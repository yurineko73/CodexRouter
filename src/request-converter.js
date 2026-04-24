/**
 * Codex Router — 请求转换器
 * 将 Responses API 请求体 转换为 Chat Completions API 请求体
 *
 * 关键差异适配：
 * 1. input vs messages — 结构完全不同
 * 2. developer role → system role
 * 3. reasoning/compaction input items → 跳过（DeepSeek 不支持）
 * 4. function_call items → 合并为 tool_calls
 * 5. function_call_output → role=tool messages
 * 6. 内置工具(web_search/file_search等) → 跳过（DeepSeek 不支持）
 * 7. reasoning.effort → reasoning_effort + thinking
 * 8. extra_body 不能作为顶级字段，需直接展开
 */

import { resolveModel } from './config.js';
import { log } from './logger.js';

/**
 * 将 Responses API 的 role 映射为 Chat Completions API 的 role
 */
function mapRole(role) {
  if (role === 'developer') return 'system';
  return role;
}

/**
 * 从 reasoning item 中提取推理摘要文本
 * reasoning item 格式：{ type: "reasoning", summary: [{type: "summary_text", text: "..."}], encrypted_content: "..." }
 * DeepSeek 不支持 encrypted_content，但可以用 summary 文本作为 reasoning_content 回传
 */
function extractReasoningSummary(item) {
  if (!item.summary || !Array.isArray(item.summary)) return null;
  const texts = [];
  for (const s of item.summary) {
    if (s.type === 'summary_text' && s.text) {
      texts.push(s.text);
    }
  }
  return texts.length > 0 ? texts.join('\n') : null;
}

/**
 * 将 Responses API 的 input 转换为 Chat Completions 的 messages 数组
 */
function convertInputToMessages(input, instructions) {
  const messages = [];

  // 处理 instructions → system message（如果 input 中没有 system/developer 消息）
  const hasSystemInInput = Array.isArray(input) && input.some(item => {
    if (item.type === 'message' && (item.role === 'system' || item.role === 'developer')) return true;
    if (item.role === 'system' || item.role === 'developer') return true;
    return false;
  });

  if (instructions && typeof instructions === 'string' && instructions.trim()) {
    messages.push({ role: 'system', content: instructions });
  }

  // input 为字符串 → 单条 user message
  if (typeof input === 'string') {
    messages.push({ role: 'user', content: input });
    return messages;
  }

  // input 为数组
  if (!Array.isArray(input)) {
    log.warn('Unexpected input type:', typeof input);
    messages.push({ role: 'user', content: String(input) });
    return messages;
  }

  // 收集连续的 function_call + function_call_output 项
  // 需要合并为 assistant(tool_calls) + tool messages
  let pendingToolCalls = [];
  let pendingToolOutputs = [];
  // 收集最近的 reasoning 内容，用于附加到 assistant 消息的 reasoning_content 字段
  // DeepSeek 要求：有工具调用时，reasoning_content 必须回传
  let pendingReasoningContent = null;

  // 调试：打印 input 结构，帮助诊断 reasoning_content 的位置
  if (log.isDebugEnabled && Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const type = item?.type || '(no type)';
      const role = item?.role || '';
      const hasRC = item?.reasoning_content ? ' [has reasoning_content]' : '';
      const contentTypes = Array.isArray(item?.content)
        ? item.content.map(c => c?.type).join(',')
        : typeof item?.content;
      log.debug(`  input[${i}]: type=${type} role=${role}${hasRC} content=[${contentTypes}]`);
    }
  }

  function flushToolItems() {
    if (pendingToolCalls.length > 0) {
      const assistantMsg = {
        role: 'assistant',
        tool_calls: pendingToolCalls.map(tc => ({
          id: tc.call_id || tc.id,
          type: 'function',
          function: {
            name: tc.name,
            arguments: tc.arguments || '{}',
          },
        })),
        content: pendingToolCalls._textContent || null,
      };
      // 有工具调用时，DeepSeek 要求回传 reasoning_content
      if (pendingReasoningContent) {
        assistantMsg.reasoning_content = pendingReasoningContent;
        pendingReasoningContent = null;
      }
      messages.push(assistantMsg);

      for (const output of pendingToolOutputs) {
        messages.push({
          role: 'tool',
          tool_call_id: output.call_id || output.id,
          content: typeof output.output === 'string' ? output.output : JSON.stringify(output.output),
        });
      }

      pendingToolCalls = [];
      pendingToolOutputs = [];
    }
  }

  for (const item of input) {
    if (!item) continue;

    const type = item.type || '';

    switch (type) {
      case 'message': {
        // 标准 message 项：{ type: "message", role, content }
        flushToolItems();
        const msg = convertMessageItem(item);
        if (msg) {
          // 如果消息已经有 reasoning_content（从 item 或 content 数组中提取），清除 pending
          if (msg.reasoning_content && pendingReasoningContent) {
            // convertMessageItem 已经处理了，清除 pending 避免重复
            log.debug('reasoning_content already attached by convertMessageItem, clearing pending');
            pendingReasoningContent = null;
          } else if (pendingReasoningContent && msg.role === 'assistant') {
            // pendingReasoningContent 属于这个 assistant 消息
            msg.reasoning_content = pendingReasoningContent;
            pendingReasoningContent = null;
            log.debug('Attached pendingReasoningContent to assistant message');
          }
          messages.push(msg);
        }
        break;
      }

      case 'function_call': {
        // { type: "function_call", call_id, name, arguments }
        pendingToolCalls.push(item);
        break;
      }

      case 'function_call_output': {
        // { type: "function_call_output", call_id, output }
        pendingToolOutputs.push(item);
        break;
      }

      case 'reasoning': {
        // Codex 多轮对话中的推理项
        // DeepSeek 不支持 encrypted_content，但可以从 summary 提取推理文本
        // 当有工具调用时，DeepSeek 要求回传 reasoning_content
        const summaryText = extractReasoningSummary(item);
        if (summaryText) {
          pendingReasoningContent = summaryText;
          log.debug('Extracted reasoning summary for multi-turn context');
        } else {
          log.debug('Skipping reasoning input item (no extractable summary)');
        }
        break;
      }

      case 'compaction': {
        // Codex 自动压缩对话时产生的项，含 encrypted_content
        // DeepSeek 不支持此类型，跳过
        log.debug('Skipping compaction input item (not supported by upstream)');
        break;
      }

      default: {
        // 可能是简化的 { role, content } 格式
        if (item.role && item.content !== undefined) {
          flushToolItems();
          const msg = convertSimpleMessageItem(item);
          if (msg) {
            if (pendingReasoningContent && msg.role === 'assistant') {
              msg.reasoning_content = pendingReasoningContent;
              pendingReasoningContent = null;
            }
            messages.push(msg);
          }
        } else {
          log.debug('Skipping unknown input item type:', type);
        }
        break;
      }
    }
  }

  flushToolItems();

  // 后处理：将未使用的 reasoning_content 附加到最近的 assistant 消息
  // 处理 reasoning item 出现在所有 message 之后的情况
  if (pendingReasoningContent && messages.length > 0) {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && !messages[i].reasoning_content) {
        messages[i].reasoning_content = pendingReasoningContent;
        pendingReasoningContent = null;
        log.debug('Attached leftover pendingReasoningContent to last assistant message');
        break;
      }
    }
  }
  return messages;
}

/**
 * 转换 Responses 的 message 项 → Chat Completions 的 message
 * content 可能是字符串或内容项数组
 *
 * Responses content types:
 *   - input_text: 文本输入
 *   - output_text: 文本输出（assistant 消息中）
 *   - input_image: 图像输入
 *   - input_file: 文件输入
 *   - refusal: 拒绝回答（需跳过）
 *   - reasoning_content: 思考内容（DeepSeek 特有，需保留给多轮对话）
 */
function convertMessageItem(item) {
  const { role, content } = item;
  if (!role) return null;

  const mappedRole = mapRole(role);

  // 如果是 assistant 消息，检查是否有 reasoning_content 需要提取
  // Codex CLI 可能将 reasoning_content 放在 item.reasoning_content 或 content 数组中
  let extractedReasoningContent = null;
  if (mappedRole === 'assistant' && item.reasoning_content) {
    extractedReasoningContent = item.reasoning_content;
    log.debug('Found reasoning_content directly on assistant message item');
  }

  if (typeof content === 'string') {
    const msg = { role: mappedRole, content };
    if (extractedReasoningContent) {
      msg.reasoning_content = extractedReasoningContent;
    }
    return msg;
  }

  if (Array.isArray(content)) {
    const textParts = [];
    const imageParts = [];

    for (const part of content) {
      if (!part) continue;
      switch (part.type) {
        case 'input_text':
        case 'output_text':
        case 'text':
          textParts.push(part.text || '');
          break;
        case 'input_image':
          imageParts.push(part);
          break;
        case 'refusal':
          // 模型拒绝回答的内容，跳过
          break;
        case 'reasoning_content':
          // DeepSeek 思考内容，收集起来附加到消息
          if (part.text) {
            extractedReasoningContent = (extractedReasoningContent || '') + part.text;
            log.debug('Found reasoning_content in content array');
          }
          break;
        default:
          // 其他类型（如 input_file、input_audio）按文本提取
          if (part.text) textParts.push(part.text);
          break;
      }
    }

    // 如果只有文本，返回简单字符串
    if (imageParts.length === 0) {
      const joined = textParts.join('');
      const msg = { role: mappedRole, content: joined || null };
      if (extractedReasoningContent) {
        msg.reasoning_content = extractedReasoningContent;
      }
      return msg;
    }

    // 包含图像 → 多模态 content
    const multiContent = [];
    for (const t of textParts) {
      multiContent.push({ type: 'text', text: t });
    }
    for (const img of imageParts) {
      const imgPart = { type: 'image_url', image_url: {} };
      if (img.image_url) {
        imgPart.image_url.url = img.image_url;
      } else if (img.file_id) {
        imgPart.image_url.url = img.file_id;
      }
      if (img.detail) imgPart.image_url.detail = img.detail;
      multiContent.push(imgPart);
    }
    const msg = { role: mappedRole, content: multiContent };
    if (extractedReasoningContent) {
      msg.reasoning_content = extractedReasoningContent;
    }
    return msg;
  }

  const msg = { role: mappedRole, content: String(content || '') };
  if (extractedReasoningContent) {
    msg.reasoning_content = extractedReasoningContent;
  }
  return msg;
}

/**
 * 转换简化的 { role, content } 项
 */
function convertSimpleMessageItem(item) {
  const { role, content } = item;
  return { role: mapRole(role), content: typeof content === 'string' ? content : JSON.stringify(content) };
}

/**
 * 转换 Responses tools → Chat Completions tools
 *
 * Responses API 工具类型：
 *   - function: 自定义函数（可转换）
 *   - web_search_preview / web_search: 内置网络搜索（跳过，DeepSeek 不支持）
 *   - file_search: 内置文件搜索（跳过）
 *   - computer_use_preview: 内置计算机使用（跳过）
 *   - image_generation: 图像生成（跳过）
 *   - code_interpreter: 代码解释器（跳过）
 *   - mcp_list: MCP 工具列表（跳过）
 */
function convertTools(tools) {
  if (!Array.isArray(tools)) return undefined;

  const converted = [];

  for (const t of tools) {
    if (!t) continue;

    switch (t.type) {
      case 'function': {
        // 自定义函数工具 → 可转换
        converted.push({
          type: 'function',
          function: {
            name: t.name,
            description: t.description || '',
            parameters: t.parameters || { type: 'object', properties: {} },
            ...(t.strict !== undefined ? { strict: t.strict } : {}),
          },
        });
        break;
      }

      case 'web_search_preview':
      case 'web_search':
      case 'file_search':
      case 'computer_use_preview':
      case 'image_generation':
      case 'code_interpreter':
      case 'mcp_list': {
        // 内置工具，DeepSeek 不支持，跳过
        log.debug(`Skipping built-in tool type: ${t.type} (not supported by upstream)`);
        break;
      }

      default: {
        log.debug(`Skipping unknown tool type: ${t.type}`);
        break;
      }
    }
  }

  return converted.length > 0 ? converted : undefined;
}

/**
 * 转换 Responses text.format → Chat Completions response_format
 *
 * DeepSeek 仅支持：text（默认）、json_object
 * 不支持：json_schema（OpenAI 专有）
 * 思考模式下 response_format 可能不兼容，需根据情况跳过
 */
function convertTextFormat(text, thinkingEnabled) {
  if (!text || !text.format) return undefined;
  const fmt = text.format;

  log.debug(`Converting text.format: type=${fmt.type}, thinking=${thinkingEnabled}`);

  switch (fmt.type) {
    case 'json_schema': {
      // DeepSeek 不支持 json_schema 类型
      // 降级为 json_object（至少保证输出是合法 JSON）
      if (thinkingEnabled) {
        // 思考模式下 json_object 也可能不兼容，直接跳过
        log.info('Skipping json_schema response_format (DeepSeek does not support it, and thinking mode is active)');
        return undefined;
      }
      log.info('DeepSeek does not support json_schema response_format, downgrading to json_object');
      return { type: 'json_object' };
    }
    case 'json_object': {
      // 思考模式下 json_object 可能不被支持
      if (thinkingEnabled) {
        log.info('Skipping json_object response_format in thinking mode (may not be supported)');
        return undefined;
      }
      return { type: 'json_object' };
    }
    case 'text':
    default:
      // text 是默认行为，不需要显式设置
      return undefined;
  }
}

/**
 * 主转换函数：Responses API Request → Chat Completions API Request
 *
 * 参数映射关键差异：
 * - input → messages（结构完全不同）
 * - instructions → system message
 * - max_output_tokens → max_tokens
 * - text.format → response_format
 * - reasoning.effort → reasoning_effort（DeepSeek 顶级参数）
 * - thinking 直接放请求体（非 extra_body）
 * - extra_body 内容需要展开到请求体顶级
 */
export function convertRequest(responsesBody) {
  const {
    model,
    input,
    instructions,
    max_output_tokens,
    temperature,
    top_p,
    stream,
    tools,
    tool_choice,
    text,
    reasoning,
    store,
    previous_response_id,
    metadata,
    truncation,
    // 以下参数直接透传
    frequency_penalty,
    presence_penalty,
    stop,
    user,
    parallel_tool_calls,
    service_tier,
    // extra_body：Codex CLI 可能通过此字段传递 thinking 等参数
    // DeepSeek 不认识 extra_body，需要将其内容展开到请求体顶级
    extra_body,
    // 以下为 Responses API 独有参数，DeepSeek 不支持，忽略
    background,
    include,
    context_management,
    conversation,
  } = responsesBody;

  // 先判断是否启用思考模式（影响后续参数处理）
  const thinkingEnabled = !!(reasoning || (extra_body && extra_body.thinking));

  const messages = convertInputToMessages(input, instructions);
  const convertedTools = convertTools(tools);
  const responseFormat = convertTextFormat(text, thinkingEnabled);

  const chatBody = {
    model: resolveModel(model),
    messages,
    stream: stream ?? false,
  };

  // 可选参数，仅在有值时添加
  // 注意：思考模式下部分参数不生效，但仍可传递（DeepSeek 会忽略）
  if (max_output_tokens != null) chatBody.max_tokens = max_output_tokens;
  if (temperature != null) chatBody.temperature = temperature;
  if (top_p != null) chatBody.top_p = top_p;
  if (frequency_penalty != null) chatBody.frequency_penalty = frequency_penalty;
  if (presence_penalty != null) chatBody.presence_penalty = presence_penalty;
  if (stop != null) chatBody.stop = stop;
  if (user != null) chatBody.user = user;
  if (responseFormat) chatBody.response_format = responseFormat;
  if (convertedTools && convertedTools.length > 0) {
    chatBody.tools = convertedTools;
    if (tool_choice != null) {
      if (typeof tool_choice === 'string') {
        chatBody.tool_choice = tool_choice;
      } else if (tool_choice && tool_choice.type === 'function') {
        chatBody.tool_choice = {
          type: 'function',
          function: { name: tool_choice.name },
        };
      }
    }
    if (parallel_tool_calls != null) chatBody.parallel_tool_calls = parallel_tool_calls;
  }

  // DeepSeek 专用：reasoning → reasoning_effort + thinking
  // thinking 是 DeepSeek 的顶级请求参数（不是 extra_body）
  if (reasoning) {
    if (reasoning.effort) {
      chatBody.reasoning_effort = reasoning.effort;
    }
    chatBody.thinking = { type: 'enabled' };
  }

  // 处理 extra_body：展开到请求体顶级
  // Codex CLI 可能通过 extra_body 传递 thinking、reasoning_effort 等参数
  // DeepSeek 不认识 extra_body，必须将其内容提取到顶级
  if (extra_body && typeof extra_body === 'object') {
    for (const [key, value] of Object.entries(extra_body)) {
      if (value !== undefined && value !== null) {
        // 不覆盖已有的参数（显式设置的优先级更高）
        if (chatBody[key] === undefined) {
          chatBody[key] = value;
        } else {
          log.debug(`extra_body.${key} skipped: already set in request body`);
        }
      }
    }
  }

  log.debug('Converted request:', JSON.stringify(chatBody, null, 2).slice(0, 500));
  return chatBody;
}
