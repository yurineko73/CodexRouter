/**
 * Codex Router — SSE 流式响应转换器
 * 将 Chat Completions SSE 事件流 转换为 Responses API SSE 事件流
 *
 * 核心规则：
 * 1. 每个 output item 的 ID 必须在整个流中保持一致
 * 2. 事件名必须与 Codex CLI 期望的完全匹配
 * 3. 流以 response.completed 终止，不需要 data: [DONE]
 * 4. output_index 必须连续递增
 */

import { log } from './logger.js';

let respCounter = 0;

function genId(prefix = 'resp') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 创建 SSE 事件字符串
 *
 * Codex CLI Rust 解析器要求：
 * 1. data JSON 必须包含 type 字段（值为 event 名）
 * 2. response.created / response.in_progress / response.completed
 *    的 data 必须把响应对象嵌套在 response 键下
 */
function sseEvent(event, data) {
  // Bug fix #1: 所有 SSE 事件的 data 必须包含 type 字段
  // Bug fix #2: response 生命周期事件的 data 需要嵌套 response 键
  const needsNesting = ['response.created', 'response.in_progress', 'response.completed', 'response.failed'];

  if (needsNesting.includes(event)) {
    // 对于需要嵌套的事件，data 本身就是响应对象
    // 需要包装成 { type: event, response: data }
    return `event: ${event}\ndata: ${JSON.stringify({ type: event, response: data })}\n\n`;
  }

  // 其他事件：{ type: event, ...data }
  return `event: ${event}\ndata: ${JSON.stringify({ type: event, ...data })}\n\n`;
}

/**
 * 流式转换器状态
 */
class StreamConverter {
  constructor(originalModel) {
    this.responseId = genId('resp');
    this.originalModel = originalModel;
    this.created = Math.floor(Date.now() / 1000);

    // 累积状态
    this.fullContent = '';
    this.reasoningContent = '';
    this.toolCalls = [];
    this.currentToolCall = null;
    this.usage = null;
    this.finishReason = null;

    // output item 追踪（ID 必须在整个流中一致）
    this.reasoningItemId = null;   // reasoning item 的 ID
    this.messageItemId = null;     // message item 的 ID

    // 输出索引
    this.outputIndex = 0;
    this.reasoningIndex = -1;      // -1 = 未开始
    this.messageOutputIndex = -1;  // -1 = 未开始

    // 状态标志
    this.messageStarted = false;
    this.contentPartStarted = false;
    this.reasoningStarted = false;
    this.reasoningPartStarted = false;
    this.firstChunk = true;
  }

  /**
   * 处理 Chat Completions SSE chunk，返回 Responses API SSE 事件字符串
   */
  processChunk(chunk) {
    let events = '';

    // 首个 chunk → 发送 response.created
    if (this.firstChunk) {
      this.firstChunk = false;
      log.info('Stream: first chunk received, sending response.created');
      events += sseEvent('response.created', {
        id: this.responseId,
        object: 'response',
        created_at: this.created,
        status: 'in_progress',
        model: this.originalModel,
        output: [],
      });
      events += sseEvent('response.in_progress', {
        id: this.responseId,
        object: 'response',
        status: 'in_progress',
      });
    }

    const choices = chunk.choices || [];
    if (choices.length === 0) {
      // 可能是 usage 信息或空 chunk
      if (chunk.usage) {
        this.usage = chunk.usage;
        log.debug('Stream: received usage chunk');
      }
      return events;
    }

    const choice = choices[0];
    if (!choice) return events;

    const delta = choice.delta || {};
    const prevFinishReason = this.finishReason;
    this.finishReason = choice.finish_reason || this.finishReason;

    if (this.finishReason && this.finishReason !== prevFinishReason) {
      log.info(`Stream: finish_reason changed to ${this.finishReason}`);
    }

    // 处理 reasoning_content (DeepSeek 推理内容)
    if (delta.reasoning_content) {
      this.reasoningContent += delta.reasoning_content;

      if (!this.reasoningStarted) {
        this.reasoningStarted = true;
        this.reasoningIndex = this.outputIndex++;
        this.reasoningItemId = genId('rs');

        events += sseEvent('response.output_item.added', {
          output_index: this.reasoningIndex,
          item: {
            type: 'reasoning',
            id: this.reasoningItemId,
            summary: [],
          },
        });
      }

      if (!this.reasoningPartStarted) {
        this.reasoningPartStarted = true;
        events += sseEvent('response.content_part.added', {
          output_index: this.reasoningIndex,
          content_index: 0,
          part: { type: 'summary_text', text: '' },
        });
      }

      events += sseEvent('response.reasoning_summary_text.delta', {
        output_index: this.reasoningIndex,
        content_index: 0,
        delta: delta.reasoning_content,
      });
    }

    // 处理文本内容
    if (delta.content) {
      this.fullContent += delta.content;

      if (!this.messageStarted) {
        this.messageStarted = true;
        this.messageOutputIndex = this.reasoningStarted
          ? this.reasoningIndex + 1
          : this.outputIndex++;
        this.messageItemId = genId('msg');

        events += sseEvent('response.output_item.added', {
          output_index: this.messageOutputIndex,
          item: {
            type: 'message',
            id: this.messageItemId,
            role: 'assistant',
            content: [],
            status: 'in_progress',
          },
        });
      }

      if (!this.contentPartStarted) {
        this.contentPartStarted = true;
        events += sseEvent('response.content_part.added', {
          output_index: this.messageOutputIndex,
          content_index: 0,
          part: { type: 'output_text', text: '' },
        });
      }

      events += sseEvent('response.output_text.delta', {
        output_index: this.messageOutputIndex,
        content_index: 0,
        delta: delta.content,
      });
    }

    // 处理 tool_calls
    if (delta.tool_calls) {
      for (const tcDelta of delta.tool_calls) {

        // 新 tool call 开始
        if (tcDelta.id) {
          // 完成之前的 message content part（如果有）
          if (this.contentPartStarted) {
            events += sseEvent('response.output_text.done', {
              output_index: this.messageOutputIndex,
              content_index: 0,
              text: this.fullContent,
            });
            events += sseEvent('response.content_part.done', {
              output_index: this.messageOutputIndex,
              content_index: 0,
              part: { type: 'output_text', text: this.fullContent },
            });
            this.contentPartStarted = false;
          }

          // 如果 message 已开始但没有内容，完成 message
          if (this.messageStarted && !this.fullContent) {
            events += sseEvent('response.output_item.done', {
              output_index: this.messageOutputIndex,
              item: {
                type: 'message',
                id: this.messageItemId,
                role: 'assistant',
                content: [],
                status: 'completed',
              },
            });
            this.messageStarted = false; // 防止 finalize 再次发送
          }

          this.currentToolCall = {
            id: genId('fc'),
            call_id: tcDelta.id,
            name: tcDelta.function?.name || '',
            arguments: '',
            outputIndex: this.outputIndex++,
          };
          this.toolCalls.push(this.currentToolCall);

          events += sseEvent('response.output_item.added', {
            output_index: this.currentToolCall.outputIndex,
            item: {
              type: 'function_call',
              id: this.currentToolCall.id,
              call_id: this.currentToolCall.call_id,
              name: this.currentToolCall.name,
              arguments: '',
            },
          });
        }

        // tool call arguments delta
        if (tcDelta.function?.arguments && this.currentToolCall) {
          this.currentToolCall.arguments += tcDelta.function.arguments;
          events += sseEvent('response.function_call_arguments.delta', {
            output_index: this.currentToolCall.outputIndex,
            delta: tcDelta.function.arguments,
          });
        }
      }
    }

    // usage 信息（某些 API 在最后一个 chunk 提供）
    if (chunk.usage) {
      this.usage = chunk.usage;
    }

    return events;
  }

  /**
   * 生成流结束事件
   */
  finalize() {
    log.info(`Stream: finalizing, content=${this.fullContent.length}chars, reasoning=${this.reasoningContent.length}chars, toolCalls=${this.toolCalls.length}, finishReason=${this.finishReason}`);

    let events = '';

    // ─── 完成 reasoning 部分 ───
    if (this.reasoningStarted && this.reasoningPartStarted) {
      events += sseEvent('response.reasoning_summary_text.done', {
        output_index: this.reasoningIndex,
        content_index: 0,
        text: this.reasoningContent,
      });
      events += sseEvent('response.content_part.done', {
        output_index: this.reasoningIndex,
        content_index: 0,
        part: { type: 'summary_text', text: this.reasoningContent },
      });
    }

    if (this.reasoningStarted) {
      events += sseEvent('response.output_item.done', {
        output_index: this.reasoningIndex,
        item: {
          type: 'reasoning',
          id: this.reasoningItemId,
          summary: [{ type: 'summary_text', text: this.reasoningContent }],
        },
      });
    }

    // ─── 完成 message 部分 ───
    if (this.contentPartStarted) {
      events += sseEvent('response.output_text.done', {
        output_index: this.messageOutputIndex,
        content_index: 0,
        text: this.fullContent,
      });
      events += sseEvent('response.content_part.done', {
        output_index: this.messageOutputIndex,
        content_index: 0,
        part: { type: 'output_text', text: this.fullContent },
      });
    }

    if (this.messageStarted) {
      const msgContent = this.fullContent
        ? [{ type: 'output_text', text: this.fullContent, annotations: [] }]
        : [];

      events += sseEvent('response.output_item.done', {
        output_index: this.messageOutputIndex,
        item: {
          type: 'message',
          id: this.messageItemId,
          role: 'assistant',
          content: msgContent,
          status: 'completed',
        },
      });
    }

    // ─── 完成 function_call 部分 ───
    for (const tc of this.toolCalls) {
      events += sseEvent('response.function_call_arguments.done', {
        output_index: tc.outputIndex,
        arguments: tc.arguments,
      });
      events += sseEvent('response.output_item.done', {
        output_index: tc.outputIndex,
        item: {
          type: 'function_call',
          id: tc.id,
          call_id: tc.call_id,
          name: tc.name,
          arguments: tc.arguments,
        },
      });
    }

    // ─── 构建 response.completed 的 output 数组 ───
    const output = [];
    if (this.reasoningStarted) {
      output.push({
        type: 'reasoning',
        id: this.reasoningItemId,
        summary: [{ type: 'summary_text', text: this.reasoningContent }],
      });
    }
    if (this.messageStarted) {
      output.push({
        type: 'message',
        id: this.messageItemId,
        role: 'assistant',
        content: this.fullContent
          ? [{ type: 'output_text', text: this.fullContent, annotations: [] }]
          : [],
        status: 'completed',
      });
    }
    for (const tc of this.toolCalls) {
      output.push({
        type: 'function_call',
        id: tc.id,
        call_id: tc.call_id,
        name: tc.name,
        arguments: tc.arguments,
      });
    }

    // 判断最终状态
    const finalStatus = this.toolCalls.length > 0 ? 'incomplete' : 'completed';
    const incompleteDetails = this.toolCalls.length > 0
      ? { reason: 'tool_calls' }
      : this.finishReason === 'length'
        ? { reason: 'max_output_tokens' }
        : null;

    // ─── response.completed 事件 ───
    events += sseEvent('response.completed', {
      id: this.responseId,
      object: 'response',
      created_at: this.created,
      status: finalStatus,
      model: this.originalModel,
      output,
      usage: {
        input_tokens: this.usage?.prompt_tokens || 0,
        output_tokens: this.usage?.completion_tokens || 0,
        total_tokens: this.usage?.total_tokens || 0,
      },
      incomplete_details: incompleteDetails,
    });

    log.info(`Stream: finalize completed, status=${finalStatus}, output_items=${output.length}`);
    return events;
  }
}

/**
 * 创建流式转换器
 */
export function createStreamConverter(originalModel) {
  return new StreamConverter(originalModel);
}
