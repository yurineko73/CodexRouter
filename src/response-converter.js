/**
 * Codex Router — 响应转换器（非流式）
 * 将 Chat Completions API 响应体 转换为 Responses API 响应体
 */

import { log } from './logger.js';

/**
 * 生成响应 ID
 */
function genId(prefix = 'resp') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 将 Chat Completions 的 assistant message 转换为 Responses 的 output items
 */
function convertAssistantMessage(message, model) {
  const outputItems = [];

  // DeepSeek 推理内容 → reasoning output item
  if (message.reasoning_content) {
    outputItems.push({
      type: 'reasoning',
      id: genId('rs'),
      summary: [
        {
          type: 'summary_text',
          text: message.reasoning_content,
        },
      ],
    });
  }

  // Tool calls → function_call output items
  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const tc of message.tool_calls) {
      outputItems.push({
        type: 'function_call',
        id: genId('fc'),
        call_id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      });
    }
  }

  // 文本内容 → message output item
  if (message.content) {
    outputItems.push({
      type: 'message',
      id: genId('msg'),
      role: 'assistant',
      content: [
        {
          type: 'output_text',
          text: message.content,
          annotations: [],
        },
      ],
      status: 'completed',
    });
  }

  return outputItems;
}

/**
 * 主转换函数：Chat Completions API Response → Responses API Response
 */
export function convertResponse(chatBody, originalModel) {
  const { id, model, choices, usage, created } = chatBody;

  if (!choices || choices.length === 0) {
    // 空响应
    return {
      id: genId('resp'),
      object: 'response',
      created_at: Math.floor(Date.now() / 1000),
      status: 'completed',
      model: originalModel || model,
      output: [],
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
    };
  }

  const choice = choices[0];
  const message = choice.message || {};
  const outputItems = convertAssistantMessage(message, originalModel || model);

  const response = {
    id: genId('resp'),
    object: 'response',
    created_at: created || Math.floor(Date.now() / 1000),
    status: choice.finish_reason === 'stop' || choice.finish_reason === 'end_turn'
      ? 'completed'
      : choice.finish_reason === 'tool_calls' || choice.finish_reason === 'function_call'
        ? 'incomplete'
        : 'completed',
    model: originalModel || model,
    output: outputItems,
    usage: {
      input_tokens: usage?.prompt_tokens || 0,
      output_tokens: usage?.completion_tokens || 0,
      total_tokens: usage?.total_tokens || 0,
    },
    // 以下字段按 Responses API 规范填充
    incomplete_details: choice.finish_reason === 'length' ? { reason: 'max_output_tokens' } : null,
    instructions: null,
    max_output_tokens: null,
    previous_response_id: null,
    reasoning: null,
    store: false,
    temperature: null,
    text: { format: { type: 'text' } },
    tool_choice: 'auto',
    tools: [],
    top_p: null,
    truncation: 'disabled',
  };

  log.debug('Converted response:', JSON.stringify(response, null, 2).slice(0, 500));
  return response;
}
