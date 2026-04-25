/**
 * Codex Router - 鍝嶅簲杞化鍣ㄦ湭娴佺嚎寮忥級
 * 灏咺hat Completions API 鍝嶅簲浣滃⇒ Responses API 鍝嶅簲浣?
 */

import { log } from './logger.js';
import { genId } from './util.js';

/**
 * 灏咺hat Completions 鐨刟ssistant message 杞化涓篬esponses 鐨凮utput items
 */
function convertAssistantMessage(message, model, originalResponseFormat) {
  const outputItems = [];

  // DeepSeek 鎺ㄧ悊鍐呭瓧 -鑷昏皟 output item
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

  // Tool calls -鑷昏皟 function_call output items
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

  // 鏂囨湰鍐呭瓧 -鑷昏皟 message output item
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
 * 涓昏浆鎹濮 含鏁帮細Chat Completions API Response 鈫→ Responses API Response
 */
export function convertResponse(chatBody, originalModel, originalResponseFormat) {
  const { id, model, choices, usage, created } = chatBody;

  if (!choices || choices.length === 0) {
    // 绌哄搷搴?
    return {
      id: genId('resp'),
      object: 'response',
      created_at: Math.floor(Date.now() / 1000),
      status: 'completed',
      model: originalModel || model,
      output: [],
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0 },
      ...(usage?.completion_tokens_details ? { output_tokens_details: { reasoning_tokens: usage.completion_tokens_details.reasoning_tokens || 0 } } : {}),
    };
  }

  const choice = choices[0];
  const message = choice.message || {};
  const outputItems = convertAssistantMessage(message, originalModel || model, originalResponseFormat);

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
      ...(usage?.completion_tokens_details ? { output_tokens_details: { reasoning_tokens: usage.completion_tokens_details.reasoning_tokens || 0 } } : {}),
    },
    // 浠ヤ笅瀛楁嶄负 Responses API 瑙勮寖琛ュ厖
    incomplete_details: choice.finish_reason === 'length' ? { reason: 'max_output_tokens' } : null,
    instructions: null,
    max_output_tokens: null,
    previous_response_id: null,
    reasoning: null,
    store: false,
    temperature: null,
    text: { format: originalResponseFormat || { type: 'text' } },
    tool_choice: 'auto',
    tools: [],
    top_p: null,
    truncation: 'disabled',
  };

  log.debug('Converted response:', JSON.stringify(response, null, 2).slice(0, 500));
  return response;
}
