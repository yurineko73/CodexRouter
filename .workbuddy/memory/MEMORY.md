# CodexRouter 项目记忆

## 项目概述
- **项目名**: CodexRouter (Codex Router)
- **位置**: f:/CodexRouter
- **功能**: 将 Codex CLI 的 Responses API 请求翻译为 Chat Completions API 格式，转发给 DeepSeek 等后端
- **技术栈**: 纯 Node.js (ES Modules)，零外部依赖
- **创建日期**: 2026-04-24

## 关键技术决策
- 零依赖选择：不引入 express/fastify 等框架，使用 Node.js 原生 http 模块
- ES Modules：使用 import/export 语法
- 配置管理：在 config.js 中加载 .env 文件（利用 ES module 加载顺序保证先于 process.env 读取）
- SSE 流式转换：逐块翻译 Chat Completions delta 为 Responses API 事件

## Codex CLI 配置要点
- 新版 Codex CLI (v0.80+) 强制使用 `wire_api = "responses"`
- `wire_api = "chat"` 已弃用，将导致 "Reconnecting..." 循环
- Codex config.toml 位置: `~/.codex/config.toml`
- 配置字段: `api_base_url` (非 base_url)

## DeepSeek API 要点
- Base URL: `https://api.deepseek.com/v1`（OpenAI 兼容格式）
- Beta 端点: `https://api.deepseek.com/beta`（用于 prefix/reasoning_content 前缀续写）
- 模型: deepseek-v4-flash (主力), deepseek-v4-pro (高级)
- deepseek-chat 和 deepseek-reasoner 将于 2026/07/24 弃用
- 思考模式: `thinking: {type: "enabled"}` 是顶级请求参数（不是 extra_body）
- `reasoning_effort` 也是顶级参数，与 `thinking.reasoning_effort` 等效
- reasoning_effort 映射: low/medium → high, xhigh → max
- 推理内容字段: `reasoning_content`（在 message 对象中，与 content 同级）
- 思考模式下不生效: temperature, top_p, presence_penalty, frequency_penalty
- 思考模式下报错: logprobs, top_logprobs
- **多轮对话有工具调用时必须回传 reasoning_content**，否则 400 报错
- 无工具调用时 reasoning_content 传不传都行（传了会被忽略）
- **response_format 只支持 text 和 json_object**，不支持 json_schema
- 思考模式下 response_format 可能不兼容，建议跳过

## Responses API vs Chat Completions 关键差异
- input vs messages, instructions vs system message
- function_call 是独立 item vs 嵌入 assistant message 的 tool_calls
- reasoning 是独立 output item vs reasoning_content 字段
- 流式事件格式完全不同
- developer role → system role（Responses API 用 developer 替代 system）
- max_output_tokens → max_tokens
- text.format → response_format
- Codex CLI 可能通过 extra_body 传递 thinking 等参数（需展开到顶级）
- Codex 回传 reasoning item 含 encrypted_content（DeepSeek 不支持，需提取 summary）
- compaction item 含 encrypted_content（Codex 自动压缩对话，跳过）
- 内置工具 web_search/file_search/computer_use 等（DeepSeek 不支持，跳过）

## 本地参考文档
- `docs/deepseek-api-reference.md` — DeepSeek Chat Completions API 完整参考
- `docs/codex-responses-api-reference.md` — Codex Responses API 完整参考

## 流式转换关键规则
- Responses API 流以 `response.completed` 终止，但**必须同时发送 `data: [DONE]`**
- OpenAI SDK 用 `data: [DONE]` 作为流终止信号，Codex CLI 底层用 OpenAI SDK
- 不发 `[DONE]` → SDK 认为流异常断开 → "stream disconnected before completion"
- SSE 事件中的 item ID 必须在整个流中保持一致（added → delta → done → completed）
- 有 tool_calls 但没有文本内容时，不创建空的 message item
- 上游错误必须以 SSE 格式返回，不能直接转发 JSON
