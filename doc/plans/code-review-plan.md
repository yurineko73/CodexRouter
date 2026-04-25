
# Codex Router — 代码审查与修改计划

> 创建日期: 2026-04-25
> 目标: 审查 Codex Router 项目代码，识别与 OpenAI Responses API 和 DeepSeek Chat Completions API 官方文档不符的问题

---

## 一、概览

Codex Router 是一个 API 中转代理，负责将 Codex CLI 的 **OpenAI Responses API 格式** (`POST /v1/responses`) 实时翻译为 **Chat Completions API 格式**，转发给 DeepSeek 后端，再将响应翻译回 Responses 格式返回给 Codex CLI。

### 项目文件

| 文件 | 功能 |
|------|------|
| `src/server.js` | 主服务器入口，HTTP 路由，上游请求转发，流处理编排 |
| `src/request-converter.js` | Responses API 请求 → Chat Completions 请求的转换逻辑 |
| `src/response-converter.js` | Chat Completions 响应 → Responses API 响应的非流式转换 |
| `src/stream-converter.js` | Chat Completions SSE 流 → Responses API SSE 流的实时转换 |
| `src/config.js` | 配置管理 (.env + 环境变量) |
| `src/logger.js` | 日志工具 |

---

## 二、关键问题列表

按优先级排序：**P0 (崩溃/阻塞)** > **P1 (功能错误)** > **P2 (不符合规范)** > **P3 (优化建议)**

---

### P0 — 崩溃/阻塞级问题

#### P0-1: `log.isDebugEnabled` 未定义 (request-converter.js:82)

- **位置**: `src/request-converter.js` 第 82 行
- **问题**: `convertInputToMessages` 函数中使用了 `log.isDebugEnabled`，但 `logger.js` 导出的 `log` 对象**没有** `isDebugEnabled` 属性
- **影响**: 当 `LOG_LEVEL=debug` 时，访问 `undefined`，`log.debug()` 调用会运行时崩溃 (TypeError)
- **修改方案**: 在 `logger.js` 中增加 `isDebugEnabled` 属性

### P1 — 功能错误级问题

#### P1-1: SSE 错误流缺少 `response.failed` 事件 (server.js)

- **位置**: `src/server.js` (handleResponses 函数的上游错误处理部分)
- **问题**: 当上游 DeepSeek 返回非 200 且 stream=true 时，代码直接发送 response.created + response.completed。根据规范：
  - response.created 的 status 应为 "in_progress" (而非 "failed")
  - 应先发送 response.failed 事件 (包含 error 信息)
  - 再发送 response.completed (status="failed")
- **修改方案**: 修正错误响应的 SSE 事件序列，加入 response.failed 事件

#### P1-2: reasoning SSE 流缺少增量 delta 事件 (stream-converter.js)

- **位置**: `src/stream-converter.js` (processChunk 方法)
- **问题**: reasoning_content 只在 finalize() 一次性发出，未使用 reasoning_summary_text.delta 增量传输；且错误地使用了 content_part.added/.done 事件
- **修改方案**: 移除 reasoning 的 content_part 事件，改用 reasoning_summary_text.delta 增量流式传输

#### P1-3: reasoning_content 回传逻辑不完整 (request-converter.js)

- **位置**: `src/request-converter.js`
- **问题**: extractReasoningSummary() 只提取 summary 字段，但 Codex 的回传 reasoning item 可能只有 encrypted_content
- **影响**: 多轮对话有 tool_calls 时，缺少 reasoning_content 回传会导致 DeepSeek 返回 400
- **修改方案**: 增加 encrypted_content 的 fallback 处理

#### P1-4: completion_tokens_details 丢失 (response-converter.js)

- **位置**: `src/response-converter.js`
- **问题**: DeepSeek 返回的 usage.completion_tokens_details.reasoning_tokens 未传递到 Response 中
- **修改方案**: 在 convertResponse 中增加对 completion_tokens_details 的传递

#### P1-5: extra_body 中 reasoning_effort 映射缺失 (request-converter.js)

- **位置**: `src/request-converter.js`
- **问题**: extra_body.reasoning_effort 在 expand 阶段被直接设置到 chatBody，未经映射 (low/medium→high, xhigh→max)
- **修改方案**: 在 expand extra_body 时对 reasoning_effort 值进行映射

#### P1-6: stream_options 未透传 (request-converter.js)

- **位置**: `src/request-converter.js`
- **问题**: DeepSeek 需要 stream_options: { include_usage: true } 才能在流末尾返回 token 用量
- **修改方案**: 在 convertRequest 中自动设置 stream_options

### P2 — 规范/兼容性问题

#### P2-1: thinking 默认开启未处理 (request-converter.js)

- **问题**: 无 reasoning 参数时未设置 thinking: { type: "disabled" }，DeepSeek 默认以思考模式响应
- **修改方案**: 无 reasoning 时显式设置 thinking disabled

#### P2-2: json_schema 降级逻辑不完整 (request-converter.js)

- **问题**: DeepSeek 完全不支持 json_schema，但原始代码只在**非**思考模式下进行降级处理；且在思考模式下错误地跳过了 json_object
- **修改方案**: 对所有模式下遇到 json_schema 都降级为 json_object；移除思考模式下对 json_object 的错误跳过逻辑（DeepSeek 官方文档确认思考模式支持 json_object）

#### P2-3: 非流式响应中 text.format 被硬编码覆盖 (response-converter.js)

- **问题**: 响应转换器硬编码 text: { format: { type: "text" } }
- **修改方案**: 将 text.format 从原始请求中透传

#### P2-4: response.in_progress 缺少 model 字段 (stream-converter.js)

- **问题**: response.in_progress 事件缺少 model 字段
- **修改方案**: 添加 model 字段

#### P2-5: DeepSeek 流式首块 delta.role 未处理 (stream-converter.js)

- **问题**: DeepSeek 第一个 chunk 可能包含 delta.role: assistant，未处理
- **修改方案**: 在 processChunk 中处理 delta.role

### P3 — 优化/重构建议

#### P3-1: 重复的 genId() 函数

- **问题**: response-converter.js 和 stream-converter.js 都定义了相同的 genId()
- **修改方案**: 抽取到共享工具模块 src/util.js

#### P3-2: 缺少超时机制 (server.js)

- **问题**: forwardRequest 和流处理都没有超时
- **修改方案**: 为上游请求添加超时处理

#### P3-3: 客户端断开时上游流资源泄漏 (server.js)

- **问题**: 客户端断开后未主动销毁 upstreamRes
- **修改方案**: 在客户端断开时主动 upstreamRes.destroy()

---

## 三、执行计划

### 第一阶段：修复 P0 + P1 (功能修复)

| 步骤 | 修改内容 | 文件 | 难度 |
|------|---------|------|------|
| 1.1 | 添加 log.isDebugEnabled | logger.js | 低 |
| 1.2 | 修复 SSE 错误流 (增加 response.failed) | server.js | 中 |
| 1.3 | 修复 reasoning SSE 增量流 | stream-converter.js | 高 |
| 1.4 | 修复 reasoning_content 回传逻辑 | request-converter.js | 中 |
| 1.5 | stream_options 透传 | request-converter.js | 低 |
| 1.6 | extra_body reasoning_effort 映射 | request-converter.js | 中 |
| 1.7 | 透传 completion_tokens_details | response-converter.js | 低 |

### 第二阶段：修复 P2 (规范兼容性)

| 步骤 | 修改内容 | 文件 | 难度 |
|------|---------|------|------|
| 2.1 | 无 reasoning 时设置 thinking disabled | request-converter.js | 低 |
| 2.2 | json_schema 降级逻辑改进 | request-converter.js | 低 |
| 2.3 | 保留原始 text.format | response-converter.js | 低 |
| 2.4 | in_progress 增加 model 字段 | stream-converter.js | 低 |
| 2.5 | 处理 delta.role | stream-converter.js | 低 |

### 第三阶段：P3 优化 (重构/加固)

| 步骤 | 修改内容 | 文件 | 难度 |
|------|---------|------|------|
| 3.1 | 抽取共享 genId() | src/util.js + 2 文件 | 低 |
| 3.2 | 添加上游请求超时 | server.js | 中 |
| 3.3 | 客户端断开时销毁上游流 | server.js | 低 |

---

## 四、DeepSeek 注意事项速查

| 项目 | 详细信息 |
|------|---------|
| thinking 默认 | `thinking.type` 默认为 "enabled"，需显式设置 disabled |
| reasoning_effort 有效值 | "high" / "max" (low/medium→high, xhigh→max) |
| response_format 支持 | 仅 text 和 json_object，不支持 json_schema（**json_object 在思考模式和非思考模式下均支持**） |
| 工具调用时 | 多轮对话有 tool_calls 时必须回传 reasoning_content |
| 流式 usage | 需要 stream_options: { include_usage: true } |
| Beta 端点 | https://api.deepseek.com/beta 支持 strict/prefix |
| 废弃模型 | deepseek-chat/reasoner 将于 2026/07/24 弃用 |
| 思考模式下忽略 | temperature, top_p, presence_penalty, frequency_penalty |
