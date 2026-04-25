# Codex Router 代码审查与修复计划

> 创建日期: 2026-04-26
> 目标: 修复 P1/P2 级问题，优化 P3 功能

---

## 一、已确认完成的修复（从 deprecated 计划继承）

以下问题已在前序计划中修复，代码验证通过：

### P0 - 崩溃级（已修复）
- ✅ P0-1: logger.js 添加 isDebugEnabled 属性

### P1 - 功能错误（已修复）
- ✅ P1-1: server.js SSE错误流增加 response.failed 事件
- ✅ P1-2: stream-converter.js reasoning使用 reasoning_summary_text.delta 增量传输
- ✅ P1-3: request-converter.js extractReasoningSummary() 添加 encrypted_content fallback
- ✅ P1-4: response-converter.js 透传 completion_tokens_details
- ✅ P1-5: request-converter.js 添加 mapReasoningEffort() 映射
- ✅ P1-6: request-converter.js 自动添加 stream_options

### P2 - 规范兼容性（已修复）
- ✅ P2-1: request-converter.js 无 reasoning 时设置 thinking disabled
- ✅ P2-2: request-converter.js 所有模式下 json_schema 降级（已移除思考模式跳过逻辑）
- ✅ P2-3: response-converter.js 保留原始 text.format
- ✅ P2-4: stream-converter.js response.in_progress 添加 model 字段
- ✅ P2-5: stream-converter.js 处理 delta.role

### P3 - 优化（已修复）
- ✅ P3-1: 创建 util.js 抽取共享 genId()
- ✅ P3-2: server.js 添加上游请求超时
- ✅ P3-3: server.js 客户端断开时销毁上游流

---

## 二、新发现的问题

### P1 - 功能错误

#### P1-1: `output_tokens_details` 字段名错误
- **位置**: `src/response-converter.js:78,101`
- **问题**: 文档定义字段名为 `output_tokens_details`（复数），代码错误使用了 `output_token_details`（单数）
- **影响**: Codex CLI 可能无法正确读取 reasoning_tokens 数量
- **修复**: 将 `output_token_details` 改为 `output_tokens_details`
- **状态**: ✅ 已修复

#### P1-2: 流式响应缺少 `output_tokens_details`
- **位置**: `src/stream-converter.js:392-396` (finalize 方法)
- **问题**: 非流式响应转换正确传递了 `output_tokens_details`，但流式响应 finalize 时未包含
- **修复**: 在流式响应的 usage 中添加 `output_tokens_details`
- **状态**: ✅ 已修复

#### P1-3: `incomplete_details.reason` 判断逻辑不完整
- **位置**: `src/stream-converter.js:377-382`
- **问题**: 只检查 `toolCalls.length > 0`，未检查 `finishReason === 'tool_calls'`
- **影响**: 当 DeepSeek 返回 `finish_reason: "tool_calls"` 但 toolCalls 数组为空时，无法正确设置 incomplete_details
- **修复**: 改为检查 `this.toolCalls.length > 0 || this.finishReason === 'tool_calls'`
- **状态**: ✅ 已修复

---

### P2 - 代码质量问题

#### P2-1: 遗留调试代码
- **位置**: `src/request-converter.js:113`
- **问题**: `pendingToolCalls._textContent` 不存在的属性访问
- **影响**: 无实际影响（属性未定义会被忽略），但表明有遗留调试代码
- **修复**: 移除无效的属性访问
- **状态**: ✅ 已修复

---

### P3 - 未实现功能（优化建议）

#### P3-1: `previous_response_id` / `conversation` 未实现
- **问题**: Responses API 支持有状态多轮对话，通过 `previous_response_id` 实现
- **当前状态**: 收到 `previous_response_id` 参数会被忽略
- **优先级**: 低（Codex CLI 当前未使用此特性）

#### P3-2: `metadata` 参数未透传
- **问题**: Responses API 的 `metadata` 自定义字段未传递到响应中
- **优先级**: 低

#### P3-3: `truncation` 参数未处理
- **问题**: 截断策略参数未实现
- **优先级**: 低

#### P3-4: `context_management` 未实现
- **问题**: 上下文压缩配置未实现
- **优先级**: 低

#### P3-5: `store` 参数未处理
- **问题**: 响应存储配置未实现
- **优先级**: 低

---

## 三、执行计划

### 第一阶段：修复 P1（功能错误）

| 步骤 | 修改内容 | 文件 | 状态 |
|------|---------|------|------|
| 1.1 | 修正 `output_token_details` → `output_tokens_details` | response-converter.js | ✅ 已修复 |
| 1.2 | 流式响应添加 `output_tokens_details` | stream-converter.js | ✅ 已修复 |
| 1.3 | 修正 `incomplete_details.reason` 判断逻辑 | stream-converter.js | ✅ 已修复 |

### 第二阶段：修复 P2（代码质量）

| 步骤 | 修改内容 | 文件 | 状态 |
|------|---------|------|------|
| 2.1 | 移除遗留调试代码 `_textContent` | request-converter.js | ✅ 已修复 |

### 第三阶段：P3 优化（可选）

| 步骤 | 修改内容 | 优先级 |
|------|---------|--------|
| 3.1 | 实现 previous_response_id/conversation 支持 | 低 |
| 3.2 | 实现 metadata 透传 | 低 |
| 3.3 | 实现 truncation 参数 | 低 |
| 3.4 | 实现 context_management 支持 | 低 |
| 3.5 | 实现 store 参数 | 低 |

---

## 四、修复验证

修复完成后，运行以下验证：
1. 检查日志级别为 debug 时无 undefined 属性警告
2. 对比流式/非流式响应的 usage 结构是否一致
3. 验证 tool_calls 场景下 incomplete_details 正确设置
