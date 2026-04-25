# Codex Router 修复 Plan

## 已完成的修复（根据 code-review-plan.md）

### P0 - 崩溃级
- ✅ P0-1: logger.js 添加 isDebugEnabled 属性

### P1 - 功能错误
- ✅ P1-1: server.js SSE错误流增加 response.failed 事件
- ✅ P1-2: stream-converter.js reasoning使用 reasoning_summary_text.delta 增量传输
- ✅ P1-3: request-converter.js extractReasoningSummary() 添加 encrypted_content fallback
- ✅ P1-4: response-converter.js 透传 completion_tokens_details
- ✅ P1-5: request-converter.js 添加 mapReasoningEffort() 映射
- ✅ P1-6: request-converter.js 自动添加 stream_options

### P2 - 规范兼容性
- ✅ P2-1: request-converter.js 无 reasoning 时设置 thinking disabled
- ✅ P2-2: request-converter.js 所有模式下 json_schema 降级
- ✅ P2-3: response-converter.js 保留原始 text.format
- ✅ P2-4: stream-converter.js response.in_progress 添加 model 字段
- ✅ P2-5: stream-converter.js 处理 delta.role

### P3 - 优化
- ✅ P3-1: 创建 util.js 抽取共享 genId()
- ✅ P3-2: server.js 添加上游请求超时
- ✅ P3-3: server.js 客户端断开时销毁上游流

## 新发现的问题

### 问题1: request-converter.js 第41行拼写错误（已确认不存在）
**位置**: `src/request-converter.js:41`
**问题**: 之前分析认为 `texts.length` 被错误拼写为 `texts.length`，但实际代码正确
**状态**: 无需修复

### 问题2: request-converter.js 第421-428行 思考模式下错误跳过 json_object
**位置**: `src/request-converter.js:421-428`
**问题**: DeepSeek 官方文档确认思考模式支持 JSON Output，当前代码在思考模式下跳过 json_object 可能导致功能错误
**修复方案**: 移除思考模式下跳过 json_object 的逻辑
**修改前**:
```javascript
case 'json_object': {
  // 思考模式下 json_object 可能不被支持
  if (thinkingEnabled) {
    log.info('Skipping json_object response_format in thinking mode (may not be supported)');
    return undefined;
  }
  return { type: 'json_object' };
}
```
**修改后**:
```javascript
case 'json_object': {
  return { type: 'json_object' };
}
```

### 问题3: stream-converter.js 第237行事件名拼写需确认
**位置**: `src/stream-converter.js:237`
**问题**: 事件名 `response.output_item.added` 需要确认是否为标准拼写（应为 `response.output_item.added`，两个d）
**验证**: 搜索结果显示正确拼写是 `response.output_item.added`
**状态**: 需要检查代码中所有事件名拼写

## 文档准确性修正

| 文档内容 | 实际情况 | 修正建议 |
|---------|---------|-----------|
| "思考模式下 json_object 也可能不兼容" | DeepSeek 官方文档确认支持 | 修正代码逻辑，移除思考模式下跳过 json_object 的判断 |

## 执行步骤

1. 修正 request-converter.js:421-428 的 json_object 处理逻辑
2. 验证 stream-converter.js 中所有事件名拼写
3. 测试验证所有修复
