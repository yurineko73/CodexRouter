---
name: code-review
description: Code review automation that identifies issues, checks for API spec compliance, generates fix plans, and applies code fixes. Compatible with Codex and Claude.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 根据审查计划进行代码审查
- 识别崩溃级(P0)和功能错误级(P1)问题
- 检查 API 规范兼容性和参数映射
- 生成修复计划并执行代码修复
- 验证修复后的代码语法正确

## When to use me

- 需要对新代码进行系统审查
- 发现疑似 API 参数映射错误
- 需要对照官方文档验证实现
- 需要生成问题修复优先级列表
- 代码审查后需要自动修复

## 审查清单

### 优先级级别

- **P0**: Crash/Blocker - 立即修复
- **P1**: Functional Error - 发布前修复
- **P2**: Spec/Compatibility - 尽快修复
- **P3**: Optimization - 时间允许时修复

### P0 - 崩溃/阻塞级

- [ ] 空指针解引用
- [ ] 未定义函数/变量访问
- [ ] 语法错误
- [ ] 缺少必需的导入
- [ ] 无限循环

### P1 - 功能错误级

- [ ] API 参数映射错误
- [ ] 缺少错误处理
- [ ] 事件序列错误
- [ ] 参数验证缺失

### 项目特定清单

#### API 代理项目

- [ ] 请求/响应格式转换正确
- [ ] 流式支持完整
- [ ] 超时处理正确
- [ ] 客户端断开连接处理

#### DeepSeek/OpenAI API

- [ ] `reasoning_effort` 映射正确
- [ ] `thinking` 模式正确配置
- [ ] `stream_options` 设置正确

## 问题报告模板

```markdown
### [优先级] — [问题标题]

- **位置**: `[file]:[line]`
- **问题**: [描述问题]
- **影响**: [说明影响]
- **修改方案**: [描述如何修复]
```

## 注意事项

- 优先修复 P0 和 P1 问题
- 修复前先验证问题确实存在
- 修改后验证代码语法正确
- 提交消息清晰说明修复内容

## 参考文档

- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [DeepSeek API](https://api-docs.deepseek.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
