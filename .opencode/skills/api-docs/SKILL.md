---
name: api-docs
description: API documentation search and validation that queries official docs, validates parameters, and updates project configs. Compatible with Codex and Claude.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 搜索官方 API 文档验证参数和用法
- 对比代码实现与文档描述的一致性
- 更新项目配置和文档
- 保持代码与最新 API 规范同步

## When to use me

- 需要验证 API 参数是否正确
- 发现 API 调用问题需要查证官方文档
- 需要更新项目中的 API 使用方式
- 需要查询特定 API 功能的最新文档

## 搜索方法

### 使用 websearch 工具

```javascript
websearch({
  query: "API-name parameter-name valid values 2026",
  numResults: 5
})
```

### 使用 Context7 MCP (如果已配置)

在提示词中添加 `use context7` 即可查询最新文档。

### 使用 Grep by Vercel MCP (如果已配置)

在提示词中添加 `use the gh_grep tool` 搜索 GitHub 上的代码示例。

## 常用 API 文档链接

### AI 服务

| 服务 | 文档链接 |
|------|---------|
| OpenAI API | https://platform.openai.com/docs |
| DeepSeek API | https://api-docs.deepseek.com/ |
| Anthropic API | https://docs.anthropic.com/ |
| Google Gemini | https://ai.google.dev/docs |

### 特定功能

| 功能 | 文档链接 |
|------|---------|
| OpenAI Responses API | https://platform.openai.com/docs/api-reference/responses |
| DeepSeek Thinking Mode | https://api-docs.deepseek.com/guides/thinking_mode |
| DeepSeek JSON Output | https://api-docs.deepseek.com/guides/json_mode |

## 注意事项

- 搜索时包含年份（如 2026）获取最新信息
- 优先使用官方文档而非博客或教程
- 验证参数时注意 API 版本差异
- 文档链接可能变更，搜索时优先搜索名称
