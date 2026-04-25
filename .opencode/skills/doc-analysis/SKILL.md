---
name: doc-analysis
description: Document analysis and accuracy validation that identifies outdated information, checks API documentation alignment, and maintains documentation sync. Compatible with Codex and Claude.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 分析文档准确性，识别过时信息
- 对照代码验证文档描述
- 对照官方文档验证 API 参数和用法
- 修正文档错误，保持代码和文档同步

## When to use me

- 发现文档描述与实际代码不符
- 需要验证 API 参数是否正确
- 需要更新过时的文档内容
- 代码修复后需要同步更新文档

## 分析流程

### 验证方法

| 文档内容 | 验证方法 |
|---------|---------|
| API 参数 | websearch 或 use context7 |
| 代码示例 | 检查代码是否存在 |
| 配置说明 | 检查配置文件 |
| 流程描述 | 对照代码逻辑 |

### 常见文档错误类型

| 错误类型 | 示例 | 修正方法 |
|---------|------|---------|
| 过时信息 | "不支持 XX 功能" (实际已支持) | 搜索最新文档确认 |
| 参数错误 | 错误的有效值范围 | 查看官方 API 文档 |
| 流程错误 | 描述与实际代码不符 | 对照代码逻辑 |
| 缺失信息 | 缺少重要说明 | 补充必要内容 |

## 分析模板

```markdown
## 文档准确性分析

### 文件: [doc-path]

| 内容位置 | 原描述 | 实际情况 | 建议修正 |
|---------|--------|---------|-----------|
| 第X行 | [原内容] | [实际情况] | [修正建议] |

### 发现的错误

1. **[错误1标题]**
   - 位置: `[file]:[line]`
   - 原内容: `[原内容]`
   - 问题: [说明错误]
   - 修正: `[修正后内容]`
```

## 注意事项

- 修正前先验证当前实际情况
- 保留文档的原始结构和风格
- 修正后提交并说明修正原因
- 如果不确定，添加注释说明待验证

## 参考文档

- [Google 技术写作指南](https://developers.google.com/tech-writing)
- [文档驱动开发](https://documentation.divio.com/)
- [Markdown 语法指南](https://www.markdownguide.org/)
