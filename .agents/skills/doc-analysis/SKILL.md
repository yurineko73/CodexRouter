---
name: doc-analysis
description: 检查文档是否过时、是否与代码实现一致。
license: MIT
metadata:
  audience: developers
  version: "1.0.0"
---

## 功能

- 识别文档中的不确定表述
- 检查年份引用是否过时
- 生成准确性报告
- 在安全范围内修正文档

## 何时使用

- 文档内容可能与当前实现不一致
- 需要排查明显过时的日期、年份或措辞
- 代码改动后要同步检查文档

## 命令

- `node .agents/skills/doc-analysis/doc-fixer.js analyze <path>`
- `node .agents/skills/doc-analysis/doc-fixer.js fix <path>`
- `node .agents/skills/doc-analysis/doc-fixer.js report <path>`

## 注意事项

- 年份修复只处理明确的安全场景，不会把所有年份统一替换
- 其余问题优先输出建议，避免误改文档

