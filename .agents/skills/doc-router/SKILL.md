---
name: doc-router
description: 识别文档类型和状态，并把文档移动到合适的目录。
license: MIT
metadata:
  audience: developers
  version: "1.0.0"
---

## 功能

- 分析文档标题、摘要和文件名，识别所属类型
- 判断文档状态：current、deprecated、tools
- 将文档移动到正确目录
- 维护文档类型缓存，支持列表、增删

## 何时使用

- 新文档需要归档到正确的目录
- 旧文档需要标记为 deprecated 并移动
- 文档目录分布需要检查或整理

## 命令

- `node .agents/skills/doc-router/doc-router.js analyze <path>`
- `node .agents/skills/doc-router/doc-router.js execute <path> [-f]`
- `node .agents/skills/doc-router/doc-router.js batch <dir> [-f]`
- `node .agents/skills/doc-router/doc-router.js check`
- `node .agents/skills/doc-router/doc-router.js types list`
- `node .agents/skills/doc-router/doc-router.js types add <id> <desc> <dir> [keywords...]`
- `node .agents/skills/doc-router/doc-router.js types remove <id>`

## 注意事项

- `batch` 会递归扫描子目录
- `execute` 默认会二次确认，`-f` 才会跳过确认
- `deprecated` 文档会补充归档头并保留替代文档提示

