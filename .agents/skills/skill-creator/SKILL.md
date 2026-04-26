---
name: skill-creator
description: 创建、校验和优化 `.agents/skills` 下的新技能。
license: MIT
metadata:
  audience: developers
  version: "1.0.0"
---

## 功能

- 创建新的技能目录和 `SKILL.md`
- 校验技能 frontmatter 和结构
- 优化旧格式内容为更简洁的 Codex 风格
- 按需生成工具脚本和记录目录

## 何时使用

- 需要新增一个 Codex 技能
- 需要把旧技能整理成统一结构
- 需要检查技能文件是否完整

## 命令

- `node .agents/skills/skill-creator/creator.js create <skill-name> <description> [--with-script] [--with-records]`
- `node .agents/skills/skill-creator/creator.js optimize <skill-path> [--apply]`
- `node .agents/skills/skill-creator/creator.js validate <skill-path>`
- `node .agents/skills/skill-creator/creator.js list`

## 注意事项

- 新技能默认生成到 `.agents/skills`
- `--with-script` 会额外生成一个基础工具脚本
- `--with-records` 仅在确实需要调用记录时启用

