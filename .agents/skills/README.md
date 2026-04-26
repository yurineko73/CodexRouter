# Codex Skills

这是 Codex 侧技能目录的入口说明。

## 当前保留技能

| Skill | 用途 | 状态 |
|---|---|---|
| `doc-router` | 文档识别、归档、状态迁移 | 保留 |
| `skill-creator` | 创建和优化新技能 | 保留 |
| `api-docs` | API 文档验证与参数检查 | 保留 |
| `doc-analysis` | 文档准确性检查与修复 | 保留 |

## 目录说明

- `.agents/skills/<skill-name>/` 是每个保留技能的独立目录
- 每个技能至少包含 `SKILL.md`
- 需要工具脚本时，脚本与技能放在同一目录下
- 仅在确实需要记录调用历史时再使用 `records/`

## 相关文档

- [使用说明](./USAGE.md)
- [目录索引](./INDEX.md)
- [替代清单](./REPLACEMENTS.md)
