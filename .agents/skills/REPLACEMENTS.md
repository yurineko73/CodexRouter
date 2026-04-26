# 旧技能替代清单

这个清单只记录“是否还需要单独保留 skill”，以及 Codex 侧更合适的替代方式。

## 已迁移保留

| 旧 skill | 处理方式 | 说明 |
|---|---|---|
| `doc-router` | 迁移到 `.agents/skills/doc-router` | 仍有独立工作流价值 |
| `skill-creator` | 迁移到 `.agents/skills/skill-creator` | 仍适合做技能生成器 |
| `api-docs` | 迁移到 `.agents/skills/api-docs` | 保留为文档和校验工具 |
| `doc-analysis` | 迁移到 `.agents/skills/doc-analysis` | 保留为文档准确性工具 |

## 不再单独作为 skill

| 旧 skill | 替代方式 | 原因 |
|---|---|---|
| `logger` | 作为内部辅助模块保留 | 只是实现细节，不是独立工作流 |
| `mcp-setup` | 文档说明 + Codex MCP 工具配置 | 更像环境配置指南 |
| `git-operations` | Codex 内置 `shell_command` + Git 命令 | 通用 Git 操作无需封装 |
| `file-edit` | Codex 内置文件编辑能力 | 行级编辑和批量替换可直接完成 |
| `file-cleanup` | Codex 内置文件/目录操作 + shell 命令 | 规则简单，重复度高 |
| `code-review` | Codex 代码审查能力 + 手动修复流程 | 审查本身不需要独立 skill 包装 |

## 结论

- 只有 `doc-router`、`skill-creator`、`api-docs`、`doc-analysis` 保留为技能
- 其余通用能力优先交给 Codex 内置工具

