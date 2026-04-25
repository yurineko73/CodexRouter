# OpenCode Skills

通用技能库，适配 Codex 和 Claude，可在不同项目中复用。

## Skills

| Skill | 描述 |
|-------|------|
| [git-operations](./git-operations/) | Git 操作自动化 |
| [code-review](./code-review/) | 代码审查与修复 |
| [doc-analysis](./doc-analysis/) | 文档准确性分析 |
| [file-cleanup](./file-cleanup/) | 文件清理与组织 |
| [api-docs](./api-docs/) | API 文档搜索与验证 |
| [mcp-setup](./mcp-setup/) | MCP 服务器配置 |
| [file-edit](./file-edit/) | 文件编辑工具 |
| [skill-creator](./skill-creator/) | Skill 创建与优化 |
| [logger](./logger/) | 日志系统核心模块 |

## Logger 系统

每个 Skill 集成 Logger，记录调用历史并支持自动升级：

- `record-logger.js` - 记录调用
- `record-analyzer.js` - 分析记录
- `auto-upgrader.js` - 自动升级

执行 Skill 后会输出 `[ANALYSIS_NEEDED: skill-name]` 标记。

## 文档

详细文档位于项目根目录 `doc/skills/`：

- `current/` - 最新文档
- `deprecated/` - 过期文档
- `tools/` - 工具 API 参考
