# OpenCode Skills

**Version**: 1.0.0

> **Auto-Analysis**: After running commands, if you see `[ANALYSIS_NEEDED: ...]` in output, 
> automatically run the analysis and upgrade process using the prompt provided.

通用技能库，从 Codex Router 项目提取，适配 Codex 和 Claude，可在不同项目中复用。

## 技能列表

| Skill | 描述 | 核心文件 |
|-------|------|---------|
| [git-operations](./git-operations/) | Git 操作（状态、提交、推送、冲突解决） | `git-operations.md`, `git-helper.js` |
| [code-review](./code-review/) | 代码审查（问题识别、修复、文档更新） | `code-review.md`, `code-fixer.js`, `review-checklist.md` |
| [doc-analysis](./doc-analysis/) | 文档分析（准确性验证、修正、同步） | `doc-analysis.md`, `doc-fixer.js` |
| [file-cleanup](./file-cleanup/) | 文件清理（临时文件、备份、.gitignore） | `file-cleanup.md`, `cleanup-script.sh`, `cleanup-script.ps1` |
| [api-docs](./api-docs/) | API 文档搜索与验证 | `api-docs.md`, `api-validator.js` |
| [mcp-setup](./mcp-setup/) | MCP 服务器配置与使用 | `mcp-setup.md`, `mcp-config.json` |

## 快速开始

### 1. Git 操作
```bash
# 使用 git-helper.js
node .opencode/skills/git-operations/git-helper.js status
node .opencode/skills/git-operations/git-helper.js commit "fix: ..."
```

### 2. 代码审查
```
请审查当前项目，使用 checklist:
.opencode/skills/code-review/review-checklist.md
```

### 3. 文档分析
```bash
# 分析文档准确性
node .opencode/skills/doc-analysis/doc-fixer.js analyze docs/your-doc.md

# 生成报告
node .opencode/skills/doc-analysis/doc-fixer.js report docs/your-doc.md
```

### 4. 文件清理
```bash
# Bash
bash .opencode/skills/file-cleanup/cleanup-script.sh /path/to/project

# PowerShell
powershell -File .opencode/skills/file-cleanup/cleanup-script.ps1 -Path /path/to/project
```

### 5. API 文档验证
```bash
# 检查代码中的 API 用法
node .opencode/skills/api-docs/api-validator.js check src/file.js

# 查看 API 文档引用
node .opencode/skills/api-docs/api-validator.js docs
```

### 6. MCP 配置
```bash
# 添加 MCP 服务器
opencode mcp add

# 查看配置模板
cat .opencode/skills/mcp-setup/mcp-config.json
```

## 与 AI 协作

### Codex/Claude 提示词模板

#### 通用审查
```
请使用 .opencode/skills/ 中的技能：

1. 读取 .opencode/skills/code-review/code-review.md
2. 使用 checklist: .opencode/skills/code-review/review-checklist.md
3. 分析项目代码
4. 生成问题列表并修复
5. 提交更改
```

#### 文档修正
```
请验证文档准确性：

1. 读取文档: docs/your-doc.md
2. 使用 .opencode/skills/doc-analysis/doc-analysis.md 中的方法
3. 搜索官方文档验证 (websearch 或 use context7)
4. 修正不准确的内容
5. 使用 doc-fixer.js 生成报告
```

#### MCP 配置
```
请配置 MCP 服务器：

1. 读取 .opencode/skills/mcp-setup/mcp-setup.md
2. 参考配置模板: .opencode/skills/mcp-setup/mcp-config.json
3. 添加到 opencode.json 或 claude.json
4. 测试连接: opencode mcp debug [name]
```

## 项目结构

```
.opencode/skills/
├── README.md                    # 本文件
├── git-operations/
│   ├── git-operations.md      # Git 操作指南
│   ├── git-helper.js          # Git 自动化脚本
│   └── git-cheatsheet.md     # Git 命令速查
├── code-review/
│   ├── code-review.md         # 代码审查流程
│   ├── code-fixer.js          # 自动修复脚本
│   └── review-checklist.md    # 审查清单
├── doc-analysis/
│   ├── doc-analysis.md        # 文档分析方法
│   └── doc-fixer.js          # 文档修正脚本
├── file-cleanup/
│   ├── file-cleanup.md       # 清理指南
│   ├── cleanup-script.sh     # Bash 清理脚本
│   └── cleanup-script.ps1    # PowerShell 清理脚本
├── api-docs/
│   ├── api-docs.md           # API 文档搜索指南
│   └── api-validator.js      # API 验证脚本
└── mcp-setup/
    ├── mcp-setup.md          # MCP 配置指南
    └── mcp-config.json       # MCP 配置模板
```

## 跨项目复用

这些 skill 设计为通用，可在不同项目中复用：

1. **复制 skills 目录** 到新项目的 `.opencode/` 或 `.claude/` 目录
2. **调整配置** 根据项目需求修改脚本参数
3. **引用文档** 更新文档链接到对应项目的 API

## 注意事项

- Skill 脚本使用 Node.js，确保环境已安装 Node.js
- Bash 脚本在 Unix/Linux/macOS 上使用
- PowerShell 脚本在 Windows 上使用
- MCP 配置需要 OpenCode 或 Claude Code 支持
- 文档链接可能变更，建议定期验证

## 参考文档

- [OpenCode 文档](https://opencode.ai/docs/)
- [Claude Code 文档](https://docs.anthropic.com/en/docs/claude-code/)
- [MCP 协议](https://modelcontextprotocol.io/)
- [Git 文档](https://git-scm.com/doc/)
