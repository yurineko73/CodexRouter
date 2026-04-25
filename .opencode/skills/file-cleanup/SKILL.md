---
name: file-cleanup
description: File cleanup automation that identifies temp files, backups, test scripts, removes untracked files, and updates gitignore. Compatible with Codex and Claude.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 识别临时文件、备份文件、测试脚本
- 评估并清理不需要的文件
- 更新 .gitignore 排除规则
- 组织项目结构

## When to use me

- 项目中积累了临时文件需要清理
- 需要更新 .gitignore 排除新类型的文件
- 提交前需要清理不必要的内容
- 需要识别可能被遗忘的临时文件

## 清理清单

### 临时文件类型

| 扩展名 | 说明 | 处理方式 |
|---------|------|---------|
| `.tmp`, `.temp` | 临时文件 | 删除 |
| `.bak`, `.backup` | 备份文件 | 评估后删除 |
| `.orig` | 原始文件备份 | 删除 |
| `.cjs`, `.mjs` | 临时 JS 脚本 | 评估后删除 |
| `.ps1` | PowerShell 脚本 | 评估后删除 |
| `~` 结尾 | 编辑器备份 | 删除 |

### 构建/依赖文件

| 目录/文件 | 说明 | 处理方式 |
|------------|------|---------|
| `node_modules/` | Node.js 依赖 | 加入 .gitignore |
| `__pycache__/` | Python 缓存 | 加入 .gitignore |
| `.env` | 环境变量 | 加入 .gitignore |
| `dist/`, `build/` | 构建输出 | 加入 .gitignore |

## .gitignore 模板

```
# Dependencies
node_modules/
__pycache__/
*.pyc

# Environment
.env
.env.local

# Temporary files
*.tmp
*.bak
*.orig
*~
test-*

# Build outputs
dist/
build/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Logger and records
.opencode/skills/*/records/
```

## 注意事项

- 删除前先评估文件是否必需
- 重要的测试文件应移至 test/ 目录
- 更新 .gitignore 防止再次提交
- 不要删除项目运行必需的配置

## 参考文档

- [Gitignore 文档](https://git-scm.com/docs/gitignore)
- [Node.js .gitignore 模板](https://github.com/github/gitignore/blob/master/Node.gitignore)
