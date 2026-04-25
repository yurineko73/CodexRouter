---
name: git-operations
description: Git operations automation including status check, staging, committing, pushing, conflict resolution, and rebasing. Compatible with Codex and Claude.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 检查 Git 状态、查看提交历史和变更
- 暂存和提交更改，支持修改最后一次提交
- 推送到远程仓库，支持变基操作
- 处理合并冲突和变基冲突
- 分支创建、切换、删除和合并

## When to use me

- 准备提交代码前检查变更内容
- 推送代码前需要拉取远程更新
- 遇到合并冲突需要解决
- 需要查看项目提交历史
- 需要批量处理 Git 操作

## 快速命令参考

### 基础操作

| Operation | Command |
|-----------|---------|
| Check status | `git status` |
| View history | `git log --oneline -10` |
| View changes | `git diff` |
| Add files | `git add file1 file2` |
| Add all | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push origin branch` |
| Pull | `git pull origin branch` |

### 分支操作

| Operation | Command |
|-----------|---------|
| List branches | `git branch` |
| Create branch | `git branch new-branch` |
| Switch branch | `git checkout branch` |
| Create & switch | `git checkout -b new-branch` |
| Delete branch | `git branch -d branch-name` |

### 冲突解决

| Operation | Command |
|-----------|---------|
| Mark resolved | `git add conflicted-file` |
| Continue rebase | `git rebase --continue` |
| Abort rebase | `git rebase --abort` |

## 提交消息规范

```
<type>: <subject>

<body>

- <detail 1>
- <detail 2>

<footer>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## 注意事项

- 推送前先拉取远程更改
- 提交前检查状态确保只包含预期更改
- 冲突解决后验证代码可正常运行
- 敏感信息不要提交到仓库
- 使用 .gitignore 排除不必要的文件

## 参考文档

- [Git 官方文档](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://docs.github.com/en/getting-started/using-github/github-flow)

