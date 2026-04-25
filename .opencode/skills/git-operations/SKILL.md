---
name: git-operations
description: Git operations automation including status, staging, committing, pushing, conflict resolution, and rebasing. Compatible with Codex and Claude. Usage: node .opencode/skills/git-operations/git-helper.js <command> [args]
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

# Git Operations

## 功能

- Git 状态检查
- 暂存和提交更改
- 推送到远程仓库
- 处理合并冲突
- 变基操作

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

### 撤销操作

| Operation | Command |
|-----------|---------|
| Unstage file | `git reset HEAD file` |
| Discard changes | `git checkout -- file` |
| Undo last commit | `git reset --soft HEAD~1` |
| Amend commit | `git commit --amend` |

### 远程操作

| Operation | Command |
|-----------|---------|
| Add remote | `git remote add name url` |
| View remotes | `git remote -v` |
| Push new branch | `git push -u origin branch` |
| Fetch updates | `git fetch origin` |
| Pull with rebase | `git pull --rebase origin branch` |

### 冲突解决

| Operation | Command |
|-----------|---------|
| Mark resolved | `git add conflicted-file` |
| Continue rebase | `git rebase --continue` |
| Abort rebase | `git rebase --abort` |
| Continue merge | `git commit` |
| Abort merge | `git merge --abort` |

## 详细命令

### 检查状态
```bash
git status
git log --oneline -5
git diff HEAD
git diff --stat HEAD
```

### 暂存和提交
```bash
# 暂存指定文件
git add file1 file2

# 暂存所有修改
git add .

# 提交
git commit -m "commit message"

# 修改最后一次提交
git commit --amend
```

### 推送和拉取
```bash
# 推送到远程
git push origin branch-name

# 拉取远程更改
git pull origin branch-name

# 变基
git pull --rebase origin branch-name
```

### 处理合并冲突
```bash
# 查看冲突文件
git status

# 手动解决冲突后标记为已解决
git add conflicted-file

# 继续变基
git rebase --continue

# 或中止变基
git rebase --abort

# 完成合并提交
git commit -m "Merge remote changes"
```

## 提交消息规范

```
<type>: <subject>

<body>

- <detail 1>
- <detail 2>

<footer>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## 与 AI 协作

### Codex/Claude 提示词模板

```
请帮我：
1. 检查 git 状态 (git status)
2. 查看最近的提交 (git log --oneline -5)
3. 暂存以下文件: [文件列表]
4. 创建提交，消息为: "[type]: [message]"
5. 推送到远程仓库
```

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
