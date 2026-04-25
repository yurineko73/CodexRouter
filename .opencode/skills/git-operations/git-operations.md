# Git Operations Skill

通用 Git 操作指南，适配 Codex 和 Claude。

## 功能

- Git 状态检查
- 暂存和提交更改
- 推送到远程仓库
- 处理合并冲突
- 变基操作

## 常用命令

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

类型 (type)：
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建/工具相关

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

### 处理冲突的提示词

```
检测到合并冲突，请：
1. 读取冲突文件: [文件路径]
2. 分析冲突部分 (<<<<<<<, =======, >>>>>>>)
3. 决定保留哪个版本（或合并）
4. 编辑文件解决冲突
5. 标记已解决: git add [file]
6. 继续操作: git rebase --continue 或 git commit
```

## 注意事项

- 推送前先拉取远程更改
- 提交前检查状态确保只包含预期更改
- 冲突解决后验证代码可正常运行
- 敏感信息（API Key 等）不要提交到仓库
- 使用 .gitignore 排除不必要的文件

## 参考文档

- [Git 官方文档](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow)
