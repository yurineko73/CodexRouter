---
name: code-review
description: Code review automation that identifies issues, checks for API spec compliance, generates fix plans, and applies code fixes. Compatible with Codex and Claude. Usage: node .opencode/skills/code-review/code-fixer.js <command> <file>
---

# Code Review

## 功能

- 根据文档进行代码审查
- 识别与 API 规范不符的问题
- 生成修复计划
- 执行代码修复

## 审查流程

### 1. 准备阶段

```bash
# 读取审查计划文档
read docs/code-review-plan.md

# 了解项目结构
glob **/*.js
glob **/*.ts

# 查看最近提交
git log --oneline -10
```

### 2. 检查阶段

#### 检查清单

- [ ] 崩溃/阻塞级问题 (P0)
- [ ] 功能错误级问题 (P1)
- [ ] 规范/兼容性问题 (P2)
- [ ] 优化/重构建议 (P3)

#### 使用工具

```bash
# 搜索代码模式
grep -pattern "search-term" -path "src/"

# 搜索函数/类定义
tree-sitter_search_code -query "functionName" -types "function"

# 查找用法
tree-sitter_find_usage -identifier "identifierName"

# 检查语法错误
tree-sitter_check_errors
```

### 3. 文档验证

```bash
# 搜索官方文档 (使用 websearch)
websearch -query "API documentation specific-parameter 2026"

# 或如果使用 Context7 MCP
# 在提示词中添加: use context7
```

### 4. 修复阶段

```bash
# 读取需要修改的文件
read file/path

# 执行修改
edit -filePath "file/path" -oldString "..." -newString "..."

# 验证修改
node --check file/path
```

### 5. 完成阶段

```bash
# 保存修复计划
write -filePath "docs/fix-plan.md" -content "..."

# 更新原始文档（如有不准确）
edit -filePath "docs/code-review-plan.md" -oldString "..." -newString "..."

# 提交更改
git add .
git commit -m "fix: ..."
git push origin master
```

## 审查模板

### 问题报告模板

```markdown
### [优先级] — [问题标题]

- **位置**: `[file]:[line]`
- **问题**: [描述问题]
- **影响**: [说明影响]
- **修改方案**: [描述如何修复]
- **验证方法**: [如何验证修复]
```

### 修复记录模板

```markdown
## 已完成的修复

### [优先级] - [类别]
- ✅ [编号]: [描述]
  - 文件: `[file]`
  - 修改: [简短说明]
```

## 与 AI 协作

### Codex/Claude 提示词模板

```
请审查当前项目代码，对照 `docs/code-review-plan.md`：

1. 读取审查计划文档
2. 检查所有列出的问题是否已修复
3. 使用 grep/tree-sitter 搜索代码验证
4. 搜索官方文档确认规范（websearch 或 use context7）
5. 发现新问题时记录到修复计划
6. 修正原始文档中的不准确内容
7. 执行修复并提交更改
```

### 深度审查提示词

```
请对 [file_path] 进行深度代码审查：

1. 使用 tree-sitter 分析代码结构
2. 检查语法错误 (tree-sitter_check_errors)
3. 搜索函数用法 (tree-sitter_find_usage)
4. 对照官方文档验证 API 使用
5. 生成优先级排序的问题列表
6. 提供修复建议和代码示例
```

## 注意事项

- 优先修复 P0 和 P1 问题
- 修复前先验证问题确实存在
- 修改后验证代码语法正确
- 提交消息清晰说明修复内容
- 更新文档保持代码和文档同步

## 参考文档

- [OpenAI Responses API 文档](https://platform.openai.com/docs/api-reference/responses)
- [DeepSeek API 文档](https://api-docs.deepseek.com/)
- [MDN Web Docs](https://developer.mozilla.org/)
