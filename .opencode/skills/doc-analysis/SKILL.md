---
name: doc-analysis
description: Document analysis and accuracy validation that identifies outdated information, checks API documentation alignment, and maintains documentation sync. Compatible with Codex and Claude. Usage: node .opencode/skills/doc-analysis/doc-fixer.js <command> <path>
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

# Document Analysis

## 功能

- 分析文档准确性
- 对照代码验证文档描述
- 修正文档错误
- 保持代码和文档同步

## 分析流程

### 1. 准备阶段

```bash
# 读取目标文档
read docs/target-doc.md

# 了解相关代码
glob **/*.js
grep -pattern "api-function" -path "src/"

# 查看文档历史
git log --oneline -- docs/target-doc.md
```

### 2. 验证阶段

#### 验证方法

| 文档内容 | 验证方法 |
|---------|---------|
| API 参数 | websearch 或 use context7 |
| 代码示例 | 检查代码是否存在 |
| 配置说明 | 检查配置文件 |
| 流程描述 | 对照代码逻辑 |

#### 使用工具

```bash
# 搜索官方文档
websearch -query "API parameter name valid values 2026"

# 或使用 Context7 MCP
# 在提示词中添加: use context7

# 检查代码实现
tree-sitter_search_code -query "functionName"

# 查找用法
tree-sitter_find_usage -identifier "identifierName"
```

### 3. 修正阶段

```bash
# 读取文档
read docs/target-doc.md

# 编辑修正
edit -filePath "docs/target-doc.md" -oldString "..." -newString "..."

# 验证修正
# 再次搜索确认
websearch -query "correct information"
```

### 4. 同步阶段

```bash
# 如果代码已修复但文档未更新
# 1. 更新文档
edit -filePath "docs/target-doc.md" ...

# 2. 提交更改
git add docs/
git commit -m "docs: update ..."
```

## 分析模板

### 文档准确性报告模板

```markdown
## 文档准确性分析

### 文件: [doc-path]

| 内容位置 | 原描述 | 实际情况 | 建议修正 |
|---------|--------|---------|-----------|
| 第X行 | [原内容] | [实际情况] | [修正建议] |

### 发现的错误

1. **[错误1标题]**
   - 位置: `[file]:[line]`
   - 原内容: `[原内容]`
   - 问题: [说明错误]
   - 修正: `[修正后内容]`

### 需要补充的内容

- [ ] [补充点1]
- [ ] [补充点2]
```

### 修正记录模板

```markdown
## 文档修正记录

### [日期] - [文档名称]

#### 修正内容
- **位置**: `[file]:[line]`
- **原内容**: `[原内容]`
- **修正后**: `[修正后内容]`
- **原因**: [为什么修正]
- **验证方法**: [如何验证]
```

## 与 AI 协作

### Codex/Claude 提示词模板

```
请分析文档 `docs/[doc-name].md` 的准确性：

1. 读取目标文档
2. 提取所有技术声明（API参数、配置项、流程描述等）
3. 对每个声明：
   a. 搜索官方文档验证 (websearch 或 use context7)
   b. 对照代码验证实现
   c. 记录不匹配的地方
4. 生成准确性报告
5. 修正文档中的错误
6. 如果代码已修复但文档未更新，同步文档
```

### 深度分析提示词

```
请对 `docs/[doc-name].md` 进行深度分析：

1. 使用 tree-sitter 搜索相关代码实现
2. 搜索官方文档确认最新规范
3. 检查所有代码示例是否准确
4. 验证参数说明是否完整
5. 检查是否有过时的信息
6. 生成详细的修正建议
7. 执行文档修正并提交
```

## 常见文档错误类型

| 错误类型 | 示例 | 修正方法 |
|---------|------|---------|
| 过时信息 | "不支持 XX 功能" (实际已支持) | 搜索最新文档确认 |
| 参数错误 | 错误的有效值范围 | 查看官方 API 文档 |
| 流程错误 | 描述与实际代码不符 | 对照代码逻辑 |
| 缺失信息 | 缺少重要说明 | 补充必要内容 |
| 代码示例错误 | 代码无法运行 | 测试并修正代码 |

## 注意事项

- 修正前先验证当前实际情况
- 保留文档的原始结构和风格
- 修正后提交并说明修正原因
- 如果不确定，添加注释说明待验证
- 重大变更先与团队确认

## 参考文档

- [Google 技术写作指南](https://developers.google.com/tech-writing)
- [文档驱动开发](https://documentation.divio.com/)
- [Markdown 语法指南](https://www.markdownguide.org/)