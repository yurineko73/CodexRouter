# Skill Creator API 参考

## 概述

Skill Creator 用于创建和优化 Skill，提供命令行界面进行创建、验证和优化操作。

---

## 命令行用法

```bash
node .opencode/skills/skill-creator/creator.js <command> [args]
```

---

## 命令

### create - 创建新 Skill

创建新的 Skill 目录和文件。

```bash
node creator.js create <skill-name> [description]
```

**参数**:

| 参数 | 必须 | 说明 |
|------|------|------|
| skill-name | ✅ | Skill 名称（符合 `^[a-z0-9]+(-[a-z0-9]+)*$`） |
| description | ❌ | Skill 描述（默认 "Skill description"） |

**示例**:

```bash
node creator.js create my-skill "My custom skill"
node creator.js create api-integration
```

**输出**:

```
Created skill: my-skill
  - .opencode/skills/my-skill/SKILL.md
  - .opencode/skills/my-skill/records/.gitignore
```

**创建的文件**:

```
.opencode/skills/my-skill/
├── SKILL.md           # 包含基本模板
└── records/
    └── .gitignore    # 排除 *.json
```

---

### validate - 验证 Skill 格式

验证 Skill 的 SKILL.md 格式是否符合规范。

```bash
node creator.js validate [path]
```

**参数**:

| 参数 | 必须 | 说明 |
|------|------|------|
| path | ❌ | Skill 路径（默认当前目录） |

**示例**:

```bash
node creator.js validate
node creator.js validate .opencode/skills/git-operations
node creator.js validate ./my-skill
```

**输出**:

```
Validating: .opencode\skills\git-operations\SKILL.md

✅ Frontmatter valid
  Name: git-operations
  Description: Git operations automation...
  Body length: 1453 chars

✅ Structure: Optimized format

✅ Length: 88 lines
```

**验证项**:

| 验证项 | 说明 |
|--------|------|
| Frontmatter | name 和 description 存在 |
| Name | 符合 `^[a-z0-9]+(-[a-z0-9]+)*$` |
| Description | 长度 1-1024 字符 |
| Structure | 包含 What I do / When to use me |
| Length | 建议 <100 行 |

---

### optimize - 优化 Skill

分析 Skill 并提供优化建议。

```bash
node creator.js optimize [path]
```

**参数**:

| 参数 | 必须 | 说明 |
|------|------|------|
| path | ❌ | Skill 路径（默认当前目录） |

**示例**:

```bash
node creator.js optimize .opencode/skills/api-docs
```

**输出**:

```
Optimizing: api-docs
  Current lines: 69
  Description: API documentation search and validation...
  Status: Already optimized (has What I do / When to use me)
  Status: Within target range (<100 lines)
```

---

### list - 列出所有 Skill

列出 `.opencode/skills/` 下所有 Skill。

```bash
node creator.js list
```

**示例**:

```bash
node creator.js list
```

**输出**:

```
Available skills:
  api-docs
    API documentation search and validation that queries officia...
  code-review
    Code review automation that identifies issues, checks for AP...
  doc-analysis
    Document analysis and accuracy validation that identifies ou...
  ...
```

---

## 编程 API

### validateFrontmatter(content)

验证 frontmatter 格式。

```javascript
const { validateFrontmatter } = require('./creator.js');

const result = validateFrontmatter(content);
console.log(result.valid);    // true/false
console.log(result.name);      // skill name
console.log(result.error);     // error message if invalid
```

**返回**:

```javascript
{
  valid: boolean,
  name?: string,
  description?: string,
  error?: string
}
```

---

### validateSkillName(name)

验证 Skill 名称。

```javascript
const { validateSkillName } = require('./creator.js');

const result = validateSkillName('my-skill');
console.log(result.valid);     // true/false
console.log(result.error);     // error message if invalid
```

---

## 模板文件

### SKILL-template.md

创建新 Skill 时使用的模板。

位置: `.opencode/skills/skill-creator/templates/SKILL-template.md`

```markdown
---
name: {skill-name}
description: {description}
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 功能点 1
- 功能点 2
- 功能点 3

## When to use me

- 使用场景 1
- 使用场景 2
- 使用场景 3

## 快速参考

<!-- 根据需要添加 -->

## 注意事项

- 注意事项 1
- 注意事项 2

## 参考文档

- [官方文档链接]
```

### tool-script-template.js

工具脚本模板，集成 RecordLogger。

位置: `.opencode/skills/skill-creator/templates/tool-script-template.js`

### records-gitignore-template

records 目录的 .gitignore 模板。

位置: `.opencode/skills/skill-creator/templates/records-gitignore-template`

```
# Skill records
*.json
!.gitignore
```

---

## 错误处理

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `Invalid name` | 名称不符合规范 | 使用小写字母、数字、连字符 |
| `Skill already exists` | 同名 Skill 已存在 | 使用不同名称或删除现有 |
| `SKILL.md not found` | 指定路径下无 SKILL.md | 检查路径是否正确 |

### 调试方法

```bash
# 查看详细输出
node creator.js validate .opencode/skills/my-skill -v

# 列出所有 Skill
node creator.js list
```

---

## 参考文档

- [Skill 开发指南](current/skill-development-guide.md)
- [OpenCode Skills 官方文档](https://opencode.ai/docs/zh-cn/skills/)
