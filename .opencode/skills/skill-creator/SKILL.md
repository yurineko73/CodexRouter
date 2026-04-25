---
name: skill-creator
description: Create and optimize skills with official format, generate tool scripts and associated documentation. Compatible with Codex and Claude.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 创建符合官方格式的新 SKILL.md
- 优化已有 skill 为"What I do / When to use me"结构
- 根据 skill 规范生成工具脚本
- 创建关联文档和 records 目录结构

## When to use me

- 需要为特定任务创建新 skill
- 需要优化已有 skill 为新结构
- 需要生成 skill 开发框架
- 需要验证 skill 格式是否符合规范

## 使用方法

### 创建新 skill

```bash
node .opencode/skills/skill-creator/creator.js create <skill-name> <description>
```

### 优化已有 skill

```bash
node .opencode/skills/skill-creator/creator.js optimize <skill-path>
```

### 验证 skill 格式

```bash
node .opencode/skills/skill-creator/creator.js validate <skill-path>
```

### 列出所有 skill

```bash
node .opencode/skills/skill-creator/creator.js list
```

## 创建流程

1. 生成 SKILL.md 前置matter（英文）
2. 编写 What I do 和 When to use me（中文）
3. 生成精简内容框架（中文）
4. 创建工具脚本（可选）
5. 初始化 records 目录和 .gitignore

## Frontmatter 规范

| 字段 | 必填 | 说明 |
|------|------|------|
| name | ✅ | 符合 `^[a-z0-9]+(-[a-z0-9]+)*$` |
| description | ✅ | 1-1024 字符，英文 |
| license | ❌ | 推荐 MIT |
| compatibility | ❌ | 推荐 opencode |
| metadata | ❌ | audience, version 等，英文 |

## 优化已有 skill

将现有 skill 优化为标准结构：

```markdown
## What I do
- 功能点 1
- 功能点 2

## When to use me
- 使用场景 1
- 使用场景 2

## 快速参考 / 清单 / etc.
- 精简内容
```

### 优化检查清单

- [ ] 删除冗余的命令示例（保留 5-8 个核心）
- [ ] 精简检查清单（保留优先级说明）
- [ ] 删除 AI 协作提示词（或精简）
- [ ] 保留核心参考文档链接
- [ ] 确保总行数 <100 行

## 注意事项

- name 必须与目录名一致
- description 应面向用户价值
- 保持内容精简（建议 <100 行）
- 工具脚本应集成 record-logger
- 主要内容使用中文，frontmatter 使用英文
- 创建后记得初始化 records/.gitignore

## 模板文件

| 模板文件 | 用途 |
|---------|------|
| `templates/SKILL-template.md` | SKILL.md 标准模板 |
| `templates/tool-script-template.js` | 工具脚本模板 |
| `templates/records-gitignore-template` | records 目录 .gitignore |

## 参考文档

- [OpenCode Skills 官方文档](https://opencode.ai/docs/zh-cn/skills/)
- [Conventional Commits](https://www.conventionalcommits.org/)
