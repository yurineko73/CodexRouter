# 使用说明

## 使用原则

1. 优先使用 Codex 内置工具完成通用动作
2. 只有当动作具有稳定、独立、可复用的工作流时，才调用技能
3. 迁移后的技能只服务于 `.agents/skills`，不依赖旧的 `.opencode/skills`

## 何时使用哪个技能

### `doc-router`
- 新文档需要归类
- 旧文档需要标记为过期并迁移
- 需要检查 `doc/` 下的分布和类型

### `skill-creator`
- 新建一个技能目录
- 校验技能 frontmatter 和结构
- 把旧 skill 迁移成 `.agents/skills` 风格

### `api-docs`
- 核对 API 参数和文档是否一致
- 快速查看官方 API 入口
- 检查本地代码中的 API 调用

### `doc-analysis`
- 检查文档内容是否过时
- 发现文档与实现不一致的地方
- 生成文档准确性报告

## 常用命令

```bash
node .agents/skills/doc-router/doc-router.js analyze <path>
node .agents/skills/doc-router/doc-router.js execute <path> [-f]
node .agents/skills/doc-router/doc-router.js batch <dir> [-f]

node .agents/skills/skill-creator/creator.js create <skill-name> <description> [--with-script] [--with-records]
node .agents/skills/skill-creator/creator.js validate <skill-path>

node .agents/skills/api-docs/api-validator.js docs
node .agents/skills/api-docs/api-validator.js validate <api> <endpoint> '<json>'

node .agents/skills/doc-analysis/doc-fixer.js analyze <path>
node .agents/skills/doc-analysis/doc-fixer.js report <path>
```

## 目录约定

- `SKILL.md`: 技能说明
- `<name>.js`: 需要时的工具脚本
- `records/`: 可选调用记录
- `doc-types.json`: 仅 `doc-router` 使用

