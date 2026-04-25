---
deprecated: true
deprecated-date: 2026-04-26
replacement: doc/skills/current/logging-system-guide.md
---

# ⚠️ [已过期] Skill 自动记录、分析与升级计划

> **状态**: 已过期 (Deprecated)
> **过期日期**: 2026-04-26
> **替代文档**: `doc/skills/current/logging-system-guide.md`
>
> 本文档记录的是旧版设计，已被新版 SKILL.md 格式替代。

---

## 原始内容

### 需求

1. **调用记录**：每次 skill 调用的参数、步骤、成功/失败状态、错误信息
2. **自动分析**：每次调用结束后分析记录（AI 辅助深度分析）
3. **自动升级**：根据分析结果更新 skill（md 文档 + js 脚本）
4. **版本管理**：语义化版本号，在 md 文档中记录升级摘要

### 旧版目录结构

```
.opencode/skills/
├── logger/
│   ├── record-logger.js
│   ├── record-analyzer.js
│   ├── auto-upgrader.js
│   └── upgrade-config.json
├── git-operations/
│   ├── records/
│   ├── git-operations.md      # 旧: 命名不规范
│   └── git-helper.js
└── ...
```

### 变更记录

| 日期 | 变更 | 说明 |
|------|------|------|
| 2026-04-26 | 格式升级 | SKILL.md 命名规范化，frontmatter 版本号 |

---

## 新版参考

- **SKILL.md 格式规范**: `doc/skills/current/skill-development-guide.md`
- **Logger 系统**: `doc/skills/current/logging-system-guide.md`
- **Logger API**: `doc/skills/tools/logger-api.md`
