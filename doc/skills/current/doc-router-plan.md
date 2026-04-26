# doc-router 技能实现计划

> 创建日期: 2026-04-26
> 状态: 待执行

---

## 1. 文件结构

```
.opencode/skills/doc-router/
├── SKILL.md              # 技能定义
├── doc-router.js         # 核心工具脚本
├── doc-types.json        # 文档类型缓存
└── records/
    └── .gitignore
```

---

## 2. 文档类型缓存结构

**文件**: `.opencode/skills/doc-router/doc-types.json`

```json
{
  "version": "1.0",
  "types": [
    {
      "id": "plans",
      "description": "项目计划、路线图、里程碑文档",
      "keywords": ["plan", "计划", "roadmap", "milestone"],
      "targetDir": "doc/plans"
    },
    {
      "id": "api-reference",
      "description": "API 参考文档、SDK 说明",
      "keywords": ["api", "reference", "sdk", "endpoint", "rest"],
      "targetDir": "doc/api/tools"
    },
    {
      "id": "skill-dev",
      "description": "Skill 开发指南、教程",
      "keywords": ["skill", "guide", "tutorial", "development"],
      "targetDir": "doc/skills"
    }
  ]
}
```

---

## 3. 状态判断规则

| 状态 | 判断条件 | 目标目录 |
|------|---------|---------|
| **current** | 无过时标记 | `{targetDir}/current/` |
| **deprecated** | `deprecated: true` 或含"已废弃"/"v1"/"旧版" | `{targetDir}/deprecated/` |
| **tools** | 含 tool/cli/api-reference/sdk 关键词 | `{targetDir}/tools/` |

---

## 4. Deprecated 文档处理

### 文件名前缀规则

| 原文件名 | → | deprecated 后 |
|---------|---|---------------|
| `xxx.md` | → | `xxx-v1.md` |
| `xxx-v1.md` | → | `xxx-v2.md` |
| `xxx-v2.md` | → | `xxx-v3.md` |

### 文档开头添加过期标识

```markdown
---
deprecated: true
deprecated-date: {YYYY-MM-DD}
replacement: {替代文档路径}
---

# ⚠️ [已过期] {原标题}

> **状态**: 已过期 (Deprecated)
> **过期日期**: {YYYY-MM-DD}
> **替代文档**: `{替代文档路径}`
>
> 本文档已过期，由上述替代文档接管。

---
（原文档内容）
```

---

## 5. Replacement 智能推断

### 扫描范围
整个 `doc/` 目录

### 匹配评分机制

| 匹配项 | 加分 |
|-------|-----|
| 文档名关键词重合 | +3 分/词 |
| 内容摘要概念重叠 | +2 分/概念 |
| 同模块目录下 | +1 分 |

### 推断流程

```
findReplacement(deprecatedDoc):
  1. 提取文档名关键词 → keywords[]
  2. 扫描 doc/**/*.md
  3. 对每个候选文档计算匹配分
  4. 取评分 > 阈值(5分) 的最高分文档
  5. 如无匹配 → 返回 null → 询问用户输入
```

---

## 6. 类型匹配流程

```
findDocType(docPath):
  1. 读取 doc-types.json 缓存
  2. 遍历 types，匹配 keywords
  3. 如找到 → 返回 type.id + 置信度
  4. 如未找到 → 智能推断:
     - 分析目录结构（是否已分类）
     - 分析内容摘要/标题
     - 生成建议 { id, description, targetDir }
  5. 询问用户确认/修正
  6. 确认后合并添加到缓存（去重）
```

---

## 7. 命令设计

| 命令 | 功能 |
|------|------|
| `analyze <path>` | 分析文档，输出简洁结果 |
| `execute <path> [-f]` | 分析并移动（-f 强制覆盖） |
| `batch <dir> [-f]` | 批量处理目录，实时进度 |
| `check` | 检查 doc/ 目录分布 |
| `types list` | 列出缓存的类型 |
| `types add <id> <desc> <dir>` | 添加新类型（合并去重） |
| `types remove <id>` | 移除类型（检查使用中文档） |

---

## 8. 交互界面

### 单文档分析（简洁输出）

```
$ node doc-router.js execute doc/xxx.md

[分析] doc/xxx.md
  → plans/current/xxx.md (置信度: 高) [y/n/q]:
```

### 批量处理（实时进度）

```
$ node doc-router.js batch doc/uncategorized/

[1/3] doc/aaa.md → plans/current/aaa.md [y/n/q]: y ✓
[2/3] doc/bbb.md → api-reference/tools/bbb.md [y/n/q]: y ✓
[3/3] doc/ccc.md → skills/deprecated/ccc-v1.md
  替代文档推荐: doc/skills/current/ddd.md (匹配度: 60%)
  需指定替代文档: _

批量完成: 3/3 成功
```

---

## 9. Logger 记录点

| 事件 | 记录内容 |
|------|---------|
| `analyze` | 分析步骤、识别结果、置信度、推荐路径 |
| `execute` | 分析结果、移动操作、覆盖警告 |
| `batch` | 批量统计、总/成功/失败数、操作列表 |
| `type-added` | 新增类型ID、描述、目标目录、匹配关键词 |
| `type-confirmed` | 用户确认的推断类型 |
| `type-removed` | 移除的类型ID |
| `replacement-found` | 推断出的替代文档路径和匹配分 |
| `replacement-user` | 用户指定的替代文档路径 |

---

## 10. 核心模块设计

```
doc-router.js
├── RecordLogger          # 继承 record-logger.js
├── DocTypeCache          # 类型缓存管理（load/save/add/remove）
├── DocAnalyzer           # 文档分析（模块/状态/置信度）
├── ReplacementFinder     # 替代文档推断（评分机制）
├── DocMover              # 文档移动（version命名/覆盖检测）
├── BatchProcessor        # 批量处理（实时进度/交互）
└── CLI                   # 命令行接口
```

---

## 11. 实现文件清单

| 文件 | 行数(估) | 描述 |
|------|---------|------|
| `SKILL.md` | ~100 | 技能定义、What I do、When to use me、命令参考 |
| `doc-router.js` | ~450 | 核心工具脚本，含所有模块 |
| `doc-types.json` | ~25 | 默认类型配置（3种） |
| `records/.gitignore` | 2 | `*.json` 忽略 |

---

## 12. 实现顺序

1. 创建 `doc-router.js` 核心脚本
2. 创建 `doc-types.json` 默认配置
3. 创建 `SKILL.md` 技能定义
4. 创建 `records/.gitignore`

---

## 状态记录

| 日期 | 状态 | 说明 |
|------|------|------|
| 2026-04-26 | 已保存 | 计划已保存 |
| - | 待实现 | - |