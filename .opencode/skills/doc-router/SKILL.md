---
name: doc-router
description: Document routing tool that analyzes documents, determines module and status, and routes them to correct directories.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 分析文档内容，识别文档模块（plans/api-reference/skill-dev 等）
- 判断文档状态（current/deprecated/tools）
- 自动移动文档到正确的目标目录
- 处理 deprecated 文档：版本命名、添加过期标识、智能推断替代文档
- 维护文档类型缓存，支持批量处理

## When to use me

- 新文档需要归档到正确的模块目录
- 需要批量整理散乱的文档
- 文档过期需要标记并移动到 deprecated 目录
- 需要检查项目文档分布情况
- 需要管理自定义文档类型

## 命令参考

| 命令 | 功能 |
|------|------|
| `node doc-router.js analyze <path>` | 分析文档，输出简洁结果 |
| `node doc-router.js execute <path> [-f]` | 分析并移动文档（-f 强制覆盖） |
| `node doc-router.js batch <dir> [-f]` | 批量处理目录，实时进度显示 |
| `node doc-router.js check` | 检查 doc/ 目录分布情况 |
| `node doc-router.js types list` | 列出缓存的文档类型 |
| `node doc-router.js types add <id> <desc> <dir>` | 添加新类型（合并去重） |
| `node doc-router.js types remove <id>` | 移除类型（检查使用中文档） |

## 状态判断规则

| 状态 | 判断条件 | 目标目录 |
|------|---------|---------|
| **current** | 无过时标记 | `{type}/current/` |
| **deprecated** | frontmatter deprecated:true 或文件名含 -v1/v2 | `{type}/deprecated/` |
| **tools** | 文件名含 tool/cli/sdk 等关键词 | `{type}/tools/` |

## Deprecated 文档处理

- 文件名添加 `-v1`, `-v2` 后缀
- 文档开头插入过期标识（frontmatter + 标题块）
- 智能推断替代文档（基于文档名和内容评分）

## 类型匹配流程

1. 读取 `doc-types.json` 缓存
2. 遍历类型，匹配 keywords
3. 未找到 → 智能推断 → 询问用户确认
4. 确认后合并添加到缓存（去重）

## 注意事项

- 批量处理时 deprecated 文档会暂停等待指定替代文档
- `types remove` 会检查是否有文档正在使用该类型
- 所有操作都会记录到 `records/` 目录的 JSON 文件