---
name: file-edit
description: Universal file editing tool supporting line operations (insert, delete), text replacement (plain/regex), batch operations with glob patterns, search, and undo. Compatible with Codex, Claude, and MCP integration.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 行操作：插入、删除指定行或行范围
- 文件追加：在文件开头或结尾添加内容
- 文本替换：支持普通文本和正则表达式替换
- 搜索定位：快速搜索并显示匹配行号
- 批量操作：使用 glob 模式匹配多个文件
- 撤销功能：恢复最近的修改

## When to use me

- 需要在文件中插入或删除行
- 需要批量替换多个文件中的文本
- 需要在文件开头或结尾添加内容
- 需要搜索项目中的特定文本
- 需要撤销之前的修改

## CLI 命令参考

| 命令 | 用法 |
|------|------|
| insert | `node file-editor.js insert <file> <line> "<text>"` |
| delete | `node file-editor.js delete <file> <line>` |
| prepend | `node file-editor.js prepend <file> "<text>"` |
| append | `node file-editor.js append <file> "<text>"` |
| replace | `node file-editor.js replace <file> "<old>" "<new>"` |
| replace (regex) | `node file-editor.js replace <file> "<regex>" "<new>" -r` |
| search | `node file-editor.js search <file> "<pattern>"` |
| list | `node file-editor.js list "<pattern>"` |
| undo | `node file-editor.js undo [count]` |

## 常用示例

```bash
# 插入文本
node file-editor.js insert src/app.js 10 "// New line"

# 删除行
node file-editor.js delete src/utils.js 20 25

# 批量替换
node file-editor.js replace "src/**/*.ts" "TODO" "DONE"

# 正则替换
node file-editor.js replace "*.js" "foo(\\d+)" "bar$1" -r

# 搜索
node file-editor.js search src/main.js "function \\w+"

# 撤销
node file-editor.js undo 3
```

## Glob 模式

| Pattern | Description | Example |
|---------|-------------|---------|
| `*` | 匹配除 `/` 外的任意字符 | `*.js` |
| `**` | 匹配任意字符包括 `/` | `**/*.js` |
| `?` | 匹配单个字符 | `file?.js` |
| `{a,b}` | 匹配 a 或 b | `{foo,bar}.js` |

## MCP 集成

```json
{
  "mcpServers": {
    "file-edit": {
      "command": "node",
      "args": [".opencode/skills/file-edit/file-editor.js", "mcp"]
    }
  }
}
```

## 注意事项

- 批量操作前会提示确认，输入 `yes`/`no`/`all`
- 每次修改前自动创建 `.bak` 备份文件
- 撤销操作会删除备份文件
- 正则表达式需使用 `-r` 标志启用

## 参考文档

- [Node.js fs 模块](https://nodejs.org/api/fs.html)
- [Glob 模式语法](https://github.com/isaacs/minimatch)
- [MCP 协议](https://modelcontextprotocol.io/)
