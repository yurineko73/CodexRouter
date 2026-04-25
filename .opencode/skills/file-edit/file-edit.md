# File Edit Skill

**Version**: 1.0.0

> **Auto-Analysis**: After running commands, if you see `[ANALYSIS_NEEDED: ...]` in output,
> automatically run the analysis and upgrade process using the prompt provided.

通用文件编辑工具，适配 Codex 和 Claude。支持行插入、删除、文本替换、批量操作、正则表达式搜索、MCP 集成。

## 功能

- **行操作**: 插入、删除指定行或行范围
- **文件追加**: 在文件开头或结尾添加内容
- **文本替换**: 支持普通文本和正则表达式替换
- **搜索定位**: 快速搜索并显示匹配行号
- **批量操作**: 使用 glob 模式匹配多个文件
- **撤销功能**: 恢复最近的修改
- **MCP 集成**: 通过 MCP 协议调用

## 命令详解

### insert - 插入文本

```bash
# 在第10行插入
node file-editor.js insert <file> <line> "<text>"
```

### delete - 删除行

```bash
# 删除单行
node file-editor.js delete <file> <line>

# 删除行范围
node file-editor.js delete <file> <startLine> <endLine>
```

### prepend - 开头添加

```bash
# 单文件
node file-editor.js prepend <file> "<text>"

# 批量（使用 glob 模式）
node file-editor.js prepend "<pattern>" "<text>"
```

### append - 结尾添加

```bash
# 单文件
node file-editor.js append <file> "<text>"

# 批量
node file-editor.js append "<pattern>" "<text>"
```

### replace - 替换文本

```bash
# 普通替换
node file-editor.js replace <file> "<old>" "<new>"

# 正则替换（-r 标志）
node file-editor.js replace <file> "<regex>" "<new>" -r

# 批量替换
node file-editor.js replace "<pattern>" "<old>" "<new>" [-r]
```

### search - 搜索定位

```bash
# 普通搜索
node file-editor.js search <file> "<pattern>"

# 正则搜索
node file-editor.js search <file> "<regex>" -r

# 批量搜索
node file-editor.js search "<pattern>" "<regex>" -r
```

### list - 列出文件

```bash
# 列出匹配 glob 模式的所有文件
node file-editor.js list "<pattern>"
```

### undo - 撤销

```bash
# 撤销上次操作
node file-editor.js undo

# 撤销上N次操作
node file-editor.js undo <count>
```

## Glob 模式

| 模式 | 说明 | 示例 |
|------|------|------|
| `*` | 匹配除 `/` 外的任意字符 | `*.js` |
| `**` | 匹配任意字符包括 `/` | `src/**/*.js` |
| `?` | 匹配单个字符 | `file?.js` |
| `{a,b}` | 匹配 a 或 b | `{foo,bar}.js` |

## 与 AI 协作

### Codex/Claude 提示词模板

#### 基础文件修改
```
请帮我修改文件：

1. 在 src/app.js 第10行插入: "const foo = 'bar';"
2. 删除 src/utils.js 第20-25行
3. 在 src/config.js 开头添加版权声明
4. 在 src/index.js 结尾添加导出语句
```

#### 批量操作
```
请帮我批量修改文件：

1. 在所有 src/**/*.js 文件开头添加: "// License: MIT"
2. 将所有 src/**/*.ts 文件中的 "TODO" 替换为 "DONE"
3. 在所有 src/**/*.{js,ts} 文件中搜索包含 "legacy" 的行
4. 删除所有 test/**/*_test.js 文件的第1行（空行）
```

#### 正则替换
```
请帮我进行正则替换：

1. 将所有 *.js 文件中的 "foo(\d+)" 替换为 "bar$1"
2. 将所有 src/**/*.ts 中以 "export" 开头的行改为 "export async"
3. 删除所有 *.md 文件中的 "[TODO]" 标记
```

#### 搜索定位
```
请帮我搜索项目：

1. 搜索 src/**/*.js 中所有包含 "TODO" 的行
2. 搜索 src/**/*.ts 中所有函数定义（function \w+）
3. 列出 src/ 下所有 .ts 文件
4. 搜索所有 *.{js,ts} 中包含 "deprecated" 的行
```

#### 撤销操作
```
我不小心修改错了，请撤销：
1. 撤销上次的修改
2. 或者撤销最近3次修改
```

## MCP 集成

### 配置

在 `opencode.json` 或 `mcp-config.json` 中添加：

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

### MCP 方法

| 方法 | 参数 | 说明 |
|------|------|------|
| `file_edit_insert` | file, line, text | 插入文本 |
| `file_edit_delete` | file, startLine, endLine? | 删除行 |
| `file_edit_prepend` | pattern, text | 开头添加 |
| `file_edit_append` | pattern, text | 结尾添加 |
| `file_edit_replace` | pattern, oldText, newText, isRegex? | 替换文本 |
| `file_edit_search` | pattern, regex, isRegex? | 搜索 |
| `file_edit_list` | pattern | 列出文件 |
| `file_edit_undo` | count? | 撤销 |

## 注意事项

- 批量操作前会提示确认，输入 `yes`/`no`/`all`
- 每次修改前自动创建 `.bak` 备份文件
- 备份文件与原文件在同一目录
- 撤销操作会删除备份文件
- 正则表达式需使用 `-r` 标志启用
- glob 模式中的 `**` 匹配子目录
- 搜索结果直接输出到 stdout

## 参考文档

- [Node.js fs 模块](https://nodejs.org/api/fs.html)
- [Glob 模式语法](https://github.com/isaacs/minimatch)
- [正则表达式语法](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_Expressions)
- [MCP 协议](https://modelcontextprotocol.io/)

## Version History

### 1.0.0 (2026-04-25)
- Initial release
- Features: insert, delete, prepend, append, replace, search, list, undo
- Supports: glob patterns, regex, batch operations, MCP integration
- No external dependencies
- Integrated with logger for auto-upgrade
