# MCP Setup Skill

MCP (Model Context Protocol) 服务器配置，适配 Codex 和 Claude。

## 功能

- 配置 MCP 服务器
- 使用 MCP 工具增强 AI 能力
- 管理 MCP 服务器生命周期

## 常用 MCP 服务器

### 1. Context7 - 文档查询

**用途**: 快速查询官方文档

**OpenCode 配置** (`opencode.json`):
```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://context7.com/mcp",
      "enabled": true
    }
  }
}
```

**使用方法**: 在提示词中添加 `use context7`

### 2. Tree-sitter - 代码搜索与分析

**用途**: 快速搜索函数、类、变量，分析代码质量

**安装**:
```bash
npm install -g @nendo/tree-sitter-mcp
```

**OpenCode 配置**:
```json
{
  "mcp": {
    "tree-sitter": {
      "type": "local",
      "command": "npx",
      "args": ["@nendo/tree-sitter-mcp"],
      "enabled": true
    }
  }
}
```

**提供工具**:
- `search_code` - 按名称搜索函数、类、变量
- `find_usage` - 查找标识符的所有使用位置
- `analyze_code` - 代码质量和结构分析
- `check_errors` - 查找语法错误

### 3. Grep by Vercel - GitHub 代码搜索

**用途**: 搜索 GitHub 上的代码示例

**OpenCode 配置**:
```json
{
  "mcp": {
    "gh_grep": {
      "type": "remote",
      "url": "https://grep.vercel.ai/mcp",
      "enabled": true
    }
  }
}
```

**使用方法**: 在提示词中添加 `use the gh_grep tool`

### 4. Node.js Debugger

**用途**: 调试 Node.js 代码

**GitHub**: https://github.com/qckfx/node-debugger-mcp

**OpenCode 配置**:
```json
{
  "mcp": {
    "node-debugger": {
      "type": "local",
      "command": "node",
      "args": ["/path/to/node-debugger-mcp/dist/index.js"],
      "enabled": true
    }
  }
}
```

## 配置模板

### opencode.json 完整模板

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://context7.com/mcp",
      "enabled": true
    },
    "tree-sitter": {
      "type": "local",
      "command": "npx",
      "args": ["@nendo/tree-sitter-mcp"],
      "enabled": true
    }
  },
  "permission": {
    "mcp_*": "ask"
  }
}
```

### Claude Code 配置

对于 Claude Code，配置文件通常在 `~/.config/claude.json`:

```json
{
  "mcpServers": {
    "context7": {
      "type": "url",
      "url": "https://context7.com/mcp"
    },
    "tree-sitter": {
      "command": "npx",
      "args": ["@nendo/tree-sitter-mcp"]
    }
  }
}
```

## 与 AI 协作

### Codex/Claude 提示词模板

```
请帮我配置 MCP 服务器：

1. 检查当前配置：读取 opencode.json 或 claude.json
2. 添加以下 MCP 服务器：
   - Context7 (文档查询)
   - Tree-sitter (代码搜索)
3. 验证配置格式正确
4. 测试连接：opencode mcp debug [name]
```

### 使用 MCP 工具的提示词

```
请使用 MCP 工具完成以下任务：

1. 使用 tree-sitter 搜索项目中的 [functionName]
   - 提示词：use the tree-sitter tool
2. 使用 context7 查询 [API-Name] 文档
   - 提示词：use context7
3. 使用 gh_grep 搜索 GitHub 上的 [code example]
   - 提示词：use the gh_grep tool
```

## MCP 命令 (OpenCode CLI)

```bash
# 添加 MCP 服务器
opencode mcp add

# 列出已配置的服务器
opencode mcp list
opencode mcp ls

# 验证连接
opencode mcp debug [name]

# 认证（如需要）
opencode mcp auth [name]

# 注销
opencode mcp logout [name]
```

## 注意事项

- 添加 MCP 服务器会增加上下文大小，谨慎选择
- 远程 MCP 服务器需要网络连接
- 本地 MCP 服务器需要先安装
- 某些 MCP 需要认证配置
- 可以在配置中禁用不常用的 MCP

## 参考文档

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [OpenCode MCP 文档](https://opencode.ai/docs/mcp-servers/)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
- [Tree-sitter MCP](https://www.npmjs.com/package/@nendo/tree-sitter-mcp)
