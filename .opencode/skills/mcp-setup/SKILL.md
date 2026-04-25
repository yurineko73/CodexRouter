---
name: mcp-setup
description: MCP (Model Context Protocol) server configuration and usage guide. Setup Context7 for docs, Tree-sitter for code search, and other MCP servers. Compatible with Codex and Claude.
license: MIT
compatibility: opencode
metadata:
  audience: developers
  version: "1.0.0"
---

## What I do

- 配置 MCP 服务器
- 使用 MCP 工具增强 AI 能力
- 管理 MCP 服务器生命周期

## When to use me

- 需要配置新的 MCP 服务器
- 需要查询官方文档（Context7）
- 需要搜索和分析代码（Tree-sitter）
- 需要在 GitHub 上搜索代码示例（gh_grep）
- 需要调试 Node.js 代码

## 常用 MCP 服务器

### Context7 - 文档查询

**用途**: 快速查询官方文档

**配置**:
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

### Tree-sitter - 代码搜索与分析

**用途**: 搜索函数、类、变量，分析代码质量

**安装**: `npm install -g @nendo/tree-sitter-mcp`

**配置**:
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

**提供工具**: search_code, find_usage, analyze_code, check_errors

### Grep by Vercel - GitHub 代码搜索

**用途**: 搜索 GitHub 上的代码示例

**配置**:
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

## MCP 命令 (OpenCode CLI)

```bash
opencode mcp add      # 添加 MCP 服务器
opencode mcp list    # 列出已配置的服务器
opencode mcp debug   # 验证连接
opencode mcp auth    # 认证
opencode mcp logout  # 注销
```

## 注意事项

- 添加 MCP 服务器会增加上下文大小，谨慎选择
- 远程 MCP 服务器需要网络连接
- 本地 MCP 服务器需要先安装
- 某些 MCP 需要认证配置

## 参考文档

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [OpenCode MCP 文档](https://opencode.ai/docs/mcp-servers/)
- [Awesome MCP Servers](https://github.com/punkpeye/awesome-mcp-servers)
