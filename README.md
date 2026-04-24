# Codex Router — Responses API → Chat Completions 中转站

将 Codex CLI 的 **Responses API** (`/v1/responses`) 请求实时翻译为 **Chat Completions API** (`/v1/chat/completions`) 格式，
转发给 DeepSeek（或任何 OpenAI 兼容的后端），再将响应翻译回 Responses 格式返回给 Codex。

**零外部依赖，纯 Node.js 实现，开箱即用。**

## 🚀 快速开始

### 1. 配置

复制 `.env.example` 为 `.env`，填入你的 API Key：

```bash
cp .env.example .env
```

编辑 `.env`：

```env
API_KEY=sk-your-deepseek-api-key
UPSTREAM_BASE_URL=https://api.deepseek.com/v1
PORT=4446
DEFAULT_MODEL=deepseek-v4-flash
```

### 2. 启动中转站

```bash
# 方式一：npm
npm start

# 方式二：直接运行
node src/server.js

# 方式三：Windows 双击 start.bat
```

启动成功后会看到：

```
╔══════════════════════════════════════════════════════╗
║          Codex Router — Responses API Proxy          ║
╠══════════════════════════════════════════════════════╣
║  Listening:     http://127.0.0.1:4446                ║
║  Upstream:      https://api.deepseek.com/v1          ║
║  Default Model: deepseek-v4-flash                    ║
╠══════════════════════════════════════════════════════╣
║  Endpoints:                                          ║
║    POST /v1/responses        → Responses API proxy   ║
║    POST /v1/chat/completions → Direct passthrough    ║
║    GET  /v1/models           → Model list proxy      ║
║    GET  /health              → Health check          ║
╚══════════════════════════════════════════════════════╝
```

### 3. 配置 Codex CLI

编辑 `~/.codex/config.toml`（Windows 通常在 `C:\Users\<你的用户名>\.codex\config.toml`）：

```toml
model = "deepseek-v4-flash"
model_provider = "deepseek-relay"

[model_providers.deepseek-relay]
name = "DeepSeek Relay"
api_base_url = "http://127.0.0.1:4446/v1"
env_key = "DEEPSEEK_API_KEY"
wire_api = "responses"
```

> ⚠️ **重要**：`wire_api = "responses"` 是必须的！新版本 Codex CLI 只支持 responses 协议。
>
> `api_base_url` 写 `http://127.0.0.1:4446/v1` 或 `http://127.0.0.1:4446` 都可以，代理同时支持 `/v1/responses` 和 `/responses` 路径。

然后设置环境变量（PowerShell）：

```powershell
# 临时设置
$env:DEEPSEEK_API_KEY = "sk-your-deepseek-api-key"

# 永久设置
setx DEEPSEEK_API_KEY "sk-your-deepseek-api-key"
```

### 4. 正常使用 Codex

```bash
codex "帮我写一个 Python 排序算法"
```

## 🏗️ 架构

```
┌─────────────┐    Responses API     ┌──────────────┐   Chat Completions API  ┌──────────────┐
│  Codex CLI   │ ──────────────────▶ │  Codex Router │ ──────────────────────▶ │   DeepSeek    │
│  (客户端)     │ ◀────────────────── │  (Node.js)    │ ◀────────────────────── │   API 服务    │
└─────────────┘    Responses 格式     └──────────────┘   Chat Completions 格式  └──────────────┘
                       :4446
```

**工作流程：**

1. Codex CLI 发送 Responses API 请求到 `http://127.0.0.1:4446/v1/responses`
2. Codex Router 将请求体从 Responses 格式转换为 Chat Completions 格式
3. Codex Router 将转换后的请求转发到 DeepSeek API
4. Deepseek 返回 Chat Completions 格式响应
5. Codex Router 将响应转换回 Responses 格式
6. Codex CLI 接收到正确的 Responses 格式响应

## 🔄 转换逻辑详解

### 请求方向：Responses → Chat Completions

| Responses API 字段 | Chat Completions API 字段 |
|---|---|
| `input` (string) | `messages[{"role":"user","content":"..."}]` |
| `input` (array) | `messages` (逐项转换) |
| `instructions` | `messages[{"role":"system","content":"..."}]` |
| `input_text` content type | `role + content` string |
| `output_text` content type | `role="assistant" + content` string |
| `function_call` items | `tool_calls` in assistant message |
| `function_call_output` items | `role="tool"` messages |
| `reasoning.effort` | `reasoning_effort` (DeepSeek 专用) |
| `max_output_tokens` | `max_tokens` |
| `text.format` (json_schema) | `response_format` |
| `tools[type="function"]` | `tools[type="function", function:{...}]` |

### 响应方向：Chat Completions → Responses

| Chat Completions 字段 | Responses API 字段 |
|---|---|
| `choices[0].message.content` | `output[{type:"message", content[{type:"output_text"}]}]` |
| `choices[0].message.tool_calls` | `output[{type:"function_call", call_id, name, arguments}]` |
| `reasoning_content` (DeepSeek) | `output[{type:"reasoning", summary:[{type:"summary_text"}]}]` |
| SSE `delta.content` | SSE `response.output_text.delta` |
| SSE `delta.tool_calls` | SSE `response.function_call_arguments.delta` |
| SSE `delta.reasoning_content` | SSE `response.reasoning_summary_text.delta` |

## ⚙️ 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `API_KEY` | — | 转发给上游的 API Key（也可通过请求 Authorization 头传入） |
| `DEEPSEEK_API_KEY` | — | 同上，API_KEY 的别名 |
| `UPSTREAM_BASE_URL` | `https://api.deepseek.com/v1` | 上游 API Base URL |
| `PORT` | `4446` | 监听端口 |
| `DEFAULT_MODEL` | `deepseek-v4-flash` | 默认模型名称 |
| `MODEL_MAP` | — | 模型映射 JSON，如 `{"o3":"deepseek-v4-flash"}` |
| `LOG_LEVEL` | `info` | 日志级别：debug / info / warn / error |

### 模型映射

如果你想让 Codex 使用特定的模型名（如 `o3`），但实际调用 DeepSeek 的模型，可以通过 `MODEL_MAP` 环境变量配置：

```env
MODEL_MAP={"o3":"deepseek-v4-flash","gpt-4o":"deepseek-v4-pro","codex-mini":"deepseek-v4-flash"}
```

然后在 Codex 的 `config.toml` 中：

```toml
model = "o3"  # 实际会调用 deepseek-v4-flash
```

## 🛠️ 支持的功能

- ✅ 非流式请求/响应转换
- ✅ SSE 流式请求/响应转换（实时逐块翻译）
- ✅ Tool Calls / Function Calling 双向转换
- ✅ 流式 Tool Calls delta 累积（Codex 要求完整 arguments）
- ✅ DeepSeek 推理模式（thinking / reasoning_content）转换
- ✅ 结构化输出（JSON Schema）转换
- ✅ 多轮对话（input 消息数组）转换
- ✅ `/v1/models` 端点代理
- ✅ 模型名称映射
- ✅ 请求错误透传
- ✅ Chat Completions 透传模式（POST `/v1/chat/completions`）
- ✅ `.env` 文件自动加载
- ✅ 零外部依赖

## 📝 兼容的后端

任何支持 OpenAI Chat Completions API 格式的后端均可使用：

| 后端 | Base URL | 推荐模型 |
|------|----------|----------|
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-v4-flash` / `deepseek-v4-pro` |
| Kimi (Moonshot) | `https://api.moonshot.cn/v1` | `moonshot-v1-128k` |
| 通义千问 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-max` |
| Mistral | `https://api.mistral.ai/v1` | `mistral-large-latest` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| OpenRouter | `https://openrouter.ai/api/v1` | 多种 |
| Ollama | `http://127.0.0.1:11434/v1` | 本地模型 |

## ❓ 常见问题

### Q: Codex 一直显示 "Reconnecting..."
A: 检查中转站是否已启动（访问 `http://127.0.0.1:4446/health`），并确认 `config.toml` 中 `wire_api = "responses"`。

### Q: 提示 401 Unauthorized
A: 确保设置了正确的 API Key（环境变量 `DEEPSEEK_API_KEY` 或 `.env` 文件中的 `API_KEY`）。

### Q: 推理模式不工作
A: DeepSeek 的推理模型需要在 Codex 中设置 `model_reasoning_effort`，或在请求中包含 `reasoning` 参数。

### Q: 端口被占用
A: 修改 `.env` 中的 `PORT` 或通过环境变量设置：`$env:PORT="4447"`。

## 📁 项目结构

```
CodexRouter/
├── src/
│   ├── server.js              # 主服务器 & 路由
│   ├── config.js              # 配置管理 & .env 加载
│   ├── request-converter.js   # Responses → Chat Completions 请求转换
│   ├── response-converter.js  # Chat Completions → Responses 非流式响应转换
│   ├── stream-converter.js    # Chat Completions → Responses SSE 流式响应转换
│   └── logger.js              # 日志工具
├── .env.example               # 环境变量模板
├── .gitignore
├── package.json
├── start.bat                  # Windows 启动脚本
└── README.md
```

## License

MIT
