# OpenAI Codex Responses API 完整参考

> 来源：https://platform.openai.com/docs/api-reference/responses
> 整理日期：2026-04-24

---

## 一、基础信息

| 参数 | 值 |
|---|---|
| **端点** | `POST /v1/responses` |
| **协议** | HTTP/SSE |
| **有状态** | 支持（通过 `previous_response_id` / `conversation`） |
| **Codex CLI** | `wire_api = "responses"`（新版强制） |

---

## 二、请求参数（Request Body）

### 完整参数列表

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| **`model`** | `string` | ✅ | 模型 ID，如 `gpt-4o`、`gpt-4o-mini`、`o3-mini`、`gpt-5.4-mini` |
| **`input`** | `string\|array` | ✅ | 文本、图像或文件输入，见下方详细定义 |
| **`instructions`** | `string` | — | 系统级指令（独立于 input，类似 system prompt） |
| **`stream`** | `boolean` | — | 是否启用 SSE 流式响应，默认 `false` |
| **`max_output_tokens`** | `integer` | — | 最大生成 token 数 |
| **`temperature`** | `number` | — | 采样温度 0-2，默认 1（推理模型可能仅支持默认值） |
| **`top_p`** | `number` | — | 核采样参数 |
| **`tools`** | `array` | — | 可用工具定义，见下方工具类型 |
| **`tool_choice`** | `string\|object` | — | 工具选择策略：`auto` / `none` / `required` / 指定工具 |
| **`reasoning`** | `object` | — | 推理配置，见下方详细定义 |
| **`text`** | `object` | — | 文本输出格式配置，见下方详细定义 |
| **`truncation`** | `string` | — | 截断策略：`auto`（自动截断）/ `disabled`（超限报错） |
| **`store`** | `boolean` | — | 是否存储响应（默认 `true`，用于后续 `previous_response_id` 引用） |
| **`metadata`** | `object` | — | 自定义键值对，最多 16 个键 |
| **`previous_response_id`** | `string` | — | 前一轮响应 ID，实现有状态多轮对话 |
| **`conversation`** | `string\|object` | — | 响应所属的对话（`{id: string}` 或 string） |
| **`background`** | `boolean` | — | 是否在后台运行模型响应 |
| **`include`** | `array` | — | 指定响应中需包含的附加输出数据 |
| **`context_management`** | `array` | — | 上下文管理配置（如 compaction） |

---

## 三、Input 详细定义

### 简单字符串输入

```json
{
  "input": "tell me a joke"
}
```

等价于 `role: "user"` 的文本输入。

### InputItemList（消息对象数组）

支持以下 item 类型：

---

### 3.1 EasyInputMessage 对象

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 可选，`"message"` |
| `role` | `string` | `"user"` / `"assistant"` / `"system"` / **`"developer"`** |
| `content` | `string\|array` | 消息内容 |
| `phase` | `string` | 可选，`"commentary"` / `"final_answer"`（gpt-5.3-codex+） |

#### content 为数组时的类型

**ResponseInputText**
```json
{"type": "input_text", "text": "Hello"}
```

**ResponseInputImage**
```json
{
  "type": "input_image",
  "image_url": "https://example.com/image.png",
  "detail": "auto"
}
```

**ResponseInputFile**
```json
{
  "type": "input_file",
  "file_id": "file-xxx",
  "filename": "doc.pdf"
}
```

---

### 3.2 ResponseOutputMessage（多轮对话中的输出回传）

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | `"message"` |
| `id` | `string` | 输出消息唯一 ID |
| `role` | `string` | `"assistant"` |
| `content` | `array` | ResponseOutputText / ResponseOutputRefusal |
| `status` | `string` | `"in_progress"` / `"completed"` / `"incomplete"` |
| `phase` | `string` | 可选，`"commentary"` / `"final_answer"` |

**ResponseOutputText**
```json
{
  "type": "output_text",
  "text": "模型输出的文本",
  "annotations": [],
  "logprobs": []
}
```

**ResponseOutputRefusal**
```json
{
  "type": "refusal",
  "refusal": "拒绝原因说明"
}
```

---

### 3.3 function_call item（工具调用）

```json
{
  "type": "function_call",
  "id": "fc_xxx",
  "call_id": "call_xxx",
  "name": "get_weather",
  "arguments": "{\"location\": \"北京\"}"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 固定值 `"function_call"` |
| `id` | `string` | 函数调用项的唯一 ID |
| `call_id` | `string` | 调用标识，用于后续 function_call_output 关联 |
| `name` | `string` | 要调用的函数名称 |
| `arguments` | `string` | 函数参数（JSON 字符串） |

---

### 3.4 function_call_output item（工具调用结果回传）

```json
{
  "type": "function_call_output",
  "call_id": "call_xxx",
  "output": "{\"temperature\": 25, \"condition\": \"晴\"}"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 固定值 `"function_call_output"` |
| `call_id` | `string` | 对应 function_call 的 call_id |
| `output` | `string` | 函数执行结果（字符串） |

---

### 3.5 reasoning item（推理输出，多轮回传）

```json
{
  "type": "reasoning",
  "id": "rs_xxx",
  "summary": [
    {
      "type": "summary_text",
      "text": "推理摘要内容..."
    }
  ],
  "encrypted_content": "..." 
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `type` | `string` | 固定值 `"reasoning"` |
| `id` | `string` | 推理项唯一 ID |
| `summary` | `array` | 推理摘要数组（当 `reasoning.summary` 参数启用时返回） |
| `encrypted_content` | `string` | 加密的推理 token（请求 `include: ["reasoning.encrypted_content"]` 时返回） |

---

### 3.6 compaction item（Codex 自动压缩对话）

```json
{
  "type": "compaction",
  "id": "cmp_xxx",
  "encrypted_content": "..."
}
```

Codex 自动在对话过长时插入此 item，将之前的对话压缩为加密内容。

---

### 3.7 内置工具调用 item

**FileSearchCall**
```json
{
  "type": "file_search_call",
  "id": "fs_xxx",
  "queries": ["search query"],
  "status": "completed",
  "results": [...]
}
```

**WebSearchCall**
```json
{
  "type": "web_search_call",
  "id": "ws_xxx",
  "action": {"type": "search", "queries": [...]},
  "status": "completed"
}
```

**ComputerCall**
```json
{
  "type": "computer_call",
  "id": "cc_xxx",
  "call_id": "call_xxx",
  "action": {"type": "click", "x": 100, "y": 200},
  "status": "completed"
}
```

**ComputerCallOutput**
```json
{
  "type": "computer_call_output",
  "call_id": "call_xxx",
  "output": {"type": "computer_screenshot", "image_url": "..."}
}
```

---

## 四、Tools 定义

### 4.1 function 工具

```json
{
  "type": "function",
  "name": "get_weather",
  "description": "Get weather of a location",
  "parameters": {
    "type": "object",
    "properties": {
      "location": {"type": "string", "description": "City name"}
    },
    "required": ["location"]
  }
}
```

### 4.2 内置工具类型

```json
{"type": "web_search"}
{"type": "web_search_preview"}
{"type": "file_search", "vector_store_ids": ["vs_xxx"]}
{"type": "code_interpreter"}
{"type": "computer_use", "display_width": 1024, "display_height": 768}
{"type": "image_generation"}
```

### 4.3 tool_choice

| 值 | 说明 |
|---|---|
| `"auto"` | 模型自行决定是否调用工具 |
| `"none"` | 禁止调用工具 |
| `"required"` | 必须调用工具 |
| `{"type":"function","name":"get_weather"}` | 指定调用特定函数 |

---

## 五、Reasoning 参数

```json
{
  "reasoning": {
    "effort": "medium",
    "summary": "auto"
  }
}
```

| 字段 | 可选值 | 说明 |
|------|--------|------|
| `effort` | `"low"` / `"medium"` / `"high"` | 推理力度 |
| `summary` | `"auto"` / `"concise"` / `"detailed"` / `"off"` | 推理摘要模式 |

---

## 六、Text 参数（输出格式控制）

```json
{
  "text": {
    "format": {
      "type": "json_schema",
      "json_schema": {
        "name": "my_schema",
        "schema": {...}
      }
    }
  }
}
```

对应 Chat Completions 的 `response_format`。

---

## 七、Include 参数

| 值 | 说明 |
|---|---|
| `"file_search_call.results"` | 包含文件搜索结果 |
| `"web_search_call.results"` | 包含网页搜索结果 |
| `"web_search_call.action.sources"` | 包含网页搜索来源 |
| `"message.input_image.image_url"` | 包含输入图片 URL |
| `"computer_call_output.output.image_url"` | 包含计算机调用输出图片 URL |
| `"code_interpreter_call.outputs"` | 包含代码解释器输出 |
| `"reasoning.encrypted_content"` | 包含加密推理 token |
| `"message.output_text.logprobs"` | 包含 logprobs |

---

## 八、Context Management（上下文压缩）

```json
{
  "context_management": [
    {
      "type": "compaction",
      "compact_threshold": 50000
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `type` | 目前仅支持 `"compaction"` |
| `compact_threshold` | 触发压缩的 token 阈值，最小值 1000 |

---

## 九、非流式响应格式

```json
{
  "id": "resp_xxx",
  "object": "response",
  "created_at": 1741476542,
  "status": "completed",
  "model": "gpt-4o",
  "output": [
    {
      "type": "message",
      "id": "msg_xxx",
      "status": "completed",
      "role": "assistant",
      "content": [
        {
          "type": "output_text",
          "text": "Hello! How can I help you?",
          "annotations": []
        }
      ]
    }
  ],
  "usage": {
    "input_tokens": 50,
    "output_tokens": 120,
    "total_tokens": 170,
    "output_tokens_details": {
      "reasoning_tokens": 0
    }
  },
  "metadata": {}
}
```

### output 可能包含的 item 类型

| type | 说明 |
|------|------|
| `message` | 助手文本回复 |
| `function_call` | 函数调用 |
| `reasoning` | 推理过程（o 系列 / thinking 模式） |
| `web_search_call` | 网络搜索调用 |
| `file_search_call` | 文件搜索调用 |
| `computer_call` | 计算机使用调用 |
| `code_interpreter_call` | 代码解释器调用 |

---

## 十、流式 SSE 事件格式

### 事件结构

```
event: <event_type>
data: <JSON payload>

```

### 完整事件类型列表

#### 响应生命周期事件

| 事件类型 | 说明 |
|---|---|
| `response.created` | 响应对象创建 |
| `response.in_progress` | 响应进入进行中状态 |
| `response.completed` | 响应完成 |
| `response.failed` | 响应失败 |
| `response.incomplete` | 响应不完整 |

#### 输出项事件

| 事件类型 | 说明 |
|---|---|
| `response.output_item.added` | 新输出项被添加 |
| `response.output_item.done` | 输出项完成 |

#### 内容部分事件

| 事件类型 | 说明 |
|---|---|
| `response.content_part.added` | 新内容部分被添加 |
| `response.content_part.done` | 内容部分完成 |

#### 文本输出事件

| 事件类型 | 说明 |
|---|---|
| `response.output_text.delta` | 文本增量输出（逐 token）⭐ |
| `response.output_text.done` | 文本输出完成 |

#### 函数调用事件

| 事件类型 | 说明 |
|---|---|
| `response.function_call_arguments.delta` | 函数参数增量 ⭐ |
| `response.function_call_arguments.done` | 函数参数完成 |

#### 推理事件

| 事件类型 | 说明 |
|---|---|
| `response.reasoning.delta` | 推理内容增量 |
| `response.reasoning.done` | 推理内容完成 |
| `response.reasoning_summary_text.delta` | 推理摘要增量 |
| `response.reasoning_summary_text.done` | 推理摘要完成 |

#### 内置工具事件

| 事件类型 | 说明 |
|---|---|
| `response.web_search_call.in_progress` | 网络搜索开始 |
| `response.web_search_call.searching` | 网络搜索进行中 |
| `response.web_search_call.completed` | 网络搜索完成 |
| `response.file_search_call.in_progress` | 文件搜索开始 |
| `response.file_search_call.searching` | 文件搜索进行中 |
| `response.file_search_call.completed` | 文件搜索完成 |
| `response.computer_call.in_progress` | 计算机调用开始 |
| `response.computer_call.completed` | 计算机调用完成 |

#### 错误事件

```
event: error
data: {"type":"error","code":"server_error","message":"..."}
```

---

### 流式事件 JSON 格式示例

#### response.created
```json
{
  "type": "response.created",
  "response": {
    "id": "resp_...",
    "object": "response",
    "created_at": 1741476542,
    "status": "in_progress",
    "model": "gpt-4o",
    "output": []
  }
}
```

#### response.output_item.added
```json
{
  "type": "response.output_item.added",
  "output_index": 0,
  "item": {
    "type": "message",
    "id": "msg_...",
    "status": "in_progress",
    "role": "assistant",
    "content": []
  }
}
```

#### response.content_part.added
```json
{
  "type": "response.content_part.added",
  "output_index": 0,
  "content_index": 0,
  "part": {
    "type": "output_text",
    "text": "",
    "annotations": []
  }
}
```

#### response.output_text.delta ⭐
```json
{
  "type": "response.output_text.delta",
  "output_index": 0,
  "content_index": 0,
  "delta": "Hello"
}
```

#### response.output_text.done
```json
{
  "type": "response.output_text.done",
  "output_index": 0,
  "content_index": 0,
  "text": "Hello! How can I help you today?"
}
```

#### response.content_part.done
```json
{
  "type": "response.content_part.done",
  "output_index": 0,
  "content_index": 0,
  "part": {
    "type": "output_text",
    "text": "Hello! How can I help you today?",
    "annotations": []
  }
}
```

#### response.output_item.done
```json
{
  "type": "response.output_item.done",
  "output_index": 0,
  "item": {
    "type": "message",
    "id": "msg_...",
    "status": "completed",
    "role": "assistant",
    "content": [
      {"type": "output_text", "text": "Hello!"}
    ]
  }
}
```

#### response.completed
```json
{
  "type": "response.completed",
  "response": {
    "id": "resp_...",
    "object": "response",
    "status": "completed",
    "output": [...],
    "usage": {
      "input_tokens": 50,
      "output_tokens": 120,
      "total_tokens": 170
    }
  }
}
```

#### response.function_call_arguments.delta
```json
{
  "type": "response.function_call_arguments.delta",
  "output_index": 1,
  "delta": "{\"loc"
}
```

#### response.function_call_arguments.done
```json
{
  "type": "response.function_call_arguments.done",
  "output_index": 1,
  "arguments": "{\"location\": \"Paris\", \"unit\": \"celsius\"}"
}
```

---

### 典型流式事件时序

```
response.created
 └→ response.in_progress
     └→ response.output_item.added        (message 输出项开始)
         └→ response.content_part.added   (output_text 开始)
             ├→ response.output_text.delta (多次，逐 token)
             ├→ response.output_text.delta
             ├→ ...
             └→ response.output_text.done  (文本完成)
         └→ response.content_part.done
     └→ response.output_item.done          (message 输出项完成)
     └→ response.output_item.added        (function_call 输出项开始)
         ├→ response.function_call_arguments.delta (多次)
         └→ response.function_call_arguments.done
     └→ response.output_item.done          (function_call 完成)
 └→ response.completed
```

---

## 十一、与 Chat Completions API 的参数映射

| Responses API | Chat Completions API | 说明 |
|---|---|---|
| `input` | `messages` | 结构不同 |
| `instructions` | `messages[0]` (system role) | 系统指令 |
| `model` | `model` | 一致 |
| `temperature` | `temperature` | 一致（推理模型可能仅支持默认值） |
| `top_p` | `top_p` | 一致 |
| `max_output_tokens` | `max_tokens` | **参数名变更** |
| `tools` | `tools` | 结构有差异 |
| `tool_choice` | `tool_choice` | 一致 |
| `text.format` | `response_format` | **路径变更** |
| `reasoning.effort` | ❌ 无对应 | 新增 |
| `reasoning.summary` | ❌ 无对应 | 新增 |
| `stream` | `stream` | 一致 |
| `store` | ❌ 无对应 | 新增 |
| `previous_response_id` | ❌ 无对应 | 新增（有状态对话） |
| `truncation` | ❌ 无对应 | 新增 |
| `input[].role = "developer"` | `role = "system"` | **角色名变更** |
| `function_call` (独立 item) | `tool_calls` (嵌入 assistant message) | **结构变更** |
| `function_call_output` (独立 item) | `role: "tool"` + `tool_call_id` | **结构变更** |
| `reasoning` (独立 item) | `reasoning_content` (嵌入 message) | **结构变更** |
| `compaction` (独立 item) | ❌ 无对应 | Codex 专有 |
| `input_text` content type | `string` content | 类型标识变更 |
| `output_text` content type | `string` content | 类型标识变更 |

---

## 十二、Codex CLI 特有的请求特征

根据实际抓包分析，Codex CLI 发送的 Responses API 请求有以下特征：

1. **`role: "developer"`** 代替 `system`
2. **`type: "reasoning"`** + `encrypted_content`：多轮对话中回传推理项
3. **`type: "compaction"`** + `encrypted_content`：Codex 自动压缩对话
4. **`type: "input_text"`** / **`type: "output_text"`**：内容类型标识
5. **内置工具 `web_search` / `file_search`** 等：非 function 类型的 tools
6. **`extra_body`**：Codex 可能通过此字段传递 `thinking` 等参数
7. **`context_management`**：Codex 可能设置 `compaction` 阈值
8. **`include`**：Codex 可能请求 `reasoning.encrypted_content`
