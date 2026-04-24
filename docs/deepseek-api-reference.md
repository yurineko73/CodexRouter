# DeepSeek Chat Completions API 完整参考

> 来源：https://api-docs.deepseek.com/zh-cn
> 整理日期：2026-04-24

---

## 一、基础信息

| 参数 | 值 |
|---|---|
| **Base URL (OpenAI)** | `https://api.deepseek.com` |
| **Base URL (Anthropic)** | `https://api.deepseek.com/anthropic` |
| **Beta 端点** | `https://api.deepseek.com/beta` |
| **Chat 端点** | `POST /chat/completions` |
| **认证方式** | `Authorization: Bearer <API_KEY>` |

### 可用模型

| 模型名称 | 说明 |
|---|---|
| `deepseek-v4-flash` | 当前推荐使用的快速模型 |
| `deepseek-v4-pro` | 当前推荐使用的高级模型 |
| `deepseek-chat` | ⚠️ 将于 2026/07/24 弃用（对应 v4-flash 的非思考模式） |
| `deepseek-reasoner` | ⚠️ 将于 2026/07/24 弃用（对应 v4-flash 的思考模式） |

---

## 二、Chat Completions 请求参数

### 端点

```
POST https://api.deepseek.com/chat/completions
```

### 必填参数

| 参数 | 类型 | 说明 |
|------|------|------|
| **`messages`** | `object[]` (≥1) | 对话消息列表，支持 4 种角色：`system`、`user`、`assistant`、`tool` |
| **`model`** | `string` | 模型 ID，可选值：`deepseek-v4-flash`、`deepseek-v4-pro` |

### 可选参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| **`thinking`** | `object\|null` | — | **思考模式开关**，见下方详细定义 |
| ↳ type | `string` | `enabled` | 可选值：`enabled`（思考模式）、`disabled`（非思考模式） |
| ↳ reasoning_effort | `string` | `high` | 推理强度。可选值：`high`、`max`（`low`/`medium` → `high`，`xhigh` → `max`） |
| **`reasoning_effort`** | `string` | — | 顶层参数，与 `thinking.reasoning_effort` 等效。值：`high` / `max` |
| **`max_tokens`** | `integer\|null` | — | 限制生成 completion 的最大 token 数 |
| **`temperature`** | `number\|null` | `1` | 采样温度，0~2。思考模式下不生效 |
| **`top_p`** | `number\|null` | `1` | 核采样参数，≤1。思考模式下不生效 |
| **`frequency_penalty`** | `number\|null` | `0` | -2~2，正值降低重复相同内容的概率。思考模式下不生效 |
| **`presence_penalty`** | `number\|null` | `0` | -2~2，正值增加谈论新主题的可能性。思考模式下不生效 |
| **`response_format`** | `object\|null` | — | 输出格式设定 |
| ↳ type | `string` | `text` | 可选值：`text`、`json_object`（启用 JSON 模式） |
| **`stop`** | `string\|string[]\|null` | — | 最多 16 个字符串，遇到时停止生成 |
| **`stream`** | `boolean\|null` | — | 设为 `true` 以 SSE 流式返回消息增量 |
| **`stream_options`** | `object\|null` | — | 流式输出相关选项（需 `stream=true`） |
| ↳ include_usage | `boolean` | — | 设为 `true` 在流末尾返回 token 用量统计 |
| **`tools`** | `object[]\|null` | — | 模型可调用的工具列表，最多 128 个 function |
| ↳ type | `string` | — | 工具类型，目前仅支持 `function` |
| ↳ function.name | `string` | — | 函数名，a-z/A-Z/0-9/下划线/连字符，最长 64 字符 |
| ↳ function.description | `string` | — | 函数功能描述 |
| ↳ function.parameters | `object` | — | JSON Schema 描述的输入参数 |
| ↳ function.strict | `boolean` | `false` | 设为 `true` 确保 JSON 输出严格符合 schema（Beta，需 beta 端点） |
| **`tool_choice`** | `string\|object\|null` | — | 控制工具调用行为 |
| ↳ (字符串模式) | `string` | — | 可选值：`none`、`auto`、`required` |
| ↳ (指定工具模式) | `object` | — | 格式：`{"type":"function","function":{"name":"..."}}` |
| **`logprobs`** | `boolean\|null` | — | 是否返回输出 token 的对数概率 |
| **`top_logprobs`** | `integer\|null` | — | 0~20，每个位置返回 top N 概率 token（需 `logprobs=true`） |

---

## 三、Messages 各角色字段

| 角色 | 必填字段 | 可选字段 |
|------|----------|----------|
| **system** | `content`, `role` | `name` |
| **user** | `content`, `role` | `name` |
| **assistant** | `content`(可 null), `role` | `name`, `prefix`(Beta), `reasoning_content`(Beta, 思考前缀续写) |
| **tool** | `content`, `role`, `tool_call_id` | — |

> ⚠️ `prefix` 和 `reasoning_content` 为 Beta 功能，需 `base_url="https://api.deepseek.com/beta"`

### assistant 消息中的 tool_calls

```json
{
  "role": "assistant",
  "content": null,
  "tool_calls": [
    {
      "id": "call_xxx",
      "type": "function",
      "function": {
        "name": "get_weather",
        "arguments": "{\"location\": \"Hangzhou\"}"
      }
    }
  ]
}
```

### tool 消息（回传函数结果）

```json
{
  "role": "tool",
  "tool_call_id": "call_xxx",
  "content": "24℃"
}
```

---

## 四、思考模式（Thinking Mode）

### 4.1 参数控制

**方式一：顶层参数**
```json
{
  "model": "deepseek-v4-pro",
  "reasoning_effort": "high",
  "messages": [...]
}
```

**方式二：thinking 对象**
```json
{
  "model": "deepseek-v4-pro",
  "thinking": {"type": "enabled"},
  "reasoning_effort": "high",
  "messages": [...]
}
```

**方式三：OpenAI SDK extra_body**
```python
response = client.chat.completions.create(
    model="deepseek-v4-pro",
    reasoning_effort="high",
    extra_body={"thinking": {"type": "enabled"}}
)
```

### 4.2 reasoning_effort 映射

| 输入值 | 实际映射 |
|--------|---------|
| `low` | → `high` |
| `medium` | → `high` |
| `high` | → `high` |
| `xhigh` | → `max` |
| `max` | → `max` |

### 4.3 思考模式下不生效的参数

- `temperature` — 不报错，但不生效
- `top_p` — 不报错，但不生效
- `presence_penalty` — 不报错，但不生效
- `frequency_penalty` — 不报错，但不生效
- `logprobs` — **会报错** ❌
- `top_logprobs` — **会报错** ❌

---

## 五、多轮对话中 reasoning_content 的处理

### 场景 1：无工具调用

`reasoning_content` 无需参与上下文拼接，即使传入也会被忽略。

```python
# 直接 append 整个 message 即可
messages.append(response.choices[0].message)
```

### 场景 2：有工具调用 ⚠️ 必须

两个 `user` 消息之间，如果模型**进行了工具调用**，则中间 `assistant` 的 `reasoning_content` **必须回传给 API**，否则返回 400 报错。

```python
# 必须携带 reasoning_content
messages.append({
    'role': 'assistant',
    'content': response.choices[0].message.content,
    'reasoning_content': response.choices[0].message.reasoning_content,
    'tool_calls': response.choices[0].message.tool_calls,
})
```

### 流式输出中的拼接

```python
reasoning_content = ""
content = ""
for chunk in response:
    if chunk.choices[0].delta.reasoning_content:
        reasoning_content += chunk.choices[0].delta.reasoning_content
    else:
        content += chunk.choices[0].delta.content

# 下一轮拼接
messages.append({
    "role": "assistant",
    "reasoning_content": reasoning_content,
    "content": content
})
```

---

## 六、响应格式

### 非流式响应

```json
{
  "id": "chatcmpl-xxxxx",
  "object": "chat.completion",
  "created": 1700000000,
  "model": "deepseek-v4-flash",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "回复内容",
        "reasoning_content": "思维链内容（思考模式）",
        "tool_calls": null
      },
      "logprobs": null,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30,
    "prompt_cache_hit_tokens": 0,
    "prompt_cache_miss_tokens": 10,
    "completion_tokens_details": {
      "reasoning_tokens": 5
    }
  }
}
```

### finish_reason 枚举

| 值 | 含义 |
|----|------|
| `stop` | 自然停止或遇到 stop 序列 |
| `length` | 达到上下文长度或 max_tokens 限制 |
| `content_filter` | 内容触发过滤策略 |
| `tool_calls` | 模型调用了工具 |
| `insufficient_system_resource` | 系统推理资源不足，生成被打断 |

---

## 七、流式 SSE 格式

### 推理阶段（思考模式先输出）

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1736xxx,"model":"deepseek-v4-flash","choices":[{"index":0,"delta":{"reasoning_content":"让我"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1736xxx,"model":"deepseek-v4-flash","choices":[{"index":0,"delta":{"reasoning_content":"一步步"},"finish_reason":null}]}
```

### 回答阶段

```
data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1736xxx,"model":"deepseek-v4-flash","choices":[{"index":0,"delta":{"content":"量子纠缠"},"finish_reason":null}]}

data: {"id":"chatcmpl-xxx","object":"chat.completion.chunk","created":1736xxx,"model":"deepseek-v4-flash","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### 关键规则

- `reasoning_content` 和 `content` **互斥**，同一 chunk 不会同时出现
- 第一个 chunk 通常包含 `delta.role: "assistant"`
- `finish_reason: "stop"` 的 chunk 中 `delta` 为空对象 `{}`
- 流式结束标记为 `data: [DONE]`

### 工具调用流式

```
data: {"choices":[{"delta":{"role":"assistant","content":null,"tool_calls":[{"index":0,"id":"call_xxx","type":"function","function":{"name":"get_weather","arguments":""}}]},"finish_reason":null}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"{\"lo"}}]},"finish_reason":null}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"cation"}}]},"finish_reason":null}]}

data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\": \"杭州\"}"}}]},"finish_reason":null}]}

data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}
```

---

## 八、Function Calling 完整流程

### 定义工具

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather of a location",
        "parameters": {
          "type": "object",
          "properties": {
            "location": {
              "type": "string",
              "description": "The city and state, e.g. San Francisco, CA"
            }
          },
          "required": ["location"]
        }
      }
    }
  ]
}
```

### strict 模式（需 beta 端点）

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "strict": true,
    "description": "Get weather of a location",
    "parameters": {
      "type": "object",
      "properties": {
        "location": {
          "type": "string",
          "description": "The city and state"
        }
      },
      "required": ["location"],
      "additionalProperties": false
    }
  }
}
```

> ⚠️ strict 模式要求**所有 function 均设置 `strict: true`**，否则报错

---

## 九、Context Caching（上下文缓存）

`usage` 中额外包含：

| 字段 | 说明 |
|------|------|
| `prompt_cache_hit_tokens` | 缓存命中的 token 数（更低费率） |
| `prompt_cache_miss_tokens` | 缓存未命中的 token 数 |

---

## 十、已知限制与注意事项

1. **思考模式默认开启**：`thinking.type` 默认为 `enabled`
2. **deepseek-reasoner 不支持 Function Calling**
3. **多轮对话中有工具调用时必须回传 reasoning_content**，否则 400 报错
4. **assistant 消息的 reasoning_content 字段**：非工具调用场景可不传（忽略），工具调用场景必须传
5. **max_tokens 包含思维链**：上限是思维链 + 最终回答的总长度
6. **logprobs 在思考模式下会报错**
