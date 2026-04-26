---
name: api-docs
description: 验证 API 文档、参数和本地代码中的 API 用法。
license: MIT
metadata:
  audience: developers
  version: "1.0.0"
---

## 功能

- 校验常见 API 参数是否符合官方文档
- 列出常用官方文档链接，便于快速查阅
- 扫描本地代码中的 API 用法问题

## 何时使用

- 需要核对 API 参数名称、必填项和枚举值
- 代码里的 API 调用和官方文档可能不一致
- 需要快速找到对应官方文档入口

## 命令

- `node .agents/skills/api-docs/api-validator.js docs`
- `node .agents/skills/api-docs/api-validator.js validate <api> <endpoint> '<json>'`
- `node .agents/skills/api-docs/api-validator.js check <file>`

## 注意事项

- `validate` 支持直接传 JSON，也支持 `@file.json`
- 该技能优先引用官方文档链接，不依赖提示词触发

