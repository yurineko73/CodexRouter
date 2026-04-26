# 技能目录索引

## 保留技能

### `doc-router`
- 位置: [`./doc-router/`](./doc-router/)
- 作用: 识别文档类型、判断状态、移动文档到合适目录
- 入口: [`doc-router.js`](./doc-router/doc-router.js)

### `skill-creator`
- 位置: [`./skill-creator/`](./skill-creator/)
- 作用: 创建、校验和优化 `.agents/skills` 下的新技能
- 入口: [`creator.js`](./skill-creator/creator.js)

### `api-docs`
- 位置: [`./api-docs/`](./api-docs/)
- 作用: API 文档查询、参数验证、本地代码检查
- 入口: [`api-validator.js`](./api-docs/api-validator.js)

### `doc-analysis`
- 位置: [`./doc-analysis/`](./doc-analysis/)
- 作用: 检查文档是否过时、是否与实现一致
- 入口: [`doc-fixer.js`](./doc-analysis/doc-fixer.js)

## 支持文件

- [`./README.md`](./README.md): 技能目录总说明
- [`./doc-router/doc-types.json`](./doc-router/doc-types.json): 文档类型缓存

## 不再单独暴露

- `logger`: 仅作为内部实现使用，不作为独立 skill

