# Skill 开发指南

## 概述

本文档介绍如何创建、开发和维护 Skill，确保符合 OpenCode 官方格式规范。

---

## SKILL.md 格式规范

### 文件位置

```
.opencode/skills/<skill-name>/
└── SKILL.md              # 主文档（必须）
```

### Frontmatter

```yaml
---
name: skill-name           # 必须：小写字母、数字、连字符
description: 描述          # 必须：1-1024 字符
license: MIT              # 推荐
compatibility: opencode   # 推荐
metadata:
  audience: developers    # 推荐
  version: "1.0.0"        # 语义化版本
---
```

### Body 结构

```markdown
## What I do

- 功能点 1
- 功能点 2
- 功能点 3

## When to use me

- 使用场景 1
- 使用场景 2
- 使用场景 3

## 快速参考

<!-- 可选：命令表格、清单等 -->

## 注意事项

- 注意点 1
- 注意点 2

## 参考文档

- [链接]
```

---

## 创建新 Skill

### 方式一：使用 skill-creator

```bash
node .opencode/skills/skill-creator/creator.js create my-skill "My skill description"
```

这会自动创建：
```
.opencode/skills/my-skill/
├── SKILL.md
└── records/
    └── .gitignore
```

### 方式二：手动创建

1. 创建目录结构
2. 编写 SKILL.md
3. 集成 logger（如需要）

---

## Skill 目录结构

### 完整结构

```
.opencode/skills/<skill-name>/
├── SKILL.md              # 主文档
├── <tool-script>.js      # 可选：工具脚本
├── records/              # 自动创建：调用记录
│   └── .gitignore
└── templates/            # 可选：模板文件
    └── *.template
```

### 不需要 records/ 的 Skill

- `mcp-setup` - 仅配置，无执行逻辑
- `file-cleanup` - Bash/PowerShell 脚本（不在 Node.js 中运行）

---

## Logger 集成

### 集成步骤

1. 在工具脚本中引入 logger：

```javascript
const RecordLogger = require('../logger/record-logger.js');
const logger = new RecordLogger('skill-name');
```

2. 在命令处理中调用 logger：

```javascript
function handleCommand(command, args) {
  logger.startCall(command, args);
  try {
    // 执行命令
    logger.logStep('Step description', { data: 'value' });
    // ...
    logger.endCall(true);
  } catch (error) {
    logger.endCall(false, error.message);
    throw error;
  }
}
```

### 日志触发分析

执行命令后会自动输出：

```
[ANALYSIS_NEEDED: skill-name]
---PROMPT_START---
# AI Analysis Prompt...
---PROMPT_END---
```

AI 看到 `[ANALYSIS_NEEDED:]` 标记后会执行分析。

---

## 版本管理

### 版本号规则

| 变更类型 | 触发条件 | 版本变化 |
|----------|----------|----------|
| PATCH | P0 修复、累积小修复 | 1.0.0 → 1.0.1 |
| MINOR | 新功能、向后兼容变更 | 1.0.0 → 1.1.0 |
| MAJOR | 破坏性变更 | 1.0.0 → 2.0.0 |

### 版本升级触发

| 优先级 | 触发条件 | 行为 |
|--------|----------|------|
| P0 | 任何 P0 问题 | 立即 PATCH 升级 |
| P1-P3 | 累积 3 个问题 | 批量 PATCH 升级 |

---

## 工具脚本规范

### 基本模板

```javascript
#!/usr/bin/env node

/**
 * <skill-name> - Tool Script
 */

const fs = require('fs');
const path = require('path');

// Logger integration
class RecordLogger {
  constructor(skillName) {
    this.skillName = skillName;
    this.currentCall = null;
    this.recordsDir = path.join(__dirname, '..', skillName, 'records');
  }

  startCall(command, args = {}) {
    this.currentCall = {
      timestamp: new Date().toISOString(),
      command,
      args,
      steps: [],
      startTime: Date.now(),
      skillName: this.skillName
    };
    return this.currentCall;
  }

  logStep(description, data = null) {
    if (!this.currentCall) return;
    this.currentCall.steps.push({
      timeMs: Date.now() - this.currentCall.startTime,
      description,
      data
    });
  }

  endCall(success, error = null) {
    if (!this.currentCall) return null;
    this.currentCall.endTime = Date.now();
    this.currentCall.durationMs = this.currentCall.endTime - this.currentCall.startTime;
    this.currentCall.success = success;
    this.currentCall.error = error;
    const record = { ...this.currentCall };
    this._saveRecord(record);
    this.currentCall = null;
    return record;
  }

  _saveRecord(record) {
    if (!fs.existsSync(this.recordsDir)) {
      fs.mkdirSync(this.recordsDir, { recursive: true });
    }
    const fileName = `call-${Date.now()}.json`;
    const filePath = path.join(this.recordsDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
  }
}

// CLI Handler
function handleCommand(command, args) {
  const logger = new RecordLogger('{skillName}');
  logger.startCall(command, args);

  try {
    // Your command logic here
    logger.endCall(true);
  } catch (error) {
    logger.endCall(false, error.message);
    throw error;
  }
}

// CLI Entry Point
const command = process.argv[2];
const args = process.argv.slice(3);
handleCommand(command, args);
```

---

## 注意事项

1. **Frontmatter 必须**：name 和 description 是必填字段
2. **Name 规范**：`^[a-z0-9]+(-[a-z0-9]+)*$`
3. **Description 长度**：1-1024 字符
4. **records/.gitignore**：必须包含 `*.json` 排除规则
5. **Logger 非必须**：仅在需要记录调用历史时集成

---

## 参考文档

- [OpenCode Skills 官方文档](https://opencode.ai/docs/zh-cn/skills/)
- [Conventional Commits](https://www.conventionalcommits.org/)
