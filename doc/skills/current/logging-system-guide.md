# Logger 系统使用指南

## 概述

Logger 系统提供 Skill 调用记录、自动分析和升级功能，帮助持续优化 Skill。

---

## 系统组件

| 组件 | 文件 | 功能 |
|------|------|------|
| Record Logger | `record-logger.js` | 记录 Skill 调用到 JSON 文件 |
| Record Analyzer | `record-analyzer.js` | 分析记录并生成 AI 提示词 |
| Auto Upgrader | `auto-upgrader.js` | 根据分析结果升级 Skill |
| 配置 | `upgrade-config.json` | 升级规则和开关 |

---

## 目录结构

```
.opencode/skills/logger/
├── record-logger.js             # 日志记录器
├── record-analyzer.js           # 记录分析器
├── auto-upgrader.js            # 自动升级器
├── upgrade-config.json          # 升级配置
└── analysis-prompt-template.md # AI 分析提示词模板

.opencode/skills/<skill-name>/
├── SKILL.md
├── records/                    # 自动创建
│   └── call-*.json           # 调用记录
└── ...
```

---

## Record Logger

### 核心 API

```javascript
const RecordLogger = require('../logger/record-logger.js');
const logger = new RecordLogger('skill-name');

// 开始一次调用
logger.startCall(command, args);

// 记录步骤
logger.logStep('description', { key: 'value' });

// 结束调用
logger.endCall(success, error);
```

### 输出格式

```json
{
  "timestamp": "2026-04-26T00:00:00.000Z",
  "command": "check",
  "args": { "file": "src/app.js" },
  "steps": [
    { "timeMs": 10, "description": "Step 1", "data": { "result": "ok" } }
  ],
  "startTime": 1234567890,
  "skillName": "skill-name",
  "endTime": 1234567900,
  "durationMs": 10,
  "success": true,
  "error": null
}
```

---

## Record Analyzer

### 使用方式

```bash
node .opencode/skills/logger/record-analyzer.js <skill-name>
```

### 输出格式

```
[ANALYSIS_NEEDED: skill-name]
---PROMPT_START---
# AI Analysis Prompt Template

Please do a deep analysis of skill-name skill call records.

## Summary Statistics
{ ... }

## Full Records
[ ... ]

## Analysis Requirements
...

---PROMPT_END---
```

### 分析触发条件

| 条件 | 是否触发 |
|------|----------|
| 有失败记录 | ✅ |
| 调用次数 >= 3 | ✅ |
| 有 P0 错误 | ✅ |

---

## Auto Upgrader

### 使用方式

```javascript
const AutoUpgrader = require('../logger/auto-upgrader.js');
const upgrader = new AutoUpgrader();

upgrader.upgrade('skill-name', {
  needsImprovement: true,
  improvements: [
    {
      id: 'P0-1',
      severity: 'P0',
      description: 'Fix crash bug',
      suggestion: '...',
      targetFiles: ['skill.js'],
      changeType: 'PATCH'
    }
  ]
});
```

### 版本升级规则

| 优先级 | 条件 | 升级类型 |
|--------|------|----------|
| P0 | 任何 P0 问题 | PATCH (立即) |
| P1-P3 | 累积 >= 3 个问题 | PATCH 或 MINOR |

### SKILL.md 更新

升级会修改 `SKILL.md` 中的：

1. **版本号**：`metadata.version`
2. **版本历史**：添加 `## Version History` 条目

```yaml
---
name: my-skill
metadata:
  version: "1.0.1"  # 更新为此值
---
```

---

## 升级配置

### upgrade-config.json

```json
{
  "autoUpgradeEnabled": true,
  "accumulateThreshold": 3,
  "rules": {
    "P0": { "autoFix": true, "changeType": "PATCH" },
    "P1": { "autoFix": false, "accumulate": true },
    "P2": { "autoFix": false, "accumulate": true },
    "P3": { "autoFix": false, "accumulate": true }
  }
}
```

### 配置项说明

| 配置项 | 类型 | 说明 |
|--------|------|------|
| autoUpgradeEnabled | boolean | 开启/关闭自动升级 |
| accumulateThreshold | number | 累积多少问题触发升级 |
| rules.P0.autoFix | boolean | P0 是否立即修复 |
| rules.*.changeType | string | 升级类型 PATCH/MINOR/MAJOR |

---

## "无感触发"流程

1. **Skill 执行**：用户调用 Skill
2. **Logger 记录**：自动保存调用记录到 `records/`
3. **输出标记**：Skill 脚本输出 `[ANALYSIS_NEEDED: skill-name]`
4. **AI 检测**：AI 检测到标记
5. **AI 分析**：读取记录并生成分析
6. **升级执行**：调用 auto-upgrader 应用修复
7. **版本更新**：SKILL.md 版本号递增

---

## 集成到 Skill

### 完整示例

```javascript
const RecordLogger = require('../logger/record-logger.js');

function handleCommand(command, args) {
  const logger = new RecordLogger('my-skill');
  logger.startCall(command, args);

  try {
    switch (command) {
      case 'check':
        // 执行检查
        logger.logStep('Checking files...');
        const result = doCheck(args);
        logger.logStep('Check completed', { files: result.length });
        break;

      case 'fix':
        // 执行修复
        logger.logStep('Applying fixes...');
        doFix(args);
        logger.logStep('Fixes applied');
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }

    logger.endCall(true);
    console.log('Command executed successfully');

  } catch (error) {
    logger.endCall(false, error.message);
    console.error('Error:', error.message);
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

1. **records/ 目录**：由 logger 自动创建，无需手动创建
2. **.gitignore**：确保 `records/*.json` 被排除
3. **非 Node.js Skill**：Bash/PowerShell 脚本无法直接集成 logger
4. **版本号位置**：在 `SKILL.md` frontmatter 的 `metadata.version` 中

---

## 参考文档

- [OpenCode Skills 官方文档](https://opencode.ai/docs/zh-cn/skills/)
- [Auto Upgrader API](doc/skills/tools/logger-api.md)
