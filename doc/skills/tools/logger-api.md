# Logger API 参考

## RecordLogger

### 构造函数

```javascript
const logger = new RecordLogger(skillName);
```

| 参数 | 类型 | 说明 |
|------|------|------|
| skillName | string | Skill 名称（目录名） |

### 方法

#### startCall(command, args)

开始记录一次调用。

```javascript
logger.startCall('check', { file: 'src/app.js' });
```

| 参数 | 类型 | 说明 |
|------|------|------|
| command | string | 命令名称 |
| args | Object | 命令参数 |

**返回**: `Object` - 调用记录对象

---

#### logStep(description, data)

记录一个步骤。

```javascript
logger.logStep('File analyzed', { lines: 100 });
```

| 参数 | 类型 | 说明 |
|------|------|------|
| description | string | 步骤描述 |
| data | any | 附加数据（可选） |

---

#### endCall(success, error)

结束调用并保存记录。

```javascript
logger.endCall(true);           // 成功
logger.endCall(false, 'Error'); // 失败
```

| 参数 | 类型 | 说明 |
|------|------|------|
| success | boolean | 是否成功 |
| error | string | 错误信息（可选） |

**返回**: `Object` - 完成的记录对象

---

#### getRecords()

获取所有记录。

```javascript
const records = logger.getRecords();
```

**返回**: `Array` - 记录对象数组

---

#### clearRecords()

清除所有记录。

```javascript
logger.clearRecords();
```

---

## RecordAnalyzer

### 构造函数

```javascript
const analyzer = new RecordAnalyzer(skillName);
```

### 方法

#### analyze()

分析记录并输出 AI 提示词。

```javascript
const result = analyzer.analyze();
console.log(result.needsImprovement); // boolean
console.log(result.summary);           // 统计摘要
```

**返回**: `Object`

```javascript
{
  needsImprovement: boolean,
  prompt: string,      // AI 提示词
  summary: {
    totalCalls: number,
    successRate: string,
    failedCalls: number,
    avgDurationMs: number,
    p0Errors: number,
    needsImprovement: boolean
  }
}
```

**副作用**: 输出 `[ANALYSIS_NEEDED:]` 标记到 stdout

---

## AutoUpgrader

### 构造函数

```javascript
const upgrader = new AutoUpgrader();
```

### 方法

#### upgrade(skillName, aiResult)

执行升级。

```javascript
const result = upgrader.upgrade('my-skill', {
  needsImprovement: true,
  improvements: [
    {
      id: 'P0-1',
      severity: 'P0',
      description: 'Fix crash bug',
      suggestion: 'oldString: `bug` newString: `fix`',
      targetFiles: ['helper.js'],
      changeType: 'PATCH'
    }
  ]
});
```

**参数**:

| 参数 | 类型 | 说明 |
|------|------|------|
| skillName | string | Skill 名称 |
| aiResult | Object | AI 分析结果 |

**aiResult 格式**:

```javascript
{
  needsImprovement: boolean,
  improvements: [
    {
      id: string,          // 唯一 ID，如 'P0-1'
      severity: string,    // P0/P1/P2/P3
      description: string,  // 问题描述
      suggestion: string,   // 修复建议
      targetFiles: string[], // 目标文件
      changeType: string    // PATCH/MINOR/MAJOR
    }
  ]
}
```

**返回**: `Object`

```javascript
{
  upgraded: boolean,
  newVersion: string,    // 如 '1.0.1'
  changeType: string,    // PATCH/MINOR/MAJOR
  reason?: string        // 未升级原因
}
```

---

## 配置文件

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
  },
  "versionStrategy": "semantic",
  "notes": "autoFix=true means apply fixes immediately. accumulate=true means wait until threshold."
}
```

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| autoUpgradeEnabled | true | 开启自动升级 |
| accumulateThreshold | 3 | 累积问题数触发升级 |
| rules.P0.autoFix | true | P0 问题立即修复 |
| rules.P0.changeType | "PATCH" | P0 升级类型 |

---

## 错误处理

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `SKILL.md not found` | 文件不存在 | 检查 skill 目录 |
| `Version not found` | frontmatter 缺少 version | 添加 `version: "1.0.0"` |
| `No improvements to apply` | aiResult.improvements 为空 | 检查分析结果 |

### 调试方法

```javascript
// 启用详细日志
const logger = new RecordLogger('my-skill', { debug: true });

// 获取所有记录
const records = logger.getRecords();
console.log(records);
```
