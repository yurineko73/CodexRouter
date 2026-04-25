# Skill 自动记录、分析与升级计划

## 需求

1. **调用记录**：每次 skill 调用的参数、步骤、成功/失败状态、错误信息
2. **自动分析**：每次调用结束后分析记录（AI 辅助深度分析）
3. **自动升级**：根据分析结果更新 skill（md 文档 + js 脚本）
4. **版本管理**：语义化版本号，在 md 文档中记录升级摘要

## 用户确认

1. ✅ 版本号：语义化版本（MAJOR.MINOR.PATCH）
2. ✅ 升级触发：智能处理（P0 立即修复，普通累积多次升级）
3. ✅ 记录存储：各 skill 下的 `records/` 目录，logger 只实现功能不保存数据
4. ✅ 升级范围：升级 md 文档 + 根据建议修改 js 脚本
5. ✅ AI 分析：借助 AI 辅助进行深度分析
6. ✅ 开关功能：用户可选择开启/关闭自动升级

## 实现方案

### 目录结构

```
.opencode/skills/
├── logger/                         # 新增：日志系统核心
│   ├── README.md                    # 日志系统说明
│   ├── record-logger.js             # 日志记录（保存到各 skill/records/）
│   ├── record-analyzer.js           # 生成 AI 分析提示词
│   ├── auto-upgrader.js             # 自动升级引擎
│   ├── upgrade-config.json          # 升级配置（开关、规则）
│   └── analysis-prompt-template.md # AI 分析提示词模板
├── git-operations/
│   ├── records/                    # 新增：调用记录存储
│   │   └── .gitignore             # 忽略 *.json
│   ├── git-operations.md
│   ├── git-helper.js               # 修改：集成日志+触发标记
│   └── ...
├── code-review/
│   ├── records/                    # 新增
│   └── ...
└── ... (其余 5 个 skill 同理)
```

### 核心模块

#### 1. `logger/record-logger.js`
- 提供 API：`startCall()`, `logStep()`, `endCall()`
- `endCall()` 时保存 JSON 到各 skill 的 `records/` 目录
- 每次调用一个 JSON 文件（`call-{timestamp}.json`）

#### 2. `logger/record-analyzer.js`
- `analyze()` 读取 `records/` 下所有 JSON
- 生成 AI 分析提示词
- **输出特殊标记到 stdout**：`[ANALYSIS_NEEDED: skillName]`
- 提示词包含完整记录和统计摘要

#### 3. `logger/auto-upgrader.js`
- `upgrade()` 根据 AI 分析结果直接修改文件
- `_decideUpgrade()` 智能决策（P0 立即修，累积阈值触发）
- `_bumpVersion()` 修改 md 文件的版本号
- `_applyImprovements()` 直接修改 js/md 文件
- `_updateVersionHistory()` 在 md 中添加版本历史

#### 4. `logger/upgrade-config.json`
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

### "无感触发"方案

1. Skill 脚本执行后输出标记：`[ANALYSIS_NEEDED: git-operations]`
2. 标记后跟随 AI 提示词（`---PROMPT_START---` 和 `---PROMPT_END---`）
3. AI 看到标记后，自动读取提示词
4. AI 执行分析（自己就是分析器）
5. AI 根据分析结果，调用 `auto-upgrader.js` 的逻辑修改文件
6. AI 更新版本号和历史

### 修改现有 Skill

每个 skill 的 js 脚本修改约 10 行：
- 引入 logger 模块
- 在命令函数中调用 `startCall/logStep/endCall`
- 在 `endCall` 后通过 `setTimeout` 触发分析（异步）

每个 skill 的 md 文档修改约 5 行：
- 添加版本号 `**Version**: 1.0.0`
- 添加 Auto-Analysis 说明
- 添加 `## Version History` 章节

## 执行步骤

1. 创建 `logger/` 目录和 6 个核心文件
2. 为 6 个 skill 各创建 `records/` 目录和 `.gitignore`
3. 修改 6 个 skill 的 js 脚本（集成日志）
4. 修改 6 个 skill 的 md 文档（版本号+历史）
5. 更新项目根目录 `.gitignore`
6. 测试验证

## 测试验证

1. 执行一次 skill 调用：`node .opencode/skills/git-operations/git-helper.js status`
2. 检查 `records/` 是否生成 JSON 文件
3. 检查 stdout 是否输出 `[ANALYSIS_NEEDED: ...]`
4. 模拟 AI 执行分析流程
5. 验证升级功能（版本号更新、文件修改）

## 注意事项

- `records/*.json` 分析后保留（历史数据）
- `records/` 目录加入 `.gitignore`
- 升级开关在 `upgrade-config.json` 中配置
- 所有 skill 初始版本为 `1.0.0`
