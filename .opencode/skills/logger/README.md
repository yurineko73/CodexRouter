# Logger System - Auto Upgrade

Automatic recording, analysis, and upgrade system for OpenCode skills.

## Overview

This system provides automatic logging, AI-powered analysis, and intelligent upgrade capabilities for all skills in `.opencode/skills/`.

## Features

- **Automatic Recording**: Each skill call is logged with parameters, steps, success/failure status
- **AI-Powered Analysis**: Deep analysis of call records using AI (Codex/Claude)
- **Smart Upgrade**: Automatic version bumps and file modifications based on analysis
- **Seamless Triggering**: Special marker output to stdout for AI detection

## Architecture

```
.opencode/skills/
├── logger/
│   ├── README.md                    # This file
│   ├── record-logger.js             # Record API (saves to skill/records/)
│   ├── record-analyzer.js           # Generates AI analysis prompt
│   ├── auto-upgrader.js             # Applies upgrades (modifies files)
│   ├── upgrade-config.json          # Configuration (enable/disable, rules)
│   └── analysis-prompt-template.md # AI prompt template
├── git-operations/
│   ├── records/                    # Call records (gitignored)
│   │   └── .gitignore
│   ├── git-helper.js               # Modified: integrated logging
│   └── git-operations.md          # Modified: version + auto-analysis note
└── ... (other skills same structure)
```

## Core Modules

### 1. `record-logger.js`

Provides API for skills to log their calls.

**Usage in skill scripts**:
```javascript
const RecordLogger = require('../logger/record-logger.js');

function myCommand(args) {
  const logger = new RecordLogger('git-operations');
  logger.startCall('myCommand', args);
  
  try {
    // ... command logic ...
    logger.logStep('Completed step 1');
    logger.logStep('Completed step 2');
    
    logger.endCall(true); // success
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}
```

**What it does**:
- Saves each call as a separate JSON file in `skill-name/records/call-{timestamp}.json`
- Records: timestamp, command, args, steps, duration, success, error

### 2. `record-analyzer.js`

Reads records and generates AI analysis prompt.

**Integration**:
```javascript
// After endCall()
setTimeout(() => {
  const analyzer = new RecordAnalyzer('git-operations');
  analyzer.analyze(); // Outputs [ANALYSIS_NEEDED: ...]
}, 0);
```

**Output to stdout**:
```
[ANALYSIS_NEEDED: git-operations]
---PROMPT_START---
{AI analysis prompt with records and summary}
---PROMPT_END---
```

### 3. `auto-upgrader.js`

Applies improvements based on AI analysis result.

**Upgrade logic**:
- Reads `upgrade-config.json` for rules
- P0 issues: immediate PATCH upgrade
- P1-P3: accumulate until threshold (default 3)
- Directly modifies target files (js/md)
- Bumps version in md file
- Updates `## Version History` section in md

## Triggering Flow ("Seamless" Integration)

1. User requests: "Help me commit code"
2. AI executes: `node .opencode/skills/git-operations/git-helper.js commit "fix: ..."`
3. Script runs, records call, saves `records/call-1234567890.json`
4. Script outputs to stdout:
   ```
   [ANALYSIS_NEEDED: git-operations]
   ---PROMPT_START---
   {prompt}
   ---PROMPT_END---
   ```
5. AI sees the marker, reads the prompt
6. AI performs analysis (it IS the analyzer)
7. AI generates result JSON
8. AI calls `auto-upgrader.js` logic:
   - Modifies files based on suggestions
   - Bumps version in md file
   - Updates version history
9. Skill upgraded automatically!

## Configuration

### `upgrade-config.json`

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

**To disable auto-upgrade**:
Set `"autoUpgradeEnabled": false`

## Version Management

Semantic versioning: **MAJOR.MINOR.PATCH**

| Change Type | Version Bump | When to Use |
|------------|-------------|------------|
| MAJOR | X.0.0 | Incompatible changes |
| MINOR | x.Y.0 | New backward-compatible features |
| PATCH | x.y.Z | Backward-compatible bug fixes |

**Initial version**: All skills start at `1.0.0`

## Modifying Skills

### JS Scripts Modification

Add to each skill's main js file:

```javascript
const RecordLogger = require('../logger/record-logger.js');
const RecordAnalyzer = require('../logger/record-analyzer.js');

// In each command function:
function someCommand(args) {
  const logger = new RecordLogger('skill-name');
  logger.startCall('someCommand', args);
  
  try {
    // ... original logic ...
    logger.logStep('Step description');
    logger.endCall(true);
    
    // Trigger analysis
    setTimeout(() => {
      const analyzer = new RecordAnalyzer('skill-name');
      analyzer.analyze();
    }, 0);
    
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}
```

### MD Documents Modification

Add to each skill's md file header:

```markdown
**Version**: 1.0.0

> **Auto-Analysis**: After running commands, if you see `[ANALYSIS_NEEDED: ...]` in output, 
> automatically run the analysis and upgrade process using the prompt provided.

## Version History

### 1.0.0 (2026-04-25)
- Initial release
- Added logging and auto-upgrade capabilities
```

## .gitignore Updates

Add to project's `.gitignore`:
```
.opencode/skills/*/records/
```

Records are kept locally for analysis but not committed to repository.

## AI Collaboration

### For Codex/Claude

When you see this in command output:
```
[ANALYSIS_NEEDED: git-operations]
---PROMPT_START---
...
---PROMPT_END---
```

Do the following:
1. Read the prompt between `---PROMPT_START---` and `---PROMPT_END---`
2. Perform the analysis as instructed
3. Use the result to:
   - Modify target files (js/md) as suggested
   - Update version numbers
   - Update version history
4. Output a summary of what was upgraded

## Testing

### 1. Test Recording

```bash
node .opencode/skills/git-operations/git-helper.js status
```

Check `.opencode/skills/git-operations/records/` for new JSON file.

### 2. Test Analysis Trigger

Run any skill command, check stdout for:
```
[ANALYSIS_NEEDED: git-operations]
---PROMPT_START---
...
---PROMPT_END---
```

### 3. Test Auto-Upgrade

Simulate AI analysis by creating a result JSON, then apply:
```javascript
const AutoUpgrader = require('.opencode/skills/logger/auto-upgrader.js');
const upgrader = new AutoUpgrader();
upgrader.upgrade('git-operations', analysisResult);
```

## Notes

- Records are saved as individual JSON files (one per call)
- Records are NOT deleted after analysis (kept for history)
- `records/` directories are in `.gitignore`
- All skills start at version `1.0.0`
- P0 issues trigger immediate upgrade
- Normal improvements accumulate until threshold (default 3)
