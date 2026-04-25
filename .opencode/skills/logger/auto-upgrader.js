/**
 * Auto Upgrader - Applies improvements based on AI analysis
 * Directy modifies files (js/md) and bumps version
 */

const fs = require('fs');
const path = require('path');

class AutoUpgrader {
  constructor() {
    this.configPath = path.join(__dirname, 'upgrade-config.json');
    this.config = this._loadConfig();
  }

  /**
   * Main upgrade method
   * @param {string} skillName - Name of the skill to upgrade
   * @param {Object} aiResult - AI analysis result (parsed JSON)
   * @returns {Object} { upgraded, newVersion, changeType }
   */
  upgrade(skillName, aiResult) {
    // Check if auto-upgrade is enabled
    if (!this.config.autoUpgradeEnabled) {
      console.log(`Auto-upgrade disabled. Skipping ${skillName}...`);
      return { upgraded: false, reason: 'Auto-upgrade disabled' };
    }

    // Validate AI result
    if (!aiResult || !aiResult.improvements || aiResult.improvements.length === 0) {
      return { upgraded: false, reason: 'No improvements to apply' };
    }

    // Decide upgrade type
    const decision = this._decideUpgrade(aiResult);
    if (!decision.shouldUpgrade) {
      return { upgraded: false, reason: decision.reason };
    }

    console.log(`Upgrading ${skillName} with change type: ${decision.changeType}`);

    // Bump version in md file
    const newVersion = this._bumpVersion(skillName, decision.changeType);

    // Apply improvements to files
    this._applyImprovements(skillName, aiResult.improvements);

    // Update version history in md file
    this._updateVersionHistory(skillName, newVersion, aiResult.improvements, decision.changeType);

    return { upgraded: true, newVersion, changeType: decision.changeType };
  }

  /**
   * Decide whether to upgrade and what type of change
   * @private
   */
  _decideUpgrade(aiResult) {
    const improvements = aiResult.improvements || [];

    // P0 issues: immediate PATCH upgrade
    const hasP0 = improvements.some(i => i.severity === 'P0');
    if (hasP0) {
      return { shouldUpgrade: true, changeType: 'PATCH', reason: 'P0 issue requires urgent fix' };
    }

    // Check accumulation threshold
    if (improvements.length >= this.config.accumulateThreshold) {
      const hasMinor = improvements.some(i => i.changeType === 'MINOR');
      return {
        shouldUpgrade: true,
        changeType: hasMinor ? 'MINOR' : 'PATCH',
        reason: `Accumulated ${improvements.length} improvements`
      };
    }

    return { shouldUpgrade: false, reason: 'Not enough improvements accumulated' };
  }

  /**
   * Bump version in skill's md file
   * @private
   */
  _bumpVersion(skillName, changeType) {
    const mdPath = path.join(__dirname, '..', skillName, `${skillName}.md`);
    if (!fs.existsSync(mdPath)) {
      console.warn(`MD file not found: ${mdPath}`);
      return null;
    }

    let content = fs.readFileSync(mdPath, 'utf8');
    const versionMatch = content.match(/\*\*Version\*\*: (\d+)\.(\d+)\.(\d+)/);
    if (!versionMatch) {
      console.warn('Version not found in md file, starting at 1.0.0');
      return '1.0.0';
    }

    let [_, major, minor, patch] = versionMatch;
    major = parseInt(major); minor = parseInt(minor); patch = parseInt(patch);

    switch (changeType) {
      case 'MAJOR': major++; minor = 0; patch = 0; break;
      case 'MINOR': minor++; patch = 0; break;
      case 'PATCH':
      default: patch++; break;
    }

    const newVersion = `${major}.${minor}.${patch}`;

    // Update version in md
    const newContent = content.replace(
      /\*\*Version\*\*: \d+\.\d+\.\d+/,
      `**Version**: ${newVersion}`
    );
    fs.writeFileSync(mdPath, newContent, 'utf8');

    console.log(`Version bumped to ${newVersion}`);
    return newVersion;
  }

  /**
   * Apply improvements to target files
   * @private
   */
  _applyImprovements(skillName, improvements) {
    improvements.forEach((imp, idx) => {
      console.log(`Applying improvement ${idx + 1}: ${imp.id} (${imp.severity})`);

      if (!imp.targetFiles || imp.targetFiles.length === 0) {
        console.warn('  No target files specified, skipping');
        return;
      }

      imp.targetFiles.forEach(targetFile => {
        // Resolve path relative to skill directory
        let fullPath;
        if (path.isAbsolute(targetFile)) {
          fullPath = targetFile;
        } else {
          fullPath = path.join(__dirname, '..', skillName, targetFile);
        }

        if (!fs.existsSync(fullPath)) {
          console.warn(`  File not found: ${fullPath}`);
          return;
        }

        // Apply the suggestion (direct text replacement or manual instruction)
        if (imp.suggestion) {
          this._applySuggestion(fullPath, imp.suggestion, imp);
        }
      });
    });
  }

  /**
   * Apply a suggestion to a file
   * @private
   */
  _applySuggestion(filePath, suggestion, improvement) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');

      // Simple approach: if suggestion contains oldString/newString pattern
      const oldNewMatch = suggestion.match(/oldString:\s*`([^`]+)`\s*newString:\s*`([^`]+)`/);
      if (oldNewMatch) {
        const oldStr = oldNewMatch[1];
        const newStr = oldNewMatch[2];
        if (content.includes(oldStr)) {
          content = content.replace(oldStr, newStr);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`  Applied text replacement in ${path.basename(filePath)}`);
        }
      } else {
        // For complex improvements, just log the suggestion
        console.log(`  Manual review needed for ${path.basename(filePath)}:`);
        console.log(`  Suggestion: ${suggestion.substring(0, 100)}...`);
      }
    } catch (e) {
      console.error(`  Error applying suggestion: ${e.message}`);
    }
  }

  /**
   * Update version history in md file
   * @private
   */
  _updateVersionHistory(skillName, newVersion, improvements, changeType) {
    const mdPath = path.join(__dirname, '..', skillName, `${skillName}.md`);
    if (!fs.existsSync(mdPath)) return;

    let content = fs.readFileSync(mdPath, 'utf8');

    // Find or create Version History section
    let historySection = '## Version History\n\n';
    if (!content.includes('## Version History')) {
      content += '\n\n' + historySection;
    }

    // Build new entry
    const date = new Date().toISOString().split('T')[0];
    let entry = `\n### ${newVersion} (${date})\n`;
    entry += `- Change type: ${changeType}\n`;
    entry += `- Improvements applied:\n`;
    improvements.forEach(imp => {
      entry += `  - [${imp.id}] ${imp.description || imp.severity} level fix\n`;
    });
    entry += '\n';

    // Insert after "## Version History"
    if (content.includes('## Version History')) {
      const insertPos = content.indexOf('## Version History') + '## Version History\n'.length;
      content = content.slice(0, insertPos) + entry + content.slice(insertPos);
    } else {
      content += entry;
    }

    fs.writeFileSync(mdPath, content, 'utf8');
    console.log(`Version history updated in ${skillName}.md`);
  }

  /**
   * Load configuration
   * @private
   */
  _loadConfig() {
    if (fs.existsSync(this.configPath)) {
      try {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      } catch (e) {
        console.warn('Failed to load config, using defaults');
      }
    }

    // Default config
    return {
      autoUpgradeEnabled: true,
      accumulateThreshold: 3,
      rules: {
        P0: { autoFix: true, changeType: 'PATCH' },
        P1: { autoFix: false, accumulate: true },
        P2: { autoFix: false, accumulate: true },
        P3: { autoFix: false, accumulate: true }
      }
    };
  }
}

module.exports = AutoUpgrader;
