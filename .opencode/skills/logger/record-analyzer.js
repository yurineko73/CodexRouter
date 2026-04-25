/**
 * Record Analyzer - Generates AI analysis prompt
 * Reads records from skill's records/ directory
 * Outputs special marker to stdout for "seamless triggering"
 */

const fs = require('fs');
const path = require('path');

class RecordAnalyzer {
  constructor(skillName) {
    this.skillName = skillName;
    this.recordsDir = path.join(__dirname, '..', skillName, 'records');
    this.templatePath = path.join(__dirname, 'analysis-prompt-template.md');
  }

  /**
   * Analyze records and generate AI prompt
   * @returns {Object} { needsImprovement, prompt, summary }
   */
  analyze() {
    const records = this._loadRecords();

    if (records.length === 0) {
      return {
        needsImprovement: false,
        prompt: null,
        summary: { totalCalls: 0, message: 'No records yet' }
      };
    }

    // Generate quick summary
    const summary = this._generateSummary(records);

    // Build the AI analysis prompt
    const prompt = this._buildPrompt(records, summary);

    // Output special marker to stdout (for seamless triggering)
    this._outputMarker(prompt);

    return {
      needsImprovement: summary.needsImprovement,
      prompt,
      summary
    };
  }

  /**
   * Load all records from JSON files
   * @private
   */
  _loadRecords() {
    if (!fs.existsSync(this.recordsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.recordsDir)
      .filter(f => f.endsWith('.json'))
      .sort(); // Sort by filename (timestamp)

    return files.map(f => {
      try {
        const content = fs.readFileSync(path.join(this.recordsDir, f), 'utf8');
        return JSON.parse(content);
      } catch (e) {
        return null;
      }
    }).filter(r => r !== null);
  }

  /**
   * Generate quick summary statistics
   * @private
   */
  _generateSummary(records) {
    const failed = records.filter(r => !r.success);
    const p0Errors = this._findP0Errors(failed);

    return {
      totalCalls: records.length,
      successRate: ((records.length - failed.length) / records.length * 100).toFixed(1) + '%',
      failedCalls: failed.length,
      avgDurationMs: Math.round(records.reduce((sum, r) => sum + r.durationMs, 0) / records.length),
      p0Errors,
      needsImprovement: failed.length > 0 || records.length >= 3
    };
  }

  /**
   * Find P0 level errors in failed calls
   * @private
   */
  _findP0Errors(failedRecords) {
    // Simple heuristic: errors containing certain keywords are P0
    const p0Keywords = ['crash', 'block', 'fail', 'error', 'exception', 'undefined', 'null'];
    return failedRecords.filter(r => {
      const errorStr = JSON.stringify(r.error || '').toLowerCase();
      return p0Keywords.some(kw => errorStr.includes(kw));
    }).length;
  }

  /**
   * Build AI analysis prompt using template
   * @private
   */
  _buildPrompt(records, summary) {
    let template = '';
    if (fs.existsSync(this.templatePath)) {
      template = fs.readFileSync(this.templatePath, 'utf8');
    } else {
      template = this._getDefaultTemplate();
    }

    // Replace placeholders
    template = template.replace(/\{skillName\}/g, this.skillName);
    template = template.replace(/\{summary\}/g, JSON.stringify(summary, null, 2));
    template = template.replace(/\{records\}/g, JSON.stringify(records, null, 2));

    return template;
  }

  /**
   * Output special marker and prompt to stdout
   * @private
   */
  _outputMarker(prompt) {
    console.log(`\n[ANALYSIS_NEEDED: ${this.skillName}]`);
    console.log('---PROMPT_START---');
    console.log(prompt);
    console.log('---PROMPT_END---\n');
  }

  /**
   * Default prompt template if file doesn't exist
   * @private
   */
  _getDefaultTemplate() {
    return `Please do a deep analysis of {skillName} skill call records:

## Summary
{summary}

## Full Records
{records}

## Analysis Requirements
1. Classify failed calls as P0/P1/P2/P3
2. For P0 errors: suggest urgent fixes
3. Generate improvement list with code examples
4. Return JSON format:
{
  "needsImprovement": boolean,
  "urgentFixNeeded": boolean,
  "summary": "analysis summary",
  "improvements": [
    {
      "id": "P0-1",
      "severity": "P0",
      "description": "...",
      "suggestion": "...",
      "targetFiles": ["path/to/file.js", "path/to/file.md"],
      "changeType": "PATCH"
    }
  ]
}`;
  }
}

module.exports = RecordAnalyzer;
