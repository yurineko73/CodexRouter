/**
 * Record Logger - Skill call recorder
 * Records each skill invocation to its own records/ directory
 * Does NOT store data itself - just provides API and saves to files
 */

const fs = require('fs');
const path = require('path');

class RecordLogger {
  constructor(skillName) {
    this.skillName = skillName;
    this.currentCall = null;
    this.recordsDir = path.join(__dirname, '..', skillName, 'records');
  }

  /**
   * Start recording a skill call
   * @param {string} command - The command/function being called
   * @param {Object} args - Arguments passed to the command
   */
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

  /**
   * Log a step in the current call
   * @param {string} description - Step description
   * @param {*} data - Optional data associated with step
   */
  logStep(description, data = null) {
    if (!this.currentCall) return;
    this.currentCall.steps.push({
      timeMs: Date.now() - this.currentCall.startTime,
      description,
      data
    });
  }

  /**
   * End the current call and save record to file
   * @param {boolean} success - Whether the call succeeded
   * @param {string|null} error - Error message if failed
   * @returns {Object|null} The completed record
   */
  endCall(success, error = null) {
    if (!this.currentCall) return null;

    this.currentCall.endTime = Date.now();
    this.currentCall.durationMs = this.currentCall.endTime - this.currentCall.startTime;
    this.currentCall.success = success;
    this.currentCall.error = error;

    const record = { ...this.currentCall };

    try {
      this._saveRecord(record);
    } catch (e) {
      console.error(`Failed to save record: ${e.message}`);
    }

    this.currentCall = null;
    return record;
  }

  /**
   * Save record to skill's records/ directory
   * @private
   */
  _saveRecord(record) {
    // Ensure records directory exists
    if (!fs.existsSync(this.recordsDir)) {
      fs.mkdirSync(this.recordsDir, { recursive: true });
    }

    const fileName = `call-${Date.now()}.json`;
    const filePath = path.join(this.recordsDir, fileName);
    fs.writeFileSync(filePath, JSON.stringify(record, null, 2), 'utf8');
    this.logStep(`Record saved: ${fileName}`);
  }

  /**
   * Get all records for this skill
   * @returns {Array} List of record objects
   */
  getRecords() {
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
   * Clear all records for this skill
   */
  clearRecords() {
    if (!fs.existsSync(this.recordsDir)) return;
    const files = fs.readdirSync(this.recordsDir).filter(f => f.endsWith('.json'));
    files.forEach(f => {
      fs.unlinkSync(path.join(this.recordsDir, f));
    });
  }
}

module.exports = RecordLogger;
