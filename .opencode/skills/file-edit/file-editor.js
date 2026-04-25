#!/usr/bin/env node
/**
 * File Editor - Convenient file modification tool
 * Features: insert, delete, prepend, append, replace, search, list, undo
 * Supports: regex, glob patterns, batch operations, MCP integration
 * No external dependencies - pure Node.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const RecordLogger = require('../logger/record-logger.js');
const RecordAnalyzer = require('../logger/record-analyzer.js');

const BACKUP_DIR = path.join(__dirname, 'records');
const BACKUP_SUFFIX = '.bak';

let lastBackupFiles = [];

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function createBackup(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const backupPath = filePath + BACKUP_SUFFIX;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function restoreBackup(backupPath, originalPath) {
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, originalPath);
    return true;
  }
  return false;
}

function readLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.split('\n');
}

function writeLines(filePath, lines) {
  fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
}

function matchPattern(filename, pattern) {
  if (pattern.includes('**')) {
    const segments = pattern.split('**');
    if (segments.length === 2) {
      if (pattern.startsWith('**/')) {
        const suffix = segments[1];
        const suffixRegex = globToRegex(suffix);
        return new RegExp(`${suffixRegex}$`).test(filename);
      } else if (pattern.endsWith('/**')) {
        const prefix = segments[0];
        const prefixRegex = globToRegex(prefix);
        return new RegExp(`^${prefixRegex}.*`).test(filename);
      } else {
        const prefixRegex = globToRegex(segments[0]);
        const suffixRegex = globToRegex(segments[1]);
        const combined = `^${prefixRegex}(?:.*/)?${suffixRegex}$`;
        return new RegExp(combined).test(filename);
      }
    }
  }

  const regexStr = globToRegex(pattern);
  return new RegExp(`^${regexStr}$`).test(filename);
}

function globToRegex(pattern) {
  return pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.')
    .replace(/\{([^}]+)\}/g, (_, opts) => `(${opts.split(',').join('|')})`);
}

function glob(pattern, cwd = process.cwd()) {
  const results = [];
  const normalizedPattern = pattern.replace(/\\/g, '/');

  function walk(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name).replace(/\\/g, '/');
        const relativePath = path.relative(cwd.replace(/\\/g, '/'), fullPath);

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (matchPattern(relativePath, normalizedPattern) ||
                   matchPattern(entry.name, normalizedPattern) ||
                   matchPattern(fullPath, normalizedPattern)) {
          results.push(fullPath);
        }
      }
    } catch (e) {
    }
  }

  walk(cwd.replace(/\\/g, '/'));
  return results;
}

function insert(file, line, text) {
  const logger = new RecordLogger('file-edit');
  logger.startCall('insert', { file, line, text });

  try {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }

    createBackup(file);
    const lines = readLines(file);
    const pos = line - 1;
    if (pos < 0 || pos > lines.length) {
      throw new Error(`Line ${line} out of range (1-${lines.length})`);
    }
    lines.splice(pos, 0, text);
    writeLines(file, lines);
    lastBackupFiles.push(file + BACKUP_SUFFIX);

    logger.logStep(`Inserted text at line ${line}`);
    console.log(`Inserted at line ${line}`);
    logger.endCall(true);

    triggerAnalysis();
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    console.error(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function deleteLines(file, startLine, endLine) {
  const logger = new RecordLogger('file-edit');
  logger.startCall('delete', { file, startLine, endLine });

  try {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }

    createBackup(file);
    const lines = readLines(file);
    const end = endLine || startLine;
    if (startLine < 1 || end > lines.length) {
      throw new Error(`Line range ${startLine}-${end} out of range (1-${lines.length})`);
    }
    lines.splice(startLine - 1, end - startLine + 1);
    writeLines(file, lines);
    lastBackupFiles.push(file + BACKUP_SUFFIX);

    logger.logStep(`Deleted lines ${startLine}-${end}`);
    console.log(`Deleted lines ${startLine}-${end}`);
    logger.endCall(true);

    triggerAnalysis();
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    console.error(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function prepend(file, text) {
  const logger = new RecordLogger('file-edit');
  logger.startCall('prepend', { file, text });

  try {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }

    createBackup(file);
    const lines = readLines(file);
    lines.unshift(text);
    writeLines(file, lines);
    lastBackupFiles.push(file + BACKUP_SUFFIX);

    logger.logStep('Prepended text');
    console.log(`Prepended to ${path.basename(file)}`);
    logger.endCall(true);

    triggerAnalysis();
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    console.error(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function append(file, text) {
  const logger = new RecordLogger('file-edit');
  logger.startCall('append', { file, text });

  try {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }

    createBackup(file);
    const lines = readLines(file);
    lines.push(text);
    writeLines(file, lines);
    lastBackupFiles.push(file + BACKUP_SUFFIX);

    logger.logStep('Appended text');
    console.log(`Appended to ${path.basename(file)}`);
    logger.endCall(true);

    triggerAnalysis();
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    console.error(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function replace(file, oldText, newText, isRegex = false) {
  const logger = new RecordLogger('file-edit');
  logger.startCall('replace', { file, oldText, newText, isRegex });

  try {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }

    createBackup(file);
    let content = fs.readFileSync(file, 'utf-8');
    let count;

    if (isRegex) {
      const regex = new RegExp(oldText, 'g');
      count = (content.match(regex) || []).length;
      content = content.replace(regex, newText);
    } else {
      count = (content.split(oldText).length - 1);
      content = content.split(oldText).join(newText);
    }

    fs.writeFileSync(file, content, 'utf-8');
    lastBackupFiles.push(file + BACKUP_SUFFIX);

    logger.logStep(`Replaced ${count} occurrences`);
    console.log(`Replaced ${count} occurrence(s) in ${path.basename(file)}`);
    logger.endCall(true);

    triggerAnalysis();
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    console.error(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function search(file, pattern, isRegex = false) {
  const logger = new RecordLogger('file-edit');
  logger.startCall('search', { file, pattern, isRegex });

  try {
    if (!fs.existsSync(file)) {
      throw new Error(`File not found: ${file}`);
    }

    const lines = readLines(file);
    const results = [];

    lines.forEach((line, idx) => {
      let match;
      if (isRegex) {
        try {
          match = new RegExp(pattern).test(line);
        } catch (e) {
          throw new Error(`Invalid regex: ${pattern}`);
        }
      } else {
        match = line.includes(pattern);
      }
      if (match) {
        results.push({ line: idx + 1, content: line });
      }
    });

    console.log(`\n=== Search results in ${file} ===`);
    console.log(`Found ${results.length} match(es) for "${pattern}"${isRegex ? ' (regex)' : ''}:`);
    results.forEach(r => {
      const lineNum = r.line.toString().padStart(5);
      console.log(`  ${lineNum}: ${r.content}`);
    });

    logger.logStep(`Found ${results.length} matches`);
    logger.endCall(true);

    triggerAnalysis();
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    console.error(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function listFiles(pattern) {
  const logger = new RecordLogger('file-edit');
  logger.startCall('list', { pattern });

  try {
    const files = glob(pattern);

    console.log(`\n=== Files matching "${pattern}" (${files.length}) ===`);
    files.forEach(f => console.log(`  ${f}`));

    logger.logStep(`Listed ${files.length} files`);
    logger.endCall(true);

    triggerAnalysis();
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    console.error(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function undo(count = 1) {
  const logger = new RecordLogger('file-edit');
  logger.startCall('undo', { count });

  try {
    let restored = 0;
    for (let i = 0; i < count; i++) {
      const backup = lastBackupFiles.pop();
      if (!backup) break;

      const original = backup.slice(0, -BACKUP_SUFFIX.length);
      if (restoreBackup(backup, original)) {
        fs.unlinkSync(backup);
        restored++;
        console.log(`Restored: ${path.basename(original)}`);
      }
    }

    if (restored === 0) {
      throw new Error('No backup files to restore');
    }

    logger.logStep(`Restored ${restored} file(s)`);
    logger.endCall(true);

    triggerAnalysis();
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    console.error(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

async function batchConfirm(pattern, operation, details) {
  const files = glob(pattern);

  console.log(`\n=== Batch operation: ${operation} ===`);
  console.log(`Pattern: ${pattern}`);
  console.log(`Files to be modified (${files.length}):`);
  files.slice(0, 10).forEach(f => console.log(`  - ${f}`));
  if (files.length > 10) {
    console.log(`  ... and ${files.length - 10} more`);
  }
  console.log(`\nDetails: ${JSON.stringify(details)}`);

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('\nProceed? (yes/no/all): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase());
    });
  });
}

async function batchPrepend(pattern, text) {
  const confirm = await batchConfirm(pattern, 'prepend', { text });
  if (confirm === 'yes' || confirm === 'all') {
    const files = glob(pattern);
    files.forEach(f => prepend(f, text));
  } else {
    console.log('Cancelled.');
  }
}

async function batchAppend(pattern, text) {
  const confirm = await batchConfirm(pattern, 'append', { text });
  if (confirm === 'yes' || confirm === 'all') {
    const files = glob(pattern);
    files.forEach(f => append(f, text));
  } else {
    console.log('Cancelled.');
  }
}

async function batchReplace(pattern, oldText, newText, isRegex) {
  const confirm = await batchConfirm(pattern, 'replace', { oldText, newText, isRegex });
  if (confirm === 'yes' || confirm === 'all') {
    const files = glob(pattern);
    files.forEach(f => replace(f, oldText, newText, isRegex));
  } else {
    console.log('Cancelled.');
  }
}

async function batchSearch(pattern, regex) {
  const files = glob(pattern);
  console.log(`\n=== Batch search: ${files.length} files ===`);
  files.forEach(f => search(f, regex, true));
}

function triggerAnalysis() {
  setTimeout(() => {
    const analyzer = new RecordAnalyzer('file-edit');
    analyzer.analyze();
  }, 0);
}

function startMCPServer() {
  ensureBackupDir();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (line) => {
    try {
      const req = JSON.parse(line);
      let result;

      switch (req.method) {
        case 'file_edit_insert':
          insert(req.params.file, req.params.line, req.params.text, req.params.before);
          result = { success: true };
          break;
        case 'file_edit_delete':
          deleteLines(req.params.file, req.params.startLine, req.params.endLine);
          result = { success: true };
          break;
        case 'file_edit_prepend':
          prepend(req.params.file, req.params.text);
          result = { success: true };
          break;
        case 'file_edit_append':
          append(req.params.file, req.params.text);
          result = { success: true };
          break;
        case 'file_edit_replace':
          replace(req.params.file, req.params.oldText, req.params.newText, req.params.isRegex);
          result = { success: true };
          break;
        case 'file_edit_search':
          search(req.params.file, req.params.pattern, req.params.isRegex);
          result = { success: true };
          break;
        case 'file_edit_list':
          listFiles(req.params.pattern);
          result = { success: true };
          break;
        case 'file_edit_undo':
          undo(req.params.count || 1);
          result = { success: true };
          break;
        default:
          result = { error: `Unknown method: ${req.method}` };
      }

      console.log(JSON.stringify({
        jsonrpc: '2.0',
        id: req.id,
        result
      }));
    } catch (e) {
      console.error(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32600, message: e.message }
      }));
    }
  });
}

const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];
const arg3 = process.argv[5];
const arg4 = process.argv[6];
const arg5 = process.argv[7];

switch (command) {
  case 'insert':
    insert(arg1, parseInt(arg2), arg3, arg4 === 'before');
    break;
  case 'delete':
    deleteLines(arg1, parseInt(arg2), arg3 ? parseInt(arg3) : null);
    break;
  case 'prepend':
    if (arg1 && (arg1.includes('*') || arg1.includes('?'))) {
      batchPrepend(arg1, arg2);
    } else {
      prepend(arg1, arg2);
    }
    break;
  case 'append':
    if (arg1 && (arg1.includes('*') || arg1.includes('?'))) {
      batchAppend(arg1, arg2);
    } else {
      append(arg1, arg2);
    }
    break;
  case 'replace':
    if (arg1 && (arg1.includes('*') || arg1.includes('?'))) {
      batchReplace(arg1, arg2, arg3, arg4 === '-r');
    } else {
      replace(arg1, arg2, arg3, arg4 === '-r');
    }
    break;
  case 'search':
    if (arg1 && (arg1.includes('*') || arg1.includes('?'))) {
      batchSearch(arg1, arg2);
    } else {
      search(arg1, arg2, arg3 === '-r');
    }
    break;
  case 'list':
    listFiles(arg1);
    break;
  case 'undo':
    undo(arg1 ? parseInt(arg1) : 1);
    break;
  case 'mcp':
    startMCPServer();
    break;
  default:
    console.log(`
File Editor v1.0.0 - Convenient file modification tool

Usage: node file-editor.js [command] [args...]

Commands:
  insert <file> <line> [before] "<text>"
    Insert text at specified line. Use 'before' to insert before the line.

  delete <file> <startLine> [endLine]
    Delete line(s). If endLine is provided, deletes range.

  prepend <pattern> "<text>"
    Prepend text to file(s). Pattern supports glob (*, ?, **, {a,b}).

  append <pattern> "<text>"
    Append text to file(s). Pattern supports glob.

  replace <pattern> "<old>" "<new>" [-r]
    Replace text in file(s). Use -r flag for regex.

  search <pattern> "<regex>" [-r]
    Search for pattern in file(s). -r enables regex.

  list <pattern>
    List files matching pattern.

  undo [count]
    Undo last N operations (default: 1). Restores from .bak files.

  mcp
    Start MCP server mode (JSON-RPC over stdin/stdout).
`);
}
