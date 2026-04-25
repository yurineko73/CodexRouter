#!/usr/bin/env node
/**
 * Code Fixer - Automated code fix template
 * Compatible with Codex and Claude
 */

const fs = require('fs');
const path = require('path');

/**
 * Fix template for common issues
 */
const fixTemplates = {
  // Add missing import
  addImport: (filePath, importStatement) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    // Find last import line
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].startsWith('const ') && lines[i].includes('require')) {
        lastImportIndex = i;
      }
    }
    lines.splice(lastImportIndex + 1, 0, importStatement);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
    console.log(`Added import: ${importStatement}`);
  },

  // Replace code pattern
  replacePattern: (filePath, oldPattern, newPattern) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes(oldPattern)) {
      content = content.replace(oldPattern, newPattern);
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Replaced pattern in ${filePath}`);
    } else {
      console.log(`Pattern not found in ${filePath}`);
    }
  },

  // Add function to file
  addFunction: (filePath, functionCode) => {
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.trimEnd() + '\n\n' + functionCode + '\n';
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Added function to ${filePath}`);
  }
};

/**
 * Check common issues
 */
function checkCommonIssues(filePath) {
  const issues = [];
  const content = fs.readFileSync(filePath, 'utf-8');

  // Check for missing isDebugEnabled
  if (content.includes('log.isDebugEnabled') && !content.includes('isDebugEnabled:')) {
    issues.push({
      type: 'missing_property',
      description: 'log.isDebugEnabled used but not defined',
      fix: () => {
        if (content.includes('const log = {')) {
          const newContent = content.replace(
            'const log = {',
            'const log = {\n  isDebugEnabled: isDebug,'
          );
          fs.writeFileSync(filePath, newContent, 'utf-8');
          console.log('Fixed: Added isDebugEnabled property');
        }
      }
    });
  }

  // Check for duplicate genId functions
  const genIdMatches = content.match(/function genId/g);
  if (genIdMatches && genIdMatches.length > 1) {
    issues.push({
      type: 'duplicate_function',
      description: 'Multiple genId functions found',
      suggestion: 'Extract to shared util.js module'
    });
  }

  return issues;
}

// CLI usage
const command = process.argv[2];
const file = process.argv[3];

switch (command) {
  case 'check':
    if (!file) {
      console.error('Usage: node code-fixer.js check <file>');
      process.exit(1);
    }
    console.log(`Checking ${file}...`);
    const issues = checkCommonIssues(file);
    if (issues.length === 0) {
      console.log('No issues found.');
    } else {
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. [${issue.type}] ${issue.description}`);
        if (issue.suggestion) console.log(`   Suggestion: ${issue.suggestion}`);
        if (issue.fix) console.log('   (Auto-fix available)');
      });
    }
    break;

  case 'fix':
    if (!file) {
      console.error('Usage: node code-fixer.js fix <file>');
      process.exit(1);
    }
    console.log(`Fixing ${file}...`);
    const issues = checkCommonIssues(file);
    issues.forEach(issue => {
      if (issue.fix) issue.fix();
    });
    break;

  default:
    console.log(`
Code Fixer - Automated code fix template

Usage: node code-fixer.js [command] [file]

Commands:
  check <file>    Check for common issues
  fix <file>      Auto-fix common issues

Examples:
  node code-fixer.js check src/logger.js
  node code-fixer.js fix src/logger.js
    `);
}
