#!/usr/bin/env node
/**
 * Git Helper - Common Git operations automation
 * Compatible with Codex and Claude
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runGit(args) {
  try {
    const output = execSync(`git ${args}`, { encoding: 'utf-8' });
    return { success: true, output };
  } catch (e) {
    return { success: false, output: e.message };
  }
}

function checkStatus() {
  console.log('=== Git Status ===');
  const result = runGit('status');
  console.log(result.output);
}

function showLog(count = 5) {
  console.log(`=== Last ${count} Commits ===`);
  const result = runGit(`log --oneline -${count}`);
  console.log(result.output);
}

function diffCheck(target = 'HEAD') {
  console.log(`=== Diff vs ${target} ===`);
  const result = runGit(`diff ${target} --stat`);
  console.log(result.output);
}

function commitChanges(message) {
  if (!message) {
    console.error('Error: Commit message required');
    process.exit(1);
  }
  console.log('=== Staging all changes ===');
  runGit('add .');
  console.log('=== Creating commit ===');
  const result = runGit(`commit -m "${message}"`);
  console.log(result.output);
}

function pushToRemote(remote = 'origin', branch = 'master') {
  console.log(`=== Pushing to ${remote}/${branch} ===`);
  const result = runGit(`push ${remote} ${branch}`);
  console.log(result.output);
}

// CLI usage
const command = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (command) {
  case 'status':
    checkStatus();
    break;
  case 'log':
    showLog(arg1 || 5);
    break;
  case 'diff':
    diffCheck(arg1 || 'HEAD');
    break;
  case 'commit':
    commitChanges(arg1);
    break;
  case 'push':
    pushToRemote(arg1 || 'origin', arg2 || 'master');
    break;
  default:
    console.log(`
Usage: node git-helper.js [command] [args]

Commands:
  status              Check git status
  log [count]         Show last N commits (default: 5)
  diff [target]        Show diff vs target (default: HEAD)
  commit "message"    Stage all and commit
  push [remote] [branch] Push to remote (default: origin/master)
    `);
}
