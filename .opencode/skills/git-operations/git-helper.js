#!/usr/bin/env node
/**
 * Git Helper - Common Git operations automation
 * Compatible with Codex and Claude
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const RecordLogger = require('../logger/record-logger.js');
const RecordAnalyzer = require('../logger/record-analyzer.js');

function runGit(args) {
  try {
    const output = execSync(`git ${args}`, { encoding: 'utf-8' });
    return { success: true, output };
  } catch (e) {
    return { success: false, output: e.message };
  }
}

function checkStatus() {
  const logger = new RecordLogger('git-operations');
  logger.startCall('status');
  
  try {
    console.log('=== Git Status ===');
    const result = runGit('status');
    logger.logStep('Git status retrieved', { outputLength: result.output.length });
    console.log(result.output);
    logger.endCall(true);
    
    // Trigger analysis asynchronously
    setTimeout(() => {
      const analyzer = new RecordAnalyzer('git-operations');
      analyzer.analyze();
    }, 0);
    
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function showLog(count = 5) {
  const logger = new RecordLogger('git-operations');
  logger.startCall('log', { count });
  
  try {
    console.log(`=== Last ${count} Commits ===`);
    const result = runGit(`log --oneline -${count}`);
    logger.logStep('Log retrieved', { outputLength: result.output.length });
    console.log(result.output);
    logger.endCall(true);
    
    // Trigger analysis asynchronously
    setTimeout(() => {
      const analyzer = new RecordAnalyzer('git-operations');
      analyzer.analyze();
    }, 0);
    
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function diffCheck(target = 'HEAD') {
  const logger = new RecordLogger('git-operations');
  logger.startCall('diff', { target });
  
  try {
    console.log(`=== Diff vs ${target} ===`);
    const result = runGit(`diff ${target} --stat`);
    logger.logStep('Diff retrieved', { outputLength: result.output.length });
    console.log(result.output);
    logger.endCall(true);
    
    // Trigger analysis asynchronously
    setTimeout(() => {
      const analyzer = new RecordAnalyzer('git-operations');
      analyzer.analyze();
    }, 0);
    
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function commitChanges(message) {
  const logger = new RecordLogger('git-operations');
  logger.startCall('commit', { message });
  
  try {
    if (!message) {
      console.error('Error: Commit message required');
      logger.endCall(false, 'No commit message');
      process.exit(1);
    }
    
    console.log('=== Staging all changes ===');
    logger.logStep('Staging all changes');
    runGit('add .');
    
    console.log('=== Creating commit ===');
    logger.logStep('Creating commit');
    const result = runGit(`commit -m "${message}"`);
    logger.logStep('Commit created', { outputLength: result.output.length });
    console.log(result.output);
    
    logger.endCall(true);
    
    // Trigger analysis asynchronously
    setTimeout(() => {
      const analyzer = new RecordAnalyzer('git-operations');
      analyzer.analyze();
    }, 0);
    
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
}

function pushToRemote(remote = 'origin', branch = 'master') {
  const logger = new RecordLogger('git-operations');
  logger.startCall('push', { remote, branch });
  
  try {
    console.log(`=== Pushing to ${remote}/${branch} ===`);
    logger.logStep('Executing git push');
    const result = runGit(`push ${remote} ${branch}`);
    logger.logStep('Push completed', { outputLength: result.output.length });
    console.log(result.output);
    logger.endCall(true);
    
    // Trigger analysis asynchronously
    setTimeout(() => {
      const analyzer = new RecordAnalyzer('git-operations');
      analyzer.analyze();
    }, 0);
    
  } catch (e) {
    logger.logStep(`Error: ${e.message}`);
    logger.endCall(false, e.message);
  }
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
