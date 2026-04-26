#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const apiDocs = {
  openai: {
    base: 'https://platform.openai.com/docs',
    endpoints: {
      responses: 'https://platform.openai.com/docs/api-reference/responses',
      chat: 'https://platform.openai.com/docs/api-reference/chat'
    }
  },
  deepseek: {
    base: 'https://api-docs.deepseek.com/',
    endpoints: {
      chat: 'https://api-docs.deepseek.com/api/create-chat-completion',
      thinking: 'https://api-docs.deepseek.com/guides/thinking_mode',
      json: 'https://api-docs.deepseek.com/guides/json_mode'
    }
  },
  anthropic: {
    base: 'https://docs.anthropic.com/',
    endpoints: {
      messages: 'https://docs.anthropic.com/en/api/messages',
      streaming: 'https://docs.anthropic.com/en/api/streaming'
    }
  }
};

function loadParams(raw) {
  if (!raw) return {};
  if (raw.startsWith('@')) {
    const filePath = raw.slice(1);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return JSON.parse(raw);
}

function validateEndpoint(api, endpoint, params) {
  const issues = [];
  const normalizedApi = String(api || '').toLowerCase();
  const normalizedEndpoint = String(endpoint || '').toLowerCase();

  if (normalizedApi === 'openai' && normalizedEndpoint === 'responses') {
    const allowed = new Set([
      'model',
      'input',
      'instructions',
      'max_output_tokens',
      'temperature',
      'top_p',
      'stream',
      'tools',
      'tool_choice',
      'text',
      'reasoning',
      'store',
      'metadata'
    ]);

    for (const key of Object.keys(params)) {
      if (!allowed.has(key)) {
        issues.push({ type: 'unknown_param', message: `Unknown parameter: ${key}` });
      }
    }

    if (!params.model) issues.push({ type: 'missing_field', message: 'model is required' });
    if (!params.input) issues.push({ type: 'missing_field', message: 'input is required' });
    if (params.text && typeof params.text === 'object' && !params.text.format) {
      issues.push({ type: 'missing_field', message: 'text.format is required when text is provided' });
    }
  }

  if (normalizedApi === 'deepseek' && normalizedEndpoint === 'chat') {
    const allowedEfforts = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
    if (!params.model) issues.push({ type: 'missing_field', message: 'model is required' });
    if (!Array.isArray(params.messages)) {
      issues.push({ type: 'missing_field', message: 'messages must be an array' });
    }
    if (params.reasoning_effort && !allowedEfforts.has(params.reasoning_effort)) {
      issues.push({
        type: 'invalid_value',
        message: `Invalid reasoning_effort: ${params.reasoning_effort}`
      });
    }
    if (params.thinking && !['enabled', 'disabled'].includes(params.thinking.type)) {
      issues.push({
        type: 'invalid_value',
        message: `Invalid thinking.type: ${params.thinking?.type}`
      });
    }
  }

  if (normalizedApi === 'anthropic' && normalizedEndpoint === 'messages') {
    if (!params.model) issues.push({ type: 'missing_field', message: 'model is required' });
    if (!Array.isArray(params.messages)) {
      issues.push({ type: 'missing_field', message: 'messages must be an array' });
    }
    if (typeof params.max_tokens !== 'number') {
      issues.push({ type: 'missing_field', message: 'max_tokens is required' });
    }
  }

  return issues;
}

function checkCode(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  const urls = content.match(/https?:\/\/[^"'`\s)]+/g) || [];
  if (urls.length > 0) {
    console.log('\n=== Found URLs ===');
    for (const url of urls) {
      console.log(`  ${url}`);
    }
  }

  if (content.includes('reasoning_effort') && !content.includes('mapReasoningEffort')) {
    issues.push({
      type: 'missing_mapping',
      message: 'reasoning_effort appears without an obvious mapping helper'
    });
  }

  if (content.includes('json_schema') && !content.includes('json_object')) {
    issues.push({
      type: 'missing_fallback',
      message: 'json_schema appears without a json_object fallback'
    });
  }

  return issues;
}

function printDocs(api = null) {
  if (api) {
    const normalized = String(api).toLowerCase();
    const docs = apiDocs[normalized];
    if (!docs) {
      console.log(`Unknown API: ${api}`);
      return;
    }
    console.log(`\n${normalized.toUpperCase()}:`);
    console.log(`  Base: ${docs.base}`);
    for (const [key, url] of Object.entries(docs.endpoints)) {
      console.log(`  ${key}: ${url}`);
    }
    return;
  }

  console.log('\n=== API Docs ===');
  for (const [name, docs] of Object.entries(apiDocs)) {
    console.log(`\n${name.toUpperCase()}:`);
    console.log(`  Base: ${docs.base}`);
    for (const [key, url] of Object.entries(docs.endpoints)) {
      console.log(`  ${key}: ${url}`);
    }
  }
}

function printIssues(issues) {
  if (issues.length === 0) {
    console.log('No issues found.');
    return true;
  }

  console.log(`Found ${issues.length} issue(s):`);
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. [${issue.type}] ${issue.message}`);
  });
  return false;
}

function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    console.log('api-docs');
    console.log('  docs [api]');
    console.log('  validate <api> <endpoint> <json-or-@file>');
    console.log('  check <file>');
    return;
  }

  try {
    switch (command) {
      case 'docs':
        printDocs(args[0]);
        break;

      case 'validate': {
        const [api, endpoint, rawParams] = args;
        if (!api || !endpoint) {
          throw new Error('Usage: validate <api> <endpoint> <json-or-@file>');
        }
        const params = loadParams(rawParams || '{}');
        const issues = validateEndpoint(api, endpoint, params);
        const ok = printIssues(issues);
        if (!ok) process.exitCode = 1;
        break;
      }

      case 'check': {
        const [filePath] = args;
        if (!filePath) {
          throw new Error('Usage: check <file>');
        }
        const issues = checkCode(filePath);
        const ok = printIssues(issues);
        if (!ok) process.exitCode = 1;
        break;
      }

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();

