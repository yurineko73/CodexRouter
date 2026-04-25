#!/usr/bin/env node
/**
 * API Validator - Validate API usage against documentation
 * Compatible with Codex and Claude
 */

const fs = require('fs');
const path = require('path');
const RecordLogger = require('../logger/record-logger.js');
const RecordAnalyzer = require('../logger/record-analyzer.js');

/**
 * Common API documentation references
 */
const apiDocs = {
  openai: {
    base: 'https://platform.openai.com/docs',
    endpoints: {
      responses: 'https://platform.openai.com/docs/api-reference/responses',
      chat: 'https://platform.openai.com/docs/api-reference/chat',
      streaming: 'https://platform.openai.com/docs/api-reference/streaming'
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

/**
 * Validate API parameters against known specs
 */
function validateParams(api, endpoint, params) {
  console.log(`\n=== Validating ${api}/${endpoint} parameters ===`);
  const issues = [];

  // OpenAI Responses API validations
  if (api === 'openai' && endpoint === 'responses') {
    const validFields = [
      'model', 'input', 'instructions', 'max_output_tokens',
      'temperature', 'top_p', 'stream', 'tools', 'tool_choice',
      'text', 'reasoning', 'store', 'metadata'
    ];

    Object.keys(params).forEach(param => {
      if (!validFields.includes(param)) {
        issues.push({
          type: 'unknown_param',
          param,
          message: `Unknown parameter: ${param}`
        });
      }
    });

    // Check specific field types
    if (params.text && !params.text.format) {
      issues.push({
        type: 'missing_field',
        param: 'text.format',
        message: 'text.format should specify the output format'
      });
    }
  }

  // DeepSeek API validations
  if (api === 'deepseek' && endpoint === 'chat') {
    if (params.reasoning_effort) {
      const validEfforts = ['low', 'medium', 'high', 'xhigh', 'max'];
      if (!validEfforts.includes(params.reasoning_effort)) {
        issues.push({
          type: 'invalid_value',
          param: 'reasoning_effort',
          message: `Invalid value: ${params.reasoning_effort}. Valid: ${validEfforts.join(', ')}`
        });
      }
    }

    if (params.thinking) {
      const validTypes = ['enabled', 'disabled'];
      if (!validTypes.includes(params.thinking.type)) {
        issues.push({
          type: 'invalid_value',
          param: 'thinking.type',
          message: `Invalid value: ${params.thinking.type}. Valid: ${validTypes.join(', ')}`
        });
      }
    }
  }

  return issues;
}

/**
 * Check code for API usage
 */
function checkCode(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  // Check for API base URLs
  const urlMatch = content.match(/https?:\/\/[^"'\s]+/g);
  if (urlMatch) {
    console.log('\n=== Found API URLs ===');
    urlMatch.forEach(url => console.log(`  ${url}`));
  }

  // Check for common issues
  if (content.includes('reasoning_effort') && !content.includes('mapReasoningEffort')) {
    issues.push({
      type: 'missing_mapping',
      message: 'reasoning_effort used without mapping function'
    });
  }

  if (content.includes('json_schema') && !content.includes('json_object')) {
    issues.push({
      type: 'missing_downgrade',
      message: 'json_schema found but no downgrade to json_object'
    });
  }

  return issues;
}

/**
 * Print validation report
 */
function printReport(issues) {
  if (issues.length === 0) {
    console.log('\n✅ No issues found!');
    return;
  }

  console.log(`\n=== Found ${issues.length} issue(s) ===`);
  issues.forEach((issue, i) => {
    console.log(`${i + 1}. [${issue.type}] ${issue.message}`);
    if (issue.param) console.log(`   Parameter: ${issue.param}`);
    if (issue.suggestion) console.log(`   Suggestion: ${issue.suggestion}`);
  });
}

// CLI usage
const command = process.argv[2];
const arg1 = process.argv[3];

switch (command) {
  case 'check':
    if (!arg1) {
      console.error('Usage: node api-validator.js check <file>');
      process.exit(1);
    }
    const logger = new RecordLogger('api-docs');
    logger.startCall('check', { file: arg1 });
    
    try {
      console.log(`Checking ${arg1}...`);
      logger.logStep('Starting code check');
      const codeIssues = checkCode(arg1);
      logger.logStep(`Found ${codeIssues.length} issues`);
      printReport(codeIssues);
      logger.endCall(true);
      
      // Trigger analysis asynchronously
      setTimeout(() => {
        const analyzer = new RecordAnalyzer('api-docs');
        analyzer.analyze();
      }, 0);
      
    } catch (e) {
      logger.logStep(`Error: ${e.message}`);
      logger.endCall(false, e.message);
    }
    break;

  case 'validate':
    const api = process.argv[3];
    const endpoint = process.argv[4];
    if (!api || !endpoint) {
      console.error('Usage: node api-validator.js validate <api> <endpoint>');
      process.exit(1);
    }
    // Stub for parameter validation
    console.log(`Validating ${api}/${endpoint}...`);
    console.log('Pass parameters as JSON object (not implemented in CLI)');
    break;

  case 'docs':
    const logger = new RecordLogger('api-docs');
    logger.startCall('docs', {});
    
    try {
      console.log('\n=== API Documentation References ===');
      logger.logStep('Starting docs display');
      
      Object.keys(apiDocs).forEach(api => {
        console.log(`\n${api.toUpperCase()}:`);
        console.log(`  Base: ${apiDocs[api].base}`);
        console.log('  Endpoints:');
        Object.keys(apiDocs[api].endpoints).forEach(ep => {
          console.log(`    ${ep}: ${apiDocs[api].endpoints[ep]}`);
        });
      });
      
      logger.logStep('Docs displayed');
      logger.endCall(true);
      
      // Trigger analysis asynchronously
      setTimeout(() => {
        const analyzer = new RecordAnalyzer('api-docs');
        analyzer.analyze();
      }, 0);
      
    } catch (e) {
      logger.logStep(`Error: ${e.message}`);
      logger.endCall(false, e.message);
    }
    break;

  default:
    console.log(`
API Validator - Validate API usage against documentation

Usage: node api-validator.js [command] [args]

Commands:
  check <file>           Check code for API usage issues
  validate <api> <ep>   Validate parameters (stub)
  docs                    Show API documentation references

Examples:
  node api-validator.js check src/request-converter.js
  node api-validator.js docs
  `);
}
