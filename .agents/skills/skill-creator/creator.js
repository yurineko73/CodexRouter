#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const SKILLS_ROOT = path.join(__dirname, '..');

const SKILL_TEMPLATE = `---
name: {name}
description: {description}
license: MIT
metadata:
  audience: developers
  version: "1.0.0"
---

## 功能

- 功能 1
- 功能 2

## 何时使用

- 场景 1
- 场景 2

## 命令

- \`node {scriptName} <command>\`

## 注意事项

- 保持描述简洁
- 避免依赖提示词触发语句
`;

const TOOL_SCRIPT_TEMPLATE = `#!/usr/bin/env node

const command = process.argv[2];

if (!command) {
  console.log('Usage: node {scriptName} <command>');
  process.exit(0);
}

switch (command) {
  case 'check':
    console.log('check: TODO');
    break;
  case 'execute':
    console.log('execute: TODO');
    break;
  default:
    console.error(\`Unknown command: \${command}\`);
    process.exitCode = 1;
}
`;

const RECORDS_GITIGNORE_TEMPLATE = `*.json
!.gitignore
`;

function validateSkillName(name) {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(name);
}

function readSkillFile(skillPath) {
  const filePath = skillPath.endsWith('SKILL.md') ? skillPath : path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(filePath)) {
    throw new Error(`SKILL.md not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { valid: false, error: 'Missing frontmatter' };

  const block = match[1];
  const name = block.match(/^name:\s*([a-z0-9]+(-[a-z0-9]+)*)\s*$/m);
  const description = block.match(/^description:\s*(.+)$/m);
  const version = block.match(/^(\s*)version:\s*"?([^"\n]+)"?\s*$/m);

  if (!name) return { valid: false, error: 'Missing or invalid name field' };
  if (!description) return { valid: false, error: 'Missing description field' };

  return {
    valid: true,
    name: name[1],
    description: description[1].trim(),
    version: version ? version[2].trim() : '1.0.0'
  };
}

function buildSkillContent(name, description, scriptName) {
  return SKILL_TEMPLATE
    .replace('{name}', name)
    .replace('{description}', description)
    .replace('{scriptName}', scriptName);
}

function createSkill(skillName, description, options = {}) {
  if (!validateSkillName(skillName)) {
    throw new Error(`Invalid skill name: ${skillName}`);
  }

  const skillDir = path.join(SKILLS_ROOT, skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const scriptFile = path.join(skillDir, `${skillName}.js`);
  const recordsDir = path.join(skillDir, 'records');

  if (fs.existsSync(skillDir)) {
    throw new Error(`Skill already exists: ${skillName}`);
  }

  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(skillFile, buildSkillContent(skillName, description, `${skillName}.js`), 'utf8');

  const created = [skillFile];

  if (options.withScript) {
    fs.writeFileSync(
      scriptFile,
      TOOL_SCRIPT_TEMPLATE.replace(/{scriptName}/g, `${skillName}.js`),
      'utf8'
    );
    created.push(scriptFile);
  }

  if (options.withRecords) {
    fs.mkdirSync(recordsDir, { recursive: true });
    fs.writeFileSync(path.join(recordsDir, '.gitignore'), RECORDS_GITIGNORE_TEMPLATE, 'utf8');
    created.push(path.join(recordsDir, '.gitignore'));
  }

  console.log(`Created skill: ${skillName}`);
  created.forEach(file => console.log(`  - ${path.relative(ROOT, file).replace(/\\/g, '/')}`));
}

function optimizeSkill(skillPath, applyChanges = false) {
  const filePath = skillPath.endsWith('SKILL.md') ? skillPath : path.join(skillPath, 'SKILL.md');
  const content = readSkillFile(filePath);
  const lines = content.split('\n');
  const fm = parseFrontmatter(content);

  console.log(`Optimizing: ${fm.valid ? fm.name : path.basename(path.dirname(filePath))}`);
  console.log(`  Lines: ${lines.length}`);

  const replacements = [
    ['## What I do', '## 功能'],
    ['## When to use me', '## 何时使用'],
    ['## Quick reference', '## 命令'],
    ['## Notes', '## 注意事项']
  ];

  let nextContent = content;
  for (const [from, to] of replacements) {
    nextContent = nextContent.replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), to);
  }

  if (applyChanges && nextContent !== content) {
    fs.writeFileSync(filePath, nextContent, 'utf8');
    console.log('  Applied heading normalization.');
  } else if (nextContent !== content) {
    console.log('  Suggested: normalize headings to Codex style.');
  } else {
    console.log('  Already normalized.');
  }

  if (!nextContent.includes('## 功能')) {
    console.log('  Suggested: add a 功能 section.');
  }
  if (!nextContent.includes('## 何时使用')) {
    console.log('  Suggested: add a 何时使用 section.');
  }
}

function validateSkill(skillPath) {
  const filePath = skillPath.endsWith('SKILL.md') ? skillPath : path.join(skillPath, 'SKILL.md');
  const content = readSkillFile(filePath);
  const fm = parseFrontmatter(content);
  const issues = [];

  if (!fm.valid) {
    issues.push(fm.error);
  }
  if (!content.includes('## 功能') && !content.includes('## What I do')) {
    issues.push('Missing 功能 section');
  }
  if (!content.includes('## 何时使用') && !content.includes('## When to use me')) {
    issues.push('Missing 何时使用 section');
  }

  console.log(`Validating: ${filePath}`);
  console.log(`  Name: ${fm.valid ? fm.name : 'invalid'}`);
  console.log(`  Description: ${fm.valid ? fm.description : 'invalid'}`);
  if (issues.length === 0) {
    console.log('  Result: OK');
  } else {
    console.log('  Result: Issues found');
    issues.forEach(issue => console.log(`  - ${issue}`));
    process.exitCode = 1;
  }
}

function listSkills() {
  const dirs = fs.readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .filter(entry => fs.existsSync(path.join(SKILLS_ROOT, entry.name, 'SKILL.md')))
    .map(entry => entry.name)
    .sort();

  console.log('Available skills:');
  for (const dir of dirs) {
    const skillContent = readSkillFile(path.join(SKILLS_ROOT, dir));
    const fm = parseFrontmatter(skillContent);
    console.log(`  ${dir} - ${fm.valid ? fm.description : 'No description'}`);
  }
}

function printHelp() {
  console.log('Skill creator');
  console.log('');
  console.log('Usage:');
  console.log('  create <name> <description> [--with-script] [--with-records]');
  console.log('  optimize <path> [--apply]');
  console.log('  validate <path>');
  console.log('  list');
}

function main() {
  const [action, ...args] = process.argv.slice(2);

  if (!action) {
    printHelp();
    return;
  }

  try {
    switch (action) {
      case 'create': {
        const [skillName, description = 'Skill description'] = args;
        if (!skillName) {
          throw new Error('Usage: create <name> <description> [--with-script] [--with-records]');
        }
        createSkill(skillName, description, {
          withScript: args.includes('--with-script'),
          withRecords: args.includes('--with-records')
        });
        break;
      }

      case 'optimize': {
        const [skillPath = '.'] = args;
        optimizeSkill(skillPath, args.includes('--apply'));
        break;
      }

      case 'validate': {
        const [skillPath = '.'] = args;
        validateSkill(skillPath);
        break;
      }

      case 'list':
        listSkills();
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();

