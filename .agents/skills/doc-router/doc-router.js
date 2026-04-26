#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = path.join(__dirname, '..', '..', '..');
const DOC_ROOT = path.join(ROOT, 'doc');
const TYPES_PATH = path.join(__dirname, 'doc-types.json');

function readJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { frontmatter: {}, body: content };
  }

  const end = content.indexOf('\n---\n', 4);
  if (end === -1) {
    return { frontmatter: {}, body: content };
  }

  const block = content.slice(4, end);
  const body = content.slice(end + 5);
  const frontmatter = {};

  for (const line of block.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (key) frontmatter[key] = value.replace(/^"(.*)"$/, '$1');
  }

  return { frontmatter, body };
}

function extractTitle(content, fileName) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : path.basename(fileName, path.extname(fileName));
}

function extractSummary(content, maxLength = 240) {
  const { body } = parseFrontmatter(content);
  const lines = body
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && !line.startsWith('>'));

  return lines.slice(0, 8).join(' ').slice(0, maxLength);
}

function loadTypes() {
  const data = readJson(TYPES_PATH, { version: '1.0', types: [] });
  if (!Array.isArray(data.types)) data.types = [];
  return data;
}

function saveTypes(data) {
  writeJson(TYPES_PATH, data);
}

function scoreType(type, text) {
  let score = 0;
  for (const keyword of type.keywords || []) {
    const normalized = keyword.toLowerCase();
    if (text.includes(normalized)) score += 3;
  }
  return score;
}

function matchType(fileName, summary, types) {
  const haystack = `${fileName} ${summary}`.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const type of types) {
    const score = scoreType(type, haystack);
    if (score > bestScore) {
      best = type;
      bestScore = score;
    }
  }

  return { type: best, score: bestScore };
}

function determineStatus(content, fileName, sourcePath) {
  const { frontmatter } = parseFrontmatter(content);
  const lowerName = fileName.toLowerCase();
  const lowerPath = sourcePath.toLowerCase().replace(/\\/g, '/');

  const isDeprecated =
    frontmatter.deprecated === 'true' ||
    frontmatter.deprecated === true ||
    /(^|\/)deprecated(\/|$)/.test(lowerPath) ||
    /-v\d+(\.[^.]+)?$/.test(lowerName);

  if (isDeprecated) return 'deprecated';

  const looksLikeTools = /\b(tool|cli|sdk|endpoint|api-reference|rest)\b/i.test(
    `${lowerName} ${lowerPath}`
  );
  if (looksLikeTools) return 'tools';

  return 'current';
}

function resolveTargetBase(type, status) {
  const base = type?.targetDir || 'doc';
  const statusFolder = status;
  if (base.toLowerCase().endsWith(`/${statusFolder}`) || base.toLowerCase().endsWith(`\\${statusFolder}`)) {
    return path.join(ROOT, base);
  }
  return path.join(ROOT, base, statusFolder);
}

function nextVersionFileName(fileName) {
  const match = fileName.match(/^(.+)-v(\d+)(\.[^.]+)$/i);
  if (match) {
    return `${match[1]}-v${Number(match[2]) + 1}${match[3]}`;
  }
  return fileName.replace(/(\.[^.]+)$/, '-v1$1');
}

function renderDeprecatedHeader(title, replacement, date) {
  return [
    '---',
    'deprecated: true',
    `deprecated-date: ${date}`,
    `replacement: ${replacement || 'none'}`,
    '---',
    '',
    `# [已过期] ${title}`,
    '',
    `> 状态: 已过期`,
    `> 替代文档: \`${replacement || 'none'}\``,
    `> 归档日期: ${date}`,
    '',
  ].join('\n');
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function scanMarkdownFiles(dirPath) {
  const result = [];
  if (!fs.existsSync(dirPath)) return result;

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      result.push(...scanMarkdownFiles(fullPath));
    } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
      result.push(fullPath);
    }
  }

  return result.sort();
}

function findReplacement(docPath, docFiles) {
  const sourceName = path.basename(docPath, path.extname(docPath)).toLowerCase();
  const sourceTokens = sourceName.split(/[-_\s]+/).filter(Boolean);
  let best = null;
  let bestScore = 0;

  for (const candidate of docFiles) {
    if (candidate === docPath) continue;
    if (candidate.toLowerCase().includes(`${path.sep}deprecated${path.sep}`)) continue;

    const candidateName = path.basename(candidate, path.extname(candidate)).toLowerCase();
    const candidateContent = fs.readFileSync(candidate, 'utf8').slice(0, 800).toLowerCase();
    let score = 0;
    for (const token of sourceTokens) {
      if (candidateName.includes(token)) score += 3;
      if (candidateContent.includes(token)) score += 1;
    }

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return bestScore >= 4 ? path.relative(DOC_ROOT, best).replace(/\\/g, '/') : null;
}

function analyzeDocument(docPath) {
  const content = fs.readFileSync(docPath, 'utf8');
  const fileName = path.basename(docPath);
  const summary = extractSummary(content);
  const title = extractTitle(content, fileName);
  const typesData = loadTypes();
  const matched = matchType(fileName, summary, typesData.types);
  const status = determineStatus(content, fileName, docPath);
  const targetDir = resolveTargetBase(matched.type, status);

  return {
    docPath,
    fileName,
    title,
    summary,
    type: matched.type,
    score: matched.score,
    status,
    targetDir
  };
}

function buildTargetPath(analysis, force = false) {
  const fileName = analysis.status === 'deprecated'
    ? nextVersionFileName(analysis.fileName)
    : analysis.fileName;

  const targetPath = path.join(analysis.targetDir, fileName);
  if (path.resolve(targetPath) === path.resolve(analysis.docPath)) {
    return { same: true, targetPath };
  }

  if (fs.existsSync(targetPath) && !force) {
    return { same: false, exists: true, targetPath };
  }

  return { same: false, exists: false, targetPath };
}

function applyDeprecatedHeader(content, analysis, replacement) {
  const { body } = parseFrontmatter(content);
  const header = renderDeprecatedHeader(
    analysis.title,
    replacement,
    new Date().toISOString().split('T')[0]
  );
  return `${header}\n${body.trimStart()}`;
}

function moveDocument(analysis, options = {}) {
  const { force = false, replacement = null } = options;
  const target = buildTargetPath(analysis, force);

  if (target.same) {
    return { success: true, skipped: true, targetPath: target.targetPath };
  }

  if (target.exists && !force) {
    return { success: false, error: 'target_exists', targetPath: target.targetPath };
  }

  ensureDir(path.dirname(target.targetPath));
  let content = fs.readFileSync(analysis.docPath, 'utf8');
  if (analysis.status === 'deprecated') {
    content = applyDeprecatedHeader(content, analysis, replacement);
  }

  fs.writeFileSync(target.targetPath, content, 'utf8');
  if (path.resolve(target.targetPath) !== path.resolve(analysis.docPath)) {
    fs.unlinkSync(analysis.docPath);
  }

  return { success: true, targetPath: target.targetPath };
}

function printAnalysis(analysis) {
  const typeName = analysis.type ? analysis.type.id : 'unmatched';
  const status = analysis.status;
  console.log(`[分析] ${path.relative(ROOT, analysis.docPath).replace(/\\/g, '/')}`);
  console.log(`  类型: ${typeName} (score: ${analysis.score})`);
  console.log(`  状态: ${status}`);
  console.log(`  目标: ${path.relative(ROOT, analysis.targetDir).replace(/\\/g, '/')}`);
}

function printTypes(types) {
  console.log('\n=== 文档类型 ===\n');
  for (const type of types) {
    console.log(`[${type.id}] ${type.description}`);
    console.log(`  目录: ${type.targetDir}`);
    console.log(`  关键字: ${(type.keywords || []).join(', ')}`);
  }
  console.log('');
}

function checkDistribution() {
  const files = scanMarkdownFiles(DOC_ROOT);
  const stats = { total: files.length, current: 0, deprecated: 0, tools: 0, byType: {} };

  for (const file of files) {
    const analysis = analyzeDocument(file);
    stats[analysis.status] += 1;
    const typeName = analysis.type ? analysis.type.id : 'unmatched';
    stats.byType[typeName] = (stats.byType[typeName] || 0) + 1;
  }

  console.log('\n=== 文档分布 ===\n');
  console.log(`总数: ${stats.total}`);
  console.log(`current: ${stats.current}`);
  console.log(`deprecated: ${stats.deprecated}`);
  console.log(`tools: ${stats.tools}`);
  console.log('\n按类型:');
  for (const [key, value] of Object.entries(stats.byType)) {
    console.log(`  ${key}: ${value}`);
  }
  console.log('');
}

async function handleAnalyze(docPath) {
  if (!fs.existsSync(docPath)) {
    throw new Error(`File not found: ${docPath}`);
  }
  const analysis = analyzeDocument(docPath);
  printAnalysis(analysis);
}

async function handleExecute(docPath, force) {
  if (!fs.existsSync(docPath)) {
    throw new Error(`File not found: ${docPath}`);
  }

  const analysis = analyzeDocument(docPath);
  printAnalysis(analysis);

  const docFiles = scanMarkdownFiles(DOC_ROOT);
  let replacement = null;
  if (analysis.status === 'deprecated') {
    replacement = findReplacement(docPath, docFiles);
    if (replacement) {
      console.log(`  推荐替代文档: ${replacement}`);
    }
  }

  const preview = buildTargetPath(analysis, force);
  if (preview.same) {
    console.log('  已在目标位置，跳过。');
    return;
  }

  if (preview.exists && !force) {
    console.log(`  目标已存在: ${path.relative(ROOT, preview.targetPath).replace(/\\/g, '/')}`);
    return;
  }

  if (!force) {
    const answer = await ask('  确认移动？(y/N): ');
    if (answer !== 'y' && answer !== 'yes') {
      console.log('  已取消。');
      return;
    }
  }

  if (analysis.status === 'deprecated' && !replacement) {
    const answer = await ask('  替代文档路径(可留空): ');
    replacement = answer || null;
  }

  const result = moveDocument(analysis, { force, replacement });
  if (result.success) {
    console.log(`  已移动到: ${path.relative(ROOT, result.targetPath).replace(/\\/g, '/')}`);
  } else {
    console.log(`  失败: ${result.error}`);
    process.exitCode = 1;
  }
}

async function handleBatch(dirPath, force) {
  if (!fs.existsSync(dirPath)) {
    throw new Error(`Directory not found: ${dirPath}`);
  }

  const files = scanMarkdownFiles(dirPath);
  let moved = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const analysis = analyzeDocument(file);
      const preview = buildTargetPath(analysis, force);

      if (preview.same) {
        skipped += 1;
        continue;
      }

      if (preview.exists && !force) {
        skipped += 1;
        continue;
      }

      if (!force) {
        const answer = await ask(
          `[${moved + skipped + failed + 1}/${files.length}] ${path.relative(ROOT, file).replace(/\\/g, '/')} -> ${path.relative(ROOT, preview.targetPath).replace(/\\/g, '/')} ? (y/n/q): `
        );

        if (answer === 'q') break;
        if (answer !== 'y' && answer !== 'yes') {
          skipped += 1;
          continue;
        }
      }

      let replacement = null;
      if (analysis.status === 'deprecated') {
        replacement = findReplacement(file, files);
        if (!replacement && !force) {
          replacement = await ask('  替代文档路径(可留空): ');
        }
      }

      const result = moveDocument(analysis, { force, replacement });
      if (result.success) {
        moved += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  console.log(`\n批处理完成: moved=${moved}, skipped=${skipped}, failed=${failed}`);
}

async function handleTypes(subCommand, args) {
  const data = loadTypes();

  if (subCommand === 'list') {
    printTypes(data.types);
    return;
  }

  if (subCommand === 'add') {
    const [id, desc, targetDir, ...keywords] = args;
    if (!id || !desc || !targetDir) {
      throw new Error('Usage: types add <id> <desc> <dir> [keywords...]');
    }

    const existing = data.types.find(item => item.id === id);
    const next = { id, description: desc, targetDir, keywords };
    if (existing) {
      Object.assign(existing, next);
    } else {
      data.types.push(next);
    }

    saveTypes(data);
    console.log(`已保存类型: ${id}`);
    return;
  }

  if (subCommand === 'remove') {
    const [id] = args;
    if (!id) {
      throw new Error('Usage: types remove <id>');
    }

    const index = data.types.findIndex(item => item.id === id);
    if (index === -1) {
      console.log(`未找到类型: ${id}`);
      return;
    }

    data.types.splice(index, 1);
    saveTypes(data);
    console.log(`已移除类型: ${id}`);
    return;
  }

  throw new Error('Usage: types [list|add|remove]');
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!command) {
    console.log('doc-router');
    console.log('  analyze <path>');
    console.log('  execute <path> [-f]');
    console.log('  batch <dir> [-f]');
    console.log('  check');
    console.log('  types [list|add|remove]');
    return;
  }

  const force = args.includes('-f');

  try {
    switch (command) {
      case 'analyze':
        await handleAnalyze(args[0]);
        break;
      case 'execute':
        await handleExecute(args[0], force);
        break;
      case 'batch':
        await handleBatch(args[0], force);
        break;
      case 'check':
        checkDistribution();
        break;
      case 'types':
        await handleTypes(args[0], args.slice(1));
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();

