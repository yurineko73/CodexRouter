#!/usr/bin/env node

/**
 * doc-router - Document routing tool
 * Analyzes documents, determines module/status, and routes to correct directory
 */

const fs = require('fs');
const path = require('path');
const RecordLogger = require('../logger/record-logger.js');
const RecordAnalyzer = require('../logger/record-analyzer.js');

class DocTypeCache {
  constructor(cachePath) {
    this.cachePath = cachePath;
    this.data = this.load();
  }

  load() {
    if (fs.existsSync(this.cachePath)) {
      try {
        return JSON.parse(fs.readFileSync(this.cachePath, 'utf8'));
      } catch (e) {
        return { version: '1.0', types: [] };
      }
    }
    return { version: '1.0', types: [] };
  }

  save() {
    fs.writeFileSync(this.cachePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  findMatch(docName, docSummary) {
    const docNameLower = docName.toLowerCase();
    const docSummaryLower = docSummary.toLowerCase();

    let bestMatch = null;
    let bestScore = 0;
    let confidence = '低';

    for (const type of this.data.types) {
      let score = 0;
      for (const keyword of type.keywords) {
        if (docNameLower.includes(keyword.toLowerCase())) {
          score += 3;
        } else if (docSummaryLower.includes(keyword.toLowerCase())) {
          score += 2;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = type;
        if (score >= 5) confidence = '高';
        else if (score >= 3) confidence = '中';
      }
    }

    return { type: bestMatch, score: bestScore, confidence };
  }

  addType(newType) {
    const existing = this.data.types.find(t => t.id === newType.id);
    if (existing) {
      if (newType.description) existing.description = newType.description;
      if (newType.keywords) existing.keywords = [...new Set([...existing.keywords, ...newType.keywords])];
      if (newType.targetDir) existing.targetDir = newType.targetDir;
    } else {
      this.data.types.push(newType);
    }
    this.save();
  }

  removeType(typeId) {
    const index = this.data.types.findIndex(t => t.id === typeId);
    if (index !== -1) {
      this.data.types.splice(index, 1);
      this.save();
      return true;
    }
    return false;
  }

  listTypes() {
    return this.data.types;
  }

  findById(typeId) {
    return this.data.types.find(t => t.id === typeId);
  }
}

class DocAnalyzer {
  constructor(typeCache) {
    this.typeCache = typeCache;
  }

  extractFrontmatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      const fm = {};
      match[1].split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          fm[key.trim()] = valueParts.join(':').trim();
        }
      });
      return { frontmatter: fm, body: content.slice(match[0].length) };
    }
    return { frontmatter: {}, body: content };
  }

  extractTitle(content) {
    const match = content.match(/^#\s+(.+)/m);
    return match ? match[1].trim() : '';
  }

  extractSummary(content, maxLength = 500) {
    const { body } = this.extractFrontmatter(content);
    const lines = body.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    return lines.slice(0, 10).join(' ').substring(0, maxLength);
  }

  determineStatus(content, fileName) {
    const { frontmatter, body } = this.extractFrontmatter(content);
    if (frontmatter.deprecated === 'true') return 'deprecated';

    const lowerName = fileName.toLowerCase();
    const firstLines = content.substring(0, 1000).toLowerCase();

    const deprecatedPatterns = [
      /^#.*已废弃|^#.*deprecated/i,
      /\*\*状态\*\*:\s*已废弃|\*\*状态\*\*:\s*deprecated/i,
      /^>.*已废弃.*deprecated/i,
      /\(deprecated\)/i,
      /^deprecated:\s*true/i
    ];
    if (deprecatedPatterns.some(p => p.test(firstLines))) {
      return 'deprecated';
    }

    if (lowerName.includes('-v1') || lowerName.includes('-v2') || lowerName.includes('-v3')) {
      return 'deprecated';
    }

    const toolsKeywords = ['tool', 'cli', 'api-reference', 'sdk', 'rest', 'endpoint'];
    const isToolsKeyword = (text) => {
      const lower = text.toLowerCase();
      return toolsKeywords.some(k => {
        if (k.includes('-')) return lower.includes(k);
        const regex = new RegExp(`\\b${k}\\b`, 'i');
        return regex.test(lower);
      });
    };
    if (isToolsKeyword(lowerName)) {
      return 'tools';
    }

    return 'current';
  }

  analyze(docPath) {
    const content = fs.readFileSync(docPath, 'utf8');
    const fileName = path.basename(docPath);
    const title = this.extractTitle(content);
    const summary = this.extractSummary(content);

    const { type, score, confidence } = this.typeCache.findMatch(fileName, summary);
    const status = this.determineStatus(content, fileName);

    let targetDir = type ? type.targetDir : 'doc';
    if (status === 'current') targetDir = path.join(targetDir, 'current');
    else if (status === 'deprecated') targetDir = path.join(targetDir, 'deprecated');
    else if (status === 'tools' && !targetDir.endsWith('tools')) targetDir = path.join(targetDir, 'tools');

    return {
      docPath,
      fileName,
      title,
      summary,
      type: type ? type.id : null,
      typeDescription: type ? type.description : null,
      status,
      targetDir,
      score,
      confidence
    };
  }
}

class ReplacementFinder {
  constructor() {
    this.docDir = path.join(__dirname, '..', '..', '..', 'doc');
  }

  extractKeywords(fileName) {
    return fileName
      .replace(/\.(md|mdx|txt)$/i, '')
      .split(/[-_\s]+/)
      .filter(w => w.length > 2)
      .map(w => w.toLowerCase());
  }

  scoreCandidate(keywords, candidatePath, candidateSummary) {
    let score = 0;
    const candidateName = path.basename(candidatePath, path.extname(candidatePath)).toLowerCase();
    const candidateSummaryLower = candidateSummary.toLowerCase();

    for (const keyword of keywords) {
      if (candidateName.includes(keyword)) score += 3;
      if (candidateSummaryLower.includes(keyword)) score += 2;
    }

    return score;
  }

  find(deprecatedDocPath) {
    const deprecatedFileName = path.basename(deprecatedDocPath, path.extname(deprecatedDocPath));
    const keywords = this.extractKeywords(deprecatedFileName);

    const candidates = [];
    this.scanDir(this.docDir, candidates);

    let bestScore = 0;
    let bestMatch = null;

    for (const candidate of candidates) {
      if (candidate === deprecatedDocPath) continue;
      if (candidate.includes('/deprecated/')) continue;

      const content = fs.readFileSync(candidate, 'utf8');
      const summary = content.substring(0, 500).toLowerCase();
      const score = this.scoreCandidate(keywords, candidate, summary);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = candidate;
      }
    }

    if (bestScore >= 5) {
      const relativePath = path.relative(this.docDir, bestMatch).replace(/\\/g, '/');
      return { path: relativePath, score: bestScore };
    }

    return null;
  }

  scanDir(dir, results) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'deprecated') {
        this.scanDir(fullPath, results);
      } else if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }
}

class DocMover {
  static getNextVersion(fileName) {
    const match = fileName.match(/^(.+)-v(\d+)\.(md|mdx)$/i);
    if (match) {
      return `${match[1]}-v${parseInt(match[2]) + 1}.${match[3]}`;
    }
    return fileName.replace(/\.(md|mdx)$/i, '-v1.$1');
  }

  static addDeprecatedHeader(content, date, replacement) {
    const title = this.extractTitleStatic(content);
    const deprecationBlock = `---\ndeprecated: true\ndeprecated-date: ${date}\nreplacement: ${replacement}\n---\n\n# ⚠️ [已过期] ${title}\n\n> **状态**: 已过期 (Deprecated)\n> **过期日期**: ${date}\n> **替代文档**: \`${replacement}\`\n>\n> 本文档已过期，由上述替代文档接管。\n\n---\n`;

    const { frontmatter, body } = this.extractFrontmatterStatic(content);
    return deprecationBlock + body;
  }

  static extractFrontmatterStatic(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      const fm = {};
      match[1].split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
          fm[key.trim()] = valueParts.join(':').trim();
        }
      });
      return { frontmatter: fm, body: content.slice(match[0].length) };
    }
    return { frontmatter: {}, body: content };
  }

  static extractTitleStatic(content) {
    const match = content.match(/^#\s+(.+)/m);
    return match ? match[1].trim() : 'Untitled';
  }

  static move(sourcePath, targetDir, targetFileName, options = {}) {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const targetPath = path.join(targetDir, targetFileName);

    if (fs.existsSync(targetPath) && !options.force) {
      return { success: false, error: 'target_exists', targetPath };
    }

    let content = fs.readFileSync(sourcePath, 'utf8');

    if (options.addDeprecatedHeader) {
      content = this.addDeprecatedHeader(content, options.deprecatedDate, options.replacement);
    }

    fs.writeFileSync(targetPath, content, 'utf8');
    fs.unlinkSync(sourcePath);

    return { success: true, targetPath };
  }
}

class BatchProcessor {
  constructor(analyzer, replacementFinder, typeCache) {
    this.analyzer = analyzer;
    this.replacementFinder = replacementFinder;
    this.typeCache = typeCache;
  }

  async process(dirPath, options = {}, logger) {
    const files = this.scanMarkdownFiles(dirPath);
    const results = { total: files.length, success: 0, failed: 0, skipped: 0, operations: [] };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const analysis = this.analyzer.analyze(file);

      let replacement = null;
      if (analysis.status === 'deprecated') {
        const found = this.replacementFinder.find(file);
        if (found) {
          replacement = found.path;
          logger.logStep('replacement-found', { doc: file, replacement: found.path, score: found.score });
        }
      }

      const prompt = this.formatPrompt(i + 1, files.length, analysis, replacement);
      process.stdout.write(prompt + ' ');

      const answer = options.nonInteractive ? 'y' : await this.getUserInput();

      if (answer === 'q') {
        logger.logStep('batch-quit', { processed: i, results });
        break;
      } else if (answer === 'n') {
        results.skipped++;
        logger.logStep('batch-skip', { doc: file });
        continue;
      } else if (answer === 's') {
        process.stdout.write('\n  指定替代文档: ');
        replacement = await this.getUserInput();
        logger.logStep('replacement-user', { doc: file, replacement });
      }

      if (!replacement && analysis.status === 'deprecated') {
        process.stdout.write('\n  需指定替代文档: ');
        replacement = await this.getUserInput();
        logger.logStep('replacement-user', { doc: file, replacement });
      }

      const targetFileName = analysis.status === 'deprecated'
        ? DocMover.getNextVersion(analysis.fileName)
        : analysis.fileName;

      const moveResult = DocMover.move(file, analysis.targetDir, targetFileName, {
        force: options.force,
        addDeprecatedHeader: analysis.status === 'deprecated',
        deprecatedDate: new Date().toISOString().split('T')[0],
        replacement: replacement || 'none'
      });

      if (moveResult.success) {
        results.success++;
        logger.logStep('execute', {
          action: 'move',
          source: file,
          target: moveResult.targetPath,
          status: analysis.status
        });
        console.log('✓');
      } else {
        results.failed++;
        logger.logStep('execute-error', { source: file, error: moveResult.error });
        console.log(`✗ (${moveResult.error})`);
      }
    }

    logger.logStep('batch-complete', results);
    return results;
  }

  scanMarkdownFiles(dir) {
    const results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && /\.(md|mdx)$/i.test(entry.name)) {
        results.push(path.join(dir, entry.name));
      }
    }
    return results;
  }

  formatPrompt(index, total, analysis, replacement) {
    const relPath = path.relative(path.join(__dirname, '..', '..', '..'), analysis.docPath).replace(/\\/g, '/');
    let prompt = `[${index}/${total}] ${relPath} → ${path.relative(__dirname, analysis.targetDir).replace(/\\/g, '/')}/${analysis.status === 'deprecated' ? DocMover.getNextVersion(analysis.fileName) : analysis.fileName}`;
    if (replacement) {
      prompt += `\n  替代文档推荐: ${replacement}`;
    }
    return prompt;
  }

  getUserInput() {
    return new Promise(resolve => {
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.on('line', input => {
        rl.close();
        resolve(input.trim().toLowerCase());
      });
    });
  }
}

function checkDocDistribution(logger) {
  const docDir = path.join(__dirname, '..', '..', '..', 'doc');
  const stats = {};

  function scan(dir, category = '') {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        scan(path.join(dir, entry.name), category ? `${category}/${entry.name}` : entry.name);
      } else if (/\.(md|mdx)$/i.test(entry.name)) {
        const key = category || 'root';
        if (!stats[key]) stats[key] = { files: [], count: 0 };
        stats[key].files.push(entry.name);
        stats[key].count++;
      }
    }
  }

  scan(docDir);

  console.log('\n=== 文档分布统计 ===\n');
  for (const [key, value] of Object.entries(stats)) {
    console.log(`${key}: ${value.count} 个文档`);
  }
  console.log('');
  logger.logStep('check-completed', { stats });
  return stats;
}

async function main() {
  const skillDir = __dirname;
  const cachePath = path.join(skillDir, 'doc-types.json');
  const typeCache = new DocTypeCache(cachePath);
  const docAnalyzer = new DocAnalyzer(typeCache);
  const replacementFinder = new ReplacementFinder();
  const batchProcessor = new BatchProcessor(docAnalyzer, replacementFinder, typeCache);

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('doc-router - Document routing tool v1.0.0\n');
    console.log('Usage:');
    console.log('  node doc-router.js analyze <path>      Analyze document');
    console.log('  node doc-router.js execute <path> [-f] Analyze and move document');
    console.log('  node doc-router.js batch <dir> [-f]    Batch process directory');
    console.log('  node doc-router.js check              Check doc distribution');
    console.log('  node doc-router.js types list         List document types');
    console.log('  node doc-router.js types add <id> <desc> <dir>  Add type');
    console.log('  node doc-router.js types remove <id>  Remove type');
    process.exit(0);
  }

  const logger = new RecordLogger('doc-router');
  const analyzer = new RecordAnalyzer('doc-router');

  try {
    switch (command) {
      case 'analyze': {
        const docPath = args[1];
        if (!docPath) { console.error('Usage: analyze <path>'); process.exit(1); }
        logger.startCall('analyze', { docPath });
        logger.logStep('start-analyze', { docPath });

        const analysis = docAnalyzer.analyze(docPath);
        logger.logStep('analysis-result', analysis);

        const relTarget = path.relative(path.join(__dirname, '..', '..', '..'), path.join(analysis.targetDir, analysis.fileName)).replace(/\\/g, '/');
        console.log(`[分析] ${path.basename(docPath)}`);
        console.log(`  → ${relTarget} (置信度: ${analysis.confidence})`);

        logger.endCall(true);
        break;
      }

      case 'execute': {
        const docPath = args[1];
        const force = args.includes('-f');
        if (!docPath) { console.error('Usage: execute <path> [-f]'); process.exit(1); }
        logger.startCall('execute', { docPath, force });

        const analysis = docAnalyzer.analyze(docPath);
        logger.logStep('analysis-result', analysis);

        let replacement = null;
        if (analysis.status === 'deprecated') {
          const found = replacementFinder.find(docPath);
          if (found) {
            replacement = found.path;
            console.log(`  替代文档推荐: ${replacement} (匹配度: ${found.score * 10}%)`);
            logger.logStep('replacement-found', { replacement: found.path, score: found.score });
          }
        }

        const targetFileName = analysis.status === 'deprecated'
          ? DocMover.getNextVersion(analysis.fileName)
          : analysis.fileName;

        process.stdout.write(`[分析] ${path.basename(docPath)} → ${path.relative(__dirname, analysis.targetDir).replace(/\\/g, '/')}/${targetFileName} [y/n]: `);

        const readline = require('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise(resolve => rl.question('', resolve));
        rl.close();

        if (answer.toLowerCase() !== 'y') {
          console.log('已取消');
          logger.endCall(true);
          process.exit(0);
        }

        if (!replacement && analysis.status === 'deprecated') {
          process.stdout.write('  需指定替代文档: ');
          const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
          replacement = await new Promise(resolve => rl2.question('', resolve));
          rl2.close();
          logger.logStep('replacement-user', { replacement });
        }

        const moveResult = DocMover.move(docPath, analysis.targetDir, targetFileName, {
          force,
          addDeprecatedHeader: analysis.status === 'deprecated',
          deprecatedDate: new Date().toISOString().split('T')[0],
          replacement: replacement || 'none'
        });

        if (moveResult.success) {
          const relTarget = path.relative(path.join(__dirname, '..', '..', '..'), moveResult.targetPath).replace(/\\/g, '/');
          console.log(`✓ → ${relTarget}`);
          logger.logStep('move-success', { source: docPath, target: moveResult.targetPath });
        } else {
          console.error(`✗ 失败: ${moveResult.error}`);
          logger.logStep('move-error', { source: docPath, error: moveResult.error });
        }

        logger.endCall(moveResult.success);
        break;
      }

      case 'batch': {
        const dirPath = args[1];
        const force = args.includes('-f');
        if (!dirPath) { console.error('Usage: batch <dir> [-f]'); process.exit(1); }
        logger.startCall('batch', { dirPath, force });

        const results = await batchProcessor.process(dirPath, { force }, logger);
        console.log(`\n批量完成: ${results.total} 个文档, 成功 ${results.success}, 跳过 ${results.skipped}, 失败 ${results.failed}`);

        logger.endCall(true);
        break;
      }

      case 'check': {
        logger.startCall('check', {});
        checkDocDistribution(logger);
        logger.endCall(true);
        break;
      }

      case 'types': {
        const subCommand = args[1];
        if (subCommand === 'list') {
          logger.startCall('types-list', {});
          const types = typeCache.listTypes();
          console.log('\n=== 文档类型列表 ===\n');
          for (const type of types) {
            console.log(`[${type.id}] ${type.description}`);
            console.log(`  目录: ${type.targetDir}`);
            console.log(`  关键词: ${type.keywords.join(', ')}\n`);
          }
          logger.logStep('types-listed', { count: types.length });
          logger.endCall(true);
        } else if (subCommand === 'add') {
          const [id, desc, targetDir] = args.slice(2);
          if (!id || !desc || !targetDir) {
            console.error('Usage: types add <id> <desc> <dir>');
            process.exit(1);
          }
          logger.startCall('types-add', { id, desc, targetDir });
          typeCache.addType({ id, description: desc, targetDir, keywords: [] });
          logger.logStep('type-added', { id, description: desc, targetDir });
          console.log(`✓ 已添加类型: ${id}`);
          logger.endCall(true);
        } else if (subCommand === 'remove') {
          const id = args[2];
          if (!id) { console.error('Usage: types remove <id>'); process.exit(1); }
          logger.startCall('types-remove', { id });
          if (typeCache.removeType(id)) {
            logger.logStep('type-removed', { id });
            console.log(`✓ 已移除类型: ${id}`);
          } else {
            console.error(`类型不存在: ${id}`);
          }
          logger.endCall(true);
        } else {
          console.error('Usage: types [list|add|remove]');
        }
        break;
      }

      default:
        logger.startCall('unknown', { command });
        console.error(`Unknown command: ${command}`);
        console.error('Available: analyze, execute, batch, check, types');
        logger.endCall(false, 'Unknown command');
        process.exit(1);
    }

    setTimeout(() => { analyzer.analyze(); }, 0);

  } catch (error) {
    logger.endCall(false, error.message);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();