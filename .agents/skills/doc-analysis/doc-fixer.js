#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CURRENT_YEAR = new Date().getFullYear();
const UNCERTAIN_PATTERNS = [
  'may not',
  'might not',
  'probably',
  'possibly',
  'maybe',
  '可能',
  '也许',
  '大概',
  '似乎'
];

function loadDocument(docPath) {
  if (!fs.existsSync(docPath)) {
    throw new Error(`File not found: ${docPath}`);
  }
  const content = fs.readFileSync(docPath, 'utf8');
  return content.split('\n');
}

function isSafeYearContext(line) {
  return /(generated|updated|created|version history|release|copyright|date|日期|版本历史)/i.test(line);
}

function analyzeDocument(docPath) {
  const lines = loadDocument(docPath);
  const issues = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    for (const pattern of UNCERTAIN_PATTERNS) {
      if (trimmed.toLowerCase().includes(pattern.toLowerCase())) {
        issues.push({
          line: index + 1,
          type: 'uncertain_language',
          text: trimmed,
          suggestion: '改成更确定、可验证的表述'
        });
        break;
      }
    }

    const years = trimmed.match(/\b(19|20)\d{2}\b/g) || [];
    for (const year of years) {
      if (Number(year) < CURRENT_YEAR) {
        issues.push({
          line: index + 1,
          type: 'outdated_year',
          text: trimmed,
          year,
          safeContext: isSafeYearContext(trimmed),
          suggestion: isSafeYearContext(trimmed)
            ? `可将 ${year} 更新为 ${CURRENT_YEAR}`
            : '请人工确认是否需要更新年份'
        });
      }
    }
  });

  return issues;
}

function fixDocument(docPath, issues) {
  const lines = loadDocument(docPath);
  let modified = false;

  for (const issue of issues) {
    if (issue.type !== 'outdated_year' || !issue.safeContext) continue;

    const lineIndex = issue.line - 1;
    const original = lines[lineIndex];
    const updated = original.replace(new RegExp(`\\b${issue.year}\\b`, 'g'), String(CURRENT_YEAR));

    if (updated !== original) {
      lines[lineIndex] = updated;
      modified = true;
      console.log(`Updated line ${issue.line}: ${issue.year} -> ${CURRENT_YEAR}`);
    }
  }

  if (modified) {
    fs.writeFileSync(docPath, lines.join('\n'), 'utf8');
    console.log(`Saved: ${docPath}`);
  } else {
    console.log('No safe auto-fix applied.');
  }
}

function generateReport(docPath, issues) {
  const reportPath = docPath.replace(/\.[^.]+$/, '-accuracy-report.md');
  const report = [];

  report.push('# Document Accuracy Report');
  report.push('');
  report.push(`- File: ${docPath}`);
  report.push(`- Generated: ${new Date().toISOString()}`);
  report.push('');

  if (issues.length === 0) {
    report.push('No issues found.');
  } else {
    report.push(`Found ${issues.length} issue(s).`);
    report.push('');
    report.push('| Line | Type | Content | Suggestion |');
    report.push('|---|---|---|---|');
    for (const issue of issues) {
      const preview = issue.text.length > 80 ? `${issue.text.slice(0, 80)}...` : issue.text;
      report.push(`| ${issue.line} | ${issue.type} | ${preview} | ${issue.suggestion} |`);
    }
  }

  fs.writeFileSync(reportPath, report.join('\n') + '\n', 'utf8');
  console.log(`Report generated: ${reportPath}`);
}

function printIssues(issues) {
  if (issues.length === 0) {
    console.log('No issues found.');
    return;
  }

  issues.forEach((issue, index) => {
    console.log(`${index + 1}. Line ${issue.line} [${issue.type}] ${issue.suggestion}`);
  });
}

function main() {
  const [command, docPath] = process.argv.slice(2);

  if (!command || !docPath) {
    console.log('doc-analysis');
    console.log('  analyze <path>');
    console.log('  fix <path>');
    console.log('  report <path>');
    return;
  }

  try {
    const issues = analyzeDocument(docPath);

    switch (command) {
      case 'analyze':
        printIssues(issues);
        break;
      case 'fix':
        printIssues(issues);
        fixDocument(docPath, issues);
        break;
      case 'report':
        generateReport(docPath, issues);
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

