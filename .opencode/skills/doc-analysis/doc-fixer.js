#!/usr/bin/env node
/**
 * Doc Fixer - Document accuracy correction
 * Compatible with Codex and Claude
 */

const fs = require('fs');
const path = require('path');

/**
 * Analyze document accuracy
 */
function analyzeDocument(docPath) {
  if (!fs.existsSync(docPath)) {
    console.error(`Error: File not found: ${docPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(docPath, 'utf-8');
  const lines = content.split('\n');
  const issues = [];

  // Check for common issues
  lines.forEach((line, index) => {
    // Check for deprecated terms
    const deprecatedTerms = ['may not be supported', 'might not work', 'probably'];
    deprecatedTerms.forEach(term => {
      if (line.includes(term)) {
        issues.push({
          line: index + 1,
          type: 'uncertain_language',
          text: line.trim(),
          suggestion: 'Use definitive language based on official docs'
        });
      }
    });

    // Check for outdated year references
    const yearMatch = line.match(/202[0-9]/g);
    if (yearMatch) {
      yearMatch.forEach(year => {
        if (parseInt(year) < 2026) {
          issues.push({
            line: index + 1,
            type: 'outdated_year',
            text: line.trim(),
            suggestion: `Update year reference from ${year} to 2026`
          });
        }
      });
    }
  });

  return issues;
}

/**
 * Apply fixes to document
 */
function fixDocument(docPath, issues) {
  let content = fs.readFileSync(docPath, 'utf-8');
  let modified = false;

  issues.forEach(issue => {
    if (issue.type === 'outdated_year') {
      const oldYear = issue.text.match(/202[0-9]/)[0];
      const newContent = content.replace(oldYear, '2026');
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`Fixed: Updated year ${oldYear} -> 2026 at line ${issue.line}`);
      }
    }
  });

  if (modified) {
    fs.writeFileSync(docPath, content, 'utf-8');
    console.log(`Document updated: ${docPath}`);
  } else {
    console.log('No fixes applied.');
  }
}

/**
 * Generate accuracy report
 */
function generateReport(docPath, issues) {
  const reportPath = docPath.replace(/\.[^.]+$/, '-accuracy-report.md');
  let report = `# Document Accuracy Report\n\n`;
  report += `**File**: ${docPath}\n`;
  report += `**Generated**: ${new Date().toISOString()}\n\n`;

  if (issues.length === 0) {
    report += '## No issues found\n\n';
    report += 'Document appears to be accurate based on automated checks.\n';
  } else {
    report += `## Found ${issues.length} potential issue(s)\n\n`;
    report += '| Line | Type | Content | Suggestion |\n';
    report += '|------|------|---------|----------|\n';

    issues.forEach(issue => {
      const textPreview = issue.text.length > 50 
        ? issue.text.substring(0, 50) + '...' 
        : issue.text;
      report += `| ${issue.line} | ${issue.type} | ${textPreview} | ${issue.suggestion} |\n`;
    });
  }

  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`Report generated: ${reportPath}`);
}

// CLI usage
const command = process.argv[2];
const docPath = process.argv[3];

if (!command || !docPath) {
  console.log(`
Doc Fixer - Document accuracy correction

Usage: node doc-fixer.js [command] [doc-path]

Commands:
  analyze <path>     Analyze document for accuracy issues
  fix <path>         Apply automated fixes
  report <path>       Generate accuracy report

Examples:
  node doc-fixer.js analyze docs/code-review-plan.md
  node doc-fixer.js fix docs/code-review-plan.md
  node doc-fixer.js report docs/code-review-plan.md
  `);
  process.exit(1);
}

switch (command) {
  case 'analyze':
    console.log(`Analyzing ${docPath}...`);
    const issues = analyzeDocument(docPath);
    if (issues.length === 0) {
      console.log('No issues found.');
    } else {
      issues.forEach((issue, i) => {
        console.log(`${i + 1}. Line ${issue.line} [${issue.type}]: ${issue.suggestion}`);
      });
    }
    break;

  case 'fix':
    console.log(`Fixing ${docPath}...`);
    const fixIssues = analyzeDocument(docPath);
    fixDocument(docPath, fixIssues);
    break;

  case 'report':
    console.log(`Generating report for ${docPath}...`);
    const reportIssues = analyzeDocument(docPath);
    generateReport(docPath, reportIssues);
    break;

  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
