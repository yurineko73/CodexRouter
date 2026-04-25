# File Editor CLI Reference

**Version**: 1.0.0

## Quick Reference

```bash
# Insert
node file-editor.js insert <file> <line> [before] "<text>"

# Delete
node file-editor.js delete <file> <startLine> [endLine]

# Prepend (single file)
node file-editor.js prepend <file> "<text>"

# Prepend (batch with glob)
node file-editor.js prepend "<pattern>" "<text>"

# Append (single file)
node file-editor.js append <file> "<text>"

# Append (batch with glob)
node file-editor.js append "<pattern>" "<text>"

# Replace (single file)
node file-editor.js replace <file> "<old>" "<new>" [-r]

# Replace (batch with glob)
node file-editor.js replace "<pattern>" "<old>" "<new>" [-r]

# Search
node file-editor.js search <file> "<pattern>" [-r]

# List matching files
node file-editor.js list "<pattern>"

# Undo
node file-editor.js undo [count]
```

## Examples

```bash
# Insert at line 10
node file-editor.js insert src/app.js 10 "// New line"

# Insert before line 5
node file-editor.js insert src/app.js 5 before "// Inserted above"

# Delete lines 20-25
node file-editor.js delete src/utils.js 20 25

# Prepend license header to all JS files
node file-editor.js prepend "src/**/*.js" "// License: MIT"

# Append EOF comment
node file-editor.js append "bin/*.sh" "# EOF"

# Replace all TODO with DONE
node file-editor.js replace "src/**/*.ts" "TODO" "DONE"

# Regex replace
node file-editor.js replace "*.js" "foo(\\d+)" "bar$1" -r

# Search for function definitions
node file-editor.js search src/main.js "function \\w+"

# Batch search
node file-editor.js search "src/**/*.js" "TODO" -r

# List all TypeScript files
node file-editor.js list "src/**/*.ts"

# Undo last operation
node file-editor.js undo

# Undo last 3 operations
node file-editor.js undo 3
```

## Glob Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| `*` | Match any characters except `/` | `*.js` matches `foo.js` but not `bar/foo.js` |
| `**` | Match any characters including `/` | `**/*.js` matches `foo.js` and `bar/foo.js` |
| `?` | Match single character | `file?.js` matches `file1.js` |
| `{a,b}` | Match either a or b | `{foo,bar}.js` matches `foo.js` or `bar.js` |

## Regex Flags

Use `-r` flag to enable regex mode:

```bash
# Match lines starting with export
node file-editor.js search file.js "^export" -r

# Replace all digits
node file-editor.js replace file.js "\\d+" "0" -r

# Replace capture groups
node file-editor.js replace file.js "before(\\d+)after" "after$1before" -r
```

## Backup & Undo

- Every modification creates a `.bak` backup file
- Undo restores from the most recent backup
- Backups are stored alongside original files
- Undo deletes the backup after restoration

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (file not found, invalid regex, etc.) |

## Version History

### 1.0.0 (2026-04-25)
- Initial release
- Features: insert, delete, prepend, append, replace, search, list, undo
- Supports: glob patterns, regex, batch operations, MCP integration
- No external dependencies
