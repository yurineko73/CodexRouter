#!/bin/bash
# File Cleanup Script
# Compatible with Codex and Claude

set -e

PATH="${1:-.}"

echo "Cleaning temporary files in $PATH..."

# Remove common temp file extensions
find "$PATH" -type f \( \
  -name "*.tmp" -o \
  -name "*.bak" -o \
  -name "*.orig" -o \
  -name "*~" -o \
  -name ".*.swp" \
  \) -delete 2>/dev/null || true

# Remove __pycache__ directories
find "$PATH" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true

# Remove node_modules (uncomment to enable)
# find "$PATH" -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true

# Remove .DS_Store (macOS)
find "$PATH" -type f -name ".DS_Store" -delete 2>/dev/null || true

# Remove Thumbs.db (Windows)
find "$PATH" -type f -name "Thumbs.db" -delete 2>/dev/null || true

echo "Cleanup complete!"
echo ""
echo "Next steps:"
echo "1. Review .gitignore"
echo "2. Add any new patterns found"
echo "3. Commit changes: git add . && git commit -m 'chore: clean temp files'"
