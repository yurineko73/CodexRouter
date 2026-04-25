# File Cleanup Skill

通用文件清理，适配 Codex 和 Claude。

## 功能

- 识别临时文件、备份文件、测试脚本
- 清理不需要的文件
- 更新 .gitignore 排除规则
- 组织项目结构

## 清理清单

### 临时文件类型

| 扩展名 | 说明 | 处理方式 |
|---------|------|---------|
| `.tmp`, `.temp` | 临时文件 | 删除 |
| `.bak`, `.backup` | 备份文件 | 评估后删除 |
| `.orig` | 原始文件备份 | 删除 |
| `.cjs`, `.mjs` | 临时 JS 脚本 | 评估后删除 |
| `.ps1` | PowerShell 脚本 | 评估后删除 |
| `~` 结尾 | 编辑器备份 | 删除 |

### 测试/调试文件

| 模式 | 示例 | 处理方式 |
|------|------|---------|
| `_test.*` | `_test.js` | 移至 test/ 或删除 |
| `test-*` | `test-api.js` | 移至 test/ 或删除 |
| `*.spec.js` | 单元测试 | 保留在 test/ |
| `*.e2e.js` | 端到端测试 | 保留在 test/ |

### 构建/依赖文件

| 目录/文件 | 说明 | 处理方式 |
|------------|------|---------|
| `node_modules/` | Node.js 依赖 | 加入 .gitignore |
| `__pycache__/` | Python 缓存 | 加入 .gitignore |
| `.env` | 环境变量 | 加入 .gitignore |
| `dist/`, `build/` | 构建输出 | 加入 .gitignore |

## 清理流程

### 1. 识别阶段

```bash
# 查找临时文件
glob **/*.tmp
glob **/*.bak
glob **/*.orig

# 查找测试文件
glob **/_test.*
glob **/test-*

# 查看 git 未跟踪文件
git status --short
```

### 2. 评估阶段

```bash
# 读取文件内容评估是否必需
read file/path

# 检查文件是否被引用
grep -pattern "filename" -path "src/"
```

### 3. 清理阶段

```bash
# 删除单个文件
Remove-Item -Path "file-path" -Force

# 删除多个文件
Remove-Item -Path "file1", "file2" -Force

# 删除目录
Remove-Item -Path "dir-path" -Recurse -Force
```

### 4. 更新 .gitignore

```bash
# 读取当前 .gitignore
read .gitignore

# 编辑添加排除规则
edit -filePath ".gitignore" -oldString "..." -newString "..."
```

## .gitignore 模板

```
# Dependencies
node_modules/
__pycache__/
*.pyc

# Environment
.env
.env.local

# Temporary files
*.tmp
*.bak
*.orig
*~
$null
test-*

# Build outputs
dist/
build/
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Personal config
opencode.json
.claude/
```

## 与 AI 协作

### Codex/Claude 提示词模板

```
请帮我清理项目中的临时文件：

1. 查找以下类型的文件：
   - 临时文件: *.tmp, *.bak, *.orig
   - 测试脚本: _test.*, test-*
   - 备份文件: *.cjs, *.mjs (评估是否必需)
2. 读取每个文件判断是否需要保留
3. 删除不需要的文件
4. 更新 .gitignore 排除这些文件类型
5. 提交更改: git add .; git commit -m 'chore: clean temp files'
```

### 深度清理提示词

```
请对项目进行深度清理：

1. 使用 glob 查找所有可疑文件
2. 读取文件内容评估用途
3. 检查是否有代码引用这些文件
4. 分三类处理：
   - 必需：保留并说明原因
   - 可移至 test/：移动并说明
   - 可删除：删除并更新 .gitignore
5. 生成清理报告
6. 执行清理并提交
```

## 清理脚本

### PowerShell 清理脚本

```powershell
# cleanup.ps1
param([string]$Path = ".")

$tempExtensions = @("tmp", "bak", "orig", "cjs", "mjs")
$testPatterns = @("_test.*", "test-*.", "*_test.*")

Write-Host "Cleaning $Path..."

foreach ($ext in $tempExtensions) {
    $files = Get-ChildItem -Path $Path -Recurse -Filter "*.$ext" -File
    foreach ($file in $files) {
        Write-Host "  Deleting: $($file.FullName)"
        Remove-Item -Path $file.FullName -Force
    }
}

Write-Host "Done!"
```

### Bash 清理脚本

```bash
#!/bin/bash
# cleanup.sh
PATH="${1:-.}"

echo "Cleaning $PATH..."

# Remove temp files
find "$PATH" -type f \( -name "*.tmp" -o -name "*.bak" -o -name "*.orig" \) -delete

# Remove test scripts (uncomment to enable)
# find "$PATH" -type f -name "_test.*" -delete
# find "$PATH" -type f -name "test-*" -delete

echo "Done!"
```

## 注意事项

- 删除前先评估文件是否必需
- 重要的测试文件应移至 test/ 目录
- 更新 .gitignore 防止再次提交
- 提交时说明清理了哪些文件
- 不要删除项目运行必需的配置

## 参考文档

- [Gitignore 文档](https://git-scm.com/docs/gitignore)
- [Node.js .gitignore 模板](https://github.com/github/gitignore/blob/master/Node.gitignore)
- [清理 Node.js 项目](https://medium.com/@alishahid_10136/how-to-clean-up-your-node-js-project-8e635d72453)
