# Git Cheatsheet

Quick reference for common Git operations.

## Basic Operations

| Operation | Command |
|-----------|---------|
| Check status | `git status` |
| View history | `git log --oneline -10` |
| View changes | `git diff` |
| Add files | `git add file1 file2` |
| Add all | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push origin branch` |
| Pull | `git pull origin branch` |

## Branching

| Operation | Command |
|-----------|---------|
| List branches | `git branch` |
| Create branch | `git branch new-branch` |
| Switch branch | `git checkout branch` |
| Create & switch | `git checkout -b new-branch` |
| Delete branch | `git branch -d branch-name` |

## Undoing Changes

| Operation | Command |
|-----------|---------|
| Unstage file | `git reset HEAD file` |
| Discard changes | `git checkout -- file` |
| Undo last commit | `git reset --soft HEAD~1` |
| Amend commit | `git commit --amend` |

## Remote Operations

| Operation | Command |
|-----------|---------|
| Add remote | `git remote add name url` |
| View remotes | `git remote -v` |
| Push new branch | `git push -u origin branch` |
| Fetch updates | `git fetch origin` |
| Pull with rebase | `git pull --rebase origin branch` |

## Conflict Resolution

| Operation | Command |
|-----------|---------|
| Mark resolved | `git add conflicted-file` |
| Continue rebase | `git rebase --continue` |
| Abort rebase | `git rebase --abort` |
| Continue merge | `git commit` |
| Abort merge | `git merge --abort` |

## Commit Message Template

```
<type>: <subject>

<body>

- <detail 1>
- <detail 2>

<footer>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

## AI Collaboration Prompts

### For Codex/Claude

```
Please help me:
1. Check git status (git status)
2. View recent commits (git log --oneline -5)
3. Stage these files: [list]
4. Commit with message: "[type]: [message]"
5. Push to remote
```
