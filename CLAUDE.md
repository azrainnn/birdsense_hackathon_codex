# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Final Year Project: AI-powered bird detection system. The repository is in its initial state — no source code exists yet.

## Git Workflow

All work must be committed and pushed to GitHub after every task:

```powershell
git add <specific files>
git commit -m "type: short description"
git push
```

Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`.

Remote: https://github.com/azrainnn/fyp-ai-bird-detection (private)

## .gitignore Notes

The `.gitignore` excludes by default:
- Model weights (`*.pt`, `*.pth`, `*.h5`, `*.onnx`, etc.)
- Raw datasets and large media files
- Python virtual environments (`venv/`, `.venv/`)
- Training logs and output directories (`runs/`, `wandb/`, `checkpoints/`)

If large files need tracking, use Git LFS rather than committing them directly.
