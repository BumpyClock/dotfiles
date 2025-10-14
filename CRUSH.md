# CRUSH.md - Dotfiles Repository Guide

## Commands
- **Explore structure**: `eza --tree --git-ignore` (install: `winget install eza-community.eza`)
- **Sync MCP config**: `python mcpServers/sync-mcp-config.py [push|pull] [--dry-run] [--health-check] [--sync-secrets]`
- **Link dotfiles (Unix)**: `./link-dotfiles.sh`
- **Link dotfiles (Windows)**: `./link-dotfiles.ps1`
- **Install zsh deps**: `./install-zsh-deps.sh`
- **Sync GitHub folder**: `./sync-github-folder.sh` or `./sync-github-folder.ps1`

## Code Style
- **File headers**: All files start with 2-line `ABOUTME:` comment explaining purpose
- **Python**: Follow PEP 8, use type hints, prefer pathlib over os.path
- **Shell scripts**: Use `#!/usr/bin/env` shebang, quote variables, check exit codes
- **PowerShell**: Use approved verbs, proper error handling with try/catch
- **Naming**: Evergreen names only - no "new", "improved", "enhanced" prefixes
- **Comments**: Preserve existing comments unless provably false; write evergreen comments
- **Changes**: Make minimal changes; match surrounding style; never rewrite without permission

## Source Control
- **Primary tool**: Use `gh` CLI for all Git operations; fallback to `git` only when necessary
- **Commits**: Conventional commit format, imperative mood, present tense, concise and descriptive
- **CRITICAL**: NEVER use `--no-verify` when committing

## Project Structure
- `.github/`: Copilot instructions, prompts, workflows
- `.claude/`: Claude-specific config, agents, memory, session context
- `mcpServers/`: MCP server configurations and sync scripts
- `agents/`: Agent definitions and templates
- `docs/`: Documentation for Python, TypeScript, React, source control

## Key Principles
- Simple, maintainable solutions over clever ones
- Consistency within files over external standards
- Real data/APIs only - no mocks
- Ask before reimplementing from scratch
- Document unrelated issues instead of fixing immediately
