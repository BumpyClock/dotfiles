# Claude Memory Documentation

## Secrets Management Setup (2025-08-05)

### Private Secrets Repository
- **Repository**: https://github.com/BumpyClock/dotfiles-secrets (PRIVATE)
- **Purpose**: Store API keys, tokens, and sensitive configuration
- **Integration**: Added as git submodule to dotfiles at `./secrets/`

### Repository Structure
```
secrets/
├── api-keys/           # Actual API keys (not committed to templates)
├── certificates/       # SSL certificates and keys
├── config/            # Sensitive configuration files
├── tokens/            # Authentication tokens
└── templates/         # Template files with placeholders
    ├── api-keys.template.env
    └── mcp-servers.template.json
```

### Workflow for Managing Secrets

#### Initial Setup (completed)
1. Create private GitHub repo `dotfiles-secrets`
2. Add as git submodule: `git submodule add https://github.com/BumpyClock/dotfiles-secrets.git secrets`
3. Initialize: `git submodule update --init --recursive`

#### Adding New Secrets
1. Navigate to `secrets/` directory
2. Copy template files: `cp templates/api-keys.template.env api-keys/api-keys.env`
3. Edit with actual values
4. Commit and push: `cd secrets && git add . && git commit -m "add: new API keys" && git push`
5. Update parent repo: `cd .. && git add secrets && git commit -m "update: secrets submodule"`

#### Syncing Across Devices
1. Pull latest dotfiles: `git pull`
2. Update submodules: `git submodule update --remote --merge`
3. Or in one command: `git pull --recurse-submodules`

#### Security Notes
- Secrets repo is PRIVATE and should remain so
- Never expose actual secret values in public channels
- Templates serve as documentation for required secrets
- Use `.gitignore` patterns to prevent accidental commits of sensitive files

## Enhanced MCP Config Sync with Secrets Integration (2025-08-05 Updated)

### Enhanced sync-mcp-config.py Features
- **Secrets Integration**: Added `--sync-secrets` flag for automatic API key management
- **Smart Loading**: Automatically loads existing API keys from secrets before prompting
- **Auto-Save**: New API keys entered during sync are automatically saved to secrets repo
- **Secrets Extraction**: Pull mode can extract secrets from Claude config and save to repo

### Enhanced Templates
- **mcp-servers.template.json**: Now stores only server names and env variables (simplified)
- **mcp-env.template.json**: Clean environment-only template for actual secrets storage

### Usage Examples
```bash
# Push with secrets integration (loads existing keys, saves new ones)
python sync-mcp-config.py push --sync-secrets

# Pull and extract secrets from Claude config  
python sync-mcp-config.py pull --sync-secrets

# Preview with secrets (won't save, but shows what would happen)
python sync-mcp-config.py --dry-run --sync-secrets
```

### Current Status
✅ Private repo created and configured
✅ Submodule integration working  
✅ Template files available for common secret types
✅ Proper .gitignore configuration in both repos
✅ **NEW**: Secrets integration in sync script
✅ **NEW**: Automatic API key loading and persistence
✅ **NEW**: Cross-device API key synchronization working