#!/usr/bin/env python3
# ABOUTME: Script to sync MCP server configurations between mcp-servers.json and ~/.claude.json
# ABOUTME: Supports bidirectional sync to keep configurations in sync across devices

import json
import os
import sys
from pathlib import Path
import shutil
from datetime import datetime
import argparse
import urllib.request
import urllib.error
import subprocess
from typing import Tuple, Dict, Any, Optional
import getpass
import platform

def load_json_file(filepath):
    """Load JSON from file, return empty dict if file doesn't exist or is invalid."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Warning: Could not load {filepath}: {e}")
        return {}

def get_mcp_servers_key(config):
    """Get the appropriate key for MCP servers from config (handles both 'mcps' and 'mcpServers')."""
    if 'mcpServers' in config:
        return 'mcpServers'
    elif 'mcps' in config:
        return 'mcps'
    return None

def normalize_config_keys(config):
    """Normalize config to use 'mcpServers' key."""
    if 'mcps' in config and 'mcpServers' not in config:
        config['mcpServers'] = config.pop('mcps')
    return config

def is_api_key_placeholder(value):
    """Check if a value is an API key placeholder that needs to be filled."""
    if not isinstance(value, str):
        return False
    
    placeholder_patterns = [
        'YOUR_API_KEY_HERE',
        'YOUR_',
        'REPLACE_ME',
        'PLACEHOLDER',
        'API_KEY_HERE',
        '<YOUR_',
        '[YOUR_'
    ]
    
    value_upper = value.upper()
    return any(pattern in value_upper for pattern in placeholder_patterns) or value == ''

def get_secrets_env_path():
    """Get the path to the secrets environment file."""
    dotfiles_dir = Path(__file__).parent
    secrets_dir = dotfiles_dir / "secrets"
    api_keys_dir = secrets_dir / "api-keys"
    
    # Create api-keys directory if it doesn't exist
    api_keys_dir.mkdir(parents=True, exist_ok=True)
    
    return api_keys_dir / "mcp-env.json"

def load_secrets_env():
    """Load API keys from the secrets repository."""
    secrets_file = get_secrets_env_path()
    
    if not secrets_file.exists():
        print(f"No secrets file found at {secrets_file}")
        return {}
    
    try:
        with open(secrets_file, 'r', encoding='utf-8') as f:
            secrets_data = json.load(f)
            # Filter out comment fields
            return {k: v for k, v in secrets_data.items() if not k.startswith('_')}
    except (json.JSONDecodeError, FileNotFoundError) as e:
        print(f"Warning: Could not load secrets from {secrets_file}: {e}")
        return {}

def save_secrets_env(secrets_env):
    """Save API keys to the secrets repository."""
    secrets_file = get_secrets_env_path()
    
    # Load existing data to preserve comments
    existing_data = {}
    if secrets_file.exists():
        try:
            with open(secrets_file, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            pass
    
    # Preserve comment fields
    final_data = {k: v for k, v in existing_data.items() if k.startswith('_')}
    final_data.update(secrets_env)
    
    # Write the updated secrets
    with open(secrets_file, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2)
    
    print(f"Saved API keys to {secrets_file}")

def merge_secrets_with_servers(servers, secrets_env):
    """Merge secrets environment variables into server configurations."""
    updated_servers = json.loads(json.dumps(servers))  # Deep copy
    
    for server_name, server_config in updated_servers.items():
        if server_name in secrets_env and 'env' in server_config:
            server_secrets = secrets_env[server_name]
            
            for env_key, env_value in server_config['env'].items():
                # If we have a secret for this env var and current value is placeholder
                if env_key in server_secrets and is_api_key_placeholder(str(env_value)):
                    secret_value = server_secrets[env_key]
                    # Only use the secret if it's not a placeholder itself
                    if not is_api_key_placeholder(str(secret_value)):
                        updated_servers[server_name]['env'][env_key] = secret_value
                        print(f"    Loaded secret for {server_name}.{env_key}")
    
    return updated_servers

def extract_secrets_from_servers(servers):
    """Extract environment variables from servers to create secrets structure."""
    secrets_env = {}
    
    for server_name, server_config in servers.items():
        if 'env' in server_config and isinstance(server_config['env'], dict):
            server_env = {}
            for env_key, env_value in server_config['env'].items():
                # Only extract if it looks like an API key and is not a placeholder
                if (any(keyword in env_key.upper() for keyword in ['API', 'KEY', 'TOKEN', 'SECRET', 'PASS']) and
                    not is_api_key_placeholder(str(env_value))):
                    server_env[env_key] = env_value
            
            if server_env:
                secrets_env[server_name] = server_env
    
    return secrets_env

def prompt_for_api_keys(servers, sync_secrets=False):
    """Prompt user to enter API keys for any placeholders found."""
    # Load existing secrets first
    secrets_env = {}
    if sync_secrets:
        print("\n=== LOADING SECRETS ===")
        secrets_env = load_secrets_env()
        if secrets_env:
            print(f"Loaded secrets for {len(secrets_env)} servers from secrets repository")
            # Merge existing secrets into servers
            servers = merge_secrets_with_servers(servers, secrets_env)
        else:
            print("No existing secrets found")
    
    api_keys_needed = []
    
    # Find all API key placeholders (after loading secrets)
    for server_name, server_config in servers.items():
        if 'env' in server_config and isinstance(server_config['env'], dict):
            for env_key, env_value in server_config['env'].items():
                if is_api_key_placeholder(str(env_value)):
                    api_keys_needed.append((server_name, env_key, env_value))
    
    if not api_keys_needed:
        return servers
    
    print("\n=== API KEY CONFIGURATION ===")
    print(f"Found {len(api_keys_needed)} API key(s) that need to be configured:\n")
    
    updated_servers = json.loads(json.dumps(servers))  # Deep copy
    new_secrets = {}
    
    for server_name, env_key, current_value in api_keys_needed:
        print(f"Server: {server_name}")
        print(f"Environment variable: {env_key}")
        print(f"Current value: {current_value}")
        
        # Prompt for API key
        while True:
            api_key = getpass.getpass(f"Enter API key for {env_key} (or press Enter to skip): ").strip()
            
            if not api_key:
                print("Skipping...\n")
                break
            
            # Basic validation
            if len(api_key) < 10:
                print("API key seems too short. Please enter a valid API key.")
                continue
            
            # Update the server config
            updated_servers[server_name]['env'][env_key] = api_key
            
            # Track new secrets for saving
            if sync_secrets:
                if server_name not in new_secrets:
                    new_secrets[server_name] = {}
                new_secrets[server_name][env_key] = api_key
            
            print("[OK] API key updated\n")
            break
    
    # Save new secrets to repository
    if sync_secrets and new_secrets:
        print("\n=== SAVING SECRETS ===")
        # Merge with existing secrets
        updated_secrets_env = dict(secrets_env)
        for server_name, server_secrets in new_secrets.items():
            if server_name not in updated_secrets_env:
                updated_secrets_env[server_name] = {}
            updated_secrets_env[server_name].update(server_secrets)
        
        save_secrets_env(updated_secrets_env)
        print(f"Saved {len(new_secrets)} new API key(s) to secrets repository")
    
    return updated_servers

def is_windows():
    """Check if running on Windows."""
    return platform.system().lower() == 'windows'

def wrap_command_for_windows(server_config):
    """Wrap commands with cmd /c for Windows if needed."""
    if not is_windows():
        return server_config
    
    # Only process stdio type servers
    if server_config.get('type') != 'stdio':
        return server_config
    
    command = server_config.get('command', '')
    
    # Skip if already wrapped with cmd
    if command.lower() == 'cmd':
        return server_config
    
    # List of commands that need cmd /c wrapper on Windows
    commands_needing_wrapper = ['npx', 'uvx', 'node', 'python', 'py']
    
    if command.lower() in commands_needing_wrapper:
        # Create a deep copy to avoid modifying the original
        wrapped_config = json.loads(json.dumps(server_config))
        wrapped_config['command'] = 'cmd'
        
        # Handle packageOrCommand field (used by some servers like context7)
        if 'packageOrCommand' in wrapped_config and 'args' not in wrapped_config:
            package = wrapped_config.pop('packageOrCommand')
            wrapped_config['args'] = ['/c', command, package]
        else:
            # Prepare new args with /c wrapper
            original_args = wrapped_config.get('args', [])
            wrapped_config['args'] = ['/c', command] + original_args
        
        return wrapped_config
    
    return server_config

def wrap_servers_for_windows(servers):
    """Apply Windows command wrapping to all servers."""
    if not is_windows():
        return servers
    
    wrapped_servers = {}
    for server_name, server_config in servers.items():
        wrapped_servers[server_name] = wrap_command_for_windows(server_config)
    
    return wrapped_servers

def unwrap_command_from_windows(server_config):
    """Unwrap cmd /c wrapper to restore original command."""
    # Only process stdio type servers
    if server_config.get('type') != 'stdio':
        return server_config
    
    command = server_config.get('command', '')
    args = server_config.get('args', [])
    
    # Check if it's wrapped with cmd /c
    if command.lower() == 'cmd' and len(args) >= 2 and args[0] == '/c':
        # Create a deep copy to avoid modifying the original
        unwrapped_config = json.loads(json.dumps(server_config))
        
        # Extract the original command and args
        unwrapped_config['command'] = args[1]
        unwrapped_config['args'] = args[2:] if len(args) > 2 else []
        
        # Remove empty args list if no args remain
        if not unwrapped_config['args']:
            unwrapped_config.pop('args', None)
        
        return unwrapped_config
    
    # Handle legacy "cmd /c npx" format in command field
    if command.lower().startswith('cmd /c '):
        unwrapped_config = json.loads(json.dumps(server_config))
        original_command = command[7:]  # Remove "cmd /c "
        unwrapped_config['command'] = original_command
        return unwrapped_config
    
    return server_config

def unwrap_servers_from_windows(servers):
    """Remove Windows command wrapping from all servers."""
    unwrapped_servers = {}
    for server_name, server_config in servers.items():
        unwrapped_servers[server_name] = unwrap_command_from_windows(server_config)
    
    return unwrapped_servers

def sanitize_api_keys(servers):
    """Replace actual API keys with placeholders for security."""
    sanitized_servers = json.loads(json.dumps(servers))  # Deep copy
    
    for server_name, server_config in sanitized_servers.items():
        if 'env' in server_config and isinstance(server_config['env'], dict):
            for env_key, env_value in server_config['env'].items():
                # Check if this looks like an API key environment variable
                if any(keyword in env_key.upper() for keyword in ['API', 'KEY', 'TOKEN', 'SECRET', 'PASS']):
                    # Don't sanitize if it's already a placeholder
                    if not is_api_key_placeholder(str(env_value)):
                        # Create a descriptive placeholder based on the env var name
                        if 'API_KEY' in env_key:
                            sanitized_servers[server_name]['env'][env_key] = 'YOUR_API_KEY_HERE'
                        elif 'TOKEN' in env_key:
                            sanitized_servers[server_name]['env'][env_key] = 'YOUR_TOKEN_HERE'
                        elif 'SECRET' in env_key:
                            sanitized_servers[server_name]['env'][env_key] = 'YOUR_SECRET_HERE'
                        else:
                            sanitized_servers[server_name]['env'][env_key] = 'YOUR_' + env_key + '_HERE'
    
    return sanitized_servers

def validate_mcp_server_config(server_name: str, server_config: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Validate MCP server configuration against expected schema."""
    if not isinstance(server_config, dict):
        return False, f"Server '{server_name}' configuration must be a dictionary"
    
    # Check required fields
    if 'type' not in server_config:
        return False, f"Server '{server_name}' missing required 'type' field"
    
    server_type = server_config['type']
    valid_types = ['stdio', 'http', 'docker', 'sse']
    
    if server_type not in valid_types:
        return False, f"Server '{server_name}' has invalid type '{server_type}'. Valid types: {', '.join(valid_types)}"
    
    # Type-specific validation
    if server_type == 'stdio':
        if 'command' not in server_config:
            return False, f"STDIO server '{server_name}' missing required 'command' field"
        if not isinstance(server_config['command'], str):
            return False, f"STDIO server '{server_name}' 'command' must be a string"
        if 'args' in server_config and not isinstance(server_config['args'], list):
            return False, f"STDIO server '{server_name}' 'args' must be a list"
    
    elif server_type == 'http' or server_type == 'sse':
        if 'url' not in server_config:
            return False, f"{server_type.upper()} server '{server_name}' missing required 'url' field"
        if not isinstance(server_config['url'], str):
            return False, f"{server_type.upper()} server '{server_name}' 'url' must be a string"
        # Basic URL validation
        url = server_config['url']
        if not (url.startswith('http://') or url.startswith('https://')):
            return False, f"{server_type.upper()} server '{server_name}' 'url' must start with http:// or https://"
    
    elif server_type == 'docker':
        if 'command' not in server_config:
            return False, f"Docker server '{server_name}' missing required 'command' field"
        if not isinstance(server_config['command'], str):
            return False, f"Docker server '{server_name}' 'command' must be a string"
        if 'args' in server_config and not isinstance(server_config['args'], list):
            return False, f"Docker server '{server_name}' 'args' must be a list"
    
    # Validate env if present
    if 'env' in server_config:
        if not isinstance(server_config['env'], dict):
            return False, f"Server '{server_name}' 'env' must be a dictionary"
        for key, value in server_config['env'].items():
            if not isinstance(key, str):
                return False, f"Server '{server_name}' env key must be a string"
            if not isinstance(value, (str, int, float, bool)):
                return False, f"Server '{server_name}' env value for '{key}' must be a string, number, or boolean"
    
    return True, None

def check_server_health(server_name: str, server_config: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Check if an MCP server is accessible/valid."""
    server_type = server_config.get('type')
    
    if server_type == 'stdio':
        command = server_config.get('command')
        if command:
            if command == 'docker':
                # Special handling for docker command
                if shutil.which('docker') is None:
                    return False, f"Docker not found in PATH"
                # Check if docker is running
                try:
                    result = subprocess.run(['docker', 'info'], 
                                           capture_output=True, text=True, timeout=5)
                    if result.returncode != 0:
                        return False, f"Docker is not running or not accessible"
                except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
                    return False, f"Docker command failed or timed out"
            elif command == 'npx':
                # Check if npx is available
                if shutil.which('npx') is None:
                    return False, f"npx not found in PATH"
            else:
                # Check if command exists in PATH
                if shutil.which(command) is None:
                    return False, f"Command '{command}' not found in PATH"
    
    elif server_type == 'http':
        url = server_config.get('url')
        if url:
            try:
                # Try to reach the URL with a short timeout
                request = urllib.request.Request(url)
                with urllib.request.urlopen(request, timeout=10) as response:
                    # Just check if we can connect, don't care about the response
                    pass
            except urllib.error.URLError as e:
                return False, f"Cannot reach URL '{url}': {e}"
            except Exception as e:
                return False, f"Error checking URL '{url}': {e}"
    
    elif server_type == 'docker':
        # For docker type, check if docker is available
        if shutil.which('docker') is None:
            return False, f"Docker not found in PATH"
        
        # Check if docker is running
        try:
            result = subprocess.run(['docker', 'info'], 
                                   capture_output=True, text=True, timeout=5)
            if result.returncode != 0:
                return False, f"Docker is not running or not accessible"
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
            return False, f"Docker command failed or timed out"
    
    return True, None

def show_diff(old_servers: Dict[str, Any], new_servers: Dict[str, Any], mode: str):
    """Display differences between server configurations."""
    print(f"\n=== CHANGES PREVIEW ({mode.upper()} MODE) ===")
    
    # Find additions
    added = set(new_servers.keys()) - set(old_servers.keys())
    if added:
        print(f"\n+ SERVERS TO ADD ({len(added)}):")
        for server in sorted(added):
            print(f"  + {server} ({new_servers[server].get('type', 'unknown')})")
    
    # Find removals (shouldn't happen in normal sync, but good to check)
    removed = set(old_servers.keys()) - set(new_servers.keys())
    if removed:
        print(f"\n- SERVERS TO REMOVE ({len(removed)}):")
        for server in sorted(removed):
            print(f"  - {server} ({old_servers[server].get('type', 'unknown')})")
    
    # Find modifications
    modified = []
    for server in set(old_servers.keys()) & set(new_servers.keys()):
        if old_servers[server] != new_servers[server]:
            modified.append(server)
    
    if modified:
        print(f"\n~ SERVERS TO UPDATE ({len(modified)}):")
        for server in sorted(modified):
            print(f"  ~ {server} ({new_servers[server].get('type', 'unknown')})")
            # Show detailed changes
            old_config = old_servers[server]
            new_config = new_servers[server]
            
            for key in set(old_config.keys()) | set(new_config.keys()):
                if key not in old_config:
                    print(f"    + {key}: {new_config[key]}")
                elif key not in new_config:
                    print(f"    - {key}: {old_config[key]}")
                elif old_config[key] != new_config[key]:
                    print(f"    ~ {key}: {old_config[key]} -> {new_config[key]}")
    
    if not added and not removed and not modified:
        print("\n[OK] No changes detected")

def validate_all_servers(servers: Dict[str, Any]) -> Tuple[bool, list]:
    """Validate all server configurations."""
    all_valid = True
    errors = []
    
    for server_name, server_config in servers.items():
        is_valid, error = validate_mcp_server_config(server_name, server_config)
        if not is_valid:
            all_valid = False
            errors.append(error)
    
    return all_valid, errors

def health_check_all_servers(servers: Dict[str, Any]) -> Tuple[int, int, list]:
    """Check health of all servers."""
    healthy_count = 0
    total_count = len(servers)
    issues = []
    
    for server_name, server_config in servers.items():
        is_healthy, error = check_server_health(server_name, server_config)
        if is_healthy:
            healthy_count += 1
        else:
            issues.append(f"{server_name}: {error}")
    
    return healthy_count, total_count, issues

def backup_file(filepath):
    """Create a backup of the file with timestamp."""
    if os.path.exists(filepath):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = f"{filepath}.backup.{timestamp}"
        shutil.copy2(filepath, backup_path)
        print(f"Created backup: {backup_path}")
        return backup_path
    return None

def merge_mcp_servers(source_servers, target_config):
    """Merge MCP servers from source into target configuration, preserving existing API keys."""
    # Initialize mcpServers if it doesn't exist
    if 'mcpServers' not in target_config:
        target_config['mcpServers'] = {}
    
    # Get existing servers
    existing_servers = target_config['mcpServers']
    
    # Merge each server from source
    for server_name, server_config in source_servers.items():
        if server_name in existing_servers:
            print(f"Updating existing server: {server_name}")
            # Preserve existing API keys when merging
            merged_config = merge_server_config_preserve_api_keys(
                source_config=server_config,
                existing_config=existing_servers[server_name]
            )
            existing_servers[server_name] = merged_config
        else:
            print(f"Adding new server: {server_name}")
            existing_servers[server_name] = server_config
    
    return target_config

def merge_server_config_preserve_api_keys(source_config, existing_config):
    """Merge server configs, preserving existing API keys if source has placeholders."""
    import copy
    
    # Start with a deep copy of the source config
    merged_config = copy.deepcopy(source_config)
    
    # If both configs have env sections, merge them intelligently
    if 'env' in source_config and 'env' in existing_config:
        source_env = source_config['env']
        existing_env = existing_config['env']
        
        # For each environment variable in the source
        for env_key, source_value in source_env.items():
            # If the source value is a placeholder and we have a real value in existing config
            if (env_key in existing_env and 
                is_api_key_placeholder(str(source_value)) and 
                not is_api_key_placeholder(str(existing_env[env_key]))):
                
                print(f"    Preserving existing API key for {env_key}")
                merged_config['env'][env_key] = existing_env[env_key]
    
    return merged_config

def push_to_claude_config(mcp_servers_file, claude_config_file, dry_run=False, health_check=False, sync_secrets=False):
    """Push MCP servers from mcp-servers.json to ~/.claude.json"""
    print("\n=== PUSH MODE: mcp-servers.json -> ~/.claude.json ===")
    
    # Load MCP servers configuration
    mcp_config = load_json_file(mcp_servers_file)
    mcp_config = normalize_config_keys(mcp_config)
    
    servers_key = get_mcp_servers_key(mcp_config)
    if not servers_key:
        print("Error: mcp-servers.json must contain 'mcpServers' or 'mcps' key")
        sys.exit(1)
    
    source_servers = mcp_config[servers_key]
    print(f"\nFound {len(source_servers)} MCP servers to push:")
    for server_name in source_servers:
        print(f"  - {server_name}")
    
    # Validate configurations
    print("\n=== VALIDATION ===")
    all_valid, errors = validate_all_servers(source_servers)
    if not all_valid:
        print("[ERROR] Configuration validation failed:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)
    else:
        print(f"[OK] All {len(source_servers)} server configurations are valid")
    
    # Prompt for API keys if needed (not in dry run mode)
    if not dry_run:
        source_servers = prompt_for_api_keys(source_servers, sync_secrets=sync_secrets)
    
    # Apply Windows command wrapping if on Windows
    if is_windows():
        print("\n=== WINDOWS COMPATIBILITY ===")
        print("Wrapping npx/uvx commands with 'cmd /c' for Windows compatibility...")
    source_servers = wrap_servers_for_windows(source_servers)
    
    # Health check if requested
    if health_check:
        print("\n=== HEALTH CHECK ===")
        healthy_count, total_count, issues = health_check_all_servers(source_servers)
        if issues:
            print(f"[WARNING] Health check found {len(issues)} issues:")
            for issue in issues:
                print(f"  • {issue}")
            print(f"\nHealthy servers: {healthy_count}/{total_count}")
            
            if healthy_count == 0:
                print("[ERROR] No servers are healthy. Aborting.")
                sys.exit(1)
        else:
            print(f"[OK] All {total_count} servers passed health check")
    
    # Load existing Claude configuration
    claude_config = load_json_file(claude_config_file)
    current_servers = claude_config.get('mcpServers', {})
    
    # Show diff
    show_diff(current_servers, source_servers, 'push')
    
    if dry_run:
        print("\n[DRY RUN] No changes will be made")
        return
    
    # Create backup if file exists
    if claude_config_file.exists():
        backup_file(claude_config_file)
    
    # Merge configurations
    print("\nMerging configurations...")
    updated_config = merge_mcp_servers(source_servers, claude_config)
    
    # Write updated configuration
    with open(claude_config_file, 'w', encoding='utf-8') as f:
        json.dump(updated_config, f, indent=2)
    
    print(f"\n[OK] Successfully updated {claude_config_file}")
    print(f"Total MCP servers in config: {len(updated_config.get('mcpServers', {}))}")

def pull_from_claude_config(mcp_servers_file, claude_config_file, dry_run=False, health_check=False, sync_secrets=False):
    """Pull MCP servers from ~/.claude.json to mcp-servers.json"""
    print("\n=== PULL MODE: ~/.claude.json -> mcp-servers.json ===")
    
    # Load existing Claude configuration
    claude_config = load_json_file(claude_config_file)
    claude_config = normalize_config_keys(claude_config)
    
    servers_key = get_mcp_servers_key(claude_config)
    if not servers_key or not claude_config.get(servers_key):
        print("No MCP servers found in ~/.claude.json")
        return
    
    claude_servers = claude_config[servers_key]
    print(f"\nFound {len(claude_servers)} MCP servers in ~/.claude.json:")
    for server_name in claude_servers:
        print(f"  - {server_name}")
    
    # Validate configurations
    print("\n=== VALIDATION ===")
    all_valid, errors = validate_all_servers(claude_servers)
    if not all_valid:
        print("[ERROR] Configuration validation failed:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)
    else:
        print(f"[OK] All {len(claude_servers)} server configurations are valid")
    
    # Prompt for API keys if needed (not in dry run mode)
    if not dry_run:
        claude_servers = prompt_for_api_keys(claude_servers, sync_secrets=sync_secrets)
    
    # Health check if requested
    if health_check:
        print("\n=== HEALTH CHECK ===")
        healthy_count, total_count, issues = health_check_all_servers(claude_servers)
        if issues:
            print(f"[WARNING] Health check found {len(issues)} issues:")
            for issue in issues:
                print(f"  • {issue}")
            print(f"\nHealthy servers: {healthy_count}/{total_count}")
            
            if healthy_count == 0:
                print("[ERROR] No servers are healthy. Aborting.")
                sys.exit(1)
        else:
            print(f"[OK] All {total_count} servers passed health check")
    
    # Load existing mcp-servers.json
    mcp_config = load_json_file(mcp_servers_file)
    mcp_config = normalize_config_keys(mcp_config)
    
    # Ensure we have the right key structure
    if 'mcpServers' not in mcp_config:
        mcp_config = {'mcpServers': {}}
    
    current_servers = mcp_config['mcpServers']
    
    # Unwrap Windows commands for portability
    print("\n=== PORTABILITY ===")
    print("Unwrapping Windows 'cmd /c' wrappers for cross-platform compatibility...")
    claude_servers = unwrap_servers_from_windows(claude_servers)
    
    # Extract and save secrets if sync_secrets is enabled
    if sync_secrets and not dry_run:
        print("\n=== EXTRACTING SECRETS ===")
        extracted_secrets = extract_secrets_from_servers(claude_servers)
        if extracted_secrets:
            # Load existing secrets and merge
            existing_secrets = load_secrets_env()
            merged_secrets = dict(existing_secrets)
            for server_name, server_secrets in extracted_secrets.items():
                if server_name not in merged_secrets:
                    merged_secrets[server_name] = {}
                merged_secrets[server_name].update(server_secrets)
            
            save_secrets_env(merged_secrets)
            print(f"Extracted and saved secrets for {len(extracted_secrets)} servers")
        else:
            print("No secrets found to extract")
    
    # Sanitize API keys for security
    print("\n=== SECURITY ===")
    print("Replacing API keys with placeholders for version control safety...")
    claude_servers = sanitize_api_keys(claude_servers)
    
    # Show diff
    show_diff(current_servers, claude_servers, 'pull')
    
    if dry_run:
        print("\n[DRY RUN] No changes will be made")
        return
    
    # Merge servers from Claude config
    new_servers = []
    updated_servers = []
    
    for server_name, server_config in claude_servers.items():
        if server_name in current_servers:
            if current_servers[server_name] != server_config:
                updated_servers.append(server_name)
        else:
            new_servers.append(server_name)
        current_servers[server_name] = server_config
    
    # Create backup if file exists
    if mcp_servers_file.exists():
        backup_file(mcp_servers_file)
    
    # Write updated mcp-servers.json
    with open(mcp_servers_file, 'w', encoding='utf-8') as f:
        json.dump(mcp_config, f, indent=4)
    
    print(f"\n[OK] Successfully updated {mcp_servers_file}")
    if new_servers:
        print(f"Added {len(new_servers)} new servers: {', '.join(new_servers)}")
    if updated_servers:
        print(f"Updated {len(updated_servers)} servers: {', '.join(updated_servers)}")
    print(f"Total MCP servers: {len(current_servers)}")

def main():
    parser = argparse.ArgumentParser(
        description='Sync MCP server configurations between mcp-servers.json and ~/.claude.json',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s              # Default: push from mcp-servers.json to ~/.claude.json
  %(prog)s push         # Push from mcp-servers.json to ~/.claude.json
  %(prog)s pull         # Pull from ~/.claude.json to mcp-servers.json
  %(prog)s --dry-run    # Preview changes without applying them
  %(prog)s --health-check # Check server health before syncing
  %(prog)s --sync-secrets # Load/save API keys from secrets repository
  %(prog)s push --sync-secrets # Push with automatic secrets loading
  %(prog)s pull --sync-secrets # Pull and extract secrets to repository
  %(prog)s pull --dry-run --health-check # Full preview with health check
        ''')
    
    parser.add_argument(
        'mode',
        nargs='?',
        default='push',
        choices=['push', 'pull'],
        help='Sync mode: push (default) or pull'
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be changed without making actual changes'
    )
    
    parser.add_argument(
        '--health-check',
        action='store_true',
        help='Check if configured MCP servers are accessible before syncing'
    )
    
    parser.add_argument(
        '--sync-secrets',
        action='store_true',
        help='Load API keys from secrets repository and save new keys back to secrets'
    )
    
    args = parser.parse_args()
    
    # Define paths
    dotfiles_dir = Path(__file__).parent
    mcp_servers_file = dotfiles_dir / "mcp-servers.json"
    claude_config_file = Path.home() / ".claude.json"
    
    print(f"MCP servers file: {mcp_servers_file}")
    print(f"Claude config file: {claude_config_file}")
    
    if args.mode == 'push':
        push_to_claude_config(mcp_servers_file, claude_config_file, 
                             dry_run=args.dry_run, health_check=args.health_check, sync_secrets=args.sync_secrets)
    else:  # pull
        pull_from_claude_config(mcp_servers_file, claude_config_file, 
                               dry_run=args.dry_run, health_check=args.health_check, sync_secrets=args.sync_secrets)

if __name__ == "__main__":
    main()