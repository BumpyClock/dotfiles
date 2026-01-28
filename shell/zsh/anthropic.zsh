#!/usr/bin/env zsh
# ABOUTME: Zsh environment setup for Anthropic API credentials
# ABOUTME: Loads Anthropic API configuration from secrets submodule for zsh users

# Determine the directory where this script is located
SCRIPT_DIR="${0%/*}"

# Source Anthropic credentials from secrets submodule
# Adjust path relative to shell/zsh directory
SECRETS_DIR="$(cd "$SCRIPT_DIR/../../secrets" && pwd)"

if [ -f "$SECRETS_DIR/anthropic.sh" ]; then
    source "$SECRETS_DIR/anthropic.sh"
else
    echo "Warning: Anthropic credentials file not found at $SECRETS_DIR/anthropic.sh"
fi
