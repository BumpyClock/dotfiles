#!/usr/bin/env bash

# Default source path (same directory as script)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_PATH="${SOURCE_PATH:-$SCRIPT_DIR/.github}"

# Check if target path is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <target-project-path>"
    echo "Example: $0 /path/to/my-project"
    exit 1
fi

TARGET_PATH="$1"
TARGET_GITHUB_PATH="$TARGET_PATH/.github"

# Resolve paths
SOURCE_PATH="$(realpath "$SOURCE_PATH" 2>/dev/null)" || { echo "Error: Source path not found"; exit 1; }
TARGET_PATH="$(realpath "$TARGET_PATH" 2>/dev/null)" || { echo "Error: Target path not found"; exit 1; }

echo -e "\033[36mSource: $SOURCE_PATH\033[0m"
echo -e "\033[36mTarget: $TARGET_GITHUB_PATH\033[0m"

# Check if .github already exists in target
if [ -e "$TARGET_GITHUB_PATH" ]; then
    echo -e "\033[33m.github folder already exists at target location!\033[0m"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "\033[31mOperation cancelled.\033[0m"
        exit 0
    fi
    rm -rf "$TARGET_GITHUB_PATH"
fi

# Ask user preference
echo -e "\n\033[32mHow would you like to add .github to the project?\033[0m"
echo "1. Create a symbolic link (recommended - stays in sync)"
echo "2. Copy the files (independent copy)"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo -e "\n\033[33mCreating symbolic link...\033[0m"
        if ln -s "$SOURCE_PATH" "$TARGET_GITHUB_PATH"; then
            echo -e "\033[32mSuccessfully created symbolic link!\033[0m"
            echo -e "\033[36mChanges to source .github folder will automatically reflect in the target.\033[0m"
        else
            echo -e "\033[31mFailed to create symbolic link.\033[0m"
            exit 1
        fi
        ;;
    2)
        echo -e "\n\033[33mCopying files...\033[0m"
        if cp -r "$SOURCE_PATH" "$TARGET_GITHUB_PATH"; then
            echo -e "\033[32mSuccessfully copied .github folder!\033[0m"
            echo -e "\033[36mNote: This is an independent copy. Changes won't sync automatically.\033[0m"
        else
            echo -e "\033[31mFailed to copy files.\033[0m"
            exit 1
        fi
        ;;
    *)
        echo -e "\033[31mInvalid choice. Please run the script again and choose 1 or 2.\033[0m"
        exit 1
        ;;
esac