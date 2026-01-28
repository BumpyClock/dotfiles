#!/usr/bin/env bash

# Default source path (dotfiles root .github)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTFILES_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SOURCE_PATH="${SOURCE_PATH:-$DOTFILES_ROOT/.github}"

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

# No need to check if .github exists - we'll merge or create as needed

# Ask user preference
echo -e "\n\033[32mHow would you like to add .github to the project?\033[0m"
echo "1. Create a symbolic link (recommended - stays in sync)"
echo "2. Copy the files (independent copy)"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        echo -e "\n\033[33mCreating symbolic links for .github contents...\033[0m"
        # Create .github directory if it doesn't exist
        mkdir -p "$TARGET_GITHUB_PATH"
        
        # Create symlinks for each item in the source .github folder
        for item in "$SOURCE_PATH"/*; do
            if [ -e "$item" ]; then
                basename=$(basename "$item")
                target_item="$TARGET_GITHUB_PATH/$basename"
                
                # Remove existing item if it exists
                if [ -e "$target_item" ]; then
                    rm -rf "$target_item"
                fi
                
                if ln -s "$item" "$target_item"; then
                    echo -e "\033[32m  ✓ Linked $basename\033[0m"
                else
                    echo -e "\033[31m  ✗ Failed to link $basename\033[0m"
                    exit 1
                fi
            fi
        done
        echo -e "\033[32mSuccessfully created symbolic links!\033[0m"
        echo -e "\033[36mChanges to source .github contents will automatically reflect in the target.\033[0m"
        ;;
    2)
        echo -e "\n\033[33mCopying files...\033[0m"
        if mkdir -p "$TARGET_GITHUB_PATH" && cp -r "$SOURCE_PATH"/* "$TARGET_GITHUB_PATH/"; then
            echo -e "\033[32mSuccessfully copied .github folder contents!\033[0m"
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