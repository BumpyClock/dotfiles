#!/usr/bin/env pwsh

param(
    [Parameter(Mandatory=$true)]
    [string]$TargetPath,
    
    [Parameter(Mandatory=$false)]
    [string]$SourcePath = "$PSScriptRoot\.github"
)

# Resolve paths
$SourcePath = Resolve-Path $SourcePath -ErrorAction Stop
$TargetPath = Resolve-Path $TargetPath -ErrorAction Stop
$TargetGithubPath = Join-Path $TargetPath ".github"

Write-Host "Source: $SourcePath" -ForegroundColor Cyan
Write-Host "Target: $TargetGithubPath" -ForegroundColor Cyan

# No need to check if .github exists - we'll merge or create as needed

# Ask user preference
Write-Host "`nHow would you like to add .github to the project?" -ForegroundColor Green
Write-Host "1. Create a symbolic link (recommended - stays in sync)"
Write-Host "2. Copy the files (independent copy)"
$choice = Read-Host "Enter your choice (1 or 2)"

switch ($choice) {
    "1" {
        Write-Host "`nCreating symbolic links for .github contents..." -ForegroundColor Yellow
        try {
            # Create .github directory if it doesn't exist
            New-Item -ItemType Directory -Path $TargetGithubPath -Force | Out-Null
            
            # Create symlinks for each item in the source .github folder
            $items = Get-ChildItem -Path $SourcePath
            foreach ($item in $items) {
                $targetItem = Join-Path $TargetGithubPath $item.Name
                
                # Remove existing item if it exists
                if (Test-Path $targetItem) {
                    Remove-Item $targetItem -Recurse -Force
                }
                
                # Create symlink (requires admin rights on Windows)
                New-Item -ItemType SymbolicLink -Path $targetItem -Target $item.FullName -Force | Out-Null
                Write-Host "  ✓ Linked $($item.Name)" -ForegroundColor Green
            }
            Write-Host "Successfully created symbolic links!" -ForegroundColor Green
            Write-Host "Changes to source .github contents will automatically reflect in the target." -ForegroundColor Cyan
        }
        catch {
            Write-Host "Failed to create symbolic links. This requires administrator privileges." -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
            Write-Host "`nTip: Run PowerShell as Administrator or use option 2 to copy files instead." -ForegroundColor Yellow
        }
    }
    "2" {
        Write-Host "`nCopying files..." -ForegroundColor Yellow
        try {
            New-Item -ItemType Directory -Path $TargetGithubPath -Force | Out-Null
            Copy-Item -Path "$SourcePath\*" -Destination $TargetGithubPath -Recurse -Force
            Write-Host "Successfully copied .github folder contents!" -ForegroundColor Green
            Write-Host "Note: This is an independent copy. Changes won't sync automatically." -ForegroundColor Cyan
        }
        catch {
            Write-Host "Failed to copy files." -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
        }
    }
    default {
        Write-Host "Invalid choice. Please run the script again and choose 1 or 2." -ForegroundColor Red
        exit 1
    }
}