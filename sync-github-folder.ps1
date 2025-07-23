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

# Check if .github already exists in target
if (Test-Path $TargetGithubPath) {
    Write-Host ".github folder already exists at target location!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne 'y') {
        Write-Host "Operation cancelled." -ForegroundColor Red
        exit 0
    }
    Remove-Item $TargetGithubPath -Recurse -Force
}

# Ask user preference
Write-Host "`nHow would you like to add .github to the project?" -ForegroundColor Green
Write-Host "1. Create a symbolic link (recommended - stays in sync)"
Write-Host "2. Copy the files (independent copy)"
$choice = Read-Host "Enter your choice (1 or 2)"

switch ($choice) {
    "1" {
        Write-Host "`nCreating symbolic link..." -ForegroundColor Yellow
        try {
            # Create symlink (requires admin rights on Windows)
            New-Item -ItemType SymbolicLink -Path $TargetGithubPath -Target $SourcePath -Force | Out-Null
            Write-Host "Successfully created symbolic link!" -ForegroundColor Green
            Write-Host "Changes to source .github folder will automatically reflect in the target." -ForegroundColor Cyan
        }
        catch {
            Write-Host "Failed to create symbolic link. This requires administrator privileges." -ForegroundColor Red
            Write-Host "Error: $_" -ForegroundColor Red
            Write-Host "`nTip: Run PowerShell as Administrator or use option 2 to copy files instead." -ForegroundColor Yellow
        }
    }
    "2" {
        Write-Host "`nCopying files..." -ForegroundColor Yellow
        try {
            Copy-Item -Path $SourcePath -Destination $TargetGithubPath -Recurse -Force
            Write-Host "Successfully copied .github folder!" -ForegroundColor Green
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