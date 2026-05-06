# ABOUTME: Bisection script to find which test creates unwanted files/state
# ABOUTME: Runs tests one by one and reports the first that creates the target path
# Usage: ./find-polluter.ps1 <file_or_dir_to_check> <test_pattern>
# Example: ./find-polluter.ps1 '.git' 'src/**/*.test.ts'

$ErrorActionPreference = "Stop"

if ($args.Count -ne 2) {
    Write-Host "Usage: $($MyInvocation.MyCommand.Name) <file_to_check> <test_pattern>"
    Write-Host "Example: $($MyInvocation.MyCommand.Name) '.git' 'src/**/*.test.ts'"
    exit 1
}

$pollutionCheck = $args[0]
$testPattern = $args[1]

Write-Host "🔍 Searching for test that creates: $pollutionCheck"
Write-Host "Test pattern: $testPattern"
Write-Host ""

# Get list of test files
$rootPath = (Resolve-Path .).ProviderPath
$normalizedPattern = $testPattern -replace '\\', '/'
$testFiles = @(
    Get-ChildItem -Path . -Recurse -File -Force | Where-Object {
        $relativePath = $_.FullName.Substring($rootPath.Length).TrimStart('\', '/')
        $relativePath = $relativePath -replace '\\', '/'
        $relativeWithDot = "./$relativePath"
        ($relativePath -clike $normalizedPattern) -or ($relativeWithDot -clike $normalizedPattern)
    } | Sort-Object FullName
)
$total = $testFiles.Count

Write-Host "Found $total test files"
Write-Host ""

$count = 0
foreach ($testFile in $testFiles) {
    $count++

    # Skip if pollution already exists
    if (Test-Path -LiteralPath $pollutionCheck) {
        Write-Host "⚠️  Pollution already exists before test $count/$total"
        Write-Host "   Skipping: $($testFile.FullName)"
        continue
    }

    Write-Host "[$count/$total] Testing: $($testFile.FullName)"

    # Run the test
    try {
        & npm test $testFile.FullName *> $null
    } catch {
        # Continue even if test fails
    }

    # Check if pollution appeared
    if (Test-Path -LiteralPath $pollutionCheck) {
        Write-Host ""
        Write-Host "🎯 FOUND POLLUTER!"
        Write-Host "   Test: $($testFile.FullName)"
        Write-Host "   Created: $pollutionCheck"
        Write-Host ""
        Write-Host "Pollution details:"
        Get-ChildItem -LiteralPath $pollutionCheck -Force | Format-Table
        Write-Host ""
        Write-Host "To investigate:"
        Write-Host "  npm test $($testFile.FullName)    # Run just this test"
        Write-Host "  cat $($testFile.FullName)        # Review test code"
        exit 1
    }
}

Write-Host ""
Write-Host "✅ No polluter found - all tests clean!"
exit 0
