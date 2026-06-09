#!/usr/bin/env pwsh
# update.ps1 — Laravel ECC Updater for Windows
#
# Usage:
#   .\update.ps1                           # Update everything (same profile as install)
#   .\update.ps1 --dry-run                 # Preview changes without applying
#   .\update.ps1 --version                 # Show current and latest versions
#
# This script updates your Laravel ECC installation to the latest
# version. It preserves your installation profile (minimal/core/full)
# and syncs all components: skills, rules, agents, hooks, MCP configs.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $PSCommandPath

function Write-Status   { param([string]$Message, [string]$Color = 'Green')  Write-Host "[Laravel ECC] $Message" -ForegroundColor $Color }
function Write-Warn     { param([string]$Message)                             Write-Host "[Laravel ECC] WARNING: $Message" -ForegroundColor Yellow }
function Write-Error    { param([string]$Message)                             Write-Host "[Laravel ECC] ERROR: $Message" -ForegroundColor Red }

# Resolve target project directory (current directory or specified)
$targetDir = Get-Location
$stateFile = Join-Path -Path $targetDir -ChildPath '.laravel-ecc-state.json'
$dryRun = $false
$showVersion = $false

foreach ($arg in $args) {
    switch ($arg) {
        '--dry-run'  { $dryRun = $true }
        '--version'  { $showVersion = $true }
        '--help'     { Get-Content -Path $PSCommandPath -TotalCount 12; exit 0 }
    }
}

# Check installation state
if (-not (Test-Path $stateFile)) {
    Write-Error "No installation found in $targetDir"
    Write-Status "Run .\install.ps1 first, or use npx laravel-ecc install" -Color Yellow
    exit 1
}

$state = Get-Content $stateFile | ConvertFrom-Json
$localVersion = $state.version

# Read current package version
$pkgFile = Join-Path -Path $scriptDir -ChildPath 'package.json'
$pkg = Get-Content $pkgFile | ConvertFrom-Json
$newVersion = $pkg.version

if ($showVersion) {
    Write-Status "Installed version: $localVersion"
    Write-Status "Latest package version: $newVersion"
    if ($localVersion -ne $newVersion) {
        Write-Status "Update available: $localVersion -> $newVersion" -Color Yellow
    } else {
        Write-Status "Already at latest version!"
    }
    exit 0
}

Write-Status "Laravel ECC Updater v$newVersion"
Write-Status "Target: $targetDir"
Write-Status "Installed: v$localVersion"
Write-Status "Latest:    v$newVersion"

if ($dryRun) {
    Write-Status "DRY RUN — no changes will be made" -Color Yellow
}

# Collect files to update
$updatePlan = @()

# Skills
$srcSkillsDir = Join-Path -Path $scriptDir -ChildPath 'skills'
$skillsDir = Join-Path -Path $targetDir -ChildPath 'skills'
if (Test-Path $srcSkillsDir) {
    Get-ChildItem -Path $srcSkillsDir -Directory | ForEach-Object {
        $updatePlan += [PSCustomObject]@{
            Type = 'skill'
            Name = $_.Name
            Source = $_.FullName
            Dest = (Join-Path $skillsDir $_.Name)
        }
    }
}

# Rules
$srcRulesDir = Join-Path -Path $scriptDir -ChildPath 'rules'
$rulesDir = Join-Path -Path $targetDir -ChildPath 'rules'
if (Test-Path $srcRulesDir) {
    foreach ($lang in @('common', 'php', 'web', 'laravel')) {
        $srcLang = Join-Path $srcRulesDir $lang
        if (Test-Path $srcLang) {
            $updatePlan += [PSCustomObject]@{
                Type = 'rules'
                Name = $lang
                Source = $srcLang
                Dest = (Join-Path $rulesDir $lang)
            }
        }
    }
}

# Agents
$srcAgentsDir = Join-Path -Path $scriptDir -ChildPath 'agents'
$agentsDir = Join-Path -Path $targetDir -ChildPath 'agents'
if (Test-Path $srcAgentsDir) {
    Get-ChildItem -Path $srcAgentsDir -Filter '*.md' | ForEach-Object {
        $updatePlan += [PSCustomObject]@{
            Type = 'agent'
            Name = $_.Name
            Source = $_.FullName
            Dest = (Join-Path $agentsDir $_.Name)
        }
    }
}

# Hooks
$srcHooksDir = Join-Path -Path $scriptDir -ChildPath 'hooks'
$hooksDir = Join-Path -Path $targetDir -ChildPath 'hooks'
if (Test-Path $srcHooksDir) {
    $updatePlan += [PSCustomObject]@{
        Type = 'hooks'
        Name = 'hooks'
        Source = $srcHooksDir
        Dest = $hooksDir
    }
}

# MCP configs
$srcMcpDir = Join-Path -Path $scriptDir -ChildPath 'mcp-configs'
$mcpDir = Join-Path -Path $targetDir -ChildPath 'mcp-configs'
if (Test-Path $srcMcpDir) {
    $updatePlan += [PSCustomObject]@{
        Type = 'mcp-configs'
        Name = 'mcp-configs'
        Source = $srcMcpDir
        Dest = $mcpDir
    }
}

# Commands (only if profile was full)
if ($state.profile -eq 'full') {
    $srcCmdDir = Join-Path -Path $scriptDir -ChildPath 'commands'
    $cmdDir = Join-Path -Path $targetDir -ChildPath 'commands'
    if (Test-Path $srcCmdDir) {
        $updatePlan += [PSCustomObject]@{
            Type = 'commands'
            Name = 'commands'
            Source = $srcCmdDir
            Dest = $cmdDir
        }
    }
}

# Harness configs (only if profile was full)
if ($state.profile -eq 'full') {
    $harnessDirs = @(
        '.opencode', '.claude', '.cursor', '.gemini', '.codex',
        '.vscode', '.zed', '.trae', '.qwen', '.codebuddy', '.kiro', '.github'
    )
    foreach ($dir in $harnessDirs) {
        $srcDir = Join-Path $scriptDir $dir
        if (Test-Path $srcDir) {
            $updatePlan += [PSCustomObject]@{
                Type = 'config'
                Name = $dir
                Source = $srcDir
                Dest = (Join-Path $targetDir $dir)
            }
        }
    }
}

# Print plan
Write-Status "Update plan: $($updatePlan.Count) items"
$typeCounts = $updatePlan | Group-Object Type | ForEach-Object { "$($_.Count) $($_.Name)" }
Write-Status ($typeCounts -join ', ')

if ($dryRun) {
    Write-Status "Dry run complete. Run without --dry-run to apply." -Color Yellow
    exit 0
}

if ($localVersion -eq $newVersion -and -not $dryRun) {
    Write-Status "Already at latest version v$newVersion. No update needed."
    exit 0
}

# Apply updates
$updated = 0
foreach ($item in $updatePlan) {
    $destParent = Split-Path -Parent $item.Dest -ErrorAction SilentlyContinue
    if ($destParent) {
        New-Item -ItemType Directory -Path $destParent -Force | Out-Null
    }
    New-Item -ItemType Directory -Path $item.Dest -Force | Out-Null

    if (Test-Path -Path $item.Source -PathType Container) {
        Copy-Item -Path $item.Source\* -Destination $item.Dest -Recurse -Force
    } else {
        Copy-Item -Path $item.Source -Destination $item.Dest -Force
    }
    $updated++
}

# Update state file
$state | Add-Member -MemberType NoteProperty -Name 'version' -Value $newVersion -Force
$state | Add-Member -MemberType NoteProperty -Name 'updated_at' -Value (Get-Date).ToString('o') -Force
$state | ConvertTo-Json | Set-Content -Path $stateFile

Write-Status "Update complete!"
Write-Status "$updated items updated: $localVersion -> $newVersion" -Color Cyan
Write-Status "Run .\install.ps1 doctor to verify."
