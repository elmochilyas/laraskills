#!/usr/bin/env pwsh
# install.ps1 — Laravel ECC Installer for Windows
#
# Usage:
#   .\install.ps1                           # Install core profile (skills + rules + agents)
#   .\install.ps1 --profile minimal         # Installed only the 3 Laravel skills
#   .\install.ps1 --profile full            # Install everything
#   .\install.ps1 add laravel-patterns      # Add a specific component
#   .\install.ps1 doctor                    # Check installation state
#
# Also available:
#   npx skills add affaan-m/ECC             # Install via Vercel Skills CLI
#   npx @agentskill.sh/cli@latest setup     # Install via agentskill.sh
#   npx laravel-ecc add laravel-patterns    # Install via Laravel ECC CLI

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $PSCommandPath

function Write-Status {
    param([string]$Message, [string]$Color = 'Green')
    Write-Host "[Laravel ECC] $Message" -ForegroundColor $Color
}

function Write-Error {
    param([string]$Message)
    Write-Host "[Laravel ECC] ERROR: $Message" -ForegroundColor Red
}

# Resolve target project directory (current directory or specified)
$targetDir = Get-Location

# Default profile
$profile = 'core'
if ($args.Count -gt 0) {
    switch ($args[0]) {
        '--profile' { $profile = $args[1]; break }
        'add' { $component = $args[1]; break }
        'doctor' { $doctor = $true; break }
        default { Write-Error "Unknown argument: $($args[0])"; exit 1 }
    }
}

# State file
$stateFile = Join-Path -Path $targetDir -ChildPath '.laravel-ecc-state.json'

# Detect AI tool directories
$detectedTools = @()
if (Test-Path (Join-Path $targetDir '.opencode')) { $detectedTools += 'opencode' }
if (Test-Path (Join-Path $targetDir '.claude')) { $detectedTools += 'claude' }
if (Test-Path (Join-Path $targetDir '.cursor')) { $detectedTools += 'cursor' }
if (Test-Path (Join-Path $targetDir '.gemini')) { $detectedTools += 'gemini' }
if (Test-Path (Join-Path $targetDir '.codex')) { $detectedTools += 'codex' }

Write-Status "Laravel ECC v1.0.0-beta.12"
Write-Status "Target: $targetDir"
Write-Status "Profile: $profile"
Write-Status "Detected tools: $($detectedTools -join ', ')"

# Handle doctor command
if ($doctor) {
    if (Test-Path $stateFile) {
        $state = Get-Content $stateFile | ConvertFrom-Json
        Write-Status "Installation state:"
        $state.psobject.Properties | ForEach-Object {
            Write-Host "  $($_.Name): $($_.Value)"
        }
    } else {
        Write-Status "Not installed. Run install.ps1 to install." -Color Yellow
    }
    exit 0
}

# Handle add component
if ($component) {
    $validComponents = @('laravel-patterns', 'laravel-tdd', 'laravel-security', 'laravel-core-internals', 'laravel-eloquent', 'laravel-database',
                         'laravel-artisan', 'laravel-migration', 'laravel-container')

    if ($component -notin $validComponents) {
        Write-Error "Unknown component: $component. Valid: $($validComponents -join ', ')"
        exit 1
    }

    $srcSkillsDir = Join-Path $scriptDir 'skills'
    $srcAgentsDir = Join-Path $scriptDir 'agents'

    if (Test-Path (Join-Path $srcSkillsDir $component)) {
        $destDir = Join-Path $targetDir 'skills' $component
        if (-not (Test-Path (Join-Path $targetDir 'skills'))) {
            New-Item -ItemType Directory -Path (Join-Path $targetDir 'skills') -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $srcSkillsDir $component) -Destination $destDir -Recurse -Force
        Write-Status "Added component: $component"
    }
    elseif (Test-Path (Join-Path $srcAgentsDir ($component + '.md'))) {
        $destDir = Join-Path $targetDir 'agents'
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $srcAgentsDir ($component + '.md')) -Destination (Join-Path $destDir ($component + '.md')) -Force
        Write-Status "Added component: $component"
    }
    else {
        Write-Error "Component not found: $component"
        exit 1
    }

    exit 0
}

# Full installation based on profile
Write-Status "Installing Laravel ECC..."

# Create skills directory
$skillsDir = Join-Path $targetDir 'skills'
$rulesDir = Join-Path $targetDir 'rules'
$agentsDir = Join-Path $targetDir 'agents'

# Copy 6 core skills
New-Item -ItemType Directory -Path $skillsDir -Force | Out-Null
$srcSkillsDir = Join-Path $scriptDir 'skills'
foreach ($skill in @('laravel-patterns', 'laravel-tdd', 'laravel-security', 'laravel-core-internals', 'laravel-eloquent', 'laravel-database')) {
    Copy-Item -Path (Join-Path $srcSkillsDir $skill) -Destination (Join-Path $skillsDir $skill) -Recurse -Force
    Write-Status "  ✓ Installed skill: $skill"
}

# Copy rules
New-Item -ItemType Directory -Path $rulesDir -Force | Out-Null
$srcRulesDir = Join-Path $scriptDir 'rules'
foreach ($lang in @('common', 'php', 'web', 'laravel')) {
    Copy-Item -Path (Join-Path $srcRulesDir $lang) -Destination (Join-Path $rulesDir $lang) -Recurse -Force
    Write-Status "  ✓ Installed rules: $lang"
}

# Copy agents (core profile includes the 5 Laravel agents)
New-Item -ItemType Directory -Path $agentsDir -Force | Out-Null
$srcAgentsDir = Join-Path $scriptDir 'agents'
foreach ($agent in @('laravel-artisan.md', 'laravel-eloquent.md', 'laravel-migration.md', 'laravel-database.md', 'laravel-container.md')) {
    Copy-Item -Path (Join-Path $srcAgentsDir $agent) -Destination (Join-Path $agentsDir $agent) -Force
}

if ($profile -eq 'full') {
    # Full profile: ecc-clone agents (optional, requires cloned repository)
    # NOTE: ..\ecc-clone\agents references a non-existent sibling directory — this silently fails unless
    # the full ECC repository is cloned alongside laravel-ecc. Consider removing this dead branch.
    $eccAgentsDir = Join-Path $scriptDir '..\ecc-clone\agents'
    if (Test-Path $eccAgentsDir) {
        Get-ChildItem -Path $eccAgentsDir -Filter '*.md' | ForEach-Object {
            Copy-Item -Path $_.FullName -Destination (Join-Path $agentsDir $_.Name) -Force
        }
        Write-Status "  ✓ Installed all ECC agents"
    }

    # Copy commands
    $commandsDir = Join-Path $targetDir 'commands'
    New-Item -ItemType Directory -Path $commandsDir -Force | Out-Null
    $srcCommandsDir = Join-Path $scriptDir 'commands'
    Get-ChildItem -Path $srcCommandsDir -Filter '*.md' | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination (Join-Path $commandsDir $_.Name) -Force
    }
    Write-Status "  ✓ Installed commands"
}

# Save state
$state = @{
    version = '1.0.0-beta.12'
    target = $targetDir
    installed_at = (Get-Date).ToString('o')
    profile = $profile
    tools = $detectedTools
    components = @('laravel-patterns', 'laravel-tdd', 'laravel-security', 'laravel-core-internals', 'laravel-eloquent', 'laravel-database', 'rules')
} | ConvertTo-Json

Set-Content -Path $stateFile -Value $state

Write-Status "Installation complete!" -Color Cyan
Write-Status "Profile: $profile"
Write-Status "State saved to: $stateFile"

if ($detectedTools.Count -eq 0) {
    Write-Status "Tip: Copy .opencode/ or .cursor/ configs from the laravel-ecc package to your project root." -Color Yellow
}
