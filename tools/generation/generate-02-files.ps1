$scriptParent = Split-Path $PSScriptRoot -Parent
$root = Split-Path $scriptParent -Parent
$root = $root -replace '\\', '/'

$paths = @(
    "api-crud-system-engineering/input-validation-architecture/form-request-customization-points"
    "api-crud-system-engineering/input-validation-architecture/nested-object-validation"
    "api-crud-system-engineering/input-validation-architecture/rate-limiting-strategies"
    "api-crud-system-engineering/input-validation-architecture/real-time-input-validation"
    "api-crud-system-engineering/input-validation-architecture/request-lifecycle-integration"
    "api-crud-system-engineering/input-validation-architecture/validation-error-format-return-messages"
    "api-crud-system-engineering/input-validation-architecture/validation-rule-inheritance"
    "api-crud-system-engineering/input-validation-architecture/validation-skip-on-edit"
    "api-crud-system-engineering/input-validation-architecture/validation-skip-on-null-update"
    "data-storage-systems/replication/7-7-lag-aware-read-routing"
    "data-storage-systems/replication/7-8-replica-promotion-failover"
    "data-storage-systems/replication/7-9-automatic-failover"
    "data-storage-systems/replication/7-10-multi-master-replication"
    "data-storage-systems/replication/7-11-conflict-resolution"
    "data-storage-systems/replication/7-12-multi-region-replication"
    "data-storage-systems/replication/7-13-plan-replication-topology"
    "data-storage-systems/replication/7-14-gtid-based-replication"
    "data-storage-systems/replication/7-15-mariadb-mysql-differences"
    "data-storage-systems/replication/7-16-multi-source-replication"
    "data-storage-systems/replication/7-17-replication-backups-strategy"
    "data-storage-systems/replication/7-18-replication-throttling"
    "data-storage-systems/replication/7-19-replication-security"
    "data-storage-systems/replication/7-20-peer-to-peer-replication"
    "laravel-eloquent-domain-modeling/attributes-and-casting/date-casting"
    "laravel-eloquent-domain-modeling/attributes-and-casting/enum-casting"
    "laravel-eloquent-domain-modeling/attributes-and-casting/immutable-casting"
    "laravel-eloquent-domain-modeling/attributes-and-casting/json-casting"
    "laravel-eloquent-domain-modeling/attributes-and-casting/legacy-accessor-mutators"
    "laravel-eloquent-domain-modeling/attributes-and-casting/migration-to-attribute-make"
    "laravel-eloquent-domain-modeling/attributes-and-casting/primitive-casting"
    "laravel-eloquent-domain-modeling/attributes-and-casting/typed-attribute-accessors-with-dto"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/aggregate-boundary-design"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/command-handler-patterns"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/domain-event-patterns"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/domain-service-patterns"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/entity-vs-value-object"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/factory-method-alternatives"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/state-machine-patterns"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/strategy-pattern-in-domain"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/temporal-modeling"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/transaction-script-refactoring"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/transatlantic-specifications"
    "laravel-eloquent-domain-modeling/domain-modeling-patterns/ubiquitous-language-mapping"
)

Write-Host "Generating 02-knowledge-unit.md for 43 non-canonical KUs..."

foreach ($relPath in $paths) {
    $kuDir = "$root/knowledge/$relPath"
    $kuName = Split-Path $relPath -Leaf
    $subdomain = (Split-Path (Split-Path $relPath -Parent) -Leaf)
    $domain = (Split-Path $relPath -Parent | Split-Path -Parent | Split-Path -Leaf)
    
    $fourFile = "$kuDir/04-standardized-knowledge.md"
    if (-not (Test-Path $fourFile)) {
        Write-Host "SKIP: $relPath (no 04 file)"
        continue
    }
    
    $content = Get-Content $fourFile -TotalCount 50 -ErrorAction SilentlyContinue
    
    # Extract title from H1
    $title = ""
    foreach ($line in $content) {
        if ($line -match '^#\s+(.+?)(\s*[–—-]\s*Standardized Knowledge)?\s*$') {
            $title = $matches[1].Trim()
            break
        }
    }
    if (-not $title) { $title = (Get-Culture).TextInfo.ToTitleCase($kuName -replace '-', ' ') }
    
    # Extract overview/summary (first paragraph after Overview heading)
    $inOverview = $false
    $overview = ""
    foreach ($line in $content) {
        if ($line -match '^##\s*Overview') { $inOverview = $true; continue }
        if ($inOverview -and $line -match '^##\s') { break }
        if ($inOverview -and $line.Trim() -ne "") { $overview += $line.Trim() + " " }
    }
    if (-not $overview) {
        # Fallback: use the first substantive paragraph
        foreach ($line in $content) {
            if ($line.Trim() -ne "" -and -not $line.StartsWith("#") -and -not $line.StartsWith("|")) {
                $overview += $line.Trim() + " "
                if ($overview.Length -gt 300) { break }
            }
        }
    }
    
    # Generate slug
    $slug = $title.ToLower() -replace '[^\w\s-]', '' -replace '\s+', '-'
    $slug = $slug -replace '-+', '-' -replace '^-|-$', ''
    
    $domainName = (Get-Culture).TextInfo.ToTitleCase($domain -replace '-', ' ')
    $subdomainName = (Get-Culture).TextInfo.ToTitleCase($subdomain -replace '-', ' ')
    $readableKU = $title
    # Remove trailing dash if any
    $readableKU = $readableKU.TrimEnd(' -')
    
    $id = "$domain/$subdomain/$kuName"
    
    $kuIdSlug = "ku-$($kuName)"
    
    $twoFile = @"
# Knowledge Unit: $readableKU

## Metadata

- **ID:** $id
- **Domain:** $domainName
- **Subdomain:** $subdomainName
- **Slug:** $slug
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

$overview

"@
    
    Set-Content -Path "$kuDir/02-knowledge-unit.md" -Value $twoFile
    Write-Host "CREATED: $relPath/02-knowledge-unit.md"
}

Write-Host "`nDone. 43 02-knowledge-unit.md files created."
