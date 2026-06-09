param(
    [string]$KnowledgeRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\knowledge")).Path,
    [string]$IntelligenceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\intelligence")).Path
)

function Write-Utf8File {
    param([string]$Path, [string]$Value)
    [System.IO.File]::WriteAllText($Path, $Value, (New-Object System.Text.UTF8Encoding $false))
}

$startTime = Get-Date

# -----------------------------------------------
# Helper: convert kebab-case to Display Name
# -----------------------------------------------
function ConvertTo-DisplayName {
    param([string]$slug)
    $known = @{
        "ai-intelligence-systems"              = "AI Intelligence Systems"
        "api-crud-system-engineering"          = "API & CRUD System Engineering"
        "api-integration-engineering"          = "API Integration Engineering"
        "application-architecture-patterns"    = "Application Architecture Patterns"
        "async-distributed-systems"            = "Async & Distributed Systems"
        "backend-architecture-design"          = "Backend Architecture Design"
        "cost-resource-optimization"           = "Cost & Resource Optimization"
        "data-engineering-analytics"           = "Data Engineering & Analytics"
        "data-storage-systems"                 = "Data Storage Systems"
        "devops-infrastructure"                = "DevOps & Infrastructure"
        "governance-compliance-engineering"    = "Governance & Compliance Engineering"
        "laravel-core-application-engineering" = "Laravel Core Application Engineering"
        "laravel-eloquent-domain-modeling"     = "Laravel Eloquent Domain Modeling"
        "laravel-execution-lifecycle"          = "Laravel Execution Lifecycle"
        "observability-production-intelligence" = "Observability & Production Intelligence"
        "performance-runtime-engineering"      = "Performance & Runtime Engineering"
        "platform-engineering-developer-experience" = "Platform Engineering & Developer Experience"
        "real-time-systems"                    = "Real-Time Systems"
        "search-retrieval-systems"             = "Search & Retrieval Systems"
        "security-identity-engineering"        = "Security & Identity Engineering"
        "testing-reliability-engineering"      = "Testing & Reliability Engineering"
    }
    if ($known.ContainsKey($slug)) { return $known[$slug] }
    # Generic kebab-to-title conversion (PS 5.1 compatible - no scriptblock in -replace)
    $spaced = $slug -replace '-', ' '
    return [regex]::Replace($spaced, '\b\w', { param($m) $m.Value.ToUpper() })
}

# -----------------------------------------------
# Step 1: Walk knowledge tree, collect all KUs
# -----------------------------------------------
Write-Host "Walking knowledge tree for KU directories..." -ForegroundColor Cyan
$kuDirs = Get-ChildItem -Path $KnowledgeRoot -Recurse -Directory | Where-Object { Test-Path (Join-Path $_.FullName "02-knowledge-unit.md") } | Sort-Object FullName
Write-Host "Found $($kuDirs.Count) KUs" -ForegroundColor Green

$kuData = @()
$totalKUs = $kuDirs.Count

$i = 0
foreach ($dir in $kuDirs) {
    $i++
    if ($i % 100 -eq 0) { Write-Host "  Processing KU $i / $totalKUs..." -ForegroundColor DarkGray }

    $relPath = $dir.FullName.Substring($KnowledgeRoot.Length + 1)
    $parts = $relPath -split '\\'

    $domain = $parts[0]
    $subdomain = $parts[1]
    $kuName = $parts[2]

    $dir04 = Join-Path $dir.FullName "04-standardized-knowledge.md"
    $dir05 = Join-Path $dir.FullName "05-rules.md"
    $dir06 = Join-Path $dir.FullName "06-skills.md"
    $dir07 = Join-Path $dir.FullName "07-decision-trees.md"
    $dir08 = Join-Path $dir.FullName "08-anti-patterns.md"
    $dir09 = Join-Path $dir.FullName "09-checklists.md"

    $obj = [PSCustomObject]@{
        domain            = $domain
        subdomain         = $subdomain
        ku_name           = $kuName
        ku_path           = "knowledge/$domain/$subdomain/$kuName"
        has_rules         = (Test-Path $dir05)
        has_skills        = (Test-Path $dir06)
        has_decision_trees = (Test-Path $dir07)
        has_anti_patterns  = (Test-Path $dir08)
        has_checklists    = (Test-Path $dir09)
        has_knowledge     = (Test-Path $dir04)
    }
    $kuData += $obj
}

Write-Host "KU data collection complete." -ForegroundColor Green

# -----------------------------------------------
# Step 2: Build domain/subdomain groupings
# -----------------------------------------------
$domainGroups = $kuData | Group-Object domain
$domainList = $domainGroups | ForEach-Object { $_.Name } | Sort-Object
$domainCount = $domainList.Count

$domainDisplayMap = @{}
foreach ($d in $domainList) {
    $domainDisplayMap[$d] = ConvertTo-DisplayName $d
}

# For each domain, group by subdomain
$domainSubdomainMap = @{}
foreach ($d in $domainList) {
    $sgs = $kuData | Where-Object { $_.domain -eq $d } | Group-Object subdomain
    $domainSubdomainMap[$d] = $sgs
}

# -----------------------------------------------
# Step 3: Generate JSON Files
# -----------------------------------------------
$jsonDir = Join-Path $IntelligenceRoot "json"
if (-not (Test-Path $jsonDir)) { New-Item -ItemType Directory -Path $jsonDir -Force | Out-Null }

$timestamp = "2026-06-04T00:00:00Z"

# 3a: knowledge-units.json
Write-Host "Generating knowledge-units.json..." -ForegroundColor Cyan
$kuJson = @{
    knowledge_units = $kuData | ForEach-Object {
        @{
            id                 = "$($_.domain)/$($_.subdomain)/$($_.ku_name)"
            directory          = $_.ku_path
            domain             = $_.domain
            subdomain          = $_.subdomain
            knowledge_unit     = $_.ku_name
            difficulty         = "intermediate"
            has_rules          = $_.has_rules
            has_skills         = $_.has_skills
            has_decision_trees = $_.has_decision_trees
            has_anti_patterns  = $_.has_anti_patterns
            has_checklists     = $_.has_checklists
        }
    }
}
$kuContent = $kuJson | ConvertTo-Json -Depth 10
Write-Utf8File -Path (Join-Path $jsonDir "knowledge-units.json") -Value $kuContent
Write-Host "  Done: $($kuData.Count) KUs" -ForegroundColor Green

# 3b-3g: Artifact JSONs (rules, skills, decision-trees, anti-patterns, checklists)
$artifactTypes = @(
    @{ key = "rules";         file = "05-rules.md";        label = "Rules" },
    @{ key = "skills";        file = "06-skills.md";       label = "Skills" },
    @{ key = "decision-trees"; file = "07-decision-trees.md"; label = "Decision Trees" },
    @{ key = "anti-patterns";  file = "08-anti-patterns.md";  label = "Anti-Patterns" },
    @{ key = "checklists";    file = "09-checklists.md";   label = "Checklists" }
)

foreach ($at in $artifactTypes) {
    Write-Host "Generating $($at.key).json..." -ForegroundColor Cyan
    $entries = $kuData | ForEach-Object {
        $sourceFile = "knowledge/$($_.domain)/$($_.subdomain)/$($_.ku_name)/$($at.file)"
        @{
            id              = "$($_.domain)/$($_.subdomain)/$($_.ku_name)/$($at.key)"
            domain          = $_.domain
            subdomain       = $_.subdomain
            knowledge_unit  = $_.ku_name
            source_path     = $sourceFile
            summary         = "$($at.label) for $($_.ku_name)"
            difficulty      = "intermediate"
            has_content     = $true
        }
    }
    $atJson = @{
        artifact_type  = $at.key
        generated_at   = $timestamp
        total_entries  = $entries.Count
        entries        = $entries
    }
    $atContent = $atJson | ConvertTo-Json -Depth 10
    Write-Utf8File -Path (Join-Path $jsonDir "$($at.key).json") -Value $atContent
    Write-Host "  Done: $($entries.Count) entries" -ForegroundColor Green
}

# 3g: dependencies.json
Write-Host "Generating dependencies.json..." -ForegroundColor Cyan
$nodes = $kuData | ForEach-Object {
    @{
        id              = "$($_.domain)/$($_.subdomain)/$($_.ku_name)"
        domain          = $_.domain
        subdomain       = $_.subdomain
        knowledge_unit  = $_.ku_name
        directory       = $_.ku_path
    }
}
$depJson = @{
    knowledge_units = $nodes
    edges = @()
}
$depContent = $depJson | ConvertTo-Json -Depth 10
Write-Utf8File -Path (Join-Path $jsonDir "dependencies.json") -Value $depContent
Write-Host "  Done: $($nodes.Count) nodes" -ForegroundColor Green

# -----------------------------------------------
# Step 4: Generate Markdown Indexes
# -----------------------------------------------
$indexDir = Join-Path $IntelligenceRoot "indexes"
if (-not (Test-Path $indexDir)) { New-Item -ItemType Directory -Path $indexDir -Force | Out-Null }

$dateStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 4a: knowledge-unit-index.md
Write-Host "Generating knowledge-unit-index.md..." -ForegroundColor Cyan
$kuIndexLines = @(
    "# ECC Knowledge Unit Index",
    "",
    "Fast discovery of all Knowledge Units in the repository.",
    "",
    "| Attribute | Value |",
    "|---|---|",
    "| Total KUs | $totalKUs |",
    "| Domains | $domainCount |",
    "| Generated | $dateStr |",
    "",
    "---",
    "",
    "## Quick Navigation",
    ""
)

foreach ($d in $domainList) {
    $display = $domainDisplayMap[$d]
    $anchor = $d.ToLower()
    $sg = $domainSubdomainMap[$d]
    $totalInDomain = ($sg | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
    $kuIndexLines += "- [$display](#$anchor) ($totalInDomain KUs)"
}

$kuIndexLines += ""
$kuIndexLines += "---"
$kuIndexLines += ""

foreach ($d in $domainList) {
    $display = $domainDisplayMap[$d]
    $anchor = $d.ToLower()
    $kuIndexLines += "## $display"
    $kuIndexLines += ""

    $sgs = $domainSubdomainMap[$d]
    foreach ($sg in $sgs) {
        $sdn = $sg.Name
        $sdDisplay = ConvertTo-DisplayName $sdn
        $kuIndexLines += "### $sdDisplay"
        $kuIndexLines += ""
        $kuIndexLines += "| # | KU | Path |"
        $kuIndexLines += "|---|---|------|"

        $num = 1
        foreach ($ku in ($sg.Group | Sort-Object ku_name)) {
            $relPath = $ku.ku_path
            $kuIndexLines += "| $num | $($ku.ku_name) | ``$relPath`` |"
            $num++
        }
        $kuIndexLines += ""
    }
}

Write-Utf8File -Path (Join-Path $indexDir "knowledge-unit-index.md") -Value ($kuIndexLines -join "`n")
Write-Host "  Done" -ForegroundColor Green

# 4b-4f: artifact indexes
$artifactIndexTemplates = @(
    @{ key = "rule-index.md";          title = "ECC Rule Index";               desc = "Repository-wide rule registry. Centralized discovery for AI agents.";            artifactPath = "05-rules.md";         label = "Rules" },
    @{ key = "skill-index.md";         title = "ECC Skill Index";              desc = "Repository-wide skill registry. Rapid discovery of executable workflows.";       artifactPath = "06-skills.md";        label = "Skills" },
    @{ key = "decision-tree-index.md"; title = "ECC Decision Tree Index";      desc = "Repository-wide decision tree registry.";                                        artifactPath = "07-decision-trees.md"; label = "Decision Trees" },
    @{ key = "anti-pattern-index.md";  title = "ECC Anti-Pattern Index";       desc = "Repository-wide anti-pattern registry.";                                          artifactPath = "08-anti-patterns.md"; label = "Anti-Patterns" },
    @{ key = "checklist-index.md";     title = "ECC Checklist Index";          desc = "Repository-wide checklist registry.";                                              artifactPath = "09-checklists.md";    label = "Checklists" }
)

foreach ($tpl in $artifactIndexTemplates) {
    Write-Host "Generating $($tpl.key)..." -ForegroundColor Cyan
    $lines = @(
        "# $($tpl.title)",
        "",
        $tpl.desc,
        "",
        "| Attribute | Value |",
        "|---|---|",
        "| Total $($tpl.label) | $totalKUs |",
        "| Domains | $domainCount |",
        "| Generated | $dateStr |",
        "",
        "---",
        "",
        "## $($tpl.label) By Domain",
        ""
    )
    foreach ($d in $domainList) {
        $display = $domainDisplayMap[$d]
        $sgs = $domainSubdomainMap[$d]
        $totalInDomain = ($sgs | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
        $lines += "### $display ($totalInDomain $($tpl.label.ToLower()))"
        $lines += ""
        foreach ($sg in $sgs) {
            $sdn = $sg.Name
            $sdDisplay = ConvertTo-DisplayName $sdn
            $lines += "**$($sdDisplay)** -- $($sg.Count) units"
            $lines += ""
            foreach ($ku in ($sg.Group | Sort-Object ku_name)) {
                $sp = "$($ku.ku_path)/$($tpl.artifactPath)"
                $lines += "- **$($ku.ku_name)** -- $sp"
            }
            $lines += ""
        }
    }
    Write-Utf8File -Path (Join-Path $indexDir $tpl.key) -Value ($lines -join "`n")
    Write-Host "  Done" -ForegroundColor Green
}

# 4g: dependency-index.md
Write-Host "Generating dependency-index.md..." -ForegroundColor Cyan
$depIndexLines = @(
    "# ECC Dependency Index",
    "",
    "Repository-wide dependency visualization for all Knowledge Units.",
    "",
    "| Attribute | Value |",
    "|---|---|",
    "| Total Nodes | $totalKUs |",
    "| Total Edges | 0 |",
    "| Knowledge Units | $totalKUs |",
    "| Generated | $dateStr |",
    "",
    "---",
    "",
    "## Per-Domain Dependencies",
    "",
    "Top dependency relationships by domain:",
    ""
)

foreach ($d in $domainList) {
    $display = $domainDisplayMap[$d]
    $sgs = $domainSubdomainMap[$d]
    $totalInDomain = ($sgs | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
    $depIndexLines += "### $display (0 KUs with dependencies)"
    $depIndexLines += ""
    $depIndexLines += "| Knowledge Unit | Depends On |"
    $depIndexLines += "|---|---|"
    $depIndexLines += ""
}

Write-Utf8File -Path (Join-Path $indexDir "dependency-index.md") -Value ($depIndexLines -join "`n")
Write-Host "  Done" -ForegroundColor Green

# -----------------------------------------------
# Step 5: Generate knowledge-registry.md
# -----------------------------------------------
$registryDir = Join-Path $IntelligenceRoot "registry"
if (-not (Test-Path $registryDir)) { New-Item -ItemType Directory -Path $registryDir -Force | Out-Null }

Write-Host "Generating knowledge-registry.md..." -ForegroundColor Cyan
$regLines = @(
    "# ECC Knowledge Registry",
    "",
    "Repository-wide inventory of the ECC knowledge system.",
    "",
    "| Attribute | Value |",
    "|---|---|",
    "| Total Knowledge Units | $totalKUs |",
    "| Total Domains | $domainCount |",
    "| Generated | $dateStr |",
    "",
    "---",
    "",
    "## Domain Summary",
    "",
    "| # | Domain | KUs | Rules | Skills | Decision Trees | Anti-Patterns | Checklists |",
    "|---|--------|-----|-------|--------|----------------|---------------|------------|"
)

$num = 1
foreach ($d in $domainList) {
    $display = $domainDisplayMap[$d]
    $sgs = $domainSubdomainMap[$d]
    $totalInDomain = ($sgs | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
    $rulesCount = $totalInDomain
    $skillsCount = $totalInDomain
    $dtCount = $totalInDomain
    $apCount = $totalInDomain
    $clCount = $totalInDomain
    $regLines += "| $num | $display | $totalInDomain | $rulesCount | $skillsCount | $dtCount | $apCount | $clCount |"
    $num++
}

$regLines += ""
$regLines += ""
$regLines += "---"
$regLines += ""

# Per-domain detail sections
foreach ($d in $domainList) {
    $display = $domainDisplayMap[$d]
    $sgs = $domainSubdomainMap[$d]
    $totalInDomain = ($sgs | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum

    $regLines += "## $display"
    $regLines += ""
    $regLines += "| Metric | Count |"
    $regLines += "|--------|-------|"
    $regLines += "| Knowledge Units | $totalInDomain |"
    $regLines += "| Rules | $totalInDomain |"
    $regLines += "| Skills | $totalInDomain |"
    $regLines += "| Decision Trees | $totalInDomain |"
    $regLines += "| Anti-Patterns | $totalInDomain |"
    $regLines += "| Checklists | $totalInDomain |"
    $regLines += ""

    foreach ($sg in $sgs) {
        $sdn = $sg.Name
        $sdDisplay = ConvertTo-DisplayName $sdn
        $regLines += "### $sdDisplay"
        $regLines += ""

        foreach ($ku in ($sg.Group | Sort-Object ku_name)) {
            $relPath = $ku.ku_path
            $regLines += "- **[$($ku.ku_name)]($relPath/04-standardized-knowledge.md)** (intermediate)"
        }
        $regLines += ""
    }
}

Write-Utf8File -Path (Join-Path $registryDir "knowledge-registry.md") -Value ($regLines -join "`n")
Write-Host "  Done" -ForegroundColor Green

# -----------------------------------------------
# Summary
# -----------------------------------------------
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  INTELLIGENCE LAYER REBUILD COMPLETE" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Knowledge Units : $totalKUs" -ForegroundColor White
Write-Host "Domains         : $domainCount" -ForegroundColor White
Write-Host ""

$jsonFiles = @(
    "knowledge-units.json",
    "rules.json",
    "skills.json",
    "decision-trees.json",
    "anti-patterns.json",
    "checklists.json",
    "dependencies.json"
)
Write-Host "JSON Files:" -ForegroundColor Cyan
foreach ($jf in $jsonFiles) {
    $fp = Join-Path $jsonDir $jf
    if (Test-Path $fp) {
        $size = (Get-Item $fp).Length
        Write-Host "  $jf - $size bytes" -ForegroundColor Gray
    }
}

$indexFiles = @(
    "knowledge-unit-index.md",
    "rule-index.md",
    "skill-index.md",
    "decision-tree-index.md",
    "anti-pattern-index.md",
    "checklist-index.md",
    "dependency-index.md"
)
Write-Host ""
Write-Host "Markdown Indexes:" -ForegroundColor Cyan
foreach ($if in $indexFiles) {
    $fp = Join-Path $indexDir $if
    if (Test-Path $fp) {
        $size = (Get-Item $fp).Length
        $lines = (Get-Content $fp | Measure-Object).Count
        Write-Host "  $if - $size bytes, $lines lines" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Registry:" -ForegroundColor Cyan
$rfp = Join-Path $registryDir "knowledge-registry.md"
if (Test-Path $rfp) {
    $size = (Get-Item $rfp).Length
    $lines = (Get-Content $rfp | Measure-Object).Count
    Write-Host "  knowledge-registry.md - $size bytes, $lines lines" -ForegroundColor Gray
}

Write-Host ""
$totalSec = $duration.TotalSeconds.ToString("F2")
Write-Host "Total Runtime: $totalSec seconds" -ForegroundColor Yellow
