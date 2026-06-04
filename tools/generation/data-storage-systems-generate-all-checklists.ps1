param(
    [string]$BasePath = "C:\Users\Pc\Desktop\laravel skills from every thing claude code\research\workspaces\data-storage-systems"
)

$logPath = Join-Path $BasePath "checklist-generation-log.txt"
"Checklist Generation Log - $(Get-Date)" | Out-File -FilePath $logPath

$totalFound = 0
$totalProcessed = 0
$totalEmpty = 0
$totalFailures = 0
$failureDetails = @()

function Get-KU-Name {
    param([string]$dirPath)
    $kuFile = Join-Path $dirPath "02-knowledge-unit.md"
    if (Test-Path -LiteralPath $kuFile) {
        $content = [System.IO.File]::ReadAllText($kuFile)
        # Match "Knowledge Unit:" line in metadata section
        if ($content -match '(?m)^Knowledge Unit:\s*(.+)$') {
            return $matches[1].Trim()
        }
        # Fallback: match "Knowledge Unit Title" from table format
        if ($content -match '(?m)^\|\s*Knowledge Unit Title\s*\|\s*(.+)\s*\|') {
            return $matches[1].Trim()
        }
    }
    return Split-Path $dirPath -Leaf
}

function Get-Subdomain-Name {
    param([string]$dirPath, [string]$basePath)
    $dirNorm = $dirPath.Replace('/', '\')
    $baseNorm = $basePath.Replace('/', '\').TrimEnd('\')
    if ($dirNorm.StartsWith($baseNorm)) {
        $rel = $dirNorm.Substring($baseNorm.Length).TrimStart('\')
        $parts = $rel -split '\\'
        if ($parts.Count -ge 2) {
            if ($parts[0] -eq 'advanced' -and $parts.Count -ge 3) {
                return "$($parts[0])/$($parts[1])"
            }
            if ($parts[0] -eq 'schema' -and $parts.Count -ge 2 -and $parts[1] -eq 'production-schema-operations') {
                return "$($parts[0])/$($parts[1])"
            }
            return $parts[0]
        }
    }
    return "unknown"
}

function Read-File-Content {
    param([string]$path)
    if (Test-Path -LiteralPath $path) {
        try { return [System.IO.File]::ReadAllText($path) } catch { return $null }
    }
    return $null
}

function Get-Source-Files {
    param([string]$dirPath)
    $missing = @()
    foreach ($f in @("04-standardized-knowledge.md", "05-rules.md", "06-skills.md", "07-decision-trees.md", "08-anti-patterns.md")) {
        if (-not (Test-Path -LiteralPath (Join-Path $dirPath $f))) { $missing += $f }
    }
    return @{Missing = $missing}
}

function Get-Existing-Files {
    param([string]$dirPath)
    $files = @()
    foreach ($f in @("02-knowledge-unit.md", "03-decomposition.md", "04-standardized-knowledge.md", "05-rules.md", "06-skills.md", "07-decision-trees.md", "08-anti-patterns.md")) {
        if (Test-Path -LiteralPath (Join-Path $dirPath $f)) { $files += $f }
    }
    return $files
}

function Parse-Section-Items($content, $sectionName, $prefix) {
    $items = @()
    $inSection = $false
    foreach ($line in $content -split "`n") {
        if ($line -match "^## $sectionName") { $inSection = $true; continue }
        if ($inSection -and $line -match '^## ') { $inSection = $false; continue }
        if ($inSection) {
            if ($prefix -eq 'best' -and ($line -match '-\s+\*\*(.+?)\*\*' -or $line -match '^\d+\.\s+\*\*(.+?)\*\*')) {
                $v = $matches[1].Trim().TrimEnd(':'); if ($v) { $items += "- [ ] $v applied" }
            } elseif ($prefix -eq 'verify' -and $line -match '-\s*\[\s*[x ]\s*\]\s*(.+)') {
                $items += "- [ ] $($matches[1].Trim())"
            } elseif ($prefix -eq 'verify' -and $line -match '^-\s+(.+)$' -and -not $line -match '^\s*$' -and -not $line -match '^- \*\*') {
                $v = $matches[1].Trim(); if ($v -and $v.Length -gt 5 -and $v -notmatch '^\*\*' -and $v -notmatch '^\d') { $items += "- [ ] $v" }
            } elseif ($prefix -eq 'mistake' -and $line -match '^\|\s*\d+\s*\|(.+?)\|') {
                $parts = $line -split '\|'
                if ($parts.Count -ge 3) { $m = $parts[2].Trim(); if ($m -and $m -notmatch '^Description$|^\-+$') { $items += "- [ ] $m prevented" } }
            } elseif ($prefix -eq 'arch' -and $line -match '^-\s*\*\*(.+?)\*\*') {
                $items += "- [ ] $($matches[1].Trim().TrimEnd(':'))"
            } elseif ($prefix -eq 'perfsec' -and $line -match '^-\s+(.+)$') {
                $t = $matches[1].Trim(); if ($t -and $t.Length -gt 10 -and $t -notmatch '^\*\*') { $t2 = $t -replace '\s+',' '; if ($t2.Length -gt 150) { $t2 = $t2.Substring(0,147)+'...' }; $items += "- [ ] $prefix`: $t2" }
            } elseif ($prefix -eq 'workflow' -and $line -match '^\d+\.\s+(.+)$') {
                $s = $matches[1].Trim(); if ($s.Length -gt 150) { $s = $s.Substring(0,147)+'...' }; $items += "- [ ] $s completed"
            } elseif ($prefix -eq 'criteria' -and $line -match '^-\s+(.+)$') {
                $c = $matches[1].Trim(); if ($c -and $c.Length -gt 5) { $items += "- [ ] $c" }
            }
        }
    }
    return $items
}

function Parse-Rules {
    param([string]$content)
    $items = @(); $cur = ""
    foreach ($line in $content -split "`n") {
        if ($line -match '^##\s+\d+\.\s+(.+)$') {
            if ($cur -and $cur -notmatch '^(Review|Consider|Core Concepts|Architecture Guidelines)') { $items += "- [ ] $cur followed" }
            $cur = $matches[1].Trim()
        }
    }
    if ($cur -and $cur -notmatch '^(Review|Consider|Core Concepts|Architecture Guidelines)') { $items += "- [ ] $cur followed" }
    return $items
}

function Parse-Validation-Checklist {
    param([string]$content)
    $items = @(); $in = $false
    foreach ($line in $content -split "`n") {
        if ($line -match '^## Validation Checklist') { $in = $true; continue }
        if ($in -and $line -match '^## ') { $in = $false; continue }
        if ($in -and $line -match '-\s*\[\s*[x ]\s*\]\s*(.+)') { $items += "- [ ] $($matches[1].Trim())" }
    }
    return $items
}

function Parse-Decision-Names {
    param([string]$content)
    $items = @(); $found = @{}
    $matches = [regex]::Matches($content, '(?m)^##\s+(.+?)\s*$')
    foreach ($m in $matches) {
        $title = $m.Groups[1].Value.Trim()
        if ($title -match 'Connection|Pooling|Strategy|Decision|Tree|Approach|Selection|Architecture') {
            if (-not $found.ContainsKey($title.ToLower())) { $found[$title.ToLower()] = $true; $items += "- [ ] Correct $title selected"; if ($items.Count -ge 3) { break } }
        }
    }
    return $items
}

function Parse-Anti-Patterns {
    param([string]$content)
    $items = @(); $found = @{}
    $in = $false
    foreach ($line in $content -split "`n") {
        if ($line -match '^## Anti-Pattern Inventory') { $in = $true; continue }
        if ($in -and $line -match '^## ') { $in = $false; continue }
        if ($in -and $line -match '^\d+\.\s+(.+)$') {
            $ap = $matches[1].Trim(); $key = $ap.ToLower()
            if ($ap -and $ap.Length -gt 3 -and -not $found.ContainsKey($key) -and $ap -notmatch 'Fat Controllers|God Services|N\+1|Premature Caching|Premature Optimization|Hidden Database|Business Logic') {
                $found[$key] = $true; $items += "- [ ] $ap prevented" }
        }
    }
    foreach ($line in $content -split "`n") {
        if ($line -match '^## Anti-Pattern\s+\d+:\s+(.+)$') {
            $ap = $matches[1].Trim(); $key = $ap.ToLower()
            if (-not $found.ContainsKey($key)) { $found[$key] = $true; $items += "- [ ] $ap prevented" }
        }
    }
    return $items
}

function Generate-Checklist {
    param([string]$dirPath, [string]$basePath)
    
    $kuName = Get-KU-Name $dirPath
    $subdomain = Get-Subdomain-Name $dirPath $basePath
    
    # Check if KU has any files
    $hasContent = $false
    foreach ($f in @("02-knowledge-unit.md","03-decomposition.md","04-standardized-knowledge.md","05-rules.md","06-skills.md","07-decision-trees.md","08-anti-patterns.md")) {
        if (Test-Path -LiteralPath (Join-Path $dirPath $f)) { $hasContent = $true; break }
    }
    if (-not $hasContent) { return $null }
    
    $missingInfo = Get-Source-Files $dirPath
    $existingFiles = Get-Existing-Files $dirPath
    $missingNote = if ($missingInfo.Missing.Count -gt 0) { "`n**Note:** Generated from partial input (missing: $($missingInfo.Missing -join ', '))" } else { "" }
    
    # Parse all content
    $bp = @(); $vf = @(); $cm = @(); $ar = @(); $pf = @(); $sf = @()
    $ru = @(); $wf = @(); $vc = @(); $sc = @(); $dc = @(); $ap = @()
    
    $c04 = Read-File-Content (Join-Path $dirPath "04-standardized-knowledge.md")
    if ($c04) {
        $bp = Parse-Section-Items $c04 "Best Practices" "best"
        $vf = Parse-Section-Items $c04 "Verification" "verify"
        $cm = Parse-Section-Items $c04 "Common Mistakes" "mistake"
        $ar = Parse-Section-Items $c04 "Architecture Guidelines" "arch"
        # Performance and Security
        $pf = Parse-Section-Items $c04 "Performance Considerations" "perfsec"
        $sf = Parse-Section-Items $c04 "Security Considerations" "perfsec"
        # Fix prefix texts
        $pf2 = @(); foreach ($i in $pf) { $pf2 += $i -replace '^- \[ \] perfsec: ', '- [ ] Performance: ' }
        $pf = $pf2
        $sf2 = @(); foreach ($i in $sf) { $sf2 += $i -replace '^- \[ \] perfsec: ', '- [ ] Security: ' }
        $sf = $sf2
    }
    
    $c05 = Read-File-Content (Join-Path $dirPath "05-rules.md")
    if ($c05) { $ru = Parse-Rules $c05 }
    
    $c06 = Read-File-Content (Join-Path $dirPath "06-skills.md")
    if ($c06) {
        $wf = Parse-Section-Items $c06 "Workflow" "workflow"
        $vc = Parse-Validation-Checklist $c06
        $sc = Parse-Section-Items $c06 "Success Criteria" "criteria"
    }
    
    $c07 = Read-File-Content (Join-Path $dirPath "07-decision-trees.md")
    if ($c07) { $dc = Parse-Decision-Names $c07 }
    
    $c08 = Read-File-Content (Join-Path $dirPath "08-anti-patterns.md")
    if ($c08) { $ap = Parse-Anti-Patterns $c08 }
    
    if (-not $ar) { $ar = @("- [ ] Responsibilities clearly separated","- [ ] Correct layer selected","- [ ] Dependency boundaries respected","- [ ] No circular dependencies","- [ ] Domain boundaries respected") }
    
    # Quick checklist (top items)
    $qi = @()
    $qi += $bp | Select-Object -First 5
    $qi += $vf | Select-Object -First 5
    $qi += $cm | Select-Object -First 5
    $qi += $ru | Select-Object -First 3
    $qi += $sc | Select-Object -First 3
    if ($qi.Count -gt 20) { $qi = $qi | Select-Object -First 20 }
    
    # Implementation
    $ii = @()
    $ii += $bp | Select-Object -First 5
    $ii += $ru | Where-Object {$_ -notmatch 'review|consider|architecture'} | Select-Object -First 5
    $ii += $wf | Select-Object -First 5
    if ($ii.Count -lt 5) {
        $id = @("- [ ] Required classes created","- [ ] Naming conventions respected","- [ ] Dependencies injected","- [ ] Error handling implemented","- [ ] Logging added where required")
        $ii += $id | Select-Object -First (5 - $ii.Count)
    }
    
    # Testing
    $ti = @()
    $ti += $vf | Select-Object -First 5
    $ti += $vc | Select-Object -First 5
    $ti += $sc | Select-Object -First 5
    if ($ti.Count -lt 3) { $td = @("- [ ] Unit tests cover core logic","- [ ] Integration tests cover database interactions","- [ ] Edge cases tested"); $ti += $td | Select-Object -First (3 - $ti.Count) }
    
    # Anti-patterns
    $api = @()
    $api += $ap | Select-Object -First 10
    $api += $cm | Select-Object -First 10
    
    # Performance
    $ppi = if ($pf) { $pf | Select-Object -First 5 } else { @("- [ ] Query performance analyzed","- [ ] Connection overhead considered","- [ ] Data volume impact evaluated") }
    
    # Security
    $ssi = if ($sf) { $sf | Select-Object -First 5 } else { @("- [ ] Data access controls reviewed","- [ ] Input validation in place","- [ ] Secrets properly managed") }
    
    # Reliability
    $ri = @()
    $ri += $cm | Select-Object -First 5
    $ri += $ru | Where-Object {$_ -match 'never|always|avoid'} | Select-Object -First 3
    if ($ri.Count -lt 3) { $rd = @("- [ ] Failure modes documented","- [ ] Retry logic for transient failures","- [ ] Timeout configured appropriately"); $ri += $rd | Select-Object -First (3 - $ri.Count) }
    
    # Maintainability
    $mi = @()
    $mi += $bp | Where-Object {$_ -match 'name|document|comment|organize|convention|pattern'} | Select-Object -First 3
    $md = @("- [ ] Code follows project conventions","- [ ] Configuration externalized","- [ ] Documentation updated","- [ ] Meaningful naming used")
    $mi += $md | Select-Object -First 4
    
    # Production
    $pi = @("- [ ] Monitoring considered","- [ ] Logging reviewed","- [ ] Error handling reviewed","- [ ] Configuration validated","- [ ] Rollback strategy considered")
    
    $output = @"
# Metadata

**Domain:** data-storage-systems
**Subdomain:** $subdomain
**Knowledge Unit:** $kuName
**Generated:** 2026-06-03
**Based on:** $($existingFiles -join ', ')$missingNote

---

# Quick Checklist

$($qi -join "`n")

---

# Architecture Checklist

$($ar -join "`n")

---

# Implementation Checklist

$($ii -join "`n")

---

# Performance Checklist

$($ppi -join "`n")

---

# Security Checklist

$($ssi -join "`n")

---

# Reliability Checklist

$($ri -join "`n")

---

# Testing Checklist

$($ti -join "`n")

---

# Maintainability Checklist

$($mi -join "`n")

---

# Anti-Pattern Prevention Checklist

$($api -join "`n")

---

# Production Readiness Checklist

$($pi -join "`n")

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
"@
    return $output
}

# ========== MAIN ==========
Write-Host "Starting checklist generation for all KUs in: $BasePath" -ForegroundColor Cyan

# Find ALL KU directories using recursive search for 02-knowledge-unit.md
$kuMdFiles = Get-ChildItem -Path $BasePath -Recurse -Filter "02-knowledge-unit.md" -File -ErrorAction SilentlyContinue
$kuDirs = $kuMdFiles | ForEach-Object { $_.DirectoryName } | Sort-Object -Unique

$totalFound = $kuDirs.Count
Write-Host "Found $totalFound KUs" -ForegroundColor Green
"Found $totalFound KUs" | Out-File -FilePath $logPath -Append

$counter = 0
foreach ($dir in $kuDirs) {
    $counter++
    $kuName = Get-KU-Name $dir
    $relPath = $dir.Substring($BasePath.Length).TrimStart('\')
    Write-Host "[$counter/$totalFound] Processing: $relPath - $kuName" -ForegroundColor Yellow
    
    try {
        $checklist = Generate-Checklist $dir $BasePath
        
        if ($null -eq $checklist) {
            Write-Host "  -> Empty KU, skipping" -ForegroundColor DarkYellow
            $totalEmpty++
            "$relPath - EMPTY (no files)" | Out-File -FilePath $logPath -Append
            continue
        }
        
        $outPath = Join-Path $dir "09-checklists.md"
        [System.IO.File]::WriteAllText($outPath, $checklist, [System.Text.Encoding]::UTF8)
        
        Write-Host "  -> Generated: $relPath\09-checklists.md" -ForegroundColor Green
        $totalProcessed++
        "$relPath - OK" | Out-File -FilePath $logPath -Append
    }
    catch {
        Write-Host "  -> FAILED: $_" -ForegroundColor Red
        $totalFailures++
        $failureDetails += "$relPath - $_"
        "$relPath - FAILED: $_" | Out-File -FilePath $logPath -Append
    }
}

$summary = @"

========================================
SUMMARY
========================================
Total KUs found:   $totalFound
Processed:         $totalProcessed
Empty skipped:     $totalEmpty
Failures:          $totalFailures
"@

Write-Host $summary -ForegroundColor Cyan
$summary | Out-File -FilePath $logPath -Append

if ($totalFailures -gt 0) {
    Write-Host "`nFailure Details:" -ForegroundColor Red
    $failureDetails | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

Write-Host "`nLog written to: $logPath" -ForegroundColor Cyan
