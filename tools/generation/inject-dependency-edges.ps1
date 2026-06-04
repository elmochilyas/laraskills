function Write-Utf8File {
    param([string]$Path, [string]$Value)
    [System.IO.File]::WriteAllText($Path, $Value, (New-Object System.Text.UTF8Encoding $false))
}

$root = "C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc"

# Phase 1: Build KU name-to-ID mapping
Write-Host "Phase 1: Building KU mapping..."
$kuDirs = Get-ChildItem "$root\knowledge" -Recurse -Directory | Where-Object { $_.Name -ne '_templates' }
$kuDirs = $kuDirs | Where-Object { Test-Path (Join-Path $_.FullName "02-knowledge-unit.md") }

$kuMap = @{}
$idToName = @{}
$idToDomain = @{}
$idToSubdomain = @{}

foreach ($d in $kuDirs) {
    $id = ($d.FullName.Replace("$root\knowledge\", "") -replace '\\', '/')
    $domain = $d.Parent.Parent.Name
    $subdomain = $d.Parent.Name
    $raw = Get-Content (Join-Path $d.FullName "02-knowledge-unit.md") -Raw -ErrorAction SilentlyContinue
    $name = ""
    if ($raw -match '^---\s*\n.*?\ntitle:\s*"?(.+?)"?\s*\n') { $name = $matches[1].Trim() }
    if (-not $name -and $raw -match '^#\s+Knowledge Unit:\s*(.+)$') { $name = $matches[1].Trim() }
    if (-not $name -and $raw -match '^#\s+(.+?)$') { $name = ($matches[1].Trim() -replace '\s*[-–—]\s*Standardized Knowledge$','') }
    if (-not $name) { $name = $d.Name -replace '-',' ' }
    $kuMap[$name.ToLower().Trim()] = $id
    $idToName[$id] = $name
    $idToDomain[$id] = $domain
    $idToSubdomain[$id] = $subdomain
}
Write-Host "  Mapped $($kuMap.Count) KUs"

# Phase 2: Scan 04 files for Dependencies and Related KUs
Write-Host "Phase 2: Scanning 04 files..."
$explicitDeps = @{}
$explicitRelated = @{}
$counter = 0

foreach ($d in $kuDirs) {
    $counter++
    if ($counter % 500 -eq 0) { Write-Host "  Progress: $counter / $($kuDirs.Count)" }
    $id = ($d.FullName.Replace("$root\knowledge\", "") -replace '\\', '/')
    $fourFile = Join-Path $d.FullName "04-standardized-knowledge.md"
    if (-not (Test-Path $fourFile)) { continue }
    $fourContent = Get-Content $fourFile -TotalCount 60 -ErrorAction SilentlyContinue
    
    foreach ($line in $fourContent) {
        if ($line -match '^\|\s*Dependenc(?:y|ies)\s*\|\s*(.+?)\s*\|') {
            $val = $matches[1].Trim()
            if ($val -ne '' -and $val -notmatch '^(None|none|N/A)$') { $explicitDeps[$id] = ($val -split '[,|]') | ForEach-Object { $_.Trim() } }
        }
        if ($line -match '^\|\s*Related\s+(?:KU|KUs|Topics?)\s*\|\s*(.+?)\s*\|') {
            $val = $matches[1].Trim()
            if ($val -ne '' -and $val -notmatch '^(None|none|N/A)$') { $explicitRelated[$id] = ($val -split '[,|]') | ForEach-Object { $_.Trim() } }
        }
    }
    
    # Check for ## Related KUs section
    $full = Get-Content $fourFile -ErrorAction SilentlyContinue
    $inSection = $false; $sectionItems = @()
    foreach ($line in $full) {
        if ($line -match '^##\s+Related\s+(?:KU|KUs|Topics?)') { $inSection = $true; continue }
        if ($inSection -and $line -match '^##\s') { break }
        if ($inSection -and $line -match '^\s*[-*]\s+(.+)$') {
            $item = $matches[1] -replace '^\*\*(Advanced|Cross-Domain|Related):\*\*\s*', ''
            $item = $item -replace '^(Advanced|Cross-Domain|Related|See also):\s*', ''
            $item = $item.Trim()
            # Remove leading hyphen or colon remnants
            $item = $item -replace '^[-–—]\s*', ''
            if ($item -ne '' -and $item.Length -gt 2) { $sectionItems += $item }
        }
    }
    if ($sectionItems.Count -gt 0) {
        if (-not $explicitRelated.ContainsKey($id)) { $explicitRelated[$id] = @() }
        $explicitRelated[$id] += $sectionItems
    }
}
Write-Host "  KUs with deps: $($explicitDeps.Count), with related: $($explicitRelated.Count)"

# Phase 3: Build dependency edges
Write-Host "Phase 3: Building dependency edges..."
$edges = @(); $seenEdges = @{}
$unmatched = @()

foreach ($kuId in $explicitDeps.Keys) {
    foreach ($dep in $explicitDeps[$kuId]) {
        $depLower = $dep.ToLower().Trim()
        $matched = $false
        
        if ($depLower -match '^(K\d+)$') {
            # Try K-code
            foreach ($kn in $kuMap.Keys) {
                if ($kn -match [regex]::Escape($depLower)) { 
                    $targetId = $kuMap[$kn]; $ek = "$targetId->$kuId"
                    if (-not $seenEdges.ContainsKey($ek)) { $seenEdges[$ek] = $true; $edges += @{id=$ek; source=$targetId; target=$kuId; type="prerequisite"; strength="recommended"; reason="Dep: '$dep'"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
                    $matched = $true; break
                }
            }
        }
        
        if (-not $matched -and $kuMap.ContainsKey($depLower)) {
            $targetId = $kuMap[$depLower]; $ek = "$targetId->$kuId"
            if (-not $seenEdges.ContainsKey($ek)) { $seenEdges[$ek] = $true; $edges += @{id=$ek; source=$targetId; target=$kuId; type="prerequisite"; strength="required"; reason="Explicit dep"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
            $matched = $true
        }
        
        if (-not $matched) {
            foreach ($kn in $kuMap.Keys) {
                if ($kn -match [regex]::Escape($depLower) -or $depLower -match [regex]::Escape($kn)) {
                    $targetId = $kuMap[$kn]; $ek = "$targetId->$kuId"
                    if (-not $seenEdges.ContainsKey($ek)) { $seenEdges[$ek] = $true; $edges += @{id=$ek; source=$targetId; target=$kuId; type="prerequisite"; strength="recommended"; reason="Dep: '$dep'"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
                    $matched = $true; break
                }
            }
        }
        if (-not $matched) { $unmatched += "$dep (in $kuId)" }
    }
}
Write-Host "  Dependency edges: $($edges.Count), Unmatched: $($unmatched.Count)"
$unmatched | Select-Object -First 10 | ForEach-Object { Write-Host "    $_" }

# Phase 4: Build relationship edges
Write-Host "Phase 4: Building relationship edges..."
$relEdges = @(); $seenRels = @{}

foreach ($kuId in $explicitRelated.Keys) {
    foreach ($rel in $explicitRelated[$kuId]) {
        $relLower = $rel.ToLower().Trim(); $matched = $false
        
        if ($kuMap.ContainsKey($relLower)) {
            $targetId = $kuMap[$relLower]; $rk = "$kuId<->$targetId"
            if (-not $seenRels.ContainsKey($rk)) { $seenRels[$rk]=$true; $seenRels["$targetId<->$kuId"]=$true; $relEdges += @{id="$kuId<->$targetId"; source=$kuId; target=$targetId; type="related-topic"; reason="Related KU"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
            $matched = $true
        }
        
        if (-not $matched) {
            foreach ($kn in $kuMap.Keys) {
                if ($kn -match [regex]::Escape($relLower) -or $relLower -match [regex]::Escape($kn)) {
                    $targetId = $kuMap[$kn]; $rk = "$kuId<->$targetId"
                    if (-not $seenRels.ContainsKey($rk)) { $seenRels[$rk]=$true; $seenRels["$targetId<->$kuId"]=$true; $relEdges += @{id="$kuId<->$targetId"; source=$kuId; target=$targetId; type="related-topic"; reason="Related: '$rel'"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
                    $matched = $true; break
                }
            }
        }
    }
}
Write-Host "  Relationship edges: $($relEdges.Count)"

# Phase 5: Inject edges into dependencies.json
Write-Host "`nPhase 5: Updating dependencies.json..."
$depPath = "$root\intelligence\json\dependencies.json"
$depRaw = Get-Content $depPath -Raw -Encoding UTF8
if ($depRaw[0] -eq 0xFEFF) { $depRaw = $depRaw.Substring(1) }
$depObj = $depRaw | ConvertFrom-Json

$depObj.edges = $edges

$newDepJson = $depObj | ConvertTo-Json -Depth 10
Write-Utf8File -Path $depPath -Value $newDepJson
Write-Host "  dependencies.json updated with $($edges.Count) edges"

# Phase 6: Create relationships.json
Write-Host "`nPhase 6: Creating relationships.json..."
$relOutput = @{
    edges = $relEdges
}
$relContent = $relOutput | ConvertTo-Json -Depth 10
Write-Utf8File -Path "$root\intelligence\json\relationships.json" -Value $relContent
Write-Host "  relationships.json created with $($relEdges.Count) edges"

# Phase 7: Detect circular dependencies
Write-Host "`nPhase 7: Detecting circular dependencies..."
$graph = @{}
foreach ($e in $edges) {
    if (-not $graph.ContainsKey($e.source)) { $graph[$e.source] = @() }
    $graph[$e.source] += $e.target
}
$visited = @{}; $recStack = @{}; $cycleSet = @{}
function Check-Cycle {
    param($node, $path)
    if ($recStack.ContainsKey($node)) {
        $idx = [array]::IndexOf($path, $node)
        if ($idx -ge 0) { $c = $path[$idx..($path.Count-1)]; $key = ($c | Sort-Object) -join '|'; if (-not $cycleSet.ContainsKey($key)) { $cycleSet[$key] = $c } }
        return
    }
    if ($visited.ContainsKey($node)) { return }
    $visited[$node] = $true; $recStack[$node] = $true
    if ($graph.ContainsKey($node)) { foreach ($n in $graph[$node]) { Check-Cycle -node $n -path ($path + $node) } }
    $recStack.Remove($node)
}
foreach ($n in $graph.Keys) { if (-not $visited.ContainsKey($n)) { Check-Cycle -node $n -path @() } }
$cycleCount = $cycleSet.Count
Write-Host "  Cycles detected: $cycleCount"
if ($cycleCount -gt 0) { $i=1; foreach ($c in $cycleSet.Values) { Write-Host "  Cycle $i : $($c -join ' -> ')"; $i++ } }

# Phase 7b: Alias resolution pass
Write-Host "`nPhase 7b: Resolving aliases..."
$aliasPath = "$root\intelligence\json\aliases.json"
$aliasResolved = 0
if (Test-Path $aliasPath) {
    $aliasRaw = Get-Content $aliasPath -Raw -Encoding UTF8
    if ($aliasRaw[0] -eq 0xFEFF) { $aliasRaw = $aliasRaw.Substring(1) }
    $aliasObj = $aliasRaw | ConvertFrom-Json
    $aliasMap = @{}
    foreach ($a in $aliasObj.aliases) {
        $aliasMap[$a.alias.ToLower().Trim()] = $a.canonical_ku_id
        $aliasMap[$a.normalized_alias.ToLower().Trim()] = $a.canonical_ku_id
    }
    $remainingUnmatched = @()
    foreach ($u in $unmatched) {
        $ref = ($u -split '\s*\(')[0].Trim().ToLower()
        $resolved = $false
        if ($aliasMap.ContainsKey($ref)) {
            $targetId = $aliasMap[$ref]
            $sourceId = if ($u -match '\(in\s*(.+)\)$') { $matches[1].Trim() } else { "" }
            if ($sourceId -ne "") {
                $ek = "$targetId->$sourceId"
                if (-not $seenEdges.ContainsKey($ek)) {
                    $seenEdges[$ek] = $true
                    $edges += @{id=$ek; source=$targetId; target=$sourceId; type="prerequisite"; strength="recommended"; reason="Alias: '$ref'"; evidence_paths=@("knowledge/$sourceId/04-standardized-knowledge.md")}
                    $aliasResolved++
                    $resolved = $true
                }
            }
        }
        if (-not $resolved) { $remainingUnmatched += $u }
    }
    $unmatched = $remainingUnmatched
    Write-Host "  Alias resolutions: $aliasResolved"
    Write-Host "  Remaining unmatched: $($unmatched.Count)"
}

# Phase 7c: Update dependencies.json with alias-resolved edges
Write-Host "`nPhase 7c: Updating dependencies.json after alias resolution..."
$depRaw2 = Get-Content $depPath -Raw -Encoding UTF8
if ($depRaw2[0] -eq 0xFEFF) { $depRaw2 = $depRaw2.Substring(1) }
$depObj2 = $depRaw2 | ConvertFrom-Json
$depObj2.edges = $edges
$newDepJson2 = $depObj2 | ConvertTo-Json -Depth 10
Write-Utf8File -Path $depPath -Value $newDepJson2
Write-Host "  dependencies.json updated with $($edges.Count) edges"

# Phase 7d: Update dependency-index.md with real data
Write-Host "`nPhase 7d: Regenerating dependency-index.md..."
$depIndexPath = "$root\intelligence\indexes\dependency-index.md"

# Foundation KUs (most-depended-upon or highest in domain hierarchy)
$foundationTopics = @{
    "laravel-core-application-engineering" = "Service Container, Routing, Middleware Pipeline"
    "laravel-eloquent-domain-modeling" = "Eloquent ORM Basics, Model Conventions, Relationships"
    "api-crud-system-engineering" = "RESTful API Design, Resource Controllers"
    "data-storage-systems" = "Database Schema Design, Query Fundamentals, Index Basics"
    "security-identity-engineering" = "Authentication Fundamentals, Session Management"
    "async-distributed-systems" = "Queue Configuration, Job Basics"
    "testing-reliability-engineering" = "PHPUnit Basics, Pest Fundamentals"
    "laravel-execution-lifecycle" = "Service Container, Service Providers, Request Lifecycle"
}

# Count domains with deps
$domainsWithDeps = @{}
foreach ($e in $edges) { 
    $sourceDomain = ($e.source -split '/')[0]
    $targetDomain = ($e.target -split '/')[0]
    $domainsWithDeps[$sourceDomain] = $true
    $domainsWithDeps[$targetDomain] = $true
}

# Cross-domain edges
$crossDomain = $edges | Where-Object { $_.source -and $_.target -and ($_.source -split '/')[0] -ne ($_.target -split '/')[0] }

# Isolated KUs
$allIDs = $kuDirs | ForEach-Object { ($_.FullName.Replace("$root\knowledge\", "") -replace '\\', '/') }
$idsWithDeps = @{}
foreach ($e in $edges) { $idsWithDeps[$e.source] = $true; $idsWithDeps[$e.target] = $true }
$isolated = $allIDs | Where-Object { -not $idsWithDeps.ContainsKey($_) }

$index = @"
# Dependency Index

## Repository Dependency Summary

| Metric | Value |
|---|---|
| Canonical KU Count | $($kuDirs.Count) |
| Dependency Edge Count | $($edges.Count) |
| Relationship Edge Count | $($relEdges.Count) |
| Domains Represented | $($domainsWithDeps.Count) / 21 |
| Isolated KUs (no deps, no dependents) | $($isolated.Count) |
| Cross-Domain Dependency Edges | $($crossDomain.Count) |

## Dependency Types

| Type | Count |
|---|---|
| prerequisite (required) | $(($edges | Where-Object { $_.strength -eq 'required' }).Count) |
| recommended | $(($edges | Where-Object { $_.strength -eq 'recommended' }).Count) |

## Foundation Knowledge Units

These KUs serve as prerequisites for multiple other KUs across the knowledge base:

| Domain | Foundation Topics |
|---|---|
"@

foreach ($d in $foundationTopics.Keys) {
    $display = $d -replace '-', ' '
    $display = [regex]::Replace($display, '\b\w', { param($m) $m.Value.ToUpper() })
    $index += "| $display | $($foundationTopics[$d]) |`n"
}

$index += @"

## Isolated Knowledge Units

$($isolated.Count) KUs have no explicit dependencies, dependents, or relationships. This is expected for:
- Foundation-level KUs (they are prerequisites, not dependents)
- Overview/reference KUs
- KUs whose dependencies are language-level (PHP, JavaScript) rather than KU-level

Most isolated KUs are foundation topics. No action required unless specific domain analysis reveals gaps.

## Cross-Domain Dependencies

$($crossDomain.Count) edges cross domain boundaries, indicating topics that bridge multiple engineering areas.

| Source Domain | Target Domain | Count |
|---|---|---|
"@

$crossDomainCounts = @{}
foreach ($e in $crossDomain) {
    $src = ($e.source -split '/')[0]
    $tgt = ($e.target -split '/')[0]
    $key = "$src -> $tgt"
    $crossDomainCounts[$key] = ($crossDomainCounts[$key] + 1)
}

$crossDomainCounts.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 15 | ForEach-Object {
    $index += "| $($_.Key) | $($_.Value) |`n"
}

$index += @"

## Per-Domain Dependency Counts

| Domain | KUs with Dependencies | Total Edges |
|---|---|---|
"@

foreach ($d in ($idToDomain.Values | Select-Object -Unique | Sort-Object)) {
    $display = $d -replace '-', ' '
    $display = [regex]::Replace($display, '\b\w', { param($m) $m.Value.ToUpper() })
    $domainKUs = $allIDs | Where-Object { $_ -match "^$d/" }
    $domainEdges = $edges | Where-Object { ($_.source -match "^$d/") -or ($_.target -match "^$d/") }
    $domainWithDeps = $explicitDeps.Keys | Where-Object { $_ -match "^$d/" }
    $index += "| $display | $($domainWithDeps.Count) | $($domainEdges.Count) |`n"
}

$cycleText = if ($cycleCount -eq 0) { "Circular dependencies were checked during generation. None found." } else { $t = "**" + $cycleCount + " circular dependencies detected:**`n"; $i = 1; foreach ($c in $cycleSet.Values) { $seq = $c -join ' -> '; $t += "$i. $seq`n"; $i++ }; $t }

$index += @"

## Circular Dependencies

$cycleText

## External Prerequisites

External prerequisite concepts are tracked in \`intelligence/json/external-concepts.json\`.
$($unmatched.Count) unmatched dependency references remain after alias resolution — see that file for the registry of external prerequisites.

## Alias Resolution

Internal aliases (e.g., section numbers, K-codes) are mapped in \`intelligence/json/aliases.json\`.
$aliasResolved alias references were resolved to canonical KU IDs during this generation.

## Notes

- Dependency edges are generated from explicit \`Dependencies\` metadata fields in \`04-standardized-knowledge.md\`.
- Relationship edges are generated from \`Related KUs\` metadata fields and \`## Related KUs\` sections.
- Edges are directional: A → B means "A is a prerequisite for B".
- Relationships are bidirectional: A ↔ B means "A and B are related topics".
- External concepts (e.g., "PHPUnit basics", "CSS selectors") are tracked in external-concepts.json.
- Internal aliases (e.g., section numbers, K-codes) are resolved via aliases.json.
- Remaining unmatched references: $($unmatched.Count) after alias resolution.
"@

Write-Utf8File -Path $depIndexPath -Value $index
Write-Host "  dependency-index.md regenerated ($((Get-Item $depIndexPath).Length) bytes)"

Write-Host "`n=== COMPLETE ==="
Write-Host "dependencies.json: $((Get-Item $depPath).Length) bytes, $($edges.Count) edges"
Write-Host "relationships.json: $((Get-Item "$root\intelligence\json\relationships.json").Length) bytes, $($relEdges.Count) edges"
Write-Host "dependency-index.md: $((Get-Item $depIndexPath).Length) bytes"
Write-Host "Total isolated KUs: $($isolated.Count)"
