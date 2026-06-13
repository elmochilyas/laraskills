function Write-Utf8File {
    param([string]$Path, [string]$Value)
    [System.IO.File]::WriteAllText($Path, $Value, (New-Object System.Text.UTF8Encoding $false))
}

# Normalize common UTF-8 mojibake sequences to proper Unicode characters
function Normalize-Mojibake {
    param([string]$Text)
    if ([string]::IsNullOrEmpty($Text)) { return $Text }
    # Em-dash mojibake: bytes 0xE2 0x80 0x94 read as Latin-1 -> â (U+00E2) € (U+20AC) " (U+201D) -> proper em-dash U+2014
    $search = [string][char]0x00E2 + [char]0x20AC + [char]0x201D
    $replace = [string][char]0x2014
    $Text = $Text.Replace([string]$search, [string]$replace)
    # Right arrow mojibake
    $search2 = [string][char]0x00E2 + [char]0x2020 + [char]0x2019
    $replace2 = [string][char]0x2192
    $Text = $Text.Replace([string]$search2, [string]$replace2)
    return $Text
}

$scriptParent = Split-Path $PSScriptRoot -Parent
$root = Split-Path $scriptParent -Parent
$root = $root -replace '\\', '/'

$knowledgeDir = "$root/knowledge"
$intelJsonDir = "$root/intelligence/json"
$intelIndexDir = "$root/intelligence/indexes"

# Phase timing
$scriptStart = Get-Date
$lastPhase = $scriptStart
function Write-PhaseTiming {
    param([string]$Phase, [string]$Message)
    $now = Get-Date
    $phaseSec = ($now - $scriptStart).TotalSeconds
    $stepSec = ($now - $lastPhase).TotalSeconds
    Write-Host "[t=${phaseSec}s / +${stepSec}s] $Phase`: $Message"
    $script:lastPhase = $now
}

# Phase 1: Build KU name-to-ID mapping
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 1" -Message "Building KU mapping..."
$kuDirs = Get-ChildItem $knowledgeDir -Recurse -Directory | Where-Object { $_.Name -ne '_templates' }
$kuDirs = $kuDirs | Where-Object { Test-Path (Join-Path $_.FullName "02-knowledge-unit.md") }

$kuMap = @{}
$idToName = @{}
$idToDomain = @{}
$idToSubdomain = @{}

foreach ($d in $kuDirs) {
    $id = ($d.FullName -replace '\\', '/').Replace("$knowledgeDir/", "")
    $domain = $d.Parent.Parent.Name
    $subdomain = $d.Parent.Name
    $raw = Get-Content (Join-Path $d.FullName "02-knowledge-unit.md") -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
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
$sortedKuKeys = $kuMap.Keys | Sort-Object
Write-PhaseTiming -Phase "Phase 1" -Message "Mapped $($kuMap.Count) KUs"

# Phase 2: Scan 04 files for Dependencies and Related KUs
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 2" -Message "Scanning 04 files..."
$explicitDeps = @{}
$explicitRelated = @{}
$counter = 0

foreach ($d in $kuDirs) {
    $counter++
    if ($counter % 500 -eq 0) { Write-Host "  Progress: $counter / $($kuDirs.Count)" }
    $id = ($d.FullName -replace '\\', '/').Replace("$knowledgeDir/", "")
    $fourFile = Join-Path $d.FullName "04-standardized-knowledge.md"
    if (-not (Test-Path $fourFile)) { continue }
    $fourContent = Get-Content $fourFile -Encoding UTF8 -ErrorAction SilentlyContinue
    if (-not $fourContent) { continue }
    
    # Single pass: parse metadata table + related KUs section
    $inSection = $false; $sectionItems = @()
    foreach ($line in $fourContent) {
        if ($line -match '^\|\s*Dependenc(?:y|ies)\s*\|\s*(.+?)\s*\|') {
            $val = $matches[1].Trim()
            if ($val -ne '' -and $val -notmatch '^(None|none|N/A)$') { $explicitDeps[$id] = ($val -split '[,|]') | ForEach-Object { Normalize-Mojibake $_.Trim() } }
        }
        if ($line -match '^\|\s*Related\s+(?:KU|KUs|Topics?)\s*\|\s*(.+?)\s*\|') {
            $val = $matches[1].Trim()
            if ($val -ne '' -and $val -notmatch '^(None|none|N/A)$') { $explicitRelated[$id] = ($val -split '[,|]') | ForEach-Object { Normalize-Mojibake $_.Trim() } }
        }

        # Check for ## Related KUs section (same pass)
        if ($line -match '^##\s+Related\s+(?:KU|KUs|Topics?)') { $inSection = $true; continue }
        if ($inSection -and $line -match '^##\s') { break }
        if ($inSection -and $line -match '^\s*[-*]\s+(.+)$') {
            $item = $matches[1] -replace '^\*\*(Advanced|Cross-Domain|Related):\*\*\s*', ''
            $item = $item -replace '^(Advanced|Cross-Domain|Related|See also):\s*', ''
            $item = $item.Trim()
            $item = $item -replace '^[-–—]\s*', ''
            $item = Normalize-Mojibake $item
            if ($item -ne '' -and $item.Length -gt 2) { $sectionItems += $item }
        }
    }
    if ($sectionItems.Count -gt 0) {
        if (-not $explicitRelated.ContainsKey($id)) { $explicitRelated[$id] = @() }
        $explicitRelated[$id] += $sectionItems
    }
}
Write-PhaseTiming -Phase "Phase 2" -Message "KUs with deps: $($explicitDeps.Count), with related: $($explicitRelated.Count)"

# Phase 3: Build dependency edges
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 3" -Message "Building dependency edges..."
$edges = @(); $seenEdges = @{}
$unmatched = @()

# Build normalized name lookup for deterministic matching
$normalizedNameMap = @{}
foreach ($kn in $sortedKuKeys) {
    $normalized = $kn -replace '[^a-z0-9]+', ' ' -replace '\s+', ' ' -replace '^\s+|\s+$', ''
    if (-not $normalizedNameMap.ContainsKey($normalized)) { $normalizedNameMap[$normalized] = @() }
    $normalizedNameMap[$normalized] += $kuMap[$kn]
}

foreach ($kuId in ($explicitDeps.Keys | Sort-Object)) {
    foreach ($dep in ($explicitDeps[$kuId] | Sort-Object)) {
        $depLower = $dep.ToLower().Trim()
        $matched = $false
        
        # Resolution order 1: Exact canonical KU ID
        if (-not $matched -and $idToName.ContainsKey($depLower)) {
            $targetId = $depLower
            if ($targetId -ne $kuId) {
                $ek = "$targetId->$kuId"
                if (-not $seenEdges.ContainsKey($ek)) { $seenEdges[$ek] = $true; $edges += @{id=$ek; source=$targetId; target=$kuId; type="prerequisite"; strength="required"; reason="Explicit dep by ID"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
            }
            $matched = $true
        }
        
        # Resolution order 2: Exact KU name match
        if (-not $matched -and $kuMap.ContainsKey($depLower)) {
            $targetId = $kuMap[$depLower]
            if ($targetId -ne $kuId) {
                $ek = "$targetId->$kuId"
                if (-not $seenEdges.ContainsKey($ek)) { $seenEdges[$ek] = $true; $edges += @{id=$ek; source=$targetId; target=$kuId; type="prerequisite"; strength="required"; reason="Explicit dep"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
            }
            $matched = $true
        }
        
        # Resolution order 3: Alias (will be resolved in Phase 7b)
        # Resolution order 4: Normalized name if unique
        if (-not $matched) {
            $normalized = $depLower -replace '[^a-z0-9]+', ' ' -replace '\s+', ' ' -replace '^\s+|\s+$', ''
            if ($normalizedNameMap.ContainsKey($normalized) -and $normalizedNameMap[$normalized].Count -eq 1) {
                $targetId = $normalizedNameMap[$normalized][0]
                if ($targetId -ne $kuId) {
                    $ek = "$targetId->$kuId"
                    if (-not $seenEdges.ContainsKey($ek)) { $seenEdges[$ek] = $true; $edges += @{id=$ek; source=$targetId; target=$kuId; type="prerequisite"; strength="recommended"; reason="Dep: '$dep'"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
                }
                $matched = $true
            }
        }
        
        # Resolution order 5: Fuzzy substring match with sorted keys (deterministic)
        if (-not $matched) {
            foreach ($kn in $sortedKuKeys) {
                if ($kn.Contains($depLower) -or $depLower.Contains($kn)) {
                    $targetId = $kuMap[$kn]
                    if ($targetId -ne $kuId) {
                        $ek = "$targetId->$kuId"
                        if (-not $seenEdges.ContainsKey($ek)) { $seenEdges[$ek] = $true; $edges += @{id=$ek; source=$targetId; target=$kuId; type="prerequisite"; strength="recommended"; reason="Dep: '$dep'"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
                    }
                    $matched = $true; break
                }
            }
        }
        
        if (-not $matched) { $unmatched += "$dep (in $kuId)" }
    }
}

# Sort edges deterministically
$edges = $edges | Sort-Object source, target, type, strength
Write-PhaseTiming -Phase "Phase 3" -Message "Dependency edges: $($edges.Count), Unmatched: $($unmatched.Count)"
$unmatched | Select-Object -First 10 | ForEach-Object { Write-Host "    $_" }

# Phase 4: Build relationship edges
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 4" -Message "Building relationship edges..."
$relEdges = @(); $seenRels = @{}

foreach ($kuId in ($explicitRelated.Keys | Sort-Object)) {
    foreach ($rel in ($explicitRelated[$kuId] | Sort-Object)) {
        $relLower = $rel.ToLower().Trim(); $matched = $false
        
        # Resolution order 1: Exact KU name match (with self-loop check)
        if ($kuMap.ContainsKey($relLower)) {
            $targetId = $kuMap[$relLower]
            if ($targetId -ne $kuId) {
                $rk = "$kuId<->$targetId"
                if (-not $seenRels.ContainsKey($rk)) { $seenRels[$rk]=$true; $seenRels["$targetId<->$kuId"]=$true; $relEdges += @{id="$kuId<->$targetId"; source=$kuId; target=$targetId; type="related-topic"; reason="Related KU"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
            }
            $matched = $true
        }
        
        # Resolution order 2: Normalized name if unique
        if (-not $matched) {
            $normalized = $relLower -replace '[^a-z0-9]+', ' ' -replace '\s+', ' ' -replace '^\s+|\s+$', ''
            if ($normalizedNameMap.ContainsKey($normalized) -and $normalizedNameMap[$normalized].Count -eq 1) {
                $targetId = $normalizedNameMap[$normalized][0]
                if ($targetId -ne $kuId) {
                    $rk = "$kuId<->$targetId"
                    if (-not $seenRels.ContainsKey($rk)) { $seenRels[$rk]=$true; $seenRels["$targetId<->$kuId"]=$true; $relEdges += @{id="$kuId<->$targetId"; source=$kuId; target=$targetId; type="related-topic"; reason="Related: '$rel'"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
                }
                $matched = $true
            }
        }
        
        # Resolution order 3: Fuzzy substring match with sorted keys (deterministic)
        if (-not $matched) {
            foreach ($kn in $sortedKuKeys) {
                if ($kn.Contains($relLower) -or $relLower.Contains($kn)) {
                    $targetId = $kuMap[$kn]
                    if ($targetId -ne $kuId) {
                        $rk = "$kuId<->$targetId"
                        if (-not $seenRels.ContainsKey($rk)) { $seenRels[$rk]=$true; $seenRels["$targetId<->$kuId"]=$true; $relEdges += @{id="$kuId<->$targetId"; source=$kuId; target=$targetId; type="related-topic"; reason="Related: '$rel'"; evidence_paths=@("knowledge/$kuId/04-standardized-knowledge.md")} }
                    }
                    $matched = $true; break
                }
            }
        }
    }
}
$relEdges = $relEdges | Sort-Object source, target, type, id
Write-PhaseTiming -Phase "Phase 4" -Message "Relationship edges: $($relEdges.Count)"

# Phase 5: Inject edges into dependencies.json
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 5" -Message "Updating dependencies.json..."
$depPath = "$intelJsonDir/dependencies.json"
$depRaw = Get-Content $depPath -Raw -Encoding UTF8
if ($depRaw[0] -eq 0xFEFF) { $depRaw = $depRaw.Substring(1) }
$depObj = $depRaw | ConvertFrom-Json

$depObj.edges = $edges

$newDepJson = $depObj | ConvertTo-Json -Depth 10
$newDepJson = Normalize-Mojibake $newDepJson
Write-Utf8File -Path $depPath -Value $newDepJson
Write-PhaseTiming -Phase "Phase 5" -Message "dependencies.json updated with $($edges.Count) edges"

# Phase 6: Create relationships.json
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 6" -Message "Creating relationships.json..."
$relOutput = @{
    edges = $relEdges
}
$relContent = $relOutput | ConvertTo-Json -Depth 10
$relContent = Normalize-Mojibake $relContent
Write-Utf8File -Path "$intelJsonDir/relationships.json" -Value $relContent
Write-PhaseTiming -Phase "Phase 6" -Message "relationships.json created with $($relEdges.Count) edges"

# Phase 7: Detect circular dependencies
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 7" -Message "Detecting circular dependencies..."
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
Write-PhaseTiming -Phase "Phase 7" -Message "Cycles detected: $cycleCount"
if ($cycleCount -gt 0) { $i=1; foreach ($c in $cycleSet.Values) { Write-Host "  Cycle $i : $($c -join ' -> ')"; $i++ } }

# Phase 7b: Alias resolution pass
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 7b" -Message "Resolving aliases..."
$aliasPath = "$intelJsonDir/aliases.json"
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
    Write-PhaseTiming -Phase "Phase 7b" -Message "Alias resolutions: $aliasResolved, Remaining unmatched: $($unmatched.Count)"
}

# Phase 7c: Update dependencies.json with alias-resolved edges
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 7c" -Message "Updating dependencies.json after alias resolution..."
$depRaw2 = Get-Content $depPath -Raw -Encoding UTF8
if ($depRaw2[0] -eq 0xFEFF) { $depRaw2 = $depRaw2.Substring(1) }
$depObj2 = $depRaw2 | ConvertFrom-Json
$depObj2.edges = $edges
$newDepJson2 = $depObj2 | ConvertTo-Json -Depth 10
Write-Utf8File -Path $depPath -Value $newDepJson2
Write-PhaseTiming -Phase "Phase 7c" -Message "dependencies.json updated with $($edges.Count) edges"

# Phase 7d: Detect circular dependencies on final graph (including alias edges)
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 7d" -Message "Detecting circular dependencies on final graph..."
$graph3 = @{}
foreach ($e in $edges) {
    if (-not $graph3.ContainsKey($e.source)) { $graph3[$e.source] = @() }
    $graph3[$e.source] += $e.target
}
$visited3 = @{}; $recStack3 = @{}; $cycleSet3 = @{}
function Check-Cycle3 {
    param($node, $path)
    if ($recStack3.ContainsKey($node)) {
        $idx = [array]::IndexOf($path, $node)
        if ($idx -ge 0) { $c = $path[$idx..($path.Count-1)]; $key = ($c | Sort-Object) -join '|'; if (-not $cycleSet3.ContainsKey($key)) { $cycleSet3[$key] = $c } }
        return
    }
    if ($visited3.ContainsKey($node)) { return }
    $visited3[$node] = $true; $recStack3[$node] = $true
    if ($graph3.ContainsKey($node)) { foreach ($n in $graph3[$node]) { Check-Cycle3 -node $n -path ($path + $node) } }
    $recStack3.Remove($node)
}
foreach ($n in $graph3.Keys) { if (-not $visited3.ContainsKey($n)) { Check-Cycle3 -node $n -path @() } }
$cycleCount3 = $cycleSet3.Count
Write-PhaseTiming -Phase "Phase 7d" -Message "Cycles detected in final graph: $cycleCount3"
if ($cycleCount3 -gt 0) { $i=1; foreach ($c in $cycleSet3.Values) { Write-Host "  Cycle $i : $($c -join ' -> ')"; $i++ } }

# Phase 7e: Update dependency-index.md with real data
$phaseNow = Get-Date; Write-PhaseTiming -Phase "Phase 7e" -Message "Regenerating dependency-index.md..."
$depIndexPath = "$intelIndexDir/dependency-index.md"

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
$allIDs = $kuDirs | ForEach-Object { ($_.FullName -replace '\\', '/').Replace("$knowledgeDir/", "") }
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

$cycleText = if ($cycleCount3 -eq 0) { "Circular dependencies were checked during generation. None found." } else { $t = "**" + $cycleCount3 + " circular dependencies detected:**`n"; $i = 1; foreach ($c in $cycleSet3.Values) { $seq = $c -join ' -> '; $t += "$i. $seq`n"; $i++ }; $t }

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
$totalSec = ((Get-Date) - $scriptStart).TotalSeconds
Write-PhaseTiming -Phase "Phase 7e" -Message "dependency-index.md regenerated ($((Get-Item $depIndexPath).Length) bytes)"

Write-Host "`n=== COMPLETE ==="
Write-Host "Total runtime: $($totalSec.ToString('0.0')) seconds"
Write-Host "Mapped KUs: $($kuMap.Count)"
Write-Host "Dependency edges: $($edges.Count)"
Write-Host "Relationship edges: $($relEdges.Count)"
Write-Host "Unmatched: $($unmatched.Count)"
Write-Host "dependencies.json: $((Get-Item $depPath).Length) bytes"
Write-Host "relationships.json: $((Get-Item "$intelJsonDir/relationships.json").Length) bytes"
Write-Host "dependency-index.md: $((Get-Item $depIndexPath).Length) bytes"
Write-Host "Total isolated KUs: $($isolated.Count)"
