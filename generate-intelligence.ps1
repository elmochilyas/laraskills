param(
    [string]$KnowledgeUnitsJson = (Resolve-Path (Join-Path $PSScriptRoot "intelligence\json\knowledge-units.json")).Path,
    [string]$TargetDir = (Resolve-Path (Join-Path $PSScriptRoot "intelligence\json")).Path,
    [string]$KnowledgeRoot = (Resolve-Path (Join-Path $PSScriptRoot "knowledge")).Path
)

Write-Host "=== ECC Intelligence JSON Generator ===" -ForegroundColor Cyan
Write-Host "Loading knowledge-units.json..." -ForegroundColor Yellow
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

$kuData = Get-Content -LiteralPath $KnowledgeUnitsJson -Raw -Encoding UTF8 | ConvertFrom-Json
$allKUs = $kuData.knowledge_units
$totalKUs = $allKUs.Count
Write-Host "Loaded $totalKUs knowledge units." -ForegroundColor Green

# Pre-allocate with ArrayList
$rules = [System.Collections.ArrayList]::new()
$skills = [System.Collections.ArrayList]::new()
$decisionTrees = [System.Collections.ArrayList]::new()
$antiPatterns = [System.Collections.ArrayList]::new()
$checklists = [System.Collections.ArrayList]::new()
$dependencyNodes = [System.Collections.ArrayList]::new()
$dependencyEdges = [System.Collections.ArrayList]::new()

$ruleIdCounter = 0
$checklistIdCounter = 0

$readerCount = 0
$readerTotal = $totalKUs * 7

# Phase file names
$phaseFiles = @(
    "04-standardized-knowledge.md",
    "05-rules.md",
    "06-skills.md",
    "07-decision-trees.md",
    "08-anti-patterns.md",
    "09-checklists.md"
)

$kuIndex = 0
foreach ($ku in $allKUs) {
    $kuIndex++
    $domain = $ku.domain
    $subdomain = $ku.subdomain
    $kuTitle = $ku.knowledge_unit
    $dir = $ku.directory
    $fullDir = Join-Path -Path $KnowledgeRoot -ChildPath $dir

    if ($kuIndex % 100 -eq 0 -or $kuIndex -eq $totalKUs) {
        $pct = [math]::Round(($kuIndex / $totalKUs) * 100, 1)
        $elapsed = $stopwatch.Elapsed.TotalSeconds
        $rate = if ($kuIndex -gt 0) { $kuIndex / $elapsed } else { 0 }
        $remaining = if ($rate -gt 0) { ($totalKUs - $kuIndex) / $rate } else { 0 }
        Write-Host "  $kuIndex/$totalKUs ($pct%) | rate: $([math]::Round($rate,1))/s | eta: $([math]::Round($remaining,0))s | rules:$($rules.Count) skills:$($skills.Count)" -ForegroundColor DarkGray
    }

    # Node for dependencies
    $nodeId = "$domain/$subdomain/$kuTitle"
    [void]$dependencyNodes.Add([PSCustomObject]@{
        id = $nodeId
        domain = $domain
        subdomain = $subdomain
        knowledge_unit = $kuTitle
        directory = $dir
    })

    $foundRefs = @{}
    $rulesContent = $null
    $skillsContent = $null
    $dtContent = $null
    $apContent = $null
    $clContent = $null
    $knowledgeContent = $null

    foreach ($pf in $phaseFiles) {
        $pfPath = Join-Path -Path $fullDir -ChildPath $pf
        if (Test-Path -LiteralPath $pfPath) {
            try {
                $pfContent = Get-Content -LiteralPath $pfPath -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
                if (-not $pfContent) { continue }
                
                # Route content based on file type
                switch -Wildcard ($pf) {
                    "04*" { $knowledgeContent = $pfContent }
                    "05*" { $rulesContent = $pfContent }
                    "06*" { $skillsContent = $pfContent }
                    "07*" { $dtContent = $pfContent }
                    "08*" { $apContent = $pfContent }
                    "09*" { $clContent = $pfContent }
                }
                
                # Dependencies: search for cross-KU references in ALL files
                $refs = [regex]::Matches($pfContent, 'knowledge/([^/"\s)]+)/([^/"\s)]+)/([^/"\s.#)]+)')
                foreach ($ref in $refs) {
                    $rDomain = $ref.Groups[1].Value
                    $rSubdomain = $ref.Groups[2].Value
                    $rKU = $ref.Groups[3].Value
                    $refKey = "$rDomain/$rSubdomain/$rKU"
                    if ($refKey -ne $nodeId) { $foundRefs[$refKey] = $true }
                }
                # Also scan for related/see patterns
                $altRefs = [regex]::Matches($pfContent, '(?:knowledge|related|see)\s*[:/]\s*([a-z]+(?:-[a-z]+)*)/([a-z]+(?:-[a-z]+)*)/([a-z0-9-]+)')
                foreach ($ref in $altRefs) {
                    $refKey = "$($ref.Groups[1].Value)/$($ref.Groups[2].Value)/$($ref.Groups[3].Value)"
                    if ($refKey -ne $nodeId) { $foundRefs[$refKey] = $true }
                }
            } catch { }
        }
    }

    # --- Parse RULES (05-rules.md) ---
    if ($ku.has_rules -and $rulesContent) {
        # Format B: Table-based rules — ## Rule N: Title with |**Name**|*| table
        $tableMatches = [regex]::Matches($rulesContent, '(?ms)^##\s+Rule\s+\d+[:\s]+(.+?)$(.*?)(?=^##\s+Rule\s+\d+[:\s]+|\z)')
        foreach ($tm in $tableMatches) {
            $title = $tm.Groups[1].Value.Trim()
            $body = $tm.Groups[2].Value
            
            # Try to extract from table rows
            $nameMatch = [regex]::Match($body, '(?m)^\|\s*\*{0,2}Name\*{0,2}\s*\|\s*(.+?)\s*\|')
            $catMatch = [regex]::Match($body, '(?m)^\|\s*\*{0,2}Category\*{0,2}\s*\|\s*(.+?)\s*\|')
            $ruleMatch = [regex]::Match($body, '(?m)^\|\s*\*{0,2}Rule\*{0,2}\s*\|\s*(.+?)\s*\|')
            
            $rName = if ($nameMatch.Success) { $nameMatch.Groups[1].Value.Trim() } else { $title }
            $rCat = if ($catMatch.Success) { $catMatch.Groups[1].Value.Trim() } else { "" }
            $rText = if ($ruleMatch.Success) { $ruleMatch.Groups[1].Value.Trim() } else { $rName }
            
            $ruleIdCounter++
            [void]$rules.Add([PSCustomObject]@{
                id = "rule-$ruleIdCounter"
                rule_text = $rText
                category = $rCat
                domain = $domain
                subdomain = $subdomain
                knowledge_unit = $kuTitle
                source_path = $dir
            })
        }

        # Format A: Heading-based rules — ## Title then ## Category / ## Rule subsections
        if ($tableMatches.Count -eq 0) {
            $headingBlocks = [regex]::Matches($rulesContent, '(?ms)^##\s+(.+?)$(.*?)(?=^##\s+|\z)')
            foreach ($hb in $headingBlocks) {
                $hTitle = $hb.Groups[1].Value.Trim()
                if ($hTitle -match '^(Category|Rule|Reason|Bad Example|Good Example|Exceptions|Consequences|Metadata|Overview)') { continue }
                $hBody = $hb.Groups[2].Value
                
                $rTextMatch = [regex]::Match($hBody, '(?m)^##\s+Rule\s*\n\s*(.+?)$')
                $rCatMatch = [regex]::Match($hBody, '(?m)^##\s+Category\s*\n\s*(.+?)$')
                
                if ($rTextMatch.Success -or $rCatMatch.Success) {
                    $ruleIdCounter++
                    [void]$rules.Add([PSCustomObject]@{
                        id = "rule-$ruleIdCounter"
                        rule_text = if ($rTextMatch.Success) { $rTextMatch.Groups[1].Value.Trim() } else { $hTitle }
                        category = if ($rCatMatch.Success) { $rCatMatch.Groups[1].Value.Trim() } else { "" }
                        domain = $domain
                        subdomain = $subdomain
                        knowledge_unit = $kuTitle
                        source_path = $dir
                    })
                }
            }
        }

        # If still nothing, try list-item based rules
        if ($tableMatches.Count -eq 0) {
            $listRules = [regex]::Matches($rulesContent, '(?m)^[-\*]\s+\*{0,2}([^*\n]+?)\*{0,2}\s*[-:]\s*(.+?)$')
            foreach ($lr in $listRules) {
                $ruleIdCounter++
                [void]$rules.Add([PSCustomObject]@{
                    id = "rule-$ruleIdCounter"
                    rule_text = "$($lr.Groups[1].Value.Trim()): $($lr.Groups[2].Value.Trim())"
                    category = ""
                    domain = $domain
                    subdomain = $subdomain
                    knowledge_unit = $kuTitle
                    source_path = $dir
                })
            }
        }
    }

    # --- Parse SKILLS (06-skills.md) ---
    if ($ku.has_skills -and $skillsContent) {
        # Find skill names from # headings, skip known subsection headings
        $skillNames = [regex]::Matches($skillsContent, '(?m)^#\s+(?:Skill:\s*)?(.+?)$') | Where-Object {
            $_.Groups[1].Value.Trim() -notmatch '^(Purpose|When\s+To\s+Use|When\s+NOT|Prerequisites|Inputs|Workflow|Validation|Common|Decision|Metadata|Domain:|Subdomain:|Knowledge)'
        }
        foreach ($sn in $skillNames) {
            $name = $sn.Groups[1].Value.Trim()
            if ($name.Length -gt 3) {
                [void]$skills.Add([PSCustomObject]@{
                    skill_name = $name
                    domain = $domain
                    subdomain = $subdomain
                    knowledge_unit = $kuTitle
                    source_path = $dir
                })
            }
        }
    }

    # --- Parse DECISION TREES (07-decision-trees.md) ---
    if ($ku.has_decision_trees -and $dtContent) {
        $seenTrees = @{}
        $treeMatches = [regex]::Matches($dtContent, '(?m)^#{2,4}\s+(?:Tree\s+\d+[:\s]+)?(.+?)$') | Where-Object {
            $t = $_.Groups[1].Value.Trim()
            $t -notmatch '^(Metadata|Decision\s+(Inventory|Context|Criteria|Tree)|Domain:|Subdomain:|Knowledge)'
        }
        foreach ($tm in $treeMatches) {
            $dName = $tm.Groups[1].Value.Trim()
            if ($dName.Length -gt 3 -and !$seenTrees.ContainsKey($dName)) {
                $seenTrees[$dName] = $true
                [void]$decisionTrees.Add([PSCustomObject]@{
                    decision_name = $dName
                    domain = $domain
                    subdomain = $subdomain
                    knowledge_unit = $kuTitle
                    source_path = $dir
                })
            }
        }
    }

    # --- Parse ANTI-PATTERNS (08-anti-patterns.md) ---
    if ($ku.has_anti_patterns -and $apContent) {
        $apBlocks = [regex]::Matches($apContent, '(?ms)^##\s+Anti-Pattern\s+\d+[:\s]+(.+?)$(.*?)(?=^##\s+Anti-Pattern\s+\d+[:\s]+|\z)')
        foreach ($ap in $apBlocks) {
            $apName = $ap.Groups[1].Value.Trim()
            $apBody = $ap.Groups[2].Value
            
            $apCat = ""
            $apSev = ""
            
            $catMatch = [regex]::Match($apBody, '(?m)^#+\s+Category\s*\n\s*(.+?)$(?:\n|$)')
            if ($catMatch.Success) { $apCat = $catMatch.Groups[1].Value.Trim() }
            $sevMatch = [regex]::Match($apBody, '(?m)^#+\s+Severity\s*\n\s*(.+?)$(?:\n|$)')
            if ($sevMatch.Success) { $apSev = $sevMatch.Groups[1].Value.Trim() }
            if (-not $apCat) {
                $catTable = [regex]::Match($apBody, '(?m)^\|\s*\*{0,2}Category\*{0,2}\s*\|\s*(.+?)\s*\|')
                if ($catTable.Success) { $apCat = $catTable.Groups[1].Value.Trim() }
            }
            
            [void]$antiPatterns.Add([PSCustomObject]@{
                anti_pattern_name = $apName
                category = $apCat
                severity = $apSev
                domain = $domain
                subdomain = $subdomain
                knowledge_unit = $kuTitle
                source_path = $dir
            })
        }

        # Also check inventory tables for anti-patterns
        if ($apBlocks.Count -eq 0) {
            $invRows = [regex]::Matches($apContent, '(?m)^\|\s*\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|')
            foreach ($ir in $invRows) {
                $apName = $ir.Groups[1].Value.Trim()
                $apCat = $ir.Groups[2].Value.Trim()
                $apSev = $ir.Groups[3].Value.Trim()
                if ($apName -notmatch '^(#|Anti-Pattern)' -and $apName.Length -gt 3) {
                    [void]$antiPatterns.Add([PSCustomObject]@{
                        anti_pattern_name = $apName
                        category = $apCat
                        severity = $apSev
                        domain = $domain
                        subdomain = $subdomain
                        knowledge_unit = $kuTitle
                        source_path = $dir
                    })
                }
            }
        }
    }

    # --- Parse CHECKLISTS (09-checklists.md) ---
    if ($ku.has_checklists -and $clContent) {
        $clSections = [regex]::Matches($clContent, '(?ms)^#\s+(.+)$(.*?)(?=^#\s+|\z)')
        $checklistEntries = @()
        foreach ($cl in $clSections) {
            $clTitle = $cl.Groups[1].Value.Trim()
            $clBody = $cl.Groups[2].Value
            if ($clTitle -match '^(Metadata)') { continue }
            
            $items = @()
            $itemMatches = [regex]::Matches($clBody, '(?m)^\s*[-*]\s*\[[. x]?\]\s*(.+?)$')
            if ($itemMatches.Count -gt 0) {
                foreach ($im in $itemMatches) {
                    $txt = $im.Groups[1].Value.Trim()
                    if ($txt.Length -gt 2) { $items += $txt }
                }
            } else {
                $bulletItems = [regex]::Matches($clBody, '(?m)^\s*[-*]\s+\*{0,2}(.+?)\*{0,2}\s*[-:]\s*(.+?)$')
                foreach ($bi in $bulletItems) {
                    $items += "$($bi.Groups[1].Value.Trim()): $($bi.Groups[2].Value.Trim())"
                }
                if ($items.Count -eq 0) {
                    $plainItems = [regex]::Matches($clBody, '(?m)^\s*[-*]\s+(.+?)$')
                    foreach ($pi in $plainItems) {
                        $txt = $pi.Groups[1].Value.Trim()
                        if ($txt.Length -gt 2 -and $txt -notmatch '^\[') { $items += $txt }
                    }
                }
            }
            
            if ($items.Count -gt 0) {
                $checklistEntries += [PSCustomObject]@{
                    stage = $clTitle
                    items = @($items)
                }
            }
        }
        
        if ($checklistEntries.Count -gt 0) {
            $checklistIdCounter++
            [void]$checklists.Add([PSCustomObject]@{
                id = "checklist-$checklistIdCounter"
                domain = $domain
                subdomain = $subdomain
                knowledge_unit = $kuTitle
                source_path = $dir
                checklists = @($checklistEntries)
            })
        }
    }

    # --- DEPENDENCIES edges ---
    foreach ($targetId in $foundRefs.Keys) {
        [void]$dependencyEdges.Add([PSCustomObject]@{
            source = $nodeId
            target = $targetId
            type = "references"
        })
    }
}

$stopwatch.Stop()
Write-Host "`n=== Processing Complete ($([math]::Round($stopwatch.Elapsed.TotalSeconds, 1))s) ===" -ForegroundColor Cyan
Write-Host "Raw counts: rules=$($rules.Count) skills=$($skills.Count) trees=$($decisionTrees.Count) ap=$($antiPatterns.Count) cl=$($checklists.Count) nodes=$($dependencyNodes.Count) edges=$($dependencyEdges.Count)" -ForegroundColor Yellow

# --- Deduplicate edges ---
Write-Host "Deduplicating dependency edges..." -ForegroundColor Yellow
$uniqueEdges = @{}
foreach ($edge in $dependencyEdges) {
    $key = "$($edge.source)|$($edge.target)"
    $uniqueEdges[$key] = $edge
}
$dedupedEdges = $uniqueEdges.Values
Write-Host "  Edges: $($dependencyEdges.Count) -> $($dedupedEdges.Count) after dedup" -ForegroundColor Green

# --- Write JSON output files ---
Write-Host "`nWriting output files..." -ForegroundColor Yellow

# Helper to write JSON
function Write-JsonFile {
    param($Object, $Path)
    $json = $Object | ConvertTo-Json -Depth 10 -Compress:$false
    # Prettify with 2-space indent
    $sb = [System.Text.StringBuilder]::new()
    $indent = 0
    $inString = $false
    $i = 0
    while ($i -lt $json.Length) {
        $c = $json[$i]
        if ($c -eq '"') { $inString = -not $inString; $sb.Append($c) | Out-Null }
        elseif ($inString) { $sb.Append($c) | Out-Null }
        elseif ($c -eq '{' -or $c -eq '[') { 
            $indent++
            $sb.Append($c).Append("`n").Append(' ' * ($indent * 2)) | Out-Null
        }
        elseif ($c -eq '}' -or $c -eq ']') { 
            $indent--
            $sb.Append("`n").Append(' ' * ($indent * 2)).Append($c) | Out-Null
        }
        elseif ($c -eq ',') { $sb.Append($c).Append("`n").Append(' ' * ($indent * 2)) | Out-Null }
        elseif ($c -eq ':') { $sb.Append($c).Append(' ') | Out-Null }
        elseif ($c -eq ' ') { }
        else { $sb.Append($c) | Out-Null }
        $i++
    }
    $prettyJson = $sb.ToString()
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $prettyJson, $utf8NoBom)
}

# Rules
$rulesObj = [PSCustomObject]@{ rules = @($rules) }
Write-JsonFile -Object $rulesObj -Path (Join-Path -Path $TargetDir -ChildPath "rules.json")
$rulesSize = (Get-Item (Join-Path $TargetDir "rules.json")).Length
Write-Host "  rules.json: $($rules.Count) items | $rulesSize bytes" -ForegroundColor Green

# Skills
$skillsObj = [PSCustomObject]@{ skills = @($skills) }
Write-JsonFile -Object $skillsObj -Path (Join-Path -Path $TargetDir -ChildPath "skills.json")
$skillsSize = (Get-Item (Join-Path $TargetDir "skills.json")).Length
Write-Host "  skills.json: $($skills.Count) items | $skillsSize bytes" -ForegroundColor Green

# Decision Trees
$dtObj = [PSCustomObject]@{ decision_trees = @($decisionTrees) }
Write-JsonFile -Object $dtObj -Path (Join-Path -Path $TargetDir -ChildPath "decision-trees.json")
$dtSize = (Get-Item (Join-Path $TargetDir "decision-trees.json")).Length
Write-Host "  decision-trees.json: $($decisionTrees.Count) items | $dtSize bytes" -ForegroundColor Green

# Anti-Patterns
$apObj = [PSCustomObject]@{ anti_patterns = @($antiPatterns) }
Write-JsonFile -Object $apObj -Path (Join-Path -Path $TargetDir -ChildPath "anti-patterns.json")
$apSize = (Get-Item (Join-Path $TargetDir "anti-patterns.json")).Length
Write-Host "  anti-patterns.json: $($antiPatterns.Count) items | $apSize bytes" -ForegroundColor Green

# Checklists
$clObj = [PSCustomObject]@{ checklists = @($checklists) }
Write-JsonFile -Object $clObj -Path (Join-Path -Path $TargetDir -ChildPath "checklists.json")
$clSize = (Get-Item (Join-Path $TargetDir "checklists.json")).Length
Write-Host "  checklists.json: $($checklists.Count) items | $clSize bytes" -ForegroundColor Green

# Dependencies
$depObj = [PSCustomObject]@{
    nodes = @($dependencyNodes)
    edges = @($dedupedEdges)
}
Write-JsonFile -Object $depObj -Path (Join-Path -Path $TargetDir -ChildPath "dependencies.json")
$depSize = (Get-Item (Join-Path $TargetDir "dependencies.json")).Length
Write-Host "  dependencies.json: $($dependencyNodes.Count) nodes, $($dedupedEdges.Count) edges | $depSize bytes" -ForegroundColor Green

# --- Final Summary ---
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "            FINAL SUMMARY              " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$files = @(
    @{Name="rules.json"; Count=$rules.Count},
    @{Name="skills.json"; Count=$skills.Count},
    @{Name="decision-trees.json"; Count=$decisionTrees.Count},
    @{Name="anti-patterns.json"; Count=$antiPatterns.Count},
    @{Name="checklists.json"; Count=$checklists.Count},
    @{Name="dependencies.json"; Count="$($dependencyNodes.Count) nodes, $($dedupedEdges.Count) edges"}
)

foreach ($f in $files) {
    $p = Join-Path -Path $TargetDir -ChildPath $f.Name
    if (Test-Path -LiteralPath $p) {
        $sz = (Get-Item -LiteralPath $p).Length
        Write-Host ("  {0,-30} {1,15} {2,12:N0} bytes" -f $f.Name, $f.Count, $sz)
    }
}

Write-Host ""
Write-Host "Done in $([math]::Round($stopwatch.Elapsed.TotalSeconds, 1))s" -ForegroundColor Green
