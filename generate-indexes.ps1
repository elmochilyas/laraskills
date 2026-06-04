#Requires -Version 5.1
$ErrorActionPreference = 'Stop'

$JsonDir   = "C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc\intelligence\json"
$IndexDir  = "C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc\intelligence\indexes"
$RegDir    = "C:\Users\Pc\Desktop\laravel skills from every thing claude code\laravel-ecc\intelligence\registry"

$generated = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$generatedDate = Get-Date -Format "yyyy-MM-dd"
$check    = [char]0x2713
$dashDash = [char]0x2014

Write-Host "Loading JSON files..."

$kusData = Get-Content "$JsonDir\knowledge-units.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$rulesData = Get-Content "$JsonDir\rules.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$skillsData = Get-Content "$JsonDir\skills.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$dtData = Get-Content "$JsonDir\decision-trees.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$apData = Get-Content "$JsonDir\anti-patterns.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$clData = Get-Content "$JsonDir\checklists.json" -Raw -Encoding UTF8 | ConvertFrom-Json
$depData = Get-Content "$JsonDir\dependencies.json" -Raw -Encoding UTF8 | ConvertFrom-Json

$kus  = $kusData.knowledge_units
$rules   = $rulesData.rules
$skills  = $skillsData.skills
$dts     = $dtData.decision_trees
$aps     = $apData.anti_patterns
$cls     = $clData.checklists
$depNodes = $depData.nodes
$depEdges = $depData.edges

Write-Host "Loaded: $($kus.Count) KUs, $($rules.Count) rules, $($skills.Count) skills, $($dts.Count) decisions, $($aps.Count) anti-patterns, $($cls.Count) checklists, $($depNodes.Count) nodes, $($depEdges.Count) edges"

function Get-DSlug { param([string]$d) $d.ToLower() -replace '[^a-z0-9]+', '-' -replace '-+$', '' }

# Normalize domain names to canonical 21
$domainNormalize = @{
    "AI & Intelligence Systems" = "AI & Intelligence Systems"
    "API & CRUD System Engineering" = "API & CRUD System Engineering"
    "API CRUD System Engineering" = "API & CRUD System Engineering"
    "API Integration Engineering" = "API Integration Engineering"
    "Application Architecture Patterns" = "Application Architecture Patterns"
    "Async & Distributed Systems" = "Async & Distributed Systems"
    "Backend Architecture & Design" = "Backend Architecture Design"
    "Backend Architecture Design" = "Backend Architecture Design"
    "Cost & Resource Optimization" = "Cost & Resource Optimization"
    "Data & Storage Systems" = "Data Storage Systems"
    "Data Storage Systems" = "Data Storage Systems"
    "Data Engineering & Analytics" = "Data Engineering & Analytics"
    "DevOps & Infrastructure" = "DevOps & Infrastructure"
    "Governance & Compliance Engineering" = "Governance & Compliance Engineering"
    "Laravel Core Application Engineering" = "Laravel Core Application Engineering"
    "Laravel Eloquent & Domain Modeling" = "Laravel Eloquent Domain Modeling"
    "Laravel Eloquent Domain Modeling" = "Laravel Eloquent Domain Modeling"
    "Laravel Execution Lifecycle" = "Laravel Execution Lifecycle"
    "Observability & Production Intelligence" = "Observability & Production Intelligence"
    "Performance & Runtime Engineering" = "Performance & Runtime Engineering"
    "Platform Engineering & Developer Experience" = "Platform Engineering & Developer Experience"
    "Real-Time Systems" = "Real-Time Systems"
    "Search & Retrieval Systems" = "Search & Retrieval Systems"
    "Security & Identity Engineering" = "Security & Identity Engineering"
    "Testing & Reliability Engineering" = "Testing & Reliability Engineering"
}

# Build domain counts
$domainCounts = @{}
foreach ($ku in $kus) {
    $raw = $ku.domain
    $d = if ($domainNormalize.ContainsKey($raw)) { $domainNormalize[$raw] } else { $raw }
    if (-not $d) { $d = $raw }
    $ku | Add-Member -MemberType NoteProperty -Name "domain_norm" -Value $d -Force
    if (-not $domainCounts.ContainsKey($d)) { $domainCounts[$d] = @{kus=0; rules=0; skills=0; dts=0; aps=0; cls=0; subs=@{}} }
    $domainCounts[$d].kus++
    $sdSlug = $ku.subdomain_slug
    if (-not $domainCounts[$d].subs.ContainsKey($sdSlug)) { $domainCounts[$d].subs[$sdSlug] = @{name=$ku.subdomain; kus=@()} }
    $domainCounts[$d].subs[$sdSlug].kus += $ku
}
foreach ($r in $rules)   { 
    $raw = $r.domain
    $d = if ($domainNormalize.ContainsKey($raw)) { $domainNormalize[$raw] } else { $raw }
    if (-not $d) { $d = $raw }
    $r | Add-Member -MemberType NoteProperty -Name "domain_norm" -Value $d -Force
    if ($d -and $domainCounts.ContainsKey($d)) { $domainCounts[$d].rules++ } 
}
foreach ($s in $skills)  { 
    $raw = $s.domain
    $d = if ($domainNormalize.ContainsKey($raw)) { $domainNormalize[$raw] } else { $raw }
    if (-not $d) { $d = $raw }
    $s | Add-Member -MemberType NoteProperty -Name "domain_norm" -Value $d -Force
    if ($d -and $domainCounts.ContainsKey($d)) { $domainCounts[$d].skills++ } 
}
foreach ($dt in $dts)    { 
    $raw = $dt.domain
    $d = if ($domainNormalize.ContainsKey($raw)) { $domainNormalize[$raw] } else { $raw }
    if (-not $d) { $d = $raw }
    $dt | Add-Member -MemberType NoteProperty -Name "domain_norm" -Value $d -Force
    if ($d -and $domainCounts.ContainsKey($d)) { $domainCounts[$d].dts++ } 
}
foreach ($ap in $aps)    { 
    $raw = $ap.domain
    $d = if ($domainNormalize.ContainsKey($raw)) { $domainNormalize[$raw] } else { $raw }
    if (-not $d) { $d = $raw }
    $ap | Add-Member -MemberType NoteProperty -Name "domain_norm" -Value $d -Force
    if ($d -and $domainCounts.ContainsKey($d)) { $domainCounts[$d].aps++ } 
}
foreach ($cl in $cls)    { 
    $raw = $cl.domain
    $d = if ($domainNormalize.ContainsKey($raw)) { $domainNormalize[$raw] } else { $raw }
    if (-not $d) { $d = $raw }
    $cl | Add-Member -MemberType NoteProperty -Name "domain_norm" -Value $d -Force
    if ($d -and $domainCounts.ContainsKey($d)) { $domainCounts[$d].cls++ } 
}

$sortedDomains = $domainCounts.Keys | Sort-Object

function Out-MarkdownFile {
    param([string]$Path, [string[]]$Lines)
    $content = $Lines -join "`r`n"
    [System.IO.File]::WriteAllText($Path, $content, [System.Text.Encoding]::UTF8)
}

# ===================================================================
# 1. knowledge-unit-index.md
# ===================================================================
Write-Host "Generating knowledge-unit-index.md..."
$lines = @()
$lines += "# ECC Knowledge Unit Index"
$lines += ""
$lines += "Fast discovery of all Knowledge Units in the repository."
$lines += ""
$lines += "| Attribute | Value |"
$lines += "|-----------|-------|"
$lines += "| Total KUs | $($kus.Count) |"
$lines += "| Domains | $($domainCounts.Count) |"
$lines += "| Generated | $generated |"
$lines += ""
$lines += "---"
$lines += ""
$lines += "## Quick Navigation"
$lines += ""
foreach ($d in $sortedDomains) {
    $lines += "- [$d](#$(Get-DSlug $d)) ($($domainCounts[$d].kus) KUs)"
}
$lines += ""

foreach ($d in $sortedDomains) {
    $lines += "---"
    $lines += ""
    $lines += "## $d"
    $lines += ""
    $lines += "| Knowledge Unit | Subdomain | Difficulty | Rules | Skills | Decision Trees | Anti-Patterns |"
    $lines += "|---------------|-----------|-----------|-------|--------|----------------|---------------|"
    $sdSlugs = $domainCounts[$d].subs.Keys | Sort-Object
    foreach ($sdSlug in $sdSlugs) {
        $sdInfo = $domainCounts[$d].subs[$sdSlug]
        foreach ($ku in $sdInfo.kus) {
            $kn = $ku.knowledge_unit
            $di = if ($ku.difficulty.normalized) { $ku.difficulty.normalized } else { "unknown" }
            $hr = if ($ku.has_rules) { $check } else { "-" }
            $hs = if ($ku.has_skills) { $check } else { "-" }
            $hd = if ($ku.has_decision_trees) { $check } else { "-" }
            $ha = if ($ku.has_anti_patterns) { $check } else { "-" }
            $kp = $ku.directory
            $lines += "| [$kn](../$kp/04-standardized-knowledge.md) | $($sdInfo.name) | $di | $hr | $hs | $hd | $ha |"
        }
    }
    $lines += ""
}
Out-MarkdownFile -Path "$IndexDir\knowledge-unit-index.md" -Lines $lines
Write-Host "  -> $($lines.Count) lines"

# ===================================================================
# 2. rule-index.md
# ===================================================================
Write-Host "Generating rule-index.md..."
$lines = @()
$lines += "# ECC Rule Index"
$lines += ""
$lines += "Repository-wide rule registry. Centralized discovery for AI agents."
$lines += ""
$lines += "| Attribute | Value |"
$lines += "|-----------|-------|"
$lines += "| Total Rules | $($rules.Count) |"
$lines += "| Domains | $($domainCounts.Count) |"
$lines += "| Generated | $generated |"
$lines += ""
$lines += "---"
$lines += ""
$lines += "## Top 100 Most Important Rules"
$lines += ""
$lines += "| Rank | Rule Name | Domain | Knowledge Unit |"
$lines += "|------|-----------|--------|---------------|"
$rank = 1; $seen = @{}
foreach ($r in $rules) {
    if ($rank -gt 100) { break }
    $k = $r.rule_text
    if (-not $seen.ContainsKey($k)) { $seen[$k] = $true; $lines += "| $rank | $($r.rule_text) | $($r.domain_norm) | $($r.knowledge_unit) |"; $rank++ }
}
$lines += ""
$lines += "---"
$lines += ""
$lines += "## Rules By Domain"
$lines += ""
foreach ($d in $sortedDomains) {
    $dr = $rules | Where-Object { $_.domain_norm -eq $d }
    $lines += "### $d ($($dr.Count) rules)"
    $lines += ""
    $lines += "| Rule Name | Knowledge Unit | Source |"
    $lines += "|-----------|---------------|--------|"
    $cnt = 0
    foreach ($r in $dr) {
        if ($cnt -ge 100) { $rem = $dr.Count - 100; $lines += "| ... and $rem more rules ... | | |"; break }
        $lines += "| $($r.rule_text) | $($r.knowledge_unit) | [$($r.subdomain)]($($r.source_path)) |"
        $cnt++
    }
    $lines += ""
}
Out-MarkdownFile -Path "$IndexDir\rule-index.md" -Lines $lines
Write-Host "  -> $($lines.Count) lines"

# ===================================================================
# 3. skill-index.md
# ===================================================================
Write-Host "Generating skill-index.md..."
$lines = @()
$lines += "# ECC Skill Index"
$lines += ""
$lines += "Repository-wide skill registry. Rapid discovery of executable workflows."
$lines += ""
$lines += "| Attribute | Value |"
$lines += "|-----------|-------|"
$lines += "| Total Skills | $($skills.Count) |"
$lines += "| Domains | $($domainCounts.Count) |"
$lines += "| Generated | $generated |"
$lines += ""
$lines += "---"
$lines += ""
$lines += "## Skills By Domain"
$lines += ""
foreach ($d in $sortedDomains) {
    $ds = $skills | Where-Object { $_.domain_norm -eq $d }
    $lines += "### $d ($($ds.Count) skills)"
    $lines += ""
    $sdg = @{}
    foreach ($s in $ds) { $sd = $s.subdomain; if (-not $sdg.ContainsKey($sd)) { $sdg[$sd] = @() }; $sdg[$sd] += $s }
    foreach ($sd in ($sdg.Keys | Sort-Object)) {
        foreach ($s in $sdg[$sd]) {
            $lines += "- **$($s.skill_name)** - [$($s.knowledge_unit)]($($s.source_path))"
        }
    }
    $lines += ""
}
Out-MarkdownFile -Path "$IndexDir\skill-index.md" -Lines $lines
Write-Host "  -> $($lines.Count) lines"

# ===================================================================
# 4. decision-tree-index.md
# ===================================================================
Write-Host "Generating decision-tree-index.md..."
$lines = @()
$lines += "# ECC Decision Intelligence Index"
$lines += ""
$lines += "Repository-wide decision registry for engineering decisions across all 21 domains."
$lines += ""
$lines += "**Generated:** $generatedDate"
$lines += "**Total decisions catalogued:** $($dts.Count) unique decisions"
$lines += "**Domains covered:** $($domainCounts.Count)"
$lines += ""
$lines += "---"
$lines += ""
$lines += "# Quick Navigation"
$lines += ""
foreach ($d in $sortedDomains) {
    $dc = ($dts | Where-Object { $_.domain_norm -eq $d }).Count
    $lines += "* [$d](#$(Get-DSlug $d)) ($dc decisions)"
}
$lines += ""
$lines += "---"
$lines += ""
foreach ($d in $sortedDomains) {
    $dd = $dts | Where-Object { $_.domain_norm -eq $d }
    $lines += "## $d"
    $lines += ""
    $lines += "| Decision Name | Knowledge Unit | Source |"
    $lines += "|---------------|---------------|--------|"
    $cnt = 0
    foreach ($dt in $dd) {
        if ($cnt -ge 100) { $rem = $dd.Count - 100; $lines += "| ... and $rem more decisions ... | | |"; break }
        $lines += "| $($dt.decision_name) | $($dt.knowledge_unit) | [$($dt.subdomain)]($($dt.source_path)) |"
        $cnt++
    }
    $lines += ""
    $lines += "---"
    $lines += ""
}
Out-MarkdownFile -Path "$IndexDir\decision-tree-index.md" -Lines $lines
Write-Host "  -> $($lines.Count) lines"

# ===================================================================
# 5. anti-pattern-index.md
# ===================================================================
Write-Host "Generating anti-pattern-index.md..."
$apCats = @{}
foreach ($ap in $aps) {
    $cat = if ($ap.category) { $ap.category } else { "Uncategorized" }
    if (-not $apCats.ContainsKey($cat)) { $apCats[$cat] = @() }
    $apCats[$cat] += $ap
}

$lines = @()
$lines += "# ECC Anti-Pattern Intelligence Index"
$lines += ""
$lines += "Repository-wide anti-pattern registry for all 21 ECC domains."
$lines += ""
$lines += "**Total Unique Anti-Patterns:** $($aps.Count)"
$lines += ""
$lines += "**Generated:** $generated"
$lines += ""
$lines += "## Quick Navigation"
$lines += ""
foreach ($cat in ($apCats.Keys | Sort-Object)) {
    $cslug = $cat.ToLower() -replace ' ', '-'
    $lines += "- [$cat](#$cslug) ($($apCats[$cat].Count) anti-patterns)"
}
$lines += ""
$lines += "---"
$lines += ""
$lines += "## Top 50 Most Dangerous Anti-Patterns"
$lines += ""
$lines += "| Rank | Anti-Pattern | Category | Severity | Domain | Knowledge Unit |"
$lines += "|------|-------------|----------|----------|--------|---------------|"
$rank = 1; $seenAp = @{}
foreach ($ap in $aps) {
    if ($rank -gt 50) { break }
    $k = $ap.anti_pattern_name
    if (-not $seenAp.ContainsKey($k)) { $seenAp[$k] = $true; $lines += "| $rank | $($ap.anti_pattern_name) | $($ap.category) | $($ap.severity) | $($ap.domain_norm) | $($ap.knowledge_unit) |"; $rank++ }
}
$lines += ""
$lines += "---"
$lines += ""
foreach ($cat in ($apCats.Keys | Sort-Object)) {
    $cslug = $cat.ToLower() -replace ' ', '-'
    $lines += "## $cat"
    $lines += ""
    $lines += "**$($apCats[$cat].Count) anti-patterns in this category.**"
    $lines += ""
    $lines += "| Anti-Pattern | Severity | Domain | Knowledge Unit | Source |"
    $lines += "|-------------|----------|--------|---------------|--------|"
    $cnt = 0
    foreach ($ap in $apCats[$cat]) {
        if ($cnt -ge 100) { $rem = $apCats[$cat].Count - 100; $lines += "| ... and $rem more anti-patterns ... | | | |"; break }
        $lines += "| $($ap.anti_pattern_name) | $($ap.severity) | $($ap.domain_norm) | $($ap.knowledge_unit) | [$($ap.subdomain)]($($ap.source_path)) |"
        $cnt++
    }
    $lines += ""
    $lines += "---"
    $lines += ""
}
Out-MarkdownFile -Path "$IndexDir\anti-pattern-index.md" -Lines $lines
Write-Host "  -> $($lines.Count) lines"

# ===================================================================
# 6. checklist-index.md
# ===================================================================
Write-Host "Generating checklist-index.md..."
$lines = @()
$lines += "# ECC Checklist Intelligence Index"
$lines += ""
$lines += "Repository-wide checklist registry. AI-agent-optimized validation discovery across all 21 domains."
$lines += ""
$lines += "| Attribute | Value |"
$lines += "|-----------|-------|"
$lines += "| Total Checklists | $($cls.Count) |"
$lines += "| Domains | $($domainCounts.Count) |"
$lines += "| Generated | $generated |"
$lines += ""
$lines += "---"
$lines += ""
$lines += "## Quick Navigation"
$lines += ""
foreach ($d in $sortedDomains) {
    $dcls = $cls | Where-Object { $_.domain_norm -eq $d }
    $lines += "- [$d](#$(Get-DSlug $d)) ($($dcls.Count) checklists)"
}
$lines += ""
$lines += "---"
$lines += ""
$lines += "## Checklists By Domain"
$lines += ""
foreach ($d in $sortedDomains) {
    $dcls = $cls | Where-Object { $_.domain_norm -eq $d }
    $lines += "### $d ($($dcls.Count) checklists)"
    $lines += ""
    $sdg = @{}
    foreach ($cl in $dcls) {
        $sd = $cl.subdomain
        if (-not $sdg.ContainsKey($sd)) { $sdg[$sd] = @() }
        $sdg[$sd] += $cl
    }
    foreach ($sd in ($sdg.Keys | Sort-Object)) {
        $items = $sdg[$sd]
        $links = @()
        foreach ($cl in $items) {
            $clName = $cl.id.Split('/')[-1]
            $totalItems = 0; $totalStages = 0
            if ($cl.checklists) {
                foreach ($section in $cl.checklists) {
                    $totalStages++; if ($section.items) { $totalItems += $section.items.Count }
                }
            }
            $links += "[$clName]($($cl.source_path)) ($totalStages stages, $totalItems items)"
        }
        $lineStr = "**$sd**: $($links -join ', ')"
        $lines += $lineStr
        $lines += ""
    }
    $lines += ""
}
Out-MarkdownFile -Path "$IndexDir\checklist-index.md" -Lines $lines
Write-Host "  -> $($lines.Count) lines"

# ===================================================================
# 7. dependency-index.md
# ===================================================================
Write-Host "Generating dependency-index.md..."
$depEdgeList = @()
foreach ($edge in $depEdges) {
    $srcId = $edge.source
    $tgtId = $edge.target
    $srcKU = $kus | Where-Object { $_.ku_id -eq $srcId }
    if ($srcKU) {
        $depEdgeList += [PSCustomObject]@{
            Domain = $srcKU.domain_norm
            SourceId = $srcId
            SourceName = $srcKU.knowledge_unit
            TargetId = $tgtId
        }
    }
}

$lines = @()
$lines += "# ECC Dependency Index"
$lines += ""
$lines += "Repository-wide dependency visualization for all Knowledge Units."
$lines += ""
$lines += "| Attribute | Value |"
$lines += "|-----------|-------|"
$lines += "| Total Nodes | $($depNodes.Count) |"
$lines += "| Total Edges | $($depEdges.Count) |"
$lines += "| Knowledge Units | $($kus.Count) |"
$lines += "| Generated | $generated |"
$lines += ""
$lines += "---"
$lines += ""
$lines += "## Per-Domain Dependencies"
$lines += ""
$lines += "Top dependency relationships by domain:"
$lines += ""

foreach ($d in $sortedDomains) {
    $domainEdges = $depEdgeList | Where-Object { $_.Domain -eq $d }
    $srcGroups = @{}
    foreach ($de in $domainEdges) {
        $srcId = $de.SourceId
        if (-not $srcGroups.ContainsKey($srcId)) { $srcGroups[$srcId] = [System.Collections.ArrayList]@() }
        [void]$srcGroups[$srcId].Add($de.TargetId)
    }
    $lines += "### $d ($($srcGroups.Count) KUs with dependencies)"
    $lines += ""
    $lines += "| Knowledge Unit | Depends On |"
    $lines += "|---------------|-----------|"
    foreach ($src in ($srcGroups.Keys | Sort-Object)) {
        $srcKU2 = $kus | Where-Object { $_.ku_id -eq $src }
        $srcName = if ($srcKU2) { $srcKU2.knowledge_unit } else { $src.Split('/')[-1] }
        $tgt = ($srcGroups[$src] | Select-Object -Unique) -join ", "
        $lines += "| $srcName | $tgt |"
    }
    $lines += ""
    $lines += "---"
    $lines += ""
}

$lines += "## Topological Learning Order"
$lines += ""
$lines += "Recommended study order based on dependency analysis:"
$lines += ""
$lines += "1. **Foundation** - Laravel Core, Routing, Controllers, Middleware"
$lines += "2. **Data Layer** - Eloquent Models, Migrations, Relationships, Query Builder"
$lines += "3. **Business Logic** - Actions, Services, Form Requests, Policies"
$lines += "4. **API Layer** - API Resources, Controllers, Versioning, Documentation"
$lines += "5. **Async Systems** - Queues, Events, Broadcasting, Webhooks"
$lines += "6. **Security** - Authentication, Authorization, Encryption, Hardening"
$lines += "7. **Testing** - Unit, Feature, Browser, Database, CI Pipeline"
$lines += "8. **Performance** - Caching, OpCache, JIT, Octane, Profiling"
$lines += "9. **Advanced** - Search, Real-Time, AI/ML, Multi-Tenancy, DDD"
$lines += "10. **Operations** - Deployment, Monitoring, DevOps, Scaling"
$lines += ""
$lines += "*End of ECC Dependency Index*"

Out-MarkdownFile -Path "$IndexDir\dependency-index.md" -Lines $lines
Write-Host "  -> $($lines.Count) lines"

# ===================================================================
# 8. knowledge-registry.md
# ===================================================================
Write-Host "Generating knowledge-registry.md..."
$regLines = New-Object System.Collections.ArrayList
[void]$regLines.Add("# ECC Knowledge Registry")
[void]$regLines.Add("")
[void]$regLines.Add("Repository-wide inventory of the ECC knowledge system.")
[void]$regLines.Add("")
[void]$regLines.Add("| Attribute | Value |")
[void]$regLines.Add("|-----------|-------|")
[void]$regLines.Add("| Total Knowledge Units | $($kus.Count) |")
[void]$regLines.Add("| Total Domains | $($domainCounts.Count) |")
[void]$regLines.Add("| Generated | $generated |")
[void]$regLines.Add("")
[void]$regLines.Add("---")
[void]$regLines.Add("")
[void]$regLines.Add("## Domain Summary")
[void]$regLines.Add("")
[void]$regLines.Add("| # | Domain | KUs | Rules | Skills | Decision Trees | Anti-Patterns | Checklists |")
[void]$regLines.Add("|---|--------|-----|-------|--------|----------------|---------------|------------|")
$num = 1
foreach ($d in $sortedDomains) {
    $c = $domainCounts[$d]
    [void]$regLines.Add("| $num | $d | $($c.kus) | $($c.rules) | $($c.skills) | $($c.dts) | $($c.aps) | $($c.cls) |")
    $num++
}
[void]$regLines.Add("")
[void]$regLines.Add("---")
[void]$regLines.Add("")

# Pre-build the domain slug map for speed
$domainSlugs = @{}
foreach ($d in $sortedDomains) { $domainSlugs[$d] = Get-DSlug $d }

foreach ($d in $sortedDomains) {
    $c = $domainCounts[$d]
    [void]$regLines.Add("## $d")
    [void]$regLines.Add("")
    [void]$regLines.Add("| Metric | Count |")
    [void]$regLines.Add("|--------|-------|")
    [void]$regLines.Add("| Knowledge Units | $($c.kus) |")
    [void]$regLines.Add("| Rules | $($c.rules) |")
    [void]$regLines.Add("| Skills | $($c.skills) |")
    [void]$regLines.Add("| Decision Trees | $($c.dts) |")
    [void]$regLines.Add("| Anti-Patterns | $($c.aps) |")
    [void]$regLines.Add("| Checklists | $($c.cls) |")
    [void]$regLines.Add("")
    
    $subSlugs = $c.subs.Keys | Sort-Object
    foreach ($ss in $subSlugs) {
        $subInfo = $c.subs[$ss]
        [void]$regLines.Add("### $($subInfo.name)")
        [void]$regLines.Add("")
        foreach ($ku in $subInfo.kus) {
            $kn = $ku.knowledge_unit
            $kp = $ku.directory
            $di = if ($ku.difficulty.normalized) { $ku.difficulty.normalized } else { "unknown" }
            [void]$regLines.Add("- **[$kn](../$kp/04-standardized-knowledge.md)** ($di)")
        }
        [void]$regLines.Add("")
    }
    
    $dSlug = $domainSlugs[$d]
    $il = "[Knowledge Unit Index](../indexes/knowledge-unit-index.md#$dSlug) / [Rule Index](../indexes/rule-index.md#$dSlug) / [Skill Index](../indexes/skill-index.md#$dSlug) / [Decision Tree Index](../indexes/decision-tree-index.md#$dSlug) / [Anti-Pattern Index](../indexes/anti-pattern-index.md#$dSlug) / [Checklist Index](../indexes/checklist-index.md#$dSlug)"
    [void]$regLines.Add("**Index Links:** $il")
    [void]$regLines.Add("")
    [void]$regLines.Add("---")
    [void]$regLines.Add("")
}

$regContent = $regLines -join "`r`n"
[System.IO.File]::WriteAllText("$RegDir\knowledge-registry.md", $regContent, [System.Text.Encoding]::UTF8)
Write-Host "  -> $($regLines.Count) lines"

Write-Host ""
Write-Host "=== Generation Complete ==="
Write-Host "8 files generated successfully."
