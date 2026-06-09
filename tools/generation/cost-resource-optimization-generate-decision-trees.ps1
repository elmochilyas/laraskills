param(
    [Parameter(Mandatory = $true)]
    [string]$ResearchRoot
)

$base = Join-Path $ResearchRoot "cost-resource-optimization"
if (-not (Test-Path $base)) { Write-Error "Research workspace not found: $base"; exit 1 }
$date = "2026-06-03"

function Write-DecisionTrees {
    param($path, $trees, $title, $rules, $domain="Cost Resource Optimization")
    
    $content = @"
# Metadata

**Domain:** $domain
**Subdomain:** $(Split-Path (Split-Path $path -Parent) -Leaf)
**Knowledge Unit:** $title
**Generated:** $date

---

# Decision Inventory

$(for($i=0; $i -lt $trees.Count; $i++) {
"$($i+1). $($trees[$i].name)"
} -join "`n")

---

# Architecture-Level Decision Trees

---
"@
    
    foreach ($tree in $trees) {
        $content += @"

## Decision Name: $($tree.name)

---

## Decision Context

$($tree.context)

---

## Decision Criteria

$($tree.criteria)

---

## Decision Tree

$($tree.tree)

---

## Rationale

$($tree.rationale)

---

## Recommended Default

**Default:** $($tree.default)
**Reason:** $($tree.rationale)

---

## Risks Of Wrong Choice

$($tree.risk)

---

## Related Rules

$(if ($rules -and $rules.Count -gt 0) { $rules[0..[Math]::Min(2, $rules.Count-1)] -join "`n" } else { "N/A" })

---

## Related Skills

Analyze and Optimize $title

---

"@
    }
    
    Set-Content -Path $path -Value $content -Encoding UTF8
}

$kus = Get-ChildItem -Path $base -Directory | Where-Object { $_.Name -match '^\d{2}-' } | ForEach-Object {
    $sub = $_.FullName
    Get-ChildItem -Path $sub -Directory | ForEach-Object {
        $std = Join-Path $_.FullName "04-standardized-knowledge.md"
        $dt = Join-Path $_.FullName "07-decision-trees.md"
        if ((Test-Path $std) -and -not (Test-Path $dt)) {
            [PSCustomObject]@{
                Subdomain = (Split-Path $sub -Leaf)
                KU = $_.Name
                Path = $_.FullName
            }
        }
    }
}

$total = ($kus | Measure-Object).Count
Write-Host "Found $total KUs to process"
$count = 0

# Define the decision tree data generation function
function Get-TreeData {
    param($kuName, $subdomain, $stdPath, $rulesPath)
    
    # Read rules for reference
    $rules = @()
    if (Test-Path $rulesPath) {
        $content = Get-Content -Path $rulesPath
        foreach ($line in $content) {
            if ($line -match '^## (.+)') {
                $rules += $matches[1]
            }
        }
    }
    if ($rules.Count -eq 0) { $rules = @("Rule 1: Follow standardized practices") }
    
    # Read title
    $title = (Get-Content -Path $stdPath -TotalCount 1).Trim('# ') 
    if ([string]::IsNullOrWhiteSpace($title)) { $title = $kuName -replace '-', ' ' }
    
    # Build trees based on KU
    $trees = @()
    
    switch -Wildcard ($kuName) {
        "vm-sizing" {
            $trees = @(
                @{name="Instance Family Selection"; context="Choose between Graviton (ARM) and x86 instance families for Laravel workloads"; criteria="cost, performance, compatibility";
                 tree="New deployment or existing migration?`n↓`nNEW → Use Graviton (m7g/r7g/c7g) — 20% cheaper, identical performance`nEXISTING → Currently on x86?`n↓`nYES → Has native x86 binary dependencies?`n↓`nYES → Stay on x86 until dependencies are ported`nNO → Migrate to Graviton via staging first`n`nWorkload profile?`n↓`nCPU-bound (image processing) → c7g instances`nMemory-bound (large cache) → r7g instances`nBalanced (web serving) → m7g instances`nBurstable (low traffic) → t4g instances";
                 rationale="Graviton offers 20% cost reduction with identical PHP execution performance for Laravel workloads. Choosing the right instance family matches resources to actual workload requirements.";
                 default="Graviton m7g for balanced workloads; c7g for CPU-bound; r7g for memory-bound"; risk="Using t4g for sustained production causes CPU credit exhaustion and throttling. Wrong instance family wastes memory, CPU, or network capacity."}
                @{name="Instance Size Right-Sizing via Monitoring"; context="Determine optimal instance size based on actual utilization metrics over 2-week period"; criteria="cost, performance";
                 tree="Current CPU utilization (2-week P95)?`n↓`n< 20% → Downsize one tier (xlarge → large)`n20-60% → Current size appropriate`n> 60% → Consider upsizing or scaling out`n`nMemory utilization (peak)?`n↓`n< 50% → Reduce instance memory or downsize family`n50-80% → Appropriate sizing`n> 80% → Increase memory or scale out`n`nTraffic pattern?`n↓`nSteady → Right-size for average + 20% headroom`nVariable → Use Auto Scaling, size for baseline only";
                 rationale="Single-day monitoring misses weekend lows and peak hours. Two-week data reveals true baseline and peak, preventing both over-provisioning and under-provisioning.";
                 default="Start with m7g.large, monitor for 2 weeks, right-size based on P95 utilization metrics"; risk="Sizing for peak without Auto Scaling wastes 40-70% of compute budget on idle capacity during off-peak hours."}
                @{name="Burstable vs Dedicated CPU Decision"; context="Choose between t4g (burstable with CPU credits) and m7g (dedicated CPU) instances"; criteria="cost, performance";
                 tree="Average CPU utilization?`n↓`n< 10% avg with spikes < 50% → t4g (burstable, 30% savings)`n10-20% avg → t4g possible but monitor credit balance`n> 20% avg → m7g required (t4g will exhaust credits)`n`nSustained peak duration?`n↓`n< 30 minutes → t4g burst credits cover peaks`n> 30 minutes → m7g needed for sustained throughput`n`nEnvironment?`n↓`nDev/staging → t4g (low utilization, credits accumulate)`nProduction → m7g unless workload is truly burstable";
                 rationale="t4g instances earn CPU credits at 1 credit per vCPU hour. Sustained CPU above 20% depletes credits, throttling performance to baseline (20-40% CPU). m7g provides consistent CPU regardless of utilization.";
                 default="t4g for dev/staging; m7g for production; only use t4g in production if average CPU < 10% and peaks < 30 minutes"; risk="t4g in production with sustained load = CPU credit exhaustion, throttled performance, dropped requests, and user-facing latency spikes."}
            )
        }
        "server-provisioning" {
            $trees = @(
                @{name="EBS Volume Type Selection"; context="Choose between gp3, gp2, io2, and instance store for Laravel server storage"; criteria="cost, performance";
                 tree="Workload type?`n↓`nWeb server → gp3 (3000 IOPS baseline sufficient)`nDatabase server → gp3 or io2 (if >16000 IOPS)`nCache/temp data → Instance store (ephemeral, high perf)`n`nIOPS requirement?`n↓`n< 16000 IOPS → gp3 (same price as gp2, 30x better baseline)`n> 16000 IOPS → io2 (provisioned, $0.125/GB + $0.065/IOPS)`n`nCurrently using gp2?`n↓`nYES → Migrate to gp3 immediately (free upgrade, higher IOPS)`nNO → Stay with gp3";
                 rationale="gp3 provides 3000 IOPS baseline at the same price as gp2's 100 IOPS/GB. For a 30GB volume, gp3 delivers 30x more IOPS at the same price point with no provisioning required.";
                 default="gp3 for all volumes; io2 only for high-performance databases needing >16000 IOPS"; risk="Using gp2 instead of gp3 leaves 30x IOPS on the table at the same price. Using io2 for web servers adds unnecessary cost."}
                @{name="EBS Volume Right-Sizing"; context="Determine optimal EBS volume size based on actual usage to avoid over-provisioning waste"; criteria="cost";
                 tree="Current root volume usage?`n↓`n< 10GB → 20GB root volume sufficient`n10-20GB → Right-size during next maintenance`n> 20GB → Investigate what's consuming space`n`nData volume monitored for 30 days?`n↓`nYES → Size at P95 usage + 20% headroom`nNO → Start with 30GB, set CloudWatch alarm at 80%`n`nLog volume separate?`n↓`nYES → 10-30GB for logs, alarm at 80%`nNO → Split root and data volumes";
                 rationale="EBS costs $0.08/GB/month. 100GB unused costs $96/year per instance. Across 30 instances, that's $2,880/year in completely wasted storage spend.";
                 default="Root: 20GB gp3; Data: size based on 30-day P95 monitoring; Logs: 10-30GB gp3 separate volume"; risk="Over-provisioning every instance by 100GB costs thousands annually without any performance benefit."}
                @{name="Swap Configuration for PHP Workloads"; context="Determine whether and how much swap to configure on Laravel application servers"; criteria="performance, reliability";
                 tree="Application type?`n↓`nPHP-FPM web server → 2GB or 2x RAM (whichever higher)`nOctane server → 2GB minimum`nQueue worker → 2GB minimum`nDatabase server → Follow DB engine swap guidelines`n`nAvailable RAM?`n↓`n< 2GB → 2x RAM swap (critical for PHP memory safety)`n2-4GB → 2GB swap`n> 4GB → 2GB swap (RAM sufficient for workloads)`n`nUsing instance store?`n↓`nYES → Use instance store for swap (faster than EBS)`nNO → Use EBS swap partition or swap file";
                 rationale="PHP memory leaks can OOM servers without swap. Swap provides a buffer for graceful degradation and process termination instead of immediate OOM kills that drop all active requests.";
                 default="2GB swap on all application servers; use instance store if available; monitor swap usage for memory leak detection"; risk="No swap configuration = OOM killer terminates PHP processes under memory pressure, causing 50x errors and downtime."}
            )
        }
        "php-fpm-tuning" {
            $trees = @(
                @{name="max_children Memory Calculation"; context="Calculate optimal PHP-FPM max_children based on server memory and worker footprint"; criteria="performance, cost";
                 tree="Total server RAM?`n↓`n2GB → Reserve 0.5GB OS = ~40 children max`n4GB → Reserve 1GB OS = ~70 children max`n8GB → Reserve 1.5GB OS = ~150 children max`n16GB → Reserve 2GB OS = ~310 children max`n`nAverage worker memory?`n↓`nMeasured via ps_mem → Use actual value (Laravel: 30-80MB)`nUnknown → Default 45MB, adjust after monitoring`n`nCPU cores also a factor?`n↓`nChildren > 2x cores → Cap at 2x cores (context switching degrades throughput)`nChildren ≤ 2x cores → Memory-based calculation is correct";
                 rationale="Each Laravel PHP-FPM worker consumes 30-80MB. Setting max_children higher than available memory causes OOM kills. CPU-bound workloads hit diminishing returns beyond 2x cores due to context switching overhead.";
                 default="max_children = (RAM - OS_reserve) / avg_worker_memory; cap at 2x CPU cores for CPU-bound workloads"; risk="Setting max_children too high causes OOM kills and 50x errors. Too low wastes CPU capacity and causes request queuing."}
                @{name="pm.max_requests Configuration for Memory Safety"; context="Set optimal max_requests to balance memory cleanup vs worker restart overhead"; criteria="performance, reliability";
                 tree="Is OPcache validate_timestamps enabled?`n↓`nNO (production) → 500-1000 requests (memory cleanup focus)`nYES (development) → 200-500 (fresher state)`n`nApplication memory leak rate?`n↓`nLow (< 1KB/request) → 1000-2000 requests`nMedium (1-10KB/request) → 500-1000`nHigh (> 10KB/request) → 200-500 + fix leaks first`n`nTraffic volume?`n↓`nHigh (> 100 req/s) → 1000 (fewer restarts, lower CPU overhead)`nLow (< 10 req/s) → 500 (restart overhead negligible)";
                 rationale="Laravel requests accumulate approximately 1KB of memory per request. After 10,000 requests, a worker may use 2x its baseline memory. max_requests restarts workers to release accumulated memory.";
                 default="500-1000 for production; start at 1000 and reduce if memory issues appear"; risk="No max_requests (default 0) = unbounded memory growth, eventual OOM kills. Too low = constant worker restarts wasting CPU on Laravel boot overhead."}
                @{name="Dynamic vs Static vs On-Demand Pool Mode"; context="Choose PHP-FPM pool mode based on traffic pattern and server resource constraints"; criteria="performance, cost";
                 tree="Traffic pattern?`n↓`nPredictable, stable load → Static pool`nVariable traffic → Dynamic pool (most common)`nVery low/sporadic → On-demand pool`n`nServer resources?`n↓`nMemory-constrained (< 2GB) → On-demand (saves memory, creates workers per request)`nAdequate RAM (4GB+) → Dynamic (pre-spawned workers, no latency penalty)`n`nLatency sensitivity?`n↓`nHigh (user-facing API) → Dynamic or Static (no creation latency)`nLow (background) → On-demand acceptable";
                 rationale="Static pool wastes memory during low traffic when workers sit idle. Dynamic pool balances memory efficiency with request latency. On-demand creates workers per request (50-200ms penalty) but saves memory on low-traffic servers.";
                 default="Dynamic for most production workloads; On-demand for low-traffic or memory-constrained servers"; risk="On-demand for high-traffic adds 50-200ms latency per request. Static for variable load wastes 80% of workers during low-traffic periods."}
            )
        }
        "opcache-tuning" {
            $trees = @(
                @{name="OPcache Memory Allocation Sizing"; context="Determine optimal opcache.memory_consumption for Laravel application codebase size"; criteria="performance";
                 tree="Application PHP file count?`n↓`n< 2000 files → 64MB may suffice, but use 128MB safe default`n2000-5000 files → 128MB (standard Laravel + vendor + packages)`n> 5000 files → 256MB (large apps with many packages)`n`nCurrent OPcache hit rate?`n↓`n< 95% → Increase memory (evictions occurring from insufficient space)`n95-99% → Current allocation is adequate`n> 99% → No change needed`n`nVerified via opcache_status()?`n↓`nYES → Adjust based on memory_usage and misses metrics`nNO → Run opcache_get_status() to check hit rate";
                 rationale="Insufficient OPcache memory causes entry eviction via LRU, forcing PHP recompilation on subsequent requests. 128MB covers most Laravel applications with adequate buffer for all compiled files.";
                 default="128MB for standard Laravel; 256MB for large applications; verify hit rate >99% via opcache_status()"; risk="Insufficient memory (64MB default) causes 10-30% miss rate, wasting 50-70% CPU on recompilation of PHP files."}
                @{name="validate_timestamps in Production"; context="Decide whether to disable OPcache file modification checking in production for performance"; criteria="performance, security";
                 tree="Production environment?`n↓`nYES → Disable validate_timestamps (opcache.validate_timestamps=0)`nNO (development) → Keep enabled so code changes reflect immediately`n`nDeployment strategy?`n↓`nAtomic deploys (new files) → validate_timestamps=0 safe (old files never modified)`nIn-place updates → validate_timestamps=0 requires explicit cache clear`n`nCache clear mechanism?`n↓`nDeploy script includes opcache_reset() → Safe to disable`nNo cache clear → Keep enabled or add opcache_reset() to deploy";
                 rationale="validate_timestamps causes a stat() syscall on every PHP file every request. Disabling saves microseconds per file; across hundreds of Laravel files, this translates to 50-70% CPU reduction.";
                 default="validate_timestamps=0 in production with deploy-time opcache_reset() call"; risk="Enabling in production wastes CPU on unnecessary stat() calls. Disabling without deploy cache clear serves stale compiled code."}
                @{name="JIT Compilation Decision for Laravel"; context="Determine whether to enable PHP JIT compilation based on workload type and PHP version"; criteria="performance";
                 tree="Workload type?`n↓`nCPU-bound (image processing, PDF generation) → Enable JIT (20-30% CPU improvement)`nI/O-bound (database, cache, HTTP calls) → Minimal benefit; JIT optional`nMixed → Enable JIT if CPU-bound paths are significant portion`n`nPHP version?`n↓`nPHP 8.0+ → JIT available`nPHP < 8.0 → Not available; upgrade PHP first`n`nRuntime?`n↓`nOctane (long-lived workers) → JIT beneficial (amortized across millions of requests)`nPHP-FPM (per-request processes) → JIT less impactful (compilation per worker restart)";
                 rationale="JIT compiles hot PHP functions to native machine code. For CPU-bound Laravel workloads, this provides 20-30% improvement. I/O-bound apps spend most time waiting on database or cache, not executing PHP bytecode.";
                 default="Enable JIT (mode=tracing, buffer_size=100M) for Octane with CPU-bound tasks; skip for I/O-heavy PHP-FPM apps"; risk="Enabling JIT for purely I/O-bound apps adds complexity and memory overhead without meaningful performance improvement."}
            )
        }
        "octane-resource-usage" {
            $trees = @(
                @{name="Octane Worker Count Decision"; context="Determine optimal number of Octane workers based on CPU cores and workload profile"; criteria="performance, cost";
                 tree="Number of CPU cores?`n↓`nSet base worker count = CPU cores`n`nWorkload profile?`n↓`nCPU-bound → workers = CPU cores (no benefit beyond, context switching hurts)`nI/O-heavy → workers = 1.5-2x CPU cores (workers yield during I/O waits)`nMixed → workers = CPU cores + 1-2 for overhead`n`nMonitor context switching?`n↓`ncs/sec < 20000 per core → Worker count appropriate`ncs/sec > 20000 per core → Reduce workers`nRun queue > 2x cores → Reduce workers";
                 rationale="CPU-bound workloads saturate all cores; extra workers cause context switching that reduces total throughput. I/O-heavy workers voluntarily yield during waits, allowing more concurrent workers without CPU contention.";
                 default="Workers = CPU cores for CPU-bound; add 1-2 for I/O-heavy; monitor cs/sec and run queue"; risk="Too many workers causes extreme context switching where throughput drops below baseline. Too few workers underutilizes CPU capacity."}
                @{name="Octane Memory Management Strategy"; context="Configure memory limits and restart policies for long-running Octane workers"; criteria="performance, reliability";
                 tree="Per-worker memory limit?`n↓`nSet memory_limit = 256M or 512M in php.ini or Octane configuration`n`nMemory growth pattern monitored?`n↓`nStable at ceiling → Worker health is good`nGrowing unbounded → Memory leak detected; set max_requests as safety`n`nmax_requests setting?`n↓`nSet 1000-5000 depending on application`nWorkers restart after N requests, releasing accumulated memory`nPrevents OOM kills that drop all in-flight requests`n`nOctane::tick() for cleanup?`n↓`nImplement periodic GC or cache pruning every N requests`nRefreshes connections that may time out";
                 rationale="Octane workers persist across thousands of requests, accumulating memory. max_requests provides automatic restart-based memory reclamation. Without it, workers grow to memory_limit and get OOM killed, dropping active requests.";
                 default="memory_limit=256M, max_requests=2000, monitor resident memory growth <10KB/request"; risk="No max_requests = unbounded memory growth, worker OOM kills failing all in-flight requests simultaneously."}
                @{name="Octane vs PHP-FPM Decision Framework"; context="Choose between Octane and traditional PHP-FPM based on traffic volume and app profile"; criteria="performance, cost, complexity";
                 tree="Current traffic volume?`n↓`n< 50 req/s → PHP-FPM simpler; cost difference is negligible`n50-500 req/s → Octane provides 3-5x throughput improvement`n> 500 req/s → Octane strongly recommended for cost-effective compute`n`nApp complexity and compatibility?`n↓`nSimple CRUD → Octane works with minimal changes`nComplex with packages → Test all critical packages for Octane compatibility`n`nGlobal state usage?`n↓`nStateless code → Octane safe to deploy`nStatic properties for request data → Must refactor for Octane sandbox`n__destruct() cleanup → Must refactor for persistent worker lifecycle`n`nMemory available per server?`n↓`nAdequate (4GB+) → Octane recommended (higher per-worker memory but fewer total)`nLimited (< 2GB) → PHP-FPM may use less total memory at low traffic";
                 rationale="Octane eliminates per-request Laravel boot overhead (30-80ms), enabling 3-10x throughput on identical hardware. This directly reduces server count and compute costs by 50-80% for moderate to high traffic apps.";
                 default="Octane for all production deployments > 100 req/s; PHP-FPM for low-traffic or apps with incompatible packages"; risk="Deploying Octane without package compatibility testing causes data leakage across requests. Staying on PHP-FPM leaves 50-80% cost savings on the table."}
            )
        }
        "roadrunner-binary" {
            $trees = @(
                @{name="RoadRunner vs Swoole for Octane"; context="Choose between RoadRunner (Go binary) and Swoole (PHP extension) as Octane server backend"; criteria="complexity, performance, deployment";
                 tree="Deployment environment?`n↓`nDocker containers → RoadRunner (simpler, no PHP extension compilation)`nSelf-managed server → Either; RoadRunner simpler, Swoole slightly faster`nKubernetes → RoadRunner (single binary, ~30MB image vs 200MB with Nginx)`n`nTeam expertise?`n↓`nPHP-only team → RoadRunner (no pecl install or extension compilation)`nPHP extension experience → Swoole acceptable (higher peak throughput)`n`nPerformance requirement?`n↓`nMaximum throughput (2000+ req/s) → Swoole 5-10% faster for CPU-bound`nStandard throughput → RoadRunner sufficient and simpler to operate`nDebugging simplicity → RoadRunner (Go binary troubleshooting)";
                 rationale="RoadRunner is a static Go binary with no PHP extension dependencies, simplifying Docker builds and deployment. Swoole requires pecl install and extension loading but offers marginally higher throughput for CPU-bound workloads.";
                 default="RoadRunner for most deployments; Swoole only if maximum throughput is critical and team has extension expertise"; risk="Swoole extension conflicts with other PECL extensions cause crashes after N requests. Missing RoadRunner health check leads to total downtime on binary crash."}
                @{name="RoadRunner Worker Pool Configuration"; context="Configure RoadRunner worker pool size and restart thresholds in .rr.yaml"; criteria="performance, reliability";
                 tree="CPU cores available?`n↓`nSet num_workers = CPU cores for CPU-bound workloads`nSet num_workers = 1.5-2x cores for I/O-heavy workloads`n`nmax_jobs setting?`n↓`nSet max_jobs = 500-1000 to prevent memory leaks`nWorkers restart after N requests, releasing accumulated memory`n`nmax_memory per worker?`n↓`nSet max_memory = 128 (MB) restart threshold`nMonitor actual memory; adjust if workers restart too frequently`n`nStatic file handling?`n↓`nEnable static plugin in .rr.yaml for direct asset serving`nNo need for separate Nginx reverse proxy layer";
                 rationale="max_jobs and max_memory provide two independent safety mechanisms against memory leaks. Workers restart after either threshold is hit, ensuring stable long-term operation without unbounded growth.";
                 default="num_workers = CPU cores, max_jobs = 500, max_memory = 128MB, enable static plugin"; risk="No max_jobs = unbounded memory growth. Over-allocating workers causes CPU thrashing. No health check endpoint = single process failure causes total downtime."}
                @{name="RoadRunner Deployment Architecture"; context="Design deployment architecture for RoadRunner with single-process container model"; criteria="complexity, performance";
                 tree="Static assets serving strategy?`n↓`nSingle process → Use RoadRunner static plugin (no Nginx needed)`nSeparate CDN → CloudFront/S3 serves assets, RR handles API only`n`nContainer image size concern?`n↓`nYES → RR single binary image ~30MB vs 200MB Nginx+FPM image`nNO → Either approach works`n`nProcess management?`n↓`nDocker → RR as ENTRYPOINT with health check on /health`nKubernetes → Single container with liveness/readiness probes`nSystemd → RR as service with auto-restart on failure`n`nPort configuration?`n↓`nExpose port 8080 (RR default), ALB targets this port directly`nNo need for port 80/443 internally (terminated at ALB)";
                 rationale="RoadRunner serves HTTP and static files directly, eliminating the Nginx reverse proxy layer entirely. This reduces deployment complexity, container image size, and operational surface area while maintaining high throughput.";
                 default="Single Docker container with `rr serve` entrypoint, static plugin, health check on /health"; risk="Adding unnecessary Nginx in front of RoadRunner adds deployment complexity and overhead. No process manager means single point of failure."}
            )
        }
        "worker-pool-sizing" {
            $trees = @(
                @{name="Worker Count by Bottleneck Identification"; context="Determine optimal worker count based on whether the primary bottleneck is CPU, memory, or I/O"; criteria="performance, cost";
                 tree="Identify primary bottleneck type?`n↓`nCPU-bound (intensive computation) → workers = CPU cores (context switching threshold)`nMemory-bound (limited RAM) → workers = Available RAM / avg worker memory`nI/O-bound (DB, API, cache waits) → workers = 2-4x CPU cores`n`nMemory per worker estimated?`n↓`n< 50MB → Memory constrained; reduce workers to prevent OOM`n50-150MB → Normal range for Laravel workers`n> 150MB → I/O bound or over-provisioned; investigate`n`nMonitor idle worker percentage?`n↓`n0% idle at peak → Under-provisioned; add workers`n10-20% idle at peak → Optimal range`n> 50% idle at peak → Over-provisioned; reduce workers";
                 rationale="Sizing for the wrong bottleneck wastes resources. CPU-bound workloads get no benefit from workers beyond CPU cores (context switching destroys gains). Memory-bound workloads with too many workers cause OOM kills. I/O-bound workloads benefit from more workers because they wait concurrently.";
                 default="CPU-bound: workers=cores; I/O-bound: 2-3x cores; Memory-bound: calculate from available RAM"; risk="Oversubscribed workers cause OOM kills and context switching thrashing. Undersubscribed workers leave CPU and memory capacity idle, wasting server potential."}
                @{name="Separate Worker Pools Design"; context="Design separate worker pools for different workload types (web, queue, scheduled tasks)"; criteria="performance, reliability";
                 tree="Workload types running on server?`n↓`nWeb only → Single pool for PHP-FPM or Octane workers`nWeb + queue → Separate pools; queues on dedicated servers preferred`nMultiple queue priorities → Separate pools per priority with different counts`n`nQueue priority differentiation needed?`n↓`nYES → High-queue pool (more workers, lower latency) + Low-queue pool (fewer workers)`nNO → Single queue pool with uniform worker count`n`nServer dedicated to single workload?`n↓`nYES → Optimal; size pool specifically for that workload only`nNO → Use cgroups to allocate CPU shares per pool (web gets priority)";
                 rationale="A large queue job should never block web request processing. Separate pools ensure each workload type gets appropriate capacity without interference, preventing batch jobs from degrading user-facing response times.";
                 default="Dedicated servers for web and queue; separate queue pools per priority level with different worker counts"; risk="Shared web+queue pool causes queue jobs to degrade web response times by 30-50% during batch processing peaks."}
                @{name="Queue Worker Throughput-Based Sizing"; context="Calculate required queue worker count based on job throughput requirements and average duration"; criteria="performance, cost";
                 tree="Job throughput required (jobs/hour)?`n↓`nMeasure desired_jobs_per_hour from business requirements`n`nAverage job duration (seconds)?`n↓`nMeasure avg_job_duration via Laravel Horizon or Telescope metrics`n`nFormula: workers = ceil(desired_throughput / (3600 / avg_job_duration))`nExample: 500 jobs/hour with 3s avg job = ceil(500 / 1200) = 1 worker`n`nAdd buffer for spikes?`n↓`nYES → Configure 20-30% above calculated peak`nNO → Risk of queue backlog during load spikes";
                 rationale="Worker count should be derived from throughput requirements and job duration, not guesswork. Each worker processes (3600 / avg_job_duration) jobs per hour. Multiplying by target throughput gives the required worker count.";
                 default="Calculate from throughput + duration formula; add 20-30% buffer above estimated peak for safety"; risk="Under-provisioning creates hours of queue backlog during spikes. Over-provisioning wastes memory on idle workers that sit around waiting for jobs."}
            )
        }
        "context-switching" {
            $trees = @(
                @{name="Web and Queue Server Separation Decision"; context="Decide whether to run queue workers on web servers or provision dedicated instances"; criteria="performance, cost";
                 tree="Current architecture?`n↓`nWeb + queue on same server → Evaluate separation cost vs benefit`nWeb and queue on separate → Already optimal`n`nServer CPU utilization?`n↓`n< 50% at peak → Could co-locate with cgroups CPU limits`n50-80% at peak → Separate servers strongly recommended`n> 80% at peak → Immediate separation required`n`nTraffic volume?`n↓`n< 50 req/s → Co-location with cgroups acceptable for cost savings`n50-200 req/s → Separate servers recommended`n> 200 req/s → Separate servers mandatory for web performance`n`nCost vs performance priority?`n↓`nCost savings → Co-locate with cgroups CPU priority limits`nPerformance → Dedicated servers for each workload";
                 rationale="Queue workers cause 10,000+ extra context switches per second, stealing 30-50% CPU from customer-facing web requests. Separation eliminates this contention entirely, preserving web response time SLAs.";
                 default="Separate servers for web and queue; cgroups compromise only for low-traffic apps under 50 req/s"; risk="Co-location causes 30-50% web response time degradation and confusing 'high CPU but server is idle' troubleshooting."}
                @{name="Worker Count to CPU Core Ratio"; context="Set optimal worker-to-CPU ratio to minimize context switching overhead for given workload"; criteria="performance";
                 tree="Workload type?`n↓`nCPU-bound → Workers = 1-2x CPU cores`nI/O-bound → Workers = 2-4x CPU cores (yield during waits)`n`nCurrent vmstat context switch rate?`n↓`n< 10,000 cs/sec per core → Healthy worker ratio`n10,000-20,000 cs/sec per core → Monitor; approaching threshold`n> 20,000 cs/sec per core → Too many workers; reduce by 25%`n`nRun queue length?`n↓`n< 2x CPU cores → Appropriate worker count`n> 2x CPU cores → Workers over-allocated; reduce by 25% and retest`n`nThroughput before vs after reduction?`n↓`nThroughput increases → Context switching was the bottleneck`nThroughput decreases → Original worker count was needed; consider more CPU";
                 rationale="Each worker beyond CPU cores causes 100+ involuntary context switches per second. Beyond 2x cores for CPU-bound workloads, throughput actually decreases because the CPU spends more time switching between workers than executing them.";
                 default="CPU-bound: workers = cores; I/O-bound: 2-3x cores; target cs/sec < 20,000 per core"; risk="Over-allocating workers wastes 20-50% of CPU on context switching, reducing effective server capacity and increasing latency."}
                @{name="CPU Priority Configuration for Mixed Workloads"; context="Configure CPU priority using cgroups or nice values when workloads must share a server"; criteria="performance, reliability";
                 tree="Mixed workloads on same server (fallback option)?`n↓`nYES → Configure cgroups or nice values for CPU priority`nNO → No CPU priority needed on dedicated servers`n`ncgroups available?`n↓`nYES → Set CPU shares: web=512, queue=256 (2:1 web priority)`nNO → Use nice values: web=0, queue=10 (lower priority)`n`nOctane workers present?`n↓`nYES → CPU-pin Octane workers to dedicated cores via taskset`nNO → Standard process scheduling is sufficient`n`nMemory cgroups also configured?`n↓`nYES → Prevents queue workers from consuming all RAM during memory leak`nNO → Configure memory limits for queue cgroup";
                 rationale="cgroups ensure web workers get CPU priority during traffic spikes, preventing queue jobs from starving web requests. CPU pinning eliminates CPU cache misses from workers migrating between cores, providing ~5-10% throughput improvement.";
                 default="cgroups CPU shares (web=512, queue=256); Octane workers CPU-pinned; memory limits for queue cgroup"; risk="No CPU limits on shared servers = queue jobs steal CPU from web requests during traffic spikes, causing unpredictable response times."}
            )
        }
        "database-connection-pool" {
            $trees = @(
                @{name="Connection Pooler Selection (RDS Proxy vs PgBouncer)"; context="Choose between RDS Proxy (managed) and PgBouncer (open-source) based on database engine and ops capacity"; criteria="cost, performance, maintenance";
                 tree="Database engine?`n↓`nMySQL/Aurora → RDS Proxy (managed service, IAM auth, ~$15-30/month)`nPostgreSQL → PgBouncer (free software, runs on t4g.nano ~$5/month)`n`nOperational capacity?`n↓`nFully managed preferred → RDS Proxy (zero maintenance, AWS handles)`nCost-sensitive → PgBouncer ($5/month vs $15-30 for RDS Proxy)`n`nIAM authentication needed?`n↓`nYES → RDS Proxy (native IAM support, 15-min credentials)`nNO → Either works; PgBouncer uses auth_file`n`nConnection count?`n↓`n< 100 → Pooler may not be needed if max_connections sufficient`n> 100 → Pooler definitely required to prevent connection exhaustion";
                 rationale="RDS Proxy is fully managed with IAM auth ($15-30/month) but is MySQL/Aurora-only. PgBouncer is free but needs a t4g.nano EC2 instance ($5/month) and is PostgreSQL-only. RDS Proxy handles failover transparently with zero connection drops.";
                 default="RDS Proxy for Aurora/MySQL; PgBouncer for PostgreSQL; both eliminate 'too many connections' errors"; risk="No connection pooler with >100 PHP-FPM workers causes 'too many connections' errors during traffic spikes, leading to application outages."}
                @{name="Connection Pool Size Configuration"; context="Set optimal database connection pool size based on database vCPUs and workload profile"; criteria="performance, cost";
                 tree="Database vCPU count?`n↓`n2 vCPU → Pool size = 4-6 (2-3x vCPUs)`n4 vCPU → Pool size = 8-12`n8 vCPU → Pool size = 16-24`n`nPool mode (PgBouncer)?`n↓`nApp uses SET commands, temp tables → Session pooling (preserves session state)`nNo session state features → Transaction pooling (maximum multiplexing, 5x efficiency)`n`nRead/write splitting needed?`n↓`nYES → Separate pool sizes: writer pool = 2-3x vCPUs, reader pool = 4-6x vCPUs`nNO → Single pool size = 2-3x database vCPUs`n`nPool utilization monitoring?`n↓`nAlarm at 80% pool capacity for proactive right-sizing`nInvestigate sustained 90%+ utilization immediately";
                 rationale="Database processes connections with approximately 2x vCPU overhead. More active connections than this causes database-level context switching. Fewer connections wastes connection slot capacity and limits throughput.";
                 default="Pool size = 2-3x database vCPUs; transaction pooling for PostgreSQL; alarm at 80% utilization"; risk="Pool too large overwhelms database with connection context switching. Pool too small causes application request queuing and timeout errors."}
                @{name="Pool Utilization Monitoring Strategy"; context="Set up monitoring thresholds and alarms for database connection pool health"; criteria="reliability, performance";
                 tree="Pool utilization metric available?`n↓`nYES → Set alarm at 80% pool capacity for proactive alerts`nNO → Enable CloudWatch or PgBouncer metrics collection first`n`nAlert triggered at 80% capacity?`n↓`nConsistently near 80% → Right-size pool or evaluate database instance upgrade`nSporadic spikes → Traffic patterns causing bursts; evaluate pool sizing`n`nCritical threshold (95%+)?`n↓`nScale-out database or increase pool capacity`nOptimize application to use fewer concurrent connections`nCheck for connection leak in application code`n`nRecovery procedure documented?`n↓`nPool flush procedure documented for emergency`nApplication retry logic tested for connection failures";
                 rationale="Connection pool exhaustion happens silently and causes request queuing at the pooler. Monitoring reveals pool sizing issues early and provides warning before traffic spikes exhaust capacity.";
                 default="CloudWatch alarm at 80% pool utilization with 5-minute evaluation period"; risk="No monitoring = silent request queuing, growing latency tail, eventual connection timeout errors with no prior warning."}
            )
        }
        "fargate-pricing-analysis" {
            $trees = @(
                @{name="Fargate vs EC2 Platform Decision"; context="Choose between Fargate (managed containers) and EC2 (self-managed servers) for Laravel workloads"; criteria="cost, operational_overhead";
                 tree="Team DevOps capacity?`n↓`nLess than 5 engineers → Fargate (zero server management, ops overhead eliminated)`n5-10 engineers → Either; Fargate preferred for velocity`nMore than 10 engineers → EC2 feasible with dedicated ops team`n`nTask count?`n↓`n< 50 tasks → Fargate (management overhead vs premium tradeoff favors Fargate)`n> 50 tasks → EC2 20-40% cheaper at scale`n`nWorkload predictability?`n↓`nVariable → Fargate (auto-scaling, no capacity planning)`nPredictable → EC2 with Reserved Instances (20-40% cheaper)`n`nNeed SSH access or custom AMIs?`n↓`nYES → EC2 required (Fargate has no SSH access to hosts)`nNO → Fargate sufficient`;
                 rationale="Fargate carries a 20-40% premium over equivalent EC2 instances, which is the price of zero server management. This premium is justified when DevOps capacity is limited or task counts are under 50.";
                 default="Fargate for teams < 5 engineers or < 50 tasks; EC2 with Graviton + RIs for maximum cost optimization at scale"; risk="Fargate at scale (50+ tasks) pays 20-40% premium unnecessarily. EC2 with small teams creates unsustainable operational burden."}
                @{name="Fargate Task Right-Sizing"; context="Right-size Fargate task CPU and memory allocation based on actual resource utilization"; criteria="cost, performance";
                 tree="Actual resource utilization monitored?`n↓`nYES → Size allocation at P95 + 20% headroom`nNO → Start with 1 vCPU / 2GB, monitor via CloudWatch Container Insights for 1 week`n`nActual memory usage vs allocation?`n↓`n< 60% allocated → Reduce allocation to save cost (charges for allocated, not used)`n60-80% allocated → Appropriate sizing`n> 80% allocated → Increase allocation to prevent OOM kills`n`nWorkload type?`n↓`nCPU-bound → Ensure vCPU allocation is the primary constraint`nMemory-bound → Ensure memory covers working set + overhead`n`nARM vs x86 architecture?`n↓`nARM/Graviton available → Use for 20% cost reduction at same performance`nx86 required → Native binary dependencies prevent ARM migration`;
                 rationale="Fargate charges for allocated memory, not used memory. Over-allocating by 2x wastes 50% of memory cost. Under-allocating causes OOM kills and task failures that impact users.";
                 default="Start 1vCPU/2GB ARM; monitor via Container Insights for 1 week; right-size to P95 + 20% headroom"; risk="Over-allocating memory costs 2x more than necessary. Under-allocating causes OOM kills and application downtime."}
                @{name="ECS vs EKS Control Plane Selection"; context="Choose between ECS (free control plane) and EKS ($73/month) for Fargate container orchestration"; criteria="cost, complexity";
                 tree="Kubernetes expertise in team?`n↓`nExperienced with K8s → EKS is viable option ($73/month cluster fee)`nNot experienced → ECS (simpler, free control plane)`n`nMulti-service architecture?`n↓`nFew services (< 5) → ECS sufficient for all orchestration needs`nMany services with complex routing → EKS may provide better tooling`n`nCost sensitivity?`n↓`nHIGH → ECS (free vs $73/month EKS fee adds 100%+ to small deployments)`nLOW → Either; EKS provides portability and ecosystem`n`nPortability requirements?`n↓`nMulti-cloud or hybrid → EKS (standard Kubernetes, portable)`nAWS-only → ECS (simpler, integrated, free)`;
                 rationale="ECS control plane is free; EKS costs $73/month per cluster. For most Laravel deployments with 1-5 services, ECS provides equivalent functionality at zero cluster cost. EKS is only justified for teams with K8s expertise and portability needs.";
                 default="ECS for most Laravel Fargate deployments; EKS only for teams with K8s experience and multi-cloud needs"; risk="Paying $73/month EKS fee for a single Fargate service that ECS could manage for free doubles the infrastructure cost for small deployments."}
            )
        }
        "fargate-spot-workers" {
            $trees = @(
                @{name="Spot vs On-Demand Worker Capacity Mix"; context="Determine optimal ratio of Spot and On-Demand Fargate capacity for queue workers"; criteria="cost, reliability";
                 tree="Worker workload characteristics?`n↓`nStateless, interruptible → High Spot percentage (70-90%) for maximum savings`nStateful, critical → Higher On-Demand percentage (50-100%) for reliability`n`nQueue processing SLA?`n↓`nBest-effort (hours to complete) → 100% Spot (maximum cost reduction)`nTimely (minutes to complete) → 70% Spot + 30% On-Demand baseline`nCritical (seconds to complete) → 100% On-Demand (no interruption risk)`n`nSpot interruption tolerance?`n↓`nJobs checkpoint progress → High Spot OK (recover from interruption)`nNo checkpoint → Lower Spot percentage (interrupted jobs restart from scratch)`n`nMulti-AZ distribution?`n↓`n3 AZs → Lower risk (diversified capacity, AZ drain won't affect all)`nSingle AZ → Higher risk; increase On-Demand baseline for reliability`;
                 rationale="Spot offers up to 70% discount with 5-15% hourly interruption rate. Mixed capacity (70/30) ensures baseline throughput during Spot shortages while maximizing savings. Job checkpointing enables higher Spot usage.";
                 default="70% Spot + 30% On-Demand for queue workers; 100% Spot for batch processing with job checkpointing"; risk="100% Spot without On-Demand fallback = queue processing stops entirely during Spot capacity shortages or AZ events."}
                @{name="Graceful Shutdown for Spot Interruption"; context="Configure queue workers to handle Spot interruption's 2-minute SIGTERM warning gracefully"; criteria="reliability";
                 tree="Spot interruption signal handled?`n↓`nYES → SIGTERM caught by Supervisor for graceful worker shutdown`nNO → Implement SIGTERM handler immediately before deploying Spot workers`n`nQueue worker timeout configured?`n↓`nSet --timeout=90 on Horizon workers (fits within 2-minute warning)`nJobs exceeding 120 seconds get interrupted mid-execution`n`nIn-flight job handling on interruption?`n↓`nJobs complete within 90 seconds → Finish before forced termination`nJobs longer than 90 seconds → Implement checkpointing in database`n`nSQS visibility timeout configuration?`n↓`nSet to max_job_duration × 2 for retry safety`nEnsures interrupted jobs become visible again for retry by another worker`;
                 rationale="AWS sends SIGTERM 2 minutes before reclaiming Spot capacity. Graceful handling allows in-flight jobs to complete or checkpoint before termination, preventing wasted processing and invisible retries.";
                 default="--timeout=90 on Horizon; SIGTERM handler for graceful shutdown; checkpoint jobs exceeding 2 minutes"; risk="No graceful shutdown = jobs terminated mid-execution, invisible SQS retries, duplicated processing, and job completion delays."}
                @{name="Spot Instance Type Diversification Strategy"; context="Diversify Spot instance configurations across types and AZs to reduce interruption risk"; criteria="reliability, cost";
                 tree="Single instance type currently used?`n↓`nYES → Add similar instance types for capacity diversification`nNO → Already diversified; review coverage`n`nInstance families available?`n↓`nt4g + m7g (ARM general purpose) → Good diversification baseline`nc7g + r7g → Add compute/memory optimized for breadth`n`nAZ distribution?`n↓`nSingle AZ → HIGH RISK; distribute across minimum 3 AZs`n3 AZs → Low risk; continue monitoring interruption rates`n`nInterruption rate monitoring?`n↓`n> 15% weekly → Increase diversification or raise On-Demand baseline`n< 10% weekly → Current strategy is effective; continue monitoring`;
                 rationale="Spot capacity availability varies significantly per instance type and AZ. Diversification across 3+ instance families and 3 AZs reduces interruption rate by 40-60%, making Spot usage more predictable and reliable.";
                 default="3+ instance types across 3 AZs; monitor SpotInterruptionCount weekly; diversify if >15% weekly interruption rate"; risk="Single instance type in one AZ = all workers interrupted simultaneously during capacity event, stopping queue processing entirely."}
            )
        }
        "graviton-price-performance" {
            $trees = @(
                @{name="Graviton Migration Decision Framework"; context="Decide whether to migrate existing x86 workloads to Graviton/ARM processors"; criteria="cost, risk";
                 tree="New or existing deployment?`n↓`nNEW → Use Graviton by default (20% cheaper, zero migration effort)`nEXISTING → Evaluate migration based on compatibility risk`n`nPHP version?`n↓`nPHP 8.0+ → Full ARM support; migration is safe and recommended`nPHP < 8.0 → Upgrade PHP first, then migrate to Graviton`n`nNative x86 binary dependencies?`n↓`nNone identified → Migrate staging first, then production after 48h validation`nSome dependencies → Test each on ARM; find ARM alternatives if needed`n`nCI/CD pipeline readiness?`n↓`nProduces ARM images → Ready for migration`nx86 only builds → Add multi-arch buildx to pipeline first`;
                 rationale="Graviton offers 20-34% cost reduction at identical or better PHP execution performance. PHP 8.0+ has first-class ARM support. 90%+ of Laravel applications migrate with zero code changes.";
                 default="Use Graviton for all new deployments; migrate existing workloads with staging validation first"; risk="Not migrating leaves 20-34% savings unclaimed. Migrating without testing native dependencies causes deployment failures."}
                @{name="Graviton Service Coverage Planning"; context="Identify which AWS services to migrate to Graviton for maximum cumulative savings"; criteria="cost";
                 tree="Compute services used?`n↓`nEC2 → t4g/m7g/r7g/c7g series (20% cheaper than x86 equivalents)`nFargate → ARM Fargate tasks (20% cheaper than x86 tasks)`nLambda → ARM architecture (34% cheaper duration cost)`n`nDatabase services used?`n↓`nRDS → db.r7g instances (20% cheaper than db.r7i x86)`nAurora → Aurora with Graviton-compatible instances`n`nCache services used?`n↓`nElastiCache → cache.r7g nodes (20% cheaper than cache.r7i)`n`nMigration sequence?`n↓`nFirst → Compute (EC2/Fargate/Lambda) for immediate savings`nSecond → RDS database for additional 20% savings`nThird → ElastiCache for remaining 20% savings`;
                 rationale="Graviton savings compound across all AWS compute services. Migrating EC2 + RDS + ElastiCache together can reduce total infrastructure cost by 20-25%. Each service saves 20-34% independently.";
                 default="Migrate all compute services first, then database, then cache; target uniform ARM architecture across stack"; risk="Migrating compute but not RDS/ElastiCache misses 20% additional savings on each of those services."}
                @{name="Multi-Architecture Build Strategy for Safe Migration"; context="Implement multi-architecture Docker builds to enable safe Graviton migration with rollback"; criteria="reliability, operational_overhead";
                 tree="Docker images in use?`n↓`nYES → Implement multi-arch buildx for ARM + x86 images`nNO → Select ARM instance types directly in launch templates`n`nCI/CD pipeline capability?`n↓`nCapable of multi-arch builds → Add docker buildx, create manifest lists`nLimited capacity → Single-arch ARM builds with manual x86 fallback`n`nRollback capability needed?`n↓`nMulti-arch images → Instant rollback by switching ECS/EC2 instance type`nSingle-arch → Need pipeline rebuild for rollback (slower)`n`nProduction cutover strategy?`n↓`nGradual (10% → 50% → 100% traffic) → Low risk, monitor at each step`nAll-at-once → Higher risk; ensure rollback plan is tested`;
                 rationale="Multi-arch Docker images enable deployment to both ARM and x86 architectures, providing instant rollback safety. Build once with docker buildx, deploy to either architecture without rebuilding.";
                 default="Multi-arch Docker builds via buildx + gradual traffic shift (10/50/100%) to Graviton"; risk="Single-arch ARM images without rollback plan = extended downtime if ARM compatibility issues are discovered in production."}
            )
        }
        "lambda-pricing-breakdown" {
            $trees = @(
                @{name="Lambda Memory Right-Sizing for Cost Optimization"; context="Find cost-optimal Lambda memory allocation that minimizes cost per invocation"; criteria="cost, performance";
                 tree="Test different memory levels (128MB, 256MB, 512MB, 1024MB)?`n↓`nYES → Measure duration at each level; compute cost per invocation`nNO → Test at 256MB and 512MB minimum for comparison`n`nCalculate cost for each level:`ncost = (memory_GB × duration_seconds × $0.0000166667) + $0.0000002`n`nPick cheapest that meets latency SLA?`n↓`nYES → Cost-optimal memory selected - may be 256MB not 1024MB`nNO → Higher memory than needed = paying more for no benefit`n`nARM architecture enabled?`n↓`nYES → ~34% lower duration cost at every memory level`nNO → Enable ARM for immediate 34% savings on duration charges`;
                 rationale="Higher memory costs more per second but may reduce execution duration. The cost-optimal point is rarely the lowest or highest memory setting. Testing 3-4 levels and computing cost per invocation reveals the sweet spot.";
                 default="256MB for simple functions, 512MB for Laravel/Bref; test and compute cost per invocation to validate"; risk="Over-allocating to 1024MB for a simple function costs 4x more per invocation than 256MB with no meaningful duration reduction."}
                @{name="Lambda vs Fargate Compute Model Decision"; context="Choose between Lambda (serverless functions) and Fargate (containers) based on workload volume"; criteria="cost, performance";
                 tree="Monthly request volume?`n↓`n< 5M req/month → Lambda (scale-to-zero eliminates idle compute cost)`n5-30M req/month → Model both; this is the breakeven zone`n> 30M req/month → Fargate cheaper (at 256MB/500ms profile)`n`nAverage execution duration?`n↓`n< 100ms → Lambda efficient (100ms minimum billing aligns)`n100-500ms → Standard range; compute breakeven depends on volume`n> 1 second → Lambda expensive per request; Fargate strongly preferred`n`nTraffic pattern?`n↓`nSpiky with long idle periods → Lambda (scale-to-zero saves during idle)`nSteady 24/7 traffic → Fargate (flat-rate container pricing wins)`n`nCold start tolerance?`n↓`nTolerable → Lambda without Provisioned Concurrency (cheapest)`nNot tolerable → Lambda + Provisioned Concurrency adds cost; re-evaluate Fargate`;
                 rationale="Lambda's scale-to-zero eliminates idle compute cost, ideal for variable low-volume workloads. For steady high-volume traffic, Fargate's flat-rate pricing is 30-60% cheaper. The breakeven is approximately 30M requests/month at 256MB/500ms.";
                 default="Lambda for < 5M req/month; Fargate for 5-50M; EC2 for > 50M req/month"; risk="Using Lambda for steady high-volume traffic beyond breakeven point costs 2-3x more than Fargate. Using Fargate for low-volume spiky traffic pays for idle compute."}
                @{name="Provisioned Concurrency vs EC2 Tradeoff"; context="Determine whether Provisioned Concurrency is cost-justified or if EC2/Fargate would be cheaper"; criteria="cost, performance";
                 tree="Cold start latency acceptable for user experience?`n↓`nYES (< 200ms acceptable) → No Provisioned Concurrency needed; simpler`nNO (< 100ms required for UX) → Evaluate Provisioned Concurrency`n`nConsistent traffic baseline?`n↓`nYES → Provisioned Concurrency may be cost-effective (always used)`nNO → Provisioned Concurrency charges for unused capacity (waste)`n`nCost comparison:`n10 provisioned 1GB functions = ~$50/month baseline charge`n1 t4g.small EC2 instance = ~$17/month (always-on, no cold starts)`n`nIf PC cost > EC2 alternative?`n↓`nYES → Use EC2/Fargate instead of Lambda + PC`nNO → Provisioned Concurrency is acceptable for the use case`;
                 rationale="Provisioned Concurrency charges even when functions aren't invoked. At $50/month for 10 provisioned 1GB functions, that's 3x the cost of a t4g.small EC2 instance running 24/7. If you need Provisioned Concurrency, you should evaluate EC2/Fargate.";
                 default="Avoid Provisioned Concurrency as default; use EC2/Fargate if consistent sub-100ms latency is required"; risk="Enabling Provisioned Concurrency as default adds a $50+/month baseline cost that may exceed running an EC2 instance full-time."}
            )
        }
        "lambda-ec2-breakeven" {
            $trees = @(
                @{name="Lambda vs EC2 Breakeven Calculation"; context="Calculate the exact breakeven point between Lambda and EC2 for your specific workload metrics"; criteria="cost";
                 tree="Gather 30-day average workload metrics:`n↓`nMonthly request count`nAverage memory per function (MB)`nAverage execution duration (ms)`n`nCalculate Lambda monthly cost:`nrequests × $0.0000002 + (requests × memory_GB × duration_hours × $0.0000166667)`n`nCalculate EC2 monthly cost:`ninstances_needed × instance_hourly_rate × 730 hours/month`n`nCompare totals:`nLambda cheaper → Use Lambda (traffic below breakeven)`nEC2 cheaper → Use EC2/Fargate (traffic above breakeven)`nSimilar cost → Fargate as middle ground option`;
                 rationale="Breakeven shifts dramatically with memory allocation and execution duration. A 512MB/1s function breakeven is approximately 7.5M requests, not the reference 30M at 256MB/500ms. Always model with your actual metrics.";
                 default="Model with 30-day actual CloudWatch metrics; re-evaluate quarterly as traffic patterns change"; risk="Using the reference profile (256MB/500ms) instead of actual metrics gives breakeven wrong by 2-4x, leading to incorrect platform choice."}
                @{name="Hidden Cost Factor Inclusion in TCO"; context="Include hidden costs (VPC networking, Provisioned Concurrency, ops overhead) in Lambda vs EC2 comparison"; criteria="cost";
                 tree="Lambda functions in VPC?`n↓`nYES → Add NAT Gateway ($32/month + $0.045/GB data transfer) to Lambda cost`nNO → No additional networking cost for Lambda`n`nProvisioned Concurrency needed?`n↓`nYES → Add PC cost: provisioned_count × memory_GB × $0.000004167/hour`nNO → No PC baseline cost`n`nOperational overhead difference?`n↓`nEC2 needs patching, monitoring, capacity planning (5-10 hours/month)`nFargate: reduced overhead`nLambda: zero operations overhead`n`nCommitment discounts available?`n↓`nCompute Savings Plans → 17% Lambda discount, up to 66% EC2 discount`nNo commitment → Use on-demand pricing for comparison`;
                 rationale="Total cost of ownership must include hidden costs that can shift the breakeven point by 20-50%. VPC networking alone can add $50-200/month to Lambda costs. Savings Plans significantly change the comparison.";
                 default="Include all hidden costs + operational overhead in TCO comparison; factor commitment discounts if applicable"; risk="Comparing only compute line items underestimates Lambda true cost by 20-50% when VPC and PC costs are significant."}
                @{name="Hybrid Lambda + EC2 Architecture Design"; context="Design a hybrid architecture using both Lambda (for spikes) and EC2 (for baseline) for optimal cost"; criteria="cost, performance, complexity";
                 tree="Baseline traffic is steady?`n↓`nYES → EC2 baseline with RIs for discount on steady portion`nNO → Lambda for all (scale-to-zero wins for variable traffic)`n`nTraffic spikes significantly above baseline?`n↓`nYES > 2x baseline → Lambda handles overflow (no idle standby capacity)`nNO < 1.5x baseline → EC2 alone with Auto Scaling sufficient`n`nImplementation complexity acceptable?`n↓`nYES → Hybrid: EC2 baseline for steady + Lambda for overflow`nNO → Single platform (simpler to operate, may cost slightly more)`n`nMonthly compute spend?`n↓`n> $5K/month → Hybrid complexity may be worth the optimization`n< $5K/month → Single platform is simpler and cost-effective enough`;
                 rationale="Hybrid architecture uses EC2's flat-rate pricing for steady baseline traffic and Lambda's scale-from-zero for traffic spikes. This is the most cost-efficient model but requires operational complexity to manage two platforms.";
                 default="Single platform (Fargate) for most apps under $5K/month; hybrid only for workloads with clear baseline/spike separation at scale"; risk="Hybrid complexity often negates savings for apps under $5K/month. Incorrect request routing can cost more than either platform alone."}
            )
        }
        "laravel-cloud-vs-vapor" {
            $trees = @(
                @{name="Cloud vs Vapor Platform Selection"; context="Choose between Laravel Cloud (Fargate) and Laravel Vapor (Lambda) for hosting Laravel applications"; criteria="cost, performance, complexity";
                 tree="Monthly request volume?`n↓`n< 100K req/day → Cloud Starter ($5/month) wins on cost simplicity`n100K-5M req/day → Cloud wins on cost predictability and Octane performance`n> 5M req/day → Cloud or Forge+EC2 for maximum control and savings`n`nCurrent platform?`n↓`nNew project → Cloud (default recommendation 2026)`nExisting Vapor > $1K/month → Model Cloud migration for 30-50% savings`nExisting Vapor < $500/month → Stay on Vapor (migration cost > savings)`n`nOctane compatibility tested?`n↓`nYES → Cloud (Octane is default runtime, 3-10x throughput gain)`nNO → Test Octane first; Cloud savings partially depend on it`nIncompatible packages → Stay on Vapor or fix packages before migration`n`nCold start sensitivity?`n↓`nLow (background jobs) → Cloud auto-hibernation fine (saves cost)`nMedium → Set minimum Cloud containers to avoid cold starts`nHigh (user-facing API) → Cloud needs min containers (reduces savings)`;
                 rationale="Real-world migrations show 30-50% cost reduction from Vapor to Cloud. Vapor's 9x Lambda invocation multiplier makes it uneconomical above 20M requests/month. Cloud's Fargate-based pricing has no multiplier effect.";
                 default="Cloud for new projects and Vapor migrations > $1K/month; test Octane compatibility first before committing"; risk="Migrating to Cloud without Octane compatibility validation = failed migration or reduced savings, wasting engineering time."}
                @{name="Vapor True Cost with Lambda Multiplier"; context="Calculate Vapor's true cost including the 9x Lambda invocation multiplier for accurate comparison"; criteria="cost";
                 tree="Measure actual Lambda invocation multiplier?`n↓`nDivide total Lambda invocations by HTTP request count (from Vapor bill + CloudWatch)`nAverage: 9x multiplier; range 4-15x depending on queue workers and architecture`n`nFactor multiplier into cost comparison:`nEffective cost per Vapor request = raw_Lambda_cost × multiplier`nA $0.00000228/request becomes $0.0000205/request with 9x multiplier`n`nCompare to Cloud:`nCloud cost per request = container_monthly_cost / requests_per_month`nCloud has NO multiplier effect`n`nAdd hidden Vapor costs?`n↓`nAPI Gateway charges`nCloudFront data transfer`nNAT Gateway (if VPC connected)`nDeployment hook Lambda invocations`;
                 rationale="A single HTTP request on Vapor triggers 9+ Lambda invocations due to architectural overhead (router, PHP-FPM bridge, workers, response). This multiplier makes Vapor 3-5x more expensive than raw Lambda pricing suggests.";
                 default="Always factor 9x multiplier into Vapor cost calculations; measure actual multiplier from Vapor bill for accuracy"; risk="Comparing Cloud to raw Lambda pricing (without 9x multiplier) makes Vapor appear 3-5x cheaper than it actually is, leading to incorrect platform decisions."}
                @{name="Vapor to Cloud Migration Decision"; context="Determine whether and when to migrate from Vapor to Cloud based on monthly spend and readiness"; criteria="cost, risk";
                 tree="Current Vapor monthly spend?`n↓`n< $500/month → Migration may not justify engineering effort`n$500-$2,000/month → Model savings; payback typically 6-12 months`n$2,000-$10,000/month → Strong migration candidate; payback 3-6 months`n> $10,000/month → Urgent; migrate as soon as resources allow`n`nMigration readiness checklist:`n↓`nOctane compatibility validated on existing infrastructure?`nCloud account configured with spending limits and team access?`nRollback plan prepared (keep Vapor running 2 weeks post-migration)?`n`nMigration approach?`n↓`nPhased (staging → non-critical routes → full production) → Lower risk`nRip-and-replace → Higher risk; only for low-traffic apps or urgent cases`n`nPost-migration optimization?`n↓`nMonitor cost vs pre-migration baseline for 30 days`nRight-size containers after 2 weeks of metrics`nTune auto-scaling thresholds`;
                 rationale="Migration payback is typically 3-6 months for apps spending > $1K/month on Vapor. Risk is low because Vapor can run in parallel as a rollback option. Case studies show 30-50% savings.";
                 default="Validate Octane first; migrate staging → monitor 48h → migrate production with 2-week Vapor rollback window"; risk="Rip-and-replace migration with no rollback plan = extended downtime if Cloud configuration or Octane compatibility issues arise in production."}
            )
        }
        "laravel-octane-throughput" {
            $trees = @(
                @{name="Octane Adoption Decision Framework"; context="Decide whether to adopt Octane based on traffic volume and application characteristics"; criteria="performance, cost, complexity";
                 tree="Current traffic volume?`n↓`n< 100K req/day → PHP-FPM sufficient; Octane optional for future-proofing`n100K-1M req/day → Octane strongly recommended for cost-effective throughput`n> 1M req/day → Octane is effectively mandatory to keep compute costs manageable`n`nApplication workload type?`n↓`nCPU-bound (API, view rendering) → 7-10x throughput gain with Octane`nI/O-bound (DB heavy, API calls) → 3-5x throughput gain`n`nOctane compatibility audited?`n↓`nAll packages tested → Proceed with confidence`nSome packages untested → Test all critical packages first`nIncompatible packages found → Refactor or find alternatives`n`nServer backend selection?`n↓`nFrankenPHP → Default for new deployments (Docker-native, PHP 8.3+)`nSwoole → Maximum throughput, most mature ecosystem`nRoadRunner → Simplest debugging, Go-based architecture`;
                 rationale="Octane delivers 3-10x throughput improvement over PHP-FPM on identical hardware by eliminating per-request boot overhead. This directly reduces server count and compute costs by 50-80% for moderate to high traffic applications.";
                 default="Enable Octane for all production deployments > 100K req/day; FrankenPHP for new deployments; Swoole for maximum throughput"; risk="Not using Octane leaves 50-80% compute cost savings on the table for high-traffic apps. Deploying without package audit risks data leakage."}
                @{name="Octane Worker Configuration and Memory Safety"; context="Configure worker count, max_requests, and memory limits for stable Octane operation"; criteria="performance, reliability";
                 tree="Server CPU cores?`n↓`nSet worker count = CPU cores for CPU-bound workloads`nSet worker count = 1.5-2x CPU cores for I/O-heavy workloads`n`nmax_requests value?`n↓`nSet 1000-5000 to prevent unbounded memory accumulation`nWorkers restart after N requests, releasing accumulated memory`nPrevents OOM kills that drop all in-flight requests`n`nMemory limit per worker?`n↓`nSet memory_limit = 256M or 512M in Octane configuration`nMonitor resident memory over 24 hours`nIf growth > 10KB/request → Investigate memory leak`n`nJIT compilation enabled?`n↓`nYES → opcache.jit=tracing, jit_buffer_size=100M for CPU-bound improvements`nNO → Enable for CPU-bound tasks running on Octane`;
                 rationale="CPU-bound workers saturate cores; extra workers cause context switching overhead. max_requests provides safety against memory leaks by restarting workers periodically. Each worker should have adequate but not excessive memory limits.";
                 default="Workers = CPU cores + 1; max_requests = 2000; memory_limit = 256M; JIT enabled for CPU-bound tasks"; risk="Too many workers causes CPU thrashing and throughput reduction. No max_requests = unbounded memory growth and OOM kills."}
                @{name="Octane Package Compatibility Audit Process"; context="Audit third-party packages for Octane compatibility before migration from PHP-FPM"; criteria="reliability, performance";
                 tree="All critical packages identified?`n↓`nYES → Compile list; categorize by risk level (static state, destructors, singletons)`nNO → Run `composer show -i` for complete inventory`n`nStatic/mutable global state issues?`n↓`nStatic class properties → Must be stateless or reset per-request`nSingleton with request data → Must use Octane sandbox for isolation`nService providers with state → Must be Octane-compatible`n`nDestructor and shutdown function usage?`n↓`n__destruct() for cleanup → Won't fire at request end; must refactor`nShutdown functions → Register via Octane lifecycle hooks instead`n`nLoad test with Octane?`n↓`nRun 10,000+ test requests before production cutover`nMonitor for: data leakage across requests, memory growth, error rates`nCompare throughput and latency to PHP-FPM baseline`;
                 rationale="Octane keeps application state in memory across requests. Packages assuming PHP-FPM's per-request lifecycle (global state, destructors) will break silently on Octane, causing data leakage or resource exhaustion.";
                 default="Test all critical packages with Octane for 10K+ requests before production cutover; fix compatibility issues early"; risk="Untested package incompatibility causes data leakage across user requests or silent failures that are difficult to diagnose in production."}
            )
        }
        "performance-vs-cost" {
            $trees = @(
                @{name="Optimization Prioritization (80/20 Rule)"; context="Identify and prioritize highest-ROI performance optimizations using the Pareto principle"; criteria="cost, performance";
                 tree="Profile current bottlenecks before optimizing?`n↓`nYES → Identify single biggest performance issue`nNO → Profile first (90% of performance guesses are wrong)`n`nIssue type identified?`n↓`nMissing OPcache → 5-minute config change, 50-70% CPU reduction`nPHP-FPM misconfiguration → Config change, 10-30% improvement`nMissing database index → Add index, 100x query speedup`nN+1 queries → Fix eager loading, 50x fewer queries per page`nApplication logic → More complex to fix, lower typical ROI`n`nROI estimate:`n↓`n5 minutes to implement, $500/month savings → Yes, implement immediately`n40 hours to implement, $100/month savings → Skip; not worth engineering time`n`nImplement in order of ROI:`n↓`nOPcache → FPM tuning → DB indexes → Query optimization → Octane`;
                 rationale="80% of optimization benefit comes from 20% of changes. OPcache alone gives 50-70% CPU reduction for a single config change. Full Octane + JIT gives additional 20% for 10x engineering effort. Prioritizing correctly saves time and money.";
                 default="Profile first; then OPcache → PHP-FPM → DB indexes → queries → Octane (highest ROI first)"; risk="Optimizing before measuring = 90% chance of fixing the wrong bottleneck, wasting engineering time with no measurable improvement."}
                @{name="Compute Platform Breakeven Analysis"; context="Determine cost-optimal compute platform (Lambda, Fargate, or EC2) based on workload volume"; criteria="cost, performance";
                 tree="Monthly request volume?`n↓`n< 100 req/s average → Lambda (scale-to-zero, no idle compute cost)`n100-1000 req/s → Fargate (balanced cost and control, no server management)`n> 1000 req/s → EC2 (maximum price-performance with Reserved Instances)`n`nAverage request duration?`n↓`n< 100ms → Lambda efficient (minimal duration cost)`n100-500ms → Standard range; breakeven analysis needed`n> 500ms → Fargate/EC2 likely cheaper per request`n`nTraffic predictability?`n↓`nSteady 24/7 → EC2 with RIs (up to 66% discount vs on-demand)`nVariable daily pattern → Fargate with auto-scaling`nSpiky with long idle → Lambda (scale-to-zero)`n`nOperational overhead cost to include?`n↓`nLambda: $0 ops overhead`nFargate: minimal ops overhead`nEC2: 5-10 hours/month ops effort (~$500-1000 value)`;
                 rationale="The cost-performance curve has a clear knee where each platform dominates. Lambda is cheapest at low volume due to scale-to-zero. EC2 wins at high volume with flat-rate pricing. Fargate sits in the middle with operational simplicity.";
                 default="Lambda < 100 req/s; Fargate 100-1000 req/s; EC2 > 1000 req/s with RIs; use Fargate as default middle ground"; risk="Using Lambda at 1000+ req/s costs 2-3x more than EC2. Using EC2 for 10 req/s average wastes 90%+ of compute capacity."}
                @{name="Cost-Performance Budget and Metric Setting"; context="Set performance budgets and cost-per-request targets for ongoing cost-performance health monitoring"; criteria="cost, performance";
                 tree="Target cost per request defined?`n↓`nTarget: < $0.0001/request for most Laravel applications`nTrack monthly: total_compute_cost / total_requests`nTrending up = cost-performance degradation; investigate immediately`n`nLatency budgets defined?`n↓`np50 < 200ms (median response time)`np95 < 500ms (ninety-fifth percentile)`np99 < 1000ms (tail latency)`n`nCI/CD performance gates in place?`n↓`nYES → Enforce budgets in pipeline; fail builds exceeding thresholds`nNO → Add performance gate in CI/CD process`n`nCost vs latency tradeoff decision?`n↓`n10% more latency for 30% cost reduction → Acceptable for most apps`n10% latency improvement for 2x cost → Only if latency directly impacts revenue`;
                 rationale="Cost per request provides a single health metric for cost-performance optimization. The $0.0001/request target gives a baseline. Tracking it monthly reveals degradation trends before they become budget problems.";
                 default="Target < $0.0001/request, p50 < 200ms, p95 < 500ms, p99 < 1000ms; review monthly in cost review"; risk="No performance budgets = cost-performance degradation goes undetected until users complain about latency or finance flags the bill."}
            )
        }
        "queue-worker-scaling" {
            $trees = @(
                @{name="SQS Queue Depth Auto-Scaling Configuration"; context="Configure queue worker auto-scaling based on SQS ApproximateNumberOfMessagesVisible metric"; criteria="performance, cost";
                 tree="Scaling metric choice?`n↓`nSQS ApproximateNumberOfMessagesVisible → Best for queue-based auto-scaling`nCustom backlog per worker → Alternative for database-backed queues`n`nScale-out threshold calculation:`n↓`ntarget_latency_minutes × jobs_per_worker_per_minute`nExample: 5 min latency × 10 jobs/min/worker = scale at depth 50`n`nScale-in threshold?`n↓`nSet at 10% of scale-out threshold (depth 5 for above example)`nScale-in cooldown: 600+ seconds to prevent oscillation`n`nWorker capacity type?`n↓`nSpot (70% discount) → Stateless queue workers`nOn-Demand → Time-critical jobs requiring consistent processing`nMixed (70% Spot + 30% On-Demand) → Balanced approach`;
                 rationale="Latency-based scaling ensures workers are added before backlog exceeds acceptable delay. Scale-out threshold = target_latency × throughput ensures proactive capacity addition. Long scale-in cooldown prevents premature worker termination.";
                 default="Scale-out at queue depth 1000, add 2 workers; scale-in at depth 100, remove 1; 600s scale-in cooldown"; risk="Too aggressive scale-in terminates workers mid-job, wasting processing and delaying job completion. No auto-scaling = hours of backlog during traffic spikes."}
                @{name="Priority Queue Separation Design"; context="Design separate auto-scaling policies per queue priority to prevent starvation"; criteria="performance, reliability";
                 tree="Multiple job priorities exist?`n↓`nYES → Implement separate queues with independent scaling policies`nNO → Single queue with uniform scaling is sufficient`n`nHigh-priority queue (email, notifications):`n↓`nScale-out threshold: depth 100 (aggressive, low latency target)`nMinimum workers: 2 (always available)`nScale-in cooldown: 300s (quick to restore capacity)`nWorker type: On-Demand (consistent processing)`n`nLow-priority queue (reports, cleanup):`n↓`nScale-out threshold: depth 5000 (conservative, batch-friendly)`nMinimum workers: 0 (scale to zero when idle)`nScale-in cooldown: 600s (slow to remove)`nWorker type: Spot (70% savings)`n`nNormal-priority queue (notifications, processing):`n↓`nScale-out: depth 500 (moderate)`nWorkers: 70% Spot + 30% On-Demand mixed`;
                 rationale="Separate auto-scaling groups per queue priority prevent low-priority jobs (reports, cleanup) from starving high-priority jobs (email, notifications). Each ASG scales independently based on its own queue depth and priority-specific thresholds.";
                 default="3 tiers: high (On-Demand, min=2, depth=100), normal (mixed, depth=500), low (Spot, min=0, depth=5000)"; risk="Same scaling for all priorities = cleanup jobs block email delivery during peak batch processing, causing critical delays."}
            )
        }
        "vapor-lambda-invocation-cost" {
            $trees = @(
                @{name="Vapor Lambda Multiplier Calculation"; context="Calculate Vapor's true per-request cost by measuring and applying the Lambda invocation multiplier"; criteria="cost";
                 tree="Measure actual Lambda invocation multiplier?`n↓`nQuery Vapor cost dashboard + CloudWatch Lambda metrics`nDivide total Lambda invocations by HTTP request count`nAverage: 9x; Range: 4-15x depending on queue workers, cron, architecture`n`nApply multiplier to cost calculation:`n↓`nEffective cost per Vapor request = raw_Lambda_cost × measured_multiplier`nExample: raw $0.00000228/request × 9x = $0.0000205/request`n`nCompare to alternatives with multiplier included:`n↓`nVapor: $0.0000205/request (with 9x multiplier)`nCloud (Fargate): ~$0.000004/request with Octane (5x cheaper)`nBref (direct Lambda): $0.00000228/request (1x, no multiplier)`n`nDecision at > $0.00005/request?`n↓`nYES → Cloud or Bref is more cost-effective`nNO → Vapor is competitive for current traffic level`;
                 rationale="Vapor's 9x invocation multiplier means effective cost per request is 9x raw Lambda pricing. This is the primary reason Vapor becomes uneconomical above 20M requests/month. Measuring your actual multiplier is essential for accurate cost comparison.";
                 default="Always factor measured multiplier into Vapor cost calculations; re-measure quarterly as architecture evolves"; risk="Comparing Vapor to Fargate/EC2 without the multiplier makes Vapor appear 3-5x cheaper than it actually is, leading to incorrect platform decisions."}
                @{name="Vapor vs Bref Direct Lambda Decision"; context="Choose between Vapor (managed Lambda) and Bref (direct Lambda runtime) for Lambda-native Laravel"; criteria="cost, complexity";
                 tree="Monthly request volume?`n↓`n< 5M req/month → Vapor convenience justifies premium over Bref`n5-20M req/month → Evaluate Bref for cost savings (eliminates 9x multiplier)`n> 20M req/month → Cloud/Fargate likely cheapest overall`n`nDevOps capacity and requirements?`n↓`nLimited → Vapor (managed deployment, env management, zero ops)`nAdequate → Bref (more control, 1x Lambda invocation multiplier)`nExperienced → Custom Lambda deployment with Bref or Laravel Zero`n`nMultiplier comparison impact:`n↓`nVapor: 9x invocation multiplier (effective cost 9x raw Lambda)`nBref: 1x invocation multiplier (direct PHP runtime, no overhead)`nBref eliminates 90% of Lambda invocation cost for same workload`n`nMigration path consideration?`n↓`nVapor → Bref → Cloud for gradual cost optimization`nEach step increases savings while maintaining operational stability`;
                 rationale="Bref provides a direct Lambda runtime for Laravel without Vapor's architectural overhead. Each HTTP request = 1 Lambda invocation vs 9+ on Vapor. This 9x reduction in invocations directly translates to proportional cost savings.";
                 default="Vapor for convenience under 5M req/month; Bref for cost optimization at higher volumes; Cloud as ultimate destination"; risk="Vapor's 9x multiplier at 20M+ req/month creates $5K+/month Lambda bills that Bref would reduce by approximately 80%."}
            )
        }
        # === 02-database-cost-optimization ===
        "aurora-platform-v4" {
            $trees = @(
                @{name="Aurora v4 Upgrade Decision"; context="Decide when and how to upgrade Aurora from v3 to v4 for immediate cost reduction"; criteria="cost, performance";
                 tree="Currently running Aurora?`n↓`nYES → Upgrade to v4 immediately (28% cost reduction, zero code changes)`nNO (RDS, Neon, etc.) → Not applicable`n`nv4 available in current AWS region?`n↓`nYES → Proceed with upgrade during next maintenance window`nNO → Wait for regional availability; check AWS regional table`n`nUpgrade approach?`n↓`nDuring maintenance window → <30s downtime, automated process`nImmediate → If maintenance window is more than 30 days away`n`nPost-upgrade step?`n↓`nEvaluate instance downsizing after 2 weeks of v4 metrics`nv4's 27% performance improvement may allow smaller instance class`;
                 rationale="Aurora v4 delivers 28% cost reduction and 27% faster queries as a free, fully backward-compatible upgrade. There is no downside to upgrading — it's a free optimization with immediate ROI.";
                 default="Upgrade immediately during next maintenance window; combine with Graviton for ~42% total savings"; risk="Delaying the v4 upgrade pays 28% more than necessary for each month of delay with zero benefit."}
                @{name="Post-v4 Instance Rightsizing Opportunity"; context="Determine if Aurora instance can be downsized after v4 upgrade due to 27% performance improvement"; criteria="cost, performance";
                 tree="Current instance CPU utilization?`n↓`n< 60% at peak → Strong candidate for downsizing one tier`n60-80% → May downsize; monitor carefully after change`n> 80% → Keep current size; no headroom for downsizing`n`nPost-upgrade monitoring period?`n↓`n2 weeks minimum → Collect CPU, memory, IOPS metrics after v4 upgrade`nSkip → Risky; insufficient data for rightsizing decision`n`nDownsize trial results?`n↓`nCPU < 70% on smaller instance → Downsize successful; keep`nCPU > 80% → Revert to original instance size`n`nCombine with Graviton migration?`n↓`nYES → v4 (28%) + Graviton (20%) = ~42% total database cost reduction`nNO → v4 savings only (28%) but simpler migration`;
                 rationale="v4's 27% average performance improvement means the same throughput can be achieved with a smaller instance. Combined with Graviton, total database cost reduction can reach approximately 42% without any application code changes.";
                 default="Monitor 2 weeks post-v4 upgrade; evaluate downsizing one tier; combine with Graviton for maximum savings"; risk="Downsizing without adequate monitoring (2 weeks minimum) risks insufficient capacity during peak traffic hours, causing performance degradation."}
            )
        }
        "aurora-serverless-breakeven" {
            $trees = @(
                @{name="Serverless v2 vs Provisioned Aurora Decision"; context="Choose between Aurora Serverless v2 and provisioned Aurora based on traffic variability and RI coverage"; criteria="cost";
                 tree="Traffic peak-to-trough ratio (measured over 90 days)?`n↓`n< 2:1 → Provisioned + RI wins (20-60% cheaper than Serverless v2)`n2:1 to 5:1 → Model both options with actual traffic pattern`n> 5:1 → Serverless v2 auto-scaling provides better cost alignment`n`nRI coverage for provisioned option?`n↓`n3-year all-upfront RI → Provisioned 60% cheaper per compute-hour`nNo RI → On-demand provisioned vs Serverless v2 are closer in cost`n`nHybrid architecture considered?`n↓`nYES → Provisioned writer (steady writes) + Serverless v2 readers (variable reads)`nOften optimal for 2:1 to 5:1 ratio range`nNO → Pure approach simplifies operations but may cost more`n`nMinimum ACU floor acceptable?`n↓`n0.5 ACU minimum (~$43/month) → Serverless v2 viable`nNeed true zero-cost idle → Provisioned can be stopped when not needed`;
                 rationale="The 3:1 rule of thumb is for on-demand pricing comparison. With 3-year RIs, provisioned is 60% cheaper per compute-hour, requiring approximately a 5:1 peak-to-trough ratio for Serverless v2 to compete on cost.";
                 default="Provisioned + RI for < 2:1 ratio; Hybrid for 2:1 to 5:1; Serverless v2 for > 5:1 ratio"; risk="Using Serverless v2 for steady workloads (<2:1 ratio) costs 20-60% more than provisioned with RIs for the same workload."}
                @{name="Serverless v2 Minimum ACU Setting"; context="Set optimal minimum ACU for Aurora Serverless v2 to balance cost and buffer pool performance"; criteria="cost, performance";
                 tree="Production database?`n↓`nYES → Min ACU = working_set_size_GB / 2 (buffer pool per ACU)`nMinimum 4 ACU for any production workload`nNO (dev/test) → Min ACU = 0 (auto-pause enabled, zero compute when idle)`n`nWorking set size known?`n↓`nYES → Calculate: min ACU = working_set_GB / 2`nNO → Start at 4 ACU, monitor buffer pool hit ratio`n`nBuffer pool hit ratio > 95%?`n↓`nYES → Min ACU is sufficient for current working set`nNO → Increase min ACU until hit ratio exceeds 95% (each ACU adds 2GB)`n`nRDS Proxy in use?`n↓`nYES → Factor 8 ACU minimum charge (~$300/month) into cost comparison`nNO → No additional ACU floor from proxy`;
                 rationale="Setting min ACU too low (0.5) causes buffer pool thrashing, increasing I/O costs by 50-200%. Each ACU provides approximately 2GB buffer pool. 4 ACU minimum ensures adequate buffer for most production workloads.";
                 default="Production: min 4 ACU (working set / 2); Dev/test: min 0 ACU (auto-pause); monitor buffer pool hit ratio >95%"; risk="Setting min ACU to 0.5 in production causes constant buffer pool thrashing with 50-200% higher I/O costs and degraded query performance."}
            )
        }
        "aurora-serverless-v2" {
            $trees = @(
                @{name="Serverless v2 ACU Configuration Strategy"; context="Configure Aurora Serverless v2 ACU range and settings for optimal cost-performance balance"; criteria="cost, performance";
                 tree="Environment type?`n↓`nProduction → Min 4 ACU, Max = peak_traffic + 20% headroom`nDev/test → Min 0 ACU (auto-pause enabled), Max 2-4 ACU`n`nI/O cost assessment?`n↓`nI/O charges > 25% of compute → Use I/O-Optimized ($0.156/ACU-hour, free I/O)`nI/O charges < 25% of compute → Use Standard ($0.12/ACU-hour + per-I/O)`n`nBuffer pool hit ratio monitored?`n↓`nYES → >95% = min ACU adequate; <95% = increase min ACU`nNO → Enable BufferCacheHitRatio monitoring immediately`n`nRDS Proxy cost factored?`n↓`nRDS Proxy with Serverless = min 8 ACU charge (~$300/month)`nUse PgBouncer instead for significant cost savings`;
                 rationale="Aurora Serverless v2 has no RI, making it optimal for variable workloads but more expensive than provisioned+RI for steady workloads. Min ACU setting directly impacts both buffer pool performance and base cost.";
                 default="Production: min 4 ACU, I/O-Optimized if I/O > 25% of compute; Dev: min 0 ACU, auto-pause"; risk="Setting min ACU to 0.5 in production causes buffer pool thrashing with 50-200% higher I/O costs."}
                @{name="I/O-Optimized vs Standard Configuration Decision"; context="Choose between Aurora Standard and I/O-Optimized based on workload I/O patterns"; criteria="cost";
                 tree="Monthly I/O charges as percentage of compute cost?`n↓`n< 15% → Standard ($0.12/ACU-hour + I/O charges) is cheaper`n15-25% → Model both; this is the breakeven zone`n> 25% → I/O-Optimized ($0.156/ACU-hour, no I/O charges) wins`n`nWorkload profile?`n↓`nRead-heavy with frequent small queries → Higher I/O count; favor I/O-Optimized`nWrite-heavy with large data volumes → Evaluate I/O percentage`nBuffer pool thrashing (from low min ACU) → Fix min ACU before switching`n`nCan switch between configurations?`n↓`nYES → Zero downtime to switch; can start Standard and monitor I/O`nMonitor I/O cost monthly; switch to I/O-Optimized when threshold crossed`;
                 rationale="I/O-Optimized eliminates per-I/O charges at 30% higher compute cost. The breakeven occurs when I/O charges exceed approximately 25% of compute cost. The configuration switch is zero-downtime, allowing flexible optimization.";
                 default="Start with Standard; monitor I/O cost vs compute ratio; switch to I/O-Optimized when I/O > 25% of compute"; risk="Not evaluating I/O-Optimized when I/O charges are high means paying 2-3x more in I/O costs than necessary each month."}
            )
        }
        "connection-limits-pricing" {
            $trees = @(
                @{name="Connection Limit Mitigation: Pooler vs Instance Upgrade"; context="Choose between adding a connection pooler vs upgrading database instance when approaching connection limits"; criteria="cost";
                 tree="Current connection count vs max_connections?`n↓`n< 50% → No action needed`n50-80% → Monitor; plan connection pooler deployment`n> 80% → Action required immediately`n`nSolution cost comparison:`n↓`nRDS Proxy: $15-30/month (managed, pools connections)`nPgBouncer: ~$5/month on t4g.nano (open source, PostgreSQL)`nInstance upgrade: $50-200+/month more (increases limits + compute)`n`nCost-optimal path:`n↓`nAdd pooler first ($15-30/month)`nOnly upgrade instance if pooler + app still needs more connections`nOR if additional compute capacity is also needed`n`nImplementation:`n↓`nRDS Proxy → Point Laravel DB_HOST to proxy endpoint, enable IAM auth`nPgBouncer → Deploy on t4g.nano, configure pool size = 2-3x DB vCPUs`;
                 rationale="RDS Proxy costs $15-30/month vs database instance upgrade costs $50-200+/month more. Always add a connection pooler before resizing the database instance, unless additional compute capacity is also genuinely needed.";
                 default="Add RDS Proxy ($15-30/month) before upgrading database instance for connection limits"; risk="Upgrading the database instance solely for more connections pays $50-200+/month for CPU and memory that aren't needed, when a $15-30 pooler would suffice."}
                @{name="max_connections Calculation and Configuration"; context="Calculate and configure maximum database connections based on instance memory and application needs"; criteria="performance, reliability";
                 tree="Database engine?`n↓`nMySQL: max_connections = LEAST(RAM_bytes / 12582880, 5000)`nPostgreSQL: Configure based on shared_buffers and workload requirements`n`nApplication connection budget calculated?`n↓`nPHP-FPM workers × servers + queue workers + admin reserve + background jobs`nReserve 10-20% of budget for admin and maintenance connections`n`nBudget within instance max_connections?`n↓`nYES → Configure in parameter group; monitor utilization with CloudWatch`nNO → Add connection pooler or upgrade to larger instance`n`nConnection timeout configured?`n↓`nLaravel: 'options' => [PDO::ATTR_TIMEOUT => 5] for 5-second timeout`nPrevents workers from hanging indefinitely when waiting for connections`;
                 rationale="max_connections is directly tied to instance RAM by the formula. Each connection uses approximately 2-10MB memory. Overriding max_connections too high risks OOM kills. Always reserve 10-20% for administrative access.";
                 default="Calculate from instance RAM formula; reserve 20% for admin connections; set Laravel connection timeout to 5s"; risk="Setting max_connections too high on small instance causes OOM. Not reserving admin connections prevents emergency database access during peak."}
            )
        }
        "data-archival" {
            $trees = @(
                @{name="Data Archival Strategy Design"; context="Design data lifecycle management with hot/warm/cold storage tiering for Laravel databases"; criteria="cost, performance";
                 tree="Current database size?`n↓`n< 50GB → Archival not urgent; plan partitioning for future`n50-200GB → Implement archival within next quarter`n> 200GB → Archival is critical; implement immediately`n`nData access patterns by age:`n↓`nCurrent 0-6 months → Hot tier (primary database, frequent queries)`n6-24 months old → Warm tier (cheaper DB, S3 with Athena, or Neon branch)`n> 24 months → Cold tier (S3 Glacier, compliance retention only)`n`nCompliance retention requirements?`n↓`n7-year retention → Archive to S3/Glacier, do not delete`nNo retention requirement → Purge after business need ends`n`nTable partitioning strategy?`n↓`nPartition by month/year → Clean detachment of old partitions`nNo partitioning → Implement partitioning first (requires migration)`;
                 rationale="Systematic data archival reduces active database size by 60-80%, enabling smaller instance sizes and faster queries. Most Laravel applications only access data from the last 30-90 days, while 80% of table bloat comes from older records.";
                 default="Partition tables by month/year; keep 6 months active; archive to S3/Parquet; test restoration quarterly"; risk="No data archival strategy = database grows unbounded to 500GB+, queries slow significantly, and instance costs increase by $500+/month."}
                @{name="Archive Storage Tier Selection"; context="Choose appropriate storage tier for archived data based on access frequency and retrieval SLA"; criteria="cost, performance";
                 tree="Archived data access frequency?`n↓`nOccasional (monthly/quarterly) → S3 Standard or Infrequent Access`nRare (yearly/audit compliance) → S3 Glacier Flexible Retrieval`nNever (compliance only) → Glacier Deep Archive (cheapest at $0.00099/GB/month)`n`nQuery mechanism required?`n↓`nSQL queries needed → Keep in cheap DB (Neon branch) or Parquet on S3 + Athena`nRaw file access → S3 direct (CSV, JSON, or Parquet files)`nNo queries needed → Glacier Deep Archive (maximum compression, lowest cost)`n`nRestore time SLA?`n↓`nMinutes → S3 Standard or Infrequent Access`n1-5 hours → Glacier Flexible Retrieval (expedited available)`n12+ hours → Glacier Deep Archive (cheapest, slowest)`n`nData format for archiving?`n↓`nParquet → Columnar, compressed (70-80% smaller than CSV), queryable via Athena`nCSV → Universal but no embedded schema, larger files, more expensive to query`;
                 rationale="S3 costs $0.023/GB/month vs RDS at $0.115-0.46/GB/month. Glacier Deep Archive at $0.00099/GB/month is approximately 100x cheaper than database storage. Parquet format with Athena provides query capability at very low cost.";
                 default="Parquet on S3 Standard for 6-24 months; Glacier Deep Archive for 2+ years; Athena for on-demand SQL queries"; risk="Archiving to CSV without schema documentation = data cannot be reliably restored. Glacier with 12-hour restore SLA doesn't meet compliance query SLAs."}
                @{name="Automated Archival Implementation in Laravel"; context="Implement scheduled automated data archival using Laravel commands and model pruning"; criteria="reliability, cost";
                 tree="Soft-deleted models accumulating?`n↓`nYES → Use Laravel's Prunable trait for auto-archival of old soft-deletes`nNO → Implement custom `php artisan app:archive-old-records` command`n`nArchival job scheduling?`n↓`nSchedule to run daily during low-traffic period`nProcess in chunks to avoid memory exhaustion`nVerify export before deleting from source`n`nExport format and verification?`n↓`nExport to Parquet on S3 with schema preserved`nVerify S3 file exists with correct record count`nDelete from active database only after verification`n`nQuarterly restoration test?`n↓`nRestore random subset of archived data`nVerify data integrity and completeness`nUpdate restoration runbook with any changes`;
                 rationale="Manual archival is error-prone and inconsistent. Automated scheduled jobs ensure regular archival without human intervention. Quarterly restoration tests validate that the archival system works correctly and data can be recovered.";
                 default="Schedule daily archival command; use Prunable for soft-deletes; test restoration quarterly; document retention policy per entity"; risk="Archiving data without testing restoration = archived data is worthless if it cannot be recovered when needed for compliance or business operations."}
            )
        }
        "index-tuning-cost" {
            $trees = @(
                @{name="Index Strategy Design for Query Patterns"; context="Design optimal indexing strategy balancing query read performance against write overhead"; criteria="performance, cost";
                 tree="Query pattern analysis completed?`n↓`nYES → Index for actual query patterns from slow query log`nNO → Enable slow query log, analyze top 10 slowest queries first`n`nColumn usage in queries:`n↓`nWHERE clause column → Must index (primary target for performance)`nJOIN column (foreign key) → Must index (prevents full table scans)`nORDER BY column → Index beneficial (eliminates filesort/temporary table)`nLow cardinality column (< 100 values) → Only useful in composite index`n`nComposite or single-column index?`n↓`nSingle WHERE filter → Single-column index`nMultiple WHERE filters → Composite index (column order by cardinality)`nWHERE + ORDER BY → Composite index covering both clauses`n`nWrite performance impact assessment?`n↓`n< 5 indexes per table → Acceptable write overhead`n5-10 indexes per table → Monitor write performance metrics`n> 10 indexes per table → Review and consolidate unnecessary indexes`;
                 rationale="Missing indexes on WHERE clauses cause full table scans on million-row tables, adding 100ms+ per query. Each additional index adds 10-30% write overhead. The goal is index for actual query patterns while avoiding unused or duplicate indexes.";
                 default="Index all foreign keys and WHERE clause columns; use composite indexes for multi-column filters; review unused indexes quarterly"; risk="No indexes on foreign keys causes full table scans on every Eloquent JOIN. Too many composite indexes destroys write performance and increases storage."}
                @{name="Unused Index Detection and Removal"; context="Identify and safely remove unused indexes to reduce write overhead and storage costs"; criteria="performance, cost";
                 tree="Index usage statistics checked?`n↓`nMySQL: sys.schema_unused_indexes view`nPostgreSQL: pg_stat_user_indexes table`n`nUnused indexes found?`n↓`nYES → Review each for safe removal`nNO → Current index strategy is efficient`n`nBefore dropping an index:`n↓`nVerify truly unused (check over 30 days, not just one snapshot)`nConfirm no seasonal or periodic queries depend on it`nDrop during non-peak hours to minimize table lock impact`n`nAfter dropping:`n↓`nMonitor slow query log for regressions over 1 week`nRe-add index if unexpected slow queries appear`nDocument the removal for future reference`;
                 rationale="Each unused index on a write-heavy table costs 1-5% write performance overhead. Dropping unused indexes provides free write performance improvement with zero impact on read queries, as they weren't being used anyway.";
                 default="Check for unused indexes quarterly; drop any index not used in 30 days after verification"; risk="Dropping an index that's used seasonally, periodically, or infrequently causes sudden query degradation that's hard to diagnose."}
                @{name="Covering Index Decision for Hot Queries"; context="Determine when to use covering indexes that include all query columns for high-traffic queries"; criteria="performance, storage";
                 tree="Query is high-traffic (> 1000 req/s)?`n↓`nYES → Covering index eliminates table access entirely (90% I/O reduction)`nNO → Simple index on WHERE columns is sufficient`n`nCan all query columns be included in index?`n↓`nYES → Covering index possible; eliminates row lookup`nNO → Include extra columns using INCLUDE (PostgreSQL) or extend composite (MySQL)`n`nStorage overhead acceptable?`n↓`nYES → Create covering index with all needed columns`nNO → Keep simple index; accept extra I/O for row access`n`nDatabase engine difference?`n↓`nPostgreSQL → INCLUDE clause keeps extra columns out of B-Tree (smaller index)`nMySQL → All columns stored in B-Tree; index larger but still covering`;
                 rationale="A covering index stores all query columns, allowing the query to be satisfied entirely from index pages without accessing table rows. For hot queries, this reduces I/O by 90% and keeps the query buffer-pool-cached.";
                 default="Covering indexes for hot queries (> 1000 req/s); simple indexes for lower traffic; PostgreSQL INCLUDE for smaller indexes"; risk="Adding covering indexes to every query results in excessive storage consumption and write overhead from indexes that include too many columns."}
            )
        }
        "query-optimization-cost" {
            $trees = @(
                @{name="N+1 Query Detection and Fix Strategy"; context="Identify and fix N+1 query problems in Laravel Eloquent ORM"; criteria="performance, cost";
                 tree="Query count checked per page load?`n↓`nYES → Target < 10 queries per page for optimal performance`nNO → Enable Laravel Debugbar or Telescope for query monitoring`n`nN+1 pattern detected?`n↓`nYES → Add eager loading with `with()` to all relationships`nNO → Profile next bottleneck; N+1 is not the current issue`n`nDeeply nested relationships needed?`n↓`nYES → Use nested `with()` or lazy eager loading for performance`nNO → Simple `with()` solves the problem effectively`n`nAPI resource optimization?`n↓`nLoad only requested relationships (conditionally)`nUse `whenLoaded()` in API Resources to only include loaded relations`nAvoid eager loading relationships that won't be serialized`;
                 rationale="N+1 with 50 parents + 5 children each generates 51 queries instead of 2 queries with eager loading. At 100 req/s, saving 49 unnecessary queries per request eliminates 4,900 unnecessary database queries per second.";
                 default="Eager load all relationships in Blade loops and API resources; check query count with Debugbar in development; target < 10 queries per page"; risk="N+1 queries in production cause database CPU to spike at 80%+ for what should be 2-3 queries per page, degrading all users' experience."}
                @{name="Slow Query Resolution Process"; context="Identify and resolve slow database queries using slow query log monitoring and EXPLAIN analysis"; criteria="performance, cost";
                 tree="Slow query log enabled?`n↓`nYES → Set threshold at 500ms (MySQL long_query_time=0.5)`nNO → Enable immediately on all production databases`n`nEXPLAIN plan analyzed for each slow query:`n↓`nFull table scan → Add appropriate index on WHERE/JOIN columns`nTemporary table (Using temporary) → Rewrite query; avoid subqueries`nFilesort (Using filesort) → Add index on ORDER BY columns`n`nQuery rewriting needed?`n↓`nSELECT * → Replace with specific needed column list`nWHERE FUNCTION(column) → Rewrite to sargable expression for index usage`nIN (SELECT ...) subquery → Replace with JOIN or EXISTS for MySQL`n`nPost-optimization verification:`n↓`nRe-check EXPLAIN plan shows index usage`nVerify query time reduced below 100ms`nDeploy to production; monitor for regressions via slow query log`;
                 rationale="Queries taking >500ms are typically the 1% of queries causing 90% of database load. Fixing each slow query can reduce database CPU by 20-50%, directly enabling smaller database instance sizes.";
                 default="Enable slow query log at 500ms threshold; EXPLAIN all slow queries; fix full table scans and missing indexes first"; risk="Not monitoring slow queries = database CPU steadily increases until a performance crisis occurs with no warning and unclear root cause."}
                @{name="SELECT Optimization for Data Transfer Reduction"; context="Optimize SELECT queries to minimize data transfer, memory usage, and I/O cost"; criteria="performance, cost";
                 tree="SELECT * currently used in queries?`n↓`nYES → Replace with specific column list for each query`nNO → Current practice is optimal`n`nLarge dataset processing needed?`n↓`nYES → Use chunk() instead of all()/get() for batch processing`nNO → Standard pagination is sufficient`n`nPagination implementation?`n↓`nCursor pagination for large datasets (avoids offset skip/scan)`nStandard offset pagination for small to medium result sets`n`nRepeated identical queries?`n↓`nYES → Cache query results with appropriate TTL (minutes to hours)`nNO → Monitor for repeated query patterns via query log`;
                 rationale="SELECT * on a table with 50 columns where only 3 are needed means 94% of transferred data is wasted. This multiplies I/O operations, network transfer, and PHP memory usage by approximately 10x for no benefit.";
                 default="Always specify needed columns in select(); use chunk() for large datasets; cursor pagination for large result sets"; risk="SELECT * on large tables causes 10x more data transfer, 5x PHP memory usage, and significantly slower response times than selecting only needed columns."}
            )
        }
        "neon-database-branching" {
            $trees = @(
                @{name="Database Branching Workflow for Development Teams"; context="Design database branching workflow using Neon for isolated development environments"; criteria="cost, productivity";
                 tree="Team size?`n↓`n1-3 developers → 1-3 branches; manual management feasible`n4-10 developers → Automated branching per developer via CLI or API`n> 10 developers → Full CI/CD integrated branch lifecycle management`n`nBranch source selection:`n↓`nProduction data (via copy-on-write) → Most realistic testing, free until modified`nSynthetic/seed data → Consistent testing data, no PII concerns`n`nBranch lifecycle configuration:`n↓`nCreate: On developer request or PR open (milliseconds)`nAuto-pause: After 5 minutes idle (scale-to-zero compute)`nAuto-delete: After 7-14 day TTL or on PR merge`n`nCI/CD integration?`n↓`nCreate branch at pipeline start → Run tests → Delete branch after completion`nCost per CI run: approximately $0.002 (5 minutes compute)`nEliminates shared test database conflicts entirely`;
                 rationale="Neon's copy-on-write branching provides instant isolated database clones at near-zero cost. Each developer gets their own database without conflicts, and CI/CD pipelines get fresh databases for every run.";
                 default="Branch from production for realism; auto-pause at 5 min; 7-day TTL; CI/CD create/delete per pipeline run"; risk="Not setting branch TTL = orphaned branches accumulate storage costs. No auto-pause = branches run compute 24/7 when only used 8 hours/day."}
                @{name="Neon Branch Cost Control Configuration"; context="Configure branch compute limits and lifecycle policies to control Neon costs"; criteria="cost, operational_overhead";
                 tree="Branch purpose?`n↓`nDeveloper sandbox → 1 CU limit, 7-day TTL, auto-pause after 5 min`nCI/CD pipeline → 2 CU, create at start and delete at end (same day)`nPR preview environment → 1-2 CU, delete on PR merge or close`nLong-term testing / staging → 2-4 CU, 30-day TTL with manual renewal`n`nCompute credit monitoring:`n↓`nFree tier: 100 compute-hours/month`n4 devs × 2 hours/day × 30 days = 240 hours → exceeds free tier`nSet billing alert at 80% of free tier allowance`n`nBranch TTL enforcement:`n↓`nAll branches must have TTL set at creation time`nWeekly review of branch list for orphans`nEnforce maximum branch age via Neon API automation`n`nStorage delta monitoring:`n↓`nTrack storage per branch monthly`nInvestigate branches with > 1GB delta from parent`;
                 rationale="Neon charges $0.106/CU-hour for compute. Developer branches with auto-pause (5 minute idle) and 1 CU limit cost approximately $6.36/month each. Without auto-pause, the same branch costs $76/month running 24/7.";
                 default="Dev: 1 CU, 5-min auto-pause, 7-day TTL; CI/CD: create/delete per run; monitor free tier monthly billing alert"; risk="Not configuring auto-pause on developer branches costs $76/month each in compute charges when idle 16 hours/day."}
            )
        }
        "neon-serverless-postgres" {
            $trees = @(
                @{name="Neon vs Aurora/RDS Environment Decision"; context="Determine when to use Neon PostgreSQL vs Aurora/RDS for different environment types"; criteria="cost, reliability";
                 tree="Environment type?`n↓`nProduction (HA required) → Aurora/RDS (Neon not recommended for production primary as of 2026)`nStaging → Neon (scale-to-zero saves 60-70% vs always-on RDS)`nDevelopment → Neon (free tier + branching, near-zero cost)`nCI/CD → Neon (branch create/delete, ~$0.002/run, isolated per pipeline)`n`nDatabase size?`n↓`n< 200GB → Neon suitable for non-production`n> 200GB → Aurora/RDS better cost structure for large volumes`n`nCold start tolerance?`n↓`nSub-1s acceptable → Neon fine for dev/staging`n< 100ms required → Aurora (always warm, no cold start)`n`nCost sensitivity?`n↓`nHigh → Neon free tier covers small staging; paid starts $0.106/CU-hour`nLow → Aurora (predictable pricing, feature-rich, multi-AZ)`;
                 rationale="Neon's scale-to-zero and instant database branching make it ideal for non-production environments, saving 60-70% compared to always-on RDS. Aurora remains the production recommendation due to multi-AZ HA and mature feature set.";
                 default="Neon for dev/staging/CI/CD; Aurora/RDS for production; re-evaluate Neon production readiness annually"; risk="Using Neon for production with strict HA requirements risks downtime without multi-AZ support or 99.95%+ uptime SLAs."}
                @{name="Neon Compute and Auto-Pause Configuration"; context="Configure Neon compute units and auto-pause settings for cost-optimized development workflows"; criteria="cost, performance";
                 tree="Environment type?`n↓`nDevelopment → 1 CU, auto-pause after 5 min idle`nStaging → 2-4 CU, auto-pause after 15 min idle`nCI/CD → 1-2 CU, no auto-pause (short-lived, delete after run)`n`nCompute credit budget:`n↓`nFree tier: 100 compute-hours/month`nPaid: $0.106/CU-hour (per-second billing, 1-hour minimum)`nMonitor monthly usage to avoid free tier exhaustion`n`nAuto-pause configuration:`n↓`n5 minutes → Good balance for individual development`n15 minutes → Better for staging with occasional queries`nDisable auto-pause → Only for latency-sensitive staging needs`n`nWeekly branch cleanup:`n↓`nReview stale branches; delete orphans`nEnforce TTL policies via Neon API automation`nDocument branch purpose and owner for accountability`;
                 rationale="Neon charges compute only when databases are active. Auto-pause after 5 minutes of inactivity reduces compute costs by 60-70% for development databases that are used 6-8 hours per day but idle the rest.";
                 default="Dev: 1 CU, 5-min auto-pause; Staging: 2-4 CU, 15-min auto-pause; monitor monthly compute credits"; risk="Not configuring auto-pause on development databases costs 3-4x more in compute charges than necessary for the same level of developer productivity."}
            )
        }
        default {
            # Generic trees for any KU not specifically handled
            $trees = @(
                @{name="Cost Optimization Strategy Selection"; context="Choose the most appropriate cost optimization strategy for this specific area"; criteria="cost, performance, complexity";
                 tree="Current monthly spend on this resource?`n↓`n< $100/month → Simple optimizations (config changes) sufficient`n$100-$500/month → Implement standard best practices`n$500-$1000/month → Model savings for each optimization option`n> $1000/month → Implement all applicable optimizations`n`nOptimization complexity?`n↓`nConfig change only → Implement immediately (highest ROI)`nArchitecture change needed → Plan and schedule implementation`nRequires vendor/third-party change → Coordinate with dependencies`n`nPerformance impact?`n↓`nNo impact → Implement immediately`nImproves performance → Implement immediately (win-win)`nMay degrade performance → Test in staging first, implement gradually`n`nRisk of wrong choice?`n↓`nLow → Implement and move to next optimization`nMedium → Validate with monitoring before and after`nHigh → Create rollback plan before implementation`;
                 rationale="Cost optimization should be prioritized by ROI. Configuration changes with no performance impact and high savings should be implemented immediately. Architectural changes need planning and testing.";
                 default="Start with config changes (highest ROI); validate with monitoring before and after; create rollback plans for high-risk changes"; risk="Implementing high-risk changes without testing or rollback plans can cause production incidents that cost more than the optimization saves."}
                @{name="Resource Right-Sizing Decision"; context="Determine optimal resource allocation based on actual usage patterns and growth projections"; criteria="cost, performance";
                 tree="Current resource utilization (P95 over 2 weeks)?`n↓`n< 30% → Downsize one tier (immediate savings)`n30-60% → Current sizing is appropriate`n60-80% → Plan for scaling; monitor growth rate`n> 80% → Up-size or scale out to maintain headroom`n`nGrowth trajectory?`n↓`nStable/declining → Right-size to current needs`nGrowing < 10%/month → Right-size with 3-month growth buffer`nGrowing > 10%/month → Right-size with 6-month growth buffer`n`nCommitment options?`n↓`n1-year commitment → 40% discount vs on-demand`n3-year commitment → 60% discount vs on-demand`nNo commitment → Maximum flexibility, highest cost`n`nAuto-scaling available?`n↓`nYES → Size for baseline; let auto-scaling handle peaks`nNO → Size for P95 + 20% headroom for safety`;
                 rationale="Right-sizing eliminates 30-50% waste from over-provisioned resources. Two-week monitoring data reveals true baseline and peak usage patterns, preventing both over-provisioning waste and under-provisioning risk.";
                 default="Monitor for 2 weeks; right-size to P95 + 20% headroom; use commitment discounts for stable workloads"; risk="Sizing for peak without auto-scaling wastes 40-70% of resource budget on capacity used less than 5% of the time."}
                @{name="Commitment Discount Purchase Decision"; context="Determine whether to purchase Reserved Instances or Savings Plans for cost savings"; criteria="cost, flexibility";
                 tree="Workload runs 24/7?`n↓`nYES → Eligible for commitment discounts`nNO (dev/staging, intermittent) → On-demand is better (no minimum)`n`nWorkload stability (12+ month outlook)?`n↓`nStable, predictable → 3-year commitment (maximum savings, up to 66%)`nGrowing/changing → 1-year commitment or Compute Savings Plans (flexible)`nUncertain → On-demand or no-upfront Savings Plans`n`nPayment preference?`n↓`nAll upfront → Maximum discount, higher initial cash outlay`nPartial upfront → Good balance of discount and cash flow`nNo upfront → Lower savings, no capital required`n`nFlexibility needed?`n↓`nInstance type may change → Compute Savings Plans (instance-flexible)`nRegion may change → Compute Savings Plans (region-flexible)`nEverything fixed → Reserved Instances (highest discount, least flexible)`;
                 rationale="Commitment discounts can reduce compute costs by up to 66%. RIs offer the highest discount for specific instance types. Compute Savings Plans provide flexibility across instances, regions, and services at slightly lower discounts.";
                 default="3-year Compute Savings Plans for maximum flexibility and savings; RIs only for completely fixed instance types"; risk="Buying 3-year RIs for resources that get downsized or migrated = paying for capacity that can't be used. No commitment on steady workloads = paying 60% more than necessary."}
            )
        }
    }
    
    return @{ Trees = $trees; Title = $title; Rules = $rules }
}

foreach ($ku in $kus) {
    $count++
    Write-Progress -Activity "Generating 07-decision-trees.md files" -Status "$($ku.Subdomain)/$($ku.KU)" -PercentComplete (($count/$total)*100)
    
    $stdPath = Join-Path $ku.Path "04-standardized-knowledge.md"
    $rulesPath = Join-Path $ku.Path "05-rules.md"
    $outputPath = Join-Path $ku.Path "07-decision-trees.md"
    
    $data = Get-TreeData -kuName $ku.KU -subdomain $ku.Subdomain -stdPath $stdPath -rulesPath $rulesPath
    
    Write-DecisionTrees -path $outputPath -trees $data.Trees -title $data.Title -rules $data.Rules
    
    Write-Host "[$count/$total] Generated: $($ku.Subdomain)/$($ku.KU)"
}

Write-Host "`n=== COMPLETE === Generated $total decision tree files ==="
