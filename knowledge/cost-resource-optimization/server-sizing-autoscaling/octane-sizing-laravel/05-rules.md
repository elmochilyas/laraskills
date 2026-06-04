# Octane Sizing for Laravel — Rules

## R1: Set Worker Count to 2x vCPUs for General Laravel Apps

**Category**: Worker Sizing

**Rule**: ALWAYS start with `worker_count = vCPU * 2` for general Laravel Octane applications. ONLY increase beyond 4x vCPUs with load testing verification.

**Reason**: Most Laravel apps are I/O-bound (database queries, external API calls, cache operations) — they spend time waiting on external services. With 2x vCPUs, one worker can serve a request while another waits on I/O, maximizing CPU utilization. More than 4x vCPUs increases context switching overhead without throughput gains. For CPU-bound apps (image processing, encryption), use `n + 1` (vCPUs + 1) since workers compete directly for CPU.

**Bad Example**: A 4-vCPU Octane server configured with 32 workers (8x vCPUs). Context switching overhead causes each worker to get only 3% CPU time. Throughput per worker drops from 50 req/s to 8 req/s. Total throughput: 256 req/s. Same server with 8 workers (2x vCPUs) would achieve 400 req/s.

**Good Example**: 4-vCPU Octane server with 8 workers (2x vCPUs). Each worker gets sufficient CPU time. Context switching is minimal. Total throughput: 400 req/s. If the app is CPU-bound, reduce to 5 workers (n+1) — each worker gets 20% CPU, maximizing parallel processing.

**Exceptions**: For pure CPU-bound workloads (no I/O wait), use n+1 workers to match vCPU count. For I/O-heavy apps (many external API calls), increase to 3-4x vCPUs and monitor response times.

**Consequences Of Violation**: Over-allocating workers reduces throughput due to context switching overhead. The server appears busy (high CPU) but delivers less total throughput than with fewer workers.

---

## R2: Calculate Max Workers from Memory Budget, Not CPU

**Category**: Memory Planning

**Rule**: ALWAYS calculate maximum Octane workers from available memory: `max_workers = (total_ram - OS_reserve - app_working_set) / per_worker_rss`. NEVER set worker count based on CPU alone without considering memory constraints.

**Reason**: Each Octane worker consumes 50-100MB RSS (idle) and 100-200MB (under load). The OS needs ~1GB, Laravel bootstrap cache ~200MB. On a 4GB server: (4GB - 1GB OS - 200MB bootstrap) / 75MB per worker = ~37 theoretical max. Setting workers to 100 would cause OOM crashes before CPU saturation. Memory is the binding constraint for Octane — CPU-bound apps are rare, memory-bound apps are common.

**Bad Example**: A team sets 32 workers on a 2GB Octane server (4x 0.5 vCPU, but memory is the constraint). Each worker: 75MB. 32 workers: 2.4GB. OS: 1GB. Bootstrap: 200MB. Total needed: 3.6GB > 2GB available. Workers start OOM-killing each other. Server becomes unstable. Response times spike from 200ms to 2000ms during OOM events.

**Good Example**: 2GB Octane server: (2GB - 1GB OS - 200MB bootstrap) / 75MB = ~10 workers max. Set workers = 8 (conservative). Server memory: 1.6GB used, 400MB free (headroom). Workers: stable, no OOM. Consistent 200ms response times.

**Exceptions**: For apps with smaller per-worker memory (optimized, no memory leaks), use 50MB per worker. Measure actual per-worker RSS in production and adjust the formula.

**Consequences Of Violation**: OOM crashes cause cascading failures. When one Octane worker OOMs, the server process manager restarts it, potentially dropping in-flight requests. Under sustained OOM pressure, the entire server becomes unstable.

---

## R3: Monitor Per-Worker Memory Growth — Investigate >10%/Hour Increase

**Category**: Memory Leak Detection

**Rule**: ALWAYS monitor per-worker RSS (Resident Set Size) over time in Octane. Investigate any worker showing >10% memory growth per hour. NEVER ignore memory growth trends in Octane workers.

**Reason**: Octane workers persist across requests — unlike PHP-FPM (which frees memory per request), Octane workers accumulate memory. A memory leak of 1MB per request (e.g., caching user data in a static variable) grows to 100MB after 100 requests. Without monitoring, the leak causes OOM after hours of operation. Per-worker RSS tracking identifies leaks before they cause crashes.

**Bad Example**: A Laravel Octane app caches user data in a service provider singleton. Each unique user adds 10KB to the worker's memory. After 10,000 requests and 5,000 unique users: 50MB added. Worker RSS grows from 75MB to 125MB over 2 hours. No one monitors worker memory. At hour 6, RSS hits 250MB. Worker OOMs. Repeat for all 8 workers. Server cascade.

**Good Example**: Scout APM Octane dashboard shows Worker 3 RSS at 120MB (up from 75MB at deploy — 60% growth in 4 hours). The team investigates, finds the singleton caching user data, fixes it. Worker RSS stabilizes at 85MB. No OOM. The monitor caught the leak in hours instead of after a crash.

**Exceptions**: Some memory growth is normal during warm-up (first 100 requests). Track growth after the warm-up period. Stable RSS after warm-up = healthy; continued growth = leak.

**Consequences Of Violation**: Undetected memory leaks crash Octane workers after hours or days. The crashes appear random, making root cause identification difficult. Service reliability degrades progressively.

---

## R4: Set max_requests Per Worker (1000-10000)

**Category**: Worker Recycling

**Rule**: ALWAYS configure Octane `max_requests` setting (1000-10000 depending on app stability). NEVER let workers run indefinitely without recycling.

**Reason**: Despite best efforts, Laravel applications accumulate memory fragmentation, stale connections, and leaked references over hundreds of requests. Recycling workers after N requests frees all accumulated memory, closes stale connections, and resets the worker state. For well-optimized apps, 10000 requests between recycling provides good stability. For apps with known memory growth, set 1000-5000.

**Bad Example**: Octane workers with max_requests = 0 (unlimited). A worker processes 50,000 requests over 48 hours. Memory grows from 75MB to 350MB. Worker RSS shows gradual growth. At hour 47, RSS hits 400MB. OOM kills the worker. 5 in-flight requests are lost. The cycle repeats for other workers.

**Good Example**: max_requests = 5000. Workers recycle after 5000 requests. Memory growth resets. Max RSS: 120MB (75MB + ~45MB growth over 5000 requests). No worker ever exceeds 150MB. 0 OOM events. Workers are fresh and stable.

**Exceptions**: For apps with proven zero memory growth (verified via 24-hour monitoring), increase max_requests to 50000 or higher. Always set a finite value — never set unlimited.

**Consequences Of Violation**: Unbounded memory growth eventually crashes all workers. The crash cycle repeats regularly, causing intermittent request failures that are hard to diagnose as memory-related.

---

## R5: Scale Horizontally Before Vertically for Octane

**Category**: Scaling Strategy

**Rule**: ALWAYS add more Octane server instances (horizontal scaling) before increasing instance size (vertical scaling). NEVER vertically scale a single Octane server beyond 8 vCPU / 16GB RAM without evaluating horizontal alternatives.

**Reason**: Octane scales near-linearly with horizontal instances — 2 x 4 vCPU servers deliver ~1.9x throughput of 1 x 4 vCPU. Vertical scaling has diminishing returns: a 16 vCPU server costs 4x a 4 vCPU server but delivers ~2.5x-3x throughput because PHP's shared-nothing architecture limits multi-core scaling beyond 8 vCPUs. Horizontal also provides fault tolerance (survive instance failure) that vertical cannot.

**Bad Example**: A team facing capacity limits scales from r7g.xlarge (4 vCPU, $260/month) to r7g.4xlarge (16 vCPU, $1,040/month). Cost: 4x. Throughput increase: 2.5x. Single point of failure: if this instance goes down, the entire app is unavailable.

**Good Example**: The team adds 3 more r7g.xlarge instances (4 x $260 = $1,040/month). Throughput increase: 3.8x (near-linear). Fault tolerance: losing 1 instance reduces capacity by 25% (not 100%). Better scalability, same cost, more resilient.

**Exceptions**: For database and cache servers, vertical scaling is the primary method (stateful services cannot be horizontally scaled easily). For Octane web servers, always prefer horizontal.

**Consequences Of Violation**: Paying more for less throughput (diminishing returns from vertical scaling). Single point of failure makes the entire app vulnerable to instance failure.
