## Set Worker Count to CPU Cores
---
## Performance
---
Always set Octane `--workers` to the number of CPU cores for CPU-bound apps, or up to 2x cores for I/O-heavy apps; never exceed 2x CPU cores.
---
More workers than CPU cores causes context switching overhead that reduces throughput; Octane workers are long-lived and each consumes 80-150MB.
---
4-core server: workers=4 for CPU-bound, workers=6-8 for I/O-bound.
---
workers=32 on a 4-core server assuming "more workers = more throughput."
---
I/O-heavy workloads with significant database/API wait time can benefit from up to 2x cores.
---
Extreme context switching, throughput below PHP-FPM levels, memory exhaustion.
---
## Monitor Memory Growth Per Worker
---
## Monitoring
---
Always monitor Octane worker memory usage over 24 hours; each worker should stabilize at a ceiling rather than grow continuously.
---
Memory leaks compound across thousands of requests in long-lived workers; a worker using 100MB at start and 200MB after 1000 requests indicates a leak rate of 100KB/request that will eventually OOM.
---
Monitor resident memory; target <10KB/request growth; restart workers via max_jobs if growth exceeds threshold.
---
Running Octane without tracking per-worker memory, assuming PHP-FPM memory patterns apply.
---
Workers that truly have no memory leaks (verified through 48h monitoring).
---
Workers grow to memory_limit, OOM killed, 50x errors, loss of in-flight requests.
---
## Set max_jobs to Prevent Memory Leaks
---
## Reliability
---
Always set `max_jobs` (RoadRunner) or configure worker restart threshold to restart workers after 1000-5000 requests.
---
Octane workers accumulate memory over time; max_jobs restarts a worker after N requests, releasing accumulated memory and preventing OOM kills.
---
.rr.yaml: `max_jobs: 2000` for RoadRunner; Swoole: `max_requests: 2000`.
---
No max_jobs configured, workers running indefinitely until OOM.
---
Applications with proven zero memory leak profile verified through 48h+ monitoring.
---
OOM kills causing 5-30s downtime, loss of in-flight requests, unpredictable behavior.
---
## Use Octane Only When Traffic Exceeds 50 req/s
---
## Cost Optimization
---
Never deploy Octane for applications with average traffic below 50 requests per second; PHP-FPM is simpler and cost-effective at low volume.
---
Octane adds operational complexity (state management, package compatibility, memory monitoring) without meaningful benefit at low traffic; the 3-10x throughput gain is unnecessary when servers are idle.
---
API server at 1000 req/s: Octane reduces from 10 to 2 servers.
---
CRUD app at 10 req/s: Octane migration with 2 weeks of engineering effort.
---
New projects where Octane is enabled from the start with minimal migration cost.
---
Wasted engineering time on unnecessary optimization, added complexity with zero cost benefit.
---
## Separate Octane Workers From Queue Workers
---
## Architecture
---
Never run Octane web workers on the same server as queue workers; always use dedicated instances for each workload.
---
Queue workers are CPU-intensive and cause context switching that degrades Octane's web request throughput; a large job can block web responses.
---
Web: Octane on 2 x m7g.large. Queue: Horizon on 2 x m7g.large separate ASG.
---
Running Octane + Horizon workers on the same 4-core server.
---
Micro-deployments where separate servers cost more than the performance penalty.
---
Web response time degradation of 30-50% during queue processing bursts.
