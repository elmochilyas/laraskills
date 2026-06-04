## Calculate Worker Count From Bottleneck
---
## Performance
---
Always identify the primary bottleneck (CPU, memory, or I/O) before sizing worker pools; never guess worker counts.
---
Sizing for the wrong bottleneck wastes resources — if memory-bound, adding workers causes OOM; if CPU-bound, adding workers causes thrashing. Each bottleneck requires a different sizing strategy.
---
Memory-bound: workers = available RAM / per-worker memory. CPU-bound: workers = CPU cores. I/O-bound: workers = 2-3x CPU cores.
---
Setting workers = 50 on a 2-core server with 2GB RAM.
---
No common exceptions; bottleneck analysis is always required.
---
OOM kills from memory exhaustion, or context switching from CPU over-allocation.
---
## Separate Web and Queue Worker Pools
---
## Architecture
---
Never run queue workers on the same server as web workers; always use dedicated instances for background job processing.
---
Queue workers steal 30-50% of CPU from web requests; context switching degrades both workloads; a burst of queue jobs causes web request timeouts.
---
Web: Nginx + PHP-FPM on web ASG. Queue: Horizon workers on separate queue ASG.
---
Running `php artisan queue:work` on the same server that serves HTTP requests.
---
Micro-deployments with <50 req/s and <1000 jobs/day where a single server is acceptable.
---
Web response time degradation, queue jobs starve during traffic spikes, unpredictable latency.
---
## Monitor Idle Worker Percentage
---
## Monitoring
---
Always monitor idle worker percentage during peak traffic; target 10-20% idle workers.
---
Consistently 0% idle workers means requests are queuing and latency is spiking; >50% idle means over-provisioned and wasting memory. The 10-20% buffer absorbs minor traffic variation.
---
CloudWatch alarm: idle workers <5% for 5 minutes triggers scale-out.
---
No monitoring of idle worker metrics, flying blind on pool health.
---
Static worker counts in Auto Scaling groups that adjust at instance level instead.
---
Request queuing during spikes (under-provisioned) or memory waste (over-provisioned).
---
## Use Separate Pools for Different Queue Priorities
---
## Architecture
---
Always configure separate worker pools with different worker counts for different queue priorities (high, default, low).
---
A large batch job on a shared pool blocks critical email notifications; separate pools ensure each priority gets appropriate capacity and large jobs don't starve critical tasks.
---
`php artisan queue:work --queue=high,default --workers=4` for high; separate pool for low with 1 worker.
---
Single queue listener processing critical email jobs and slow PDF generation with equal priority.
---
All queues have identical job duration and urgency; even then, separation prevents cascading failures.
---
Email delivery delayed by batch processing; critical jobs wait behind non-urgent ones.
---
## Right-Size Queue Workers for Throughput
---
## Performance
---
Always calculate queue worker count based on desired throughput and average job duration using `workers = desired_throughput / (3600 / avg_job_duration_seconds)`.
---
Prevents both over- and under-provisioning; a queue processing 500 jobs/hour at 3 seconds each needs only 1 worker, not 10.
---
500 jobs/hour, avg 3s/job: workers = ceil(500 / (3600/3)) = 1 worker.
---
Running 10 queue workers for a queue that processes 100 jobs/hour at 1s each.
---
Jobs with highly variable duration; use separate queues for different job durations.
---
Over-provisioned workers waste memory; under-provisioned queues cause hours of backlog.
