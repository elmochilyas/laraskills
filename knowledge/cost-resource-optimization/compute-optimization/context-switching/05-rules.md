## Monitor Run Queue Length
---
## Performance
---
Always monitor Linux run queue length and context switch rate; investigate when run queue exceeds 2x CPU cores or context switches exceed 20000/sec per core.
---
Excessive context switching wastes 20-50% of CPU capacity, meaning the same workload requires more servers or larger instances without any throughput benefit.
---
Set up CloudWatch agent to report `vmstat` cs/sec and run queue length; alarm at >20000 cs/sec per core.
---
Setting max_children=250 on a 4-core server without monitoring context switch overhead.
---
Under-utilized servers with <50% CPU; context switching is irrelevant at low utilization.
---
20-50% hidden CPU waste, premature scaling decisions, over-provisioned infrastructure.
---
## Set Workers to CPU Cores for CPU-Bound
---
## Performance
---
Never set worker count to more than 2x CPU cores for CPU-bound PHP-FPM or Octane workers.
---
Each worker beyond CPU cores causes 100+ involuntary context switches per second per worker; beyond 2x cores, throughput actually decreases due to context switching overhead.
---
4-core web server: 4-8 PHP-FPM workers, vmstat cs < 10000/sec, run queue < 2.
---
40 workers on a 4-core server assuming "more workers = more throughput."
---
I/O-heavy workloads where workers voluntarily yield during database/API waits.
---
Throughput drops below baseline, CPU wasted on switching, request latency increases.
---
## Separate Web and Queue Servers
---
## Architecture
---
Never run queue workers on the same server as web workers; always use dedicated instances to minimize context switching.
---
Queue workers cause 10000+ extra context switches per second, stealing CPU from customer-facing requests and degrading web response times by 30-50%.
---
Web server: Nginx + PHP-FPM only. Queue server: Horizon workers only.
---
Running queue workers on the production web server to "save costs."
---
Micro-deployments with <50 req/s where a second server cost is unjustified; use cgroups to limit queue CPU.
---
30-50% web response time degradation, confused troubleshooting when CPU is "high but idle."
---
## Use cgroups for Mixed Workloads
---
## Architecture
---
If web and queue workers must share a server, always use cgroups or similar to limit CPU share for queue workers.
---
cgroups ensure web workers get CPU priority during traffic spikes and queue jobs don't slow down API responses, providing fair scheduling without dedicated servers.
---
cgroups CPU shares: web=512, queue=256, ensuring web gets 2x priority.
---
Running web + queue on the same server without any CPU limits.
---
Separate servers are always preferred; cgroups is a compromise, not a best practice.
---
Queue jobs starve web requests during traffic spikes, unpredictable response times.
