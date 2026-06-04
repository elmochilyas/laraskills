## Calculate max_children From Available Memory
---
## Performance
---
Always calculate `pm.max_children = (Total RAM - OS reserve) / avg worker memory`; never set max_children arbitrarily high.
---
Each Laravel PHP-FPM worker consumes 30-80MB; exceeding available memory causes OOM kills that crash the server and abort in-flight requests.
---
4GB RAM server: max_children = (4GB - 1GB OS) / 50MB = ~60 workers.
---
max_children = 250 on a 2GB server expecting more throughput.
---
Octane-based deployments replace FPM entirely; this rule applies only to PHP-FPM.
---
OOM kills, 50x errors, server thrashing, complete request failures during traffic spikes.
---
## Set pm.max_requests to 500-1000
---
## Reliability
---
Always set `pm.max_requests` to 500-1000 to restart workers periodically and free accumulated memory.
---
Laravel requests slowly accumulate ~1KB per request; after 10,000 requests a worker may use 2x baseline memory; restarting resets clean state and prevents OOM.
---
pm.max_requests = 500 in php-fpm pool configuration.
---
pm.max_requests = 0 (default, no restart) relying on OPcache and assuming no leaks.
---
Octane uses `max_jobs` instead of `max_requests`; apply equivalent setting there.
---
Worker memory grows from 40MB to 200MB+ over days, causing OOM kills and request failures.
---
## Use Dynamic Pool for Variable Traffic
---
## Performance
---
Use `pm = dynamic` for general production workloads with variable traffic; avoid static for variable loads and on-demand for high-traffic.
---
Static pools waste memory during low traffic and limit capacity during peaks; on-demand creates worker creation overhead per request (50-200ms latency).
---
pm=dynamic, pm.max_children=70, pm.start_servers=25, pm.min_spare_servers=10, pm.max_spare_servers=35.
---
pm=static with max_children=100 on a server handling 10 concurrent requests at night.
---
Static for predictable load with stable concurrent requests; on-demand for very low-traffic on memory-constrained instances.
---
Memory waste during low traffic, request queuing during peaks, or latency spikes from worker creation.
---
## Set pm.process_idle_timeout to 10-30s
---
## Performance
---
Never set `pm.process_idle_timeout` below 10 seconds for production workloads.
---
Extremely short idle timeout causes constant worker create/destroy cycles, increasing CPU usage and request latency as workers are frequently spawned.
---
pm.process_idle_timeout = 30s.
---
pm.process_idle_timeout = 2s trying to "save every MB of memory."
---
Memory-constrained environments where every MB matters; accept latency trade-off.
---
Constant worker churn, increased CPU usage, latency spikes on every request.
---
## Monitor FPM Status Metrics
---
## Monitoring
---
Always enable and monitor `pm.status_path` or CloudWatch FPM metrics to track listen queue, active processes, and max children reached.
---
Without monitoring, you are blind to FPM pool exhaustion — workers queueing, requests timing out, or max_children being hit — causing silent performance degradation.
---
Enable pm.status_path=/fpm-status in pool config; collect via CloudWatch agent.
---
No monitoring of FPM pool metrics, assuming "it just works."
---
Octane or FrankenPHP deployments that replace FPM entirely.
---
Silent pool exhaustion, undetected request queuing, preventable outages.
