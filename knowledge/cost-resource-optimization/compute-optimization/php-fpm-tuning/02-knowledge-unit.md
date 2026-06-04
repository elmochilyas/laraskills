# KU-03-PHP-FPM-TUNING: PHP-FPM Tuning

## Metadata
- **ID**: KU-03-PHP-FPM-TUNING
- **Subdomain**: Compute Optimization
- **Topic**: PHP-FPM Tuning
- **Source**: Compute Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
PHP-FPM (FastCGI Process Manager) manages PHP worker processes. Tuning `pm.max_children`, `pm.start_servers`, `pm.max_requests`, and `pm.process_idle_timeout` directly impacts memory usage, request latency, and server cost. Over-allocation causes OOM kills; under-allocation wastes CPU. For Laravel, PHP-FPM pools must account for each worker's ~30-80MB memory footprint and the application's concurrent request patterns.

## Core Concepts
- **pm.max_children**: Maximum PHP-FPM worker processes; 1 worker handles 1 request at a time
- **pm.start_servers**: Workers created on FPM start
- **pm.max_requests**: Requests each worker handles before restarting (prevent memory leaks)
- **pm.process_idle_timeout**: How long idle workers stay alive before being killed
- **On-demand vs static vs dynamic**: Dynamic (most common) adjusts workers based on load; Static (fixed) for predictable load; On-demand (workers created per request) for low-memory environments
- **Memory per worker**: ~30-80MB per Laravel request; 80% is Laravel boot + autoloaded classes

## Mental Models
- Default calculation: max_children = (available_RAM - OS_overhead) / avg_worker_memory
- Default max_requests = 500 for Laravel apps
- Monitor with `pm.status_path` or CloudWatch

## Internal Mechanics
- More workers does not always mean more throughput: CPU context switching degrades above ~2x vCPU count
- Monitor CPU queue length; if consistently > 2x vCPUs, max_children is too high
- Each idle worker still consumes ~20MB memory; don't over-allocate idle servers
- Worker creation (fork) costs ~50-200ms CPU time; dynamic pool pre-creates to avoid this latency
- pm.max_requests 500 = workers restart ~every 50 seconds at 10 req/s; too frequent means constant boot overhead

## Patterns
- Calculate max_children from available memory
- Set pm.max_requests to 500-1000
- Monitor real memory per worker
- Set pm.start_servers to peak average count
- Use pm.process_idle_timeout of 10-30s

## Architectural Decisions
- For 2GB RAM server: max_children = ~40 (2GB - 0.5GB OS = 1.5GB / ~40MB per worker)
- For 4GB RAM server: max_children = ~70 (4GB - 1GB OS = 3GB / ~45MB per worker)
- For 8GB RAM server: max_children = ~150 (8GB - 1.5GB OS = 6.5GB / ~45MB per worker)
- These are starting points; measure with Load Testing (k6, locust) and adjust
- When using Octane: FPM is replaced by Swoole/RR workers; Octane tuning is separate

## Tradeoffs
**When To Use:**
- Dynamic pool: General production use; adjusts workers based on concurrent requests
- Static pool: Predictable load with stable concurrent requests (Octane replaces FPM in this case)
- On-demand: Very low-traffic apps on memory-constrained instances (<1GB RAM)
- Increased max_requests: When using OPcache with file modification detection disabled (workers live longer)

**When NOT To Use:**
- Static pool for variable traffic: Fixed worker count wastes memory during low traffic, limits capacity during peaks
- Dynamic pool with very high max_children: Setting max_children > available memory/worker_size causes OOM
- On-demand for high-traffic: Worker creation overhead per request adds 50-200ms latency
- Too low pm.max_requests: Setting <100 causes frequent worker restarts (wasted CPU on boot)

## Performance Considerations
- More workers does not always mean more throughput: CPU context switching degrades above ~2x vCPU count
- Monitor CPU queue length; if consistently > 2x vCPUs, max_children is too high
- Each idle worker still consumes ~20MB memory; don't over-allocate idle servers
- Worker creation (fork) costs ~50-200ms CPU time; dynamic pool pre-creates to avoid this latency
- pm.max_requests 500 = workers restart ~every 50 seconds at 10 req/s; too frequent means constant boot overhead

## Production Considerations
- Run PHP-FPM as dedicated user (www-data), not root
- chroot/chdir to application root to limit file system access
- Set `security.limit_extensions` to `.php` only (prevent arbitrary file execution)
- PHP-FPM socket should be file-system protected or listen on localhost only
- Monitor for slow request logs (`request_slowlog_timeout`) as security indicator

## Common Mistakes
- **Setting max_children too high**: max_children = 250 on 2GB server (Cause: "more workers = more performance" assumption; Consequence: OOM kills, 50x errors, server thrashing; Better: calculate from available memory; 2GB server ~40 children max)
- **No pm.max_requests limit**: Default 0 = no restart; workers accumulate memory indefinitely (Cause: relying on OPcache and assuming no leaks; Consequence: worker memory grows from 40MB to 200MB+ over days, causing OOM; Better: set max_requests = 500)
- **Dynamic pool with very short idle timeout**: pm.process_idle_timeout = 2s (Cause: "save every MB of memory"; Consequence: constant worker create/destroy cycles, increased latency; Better: 30s idle timeout balances memory and responsiveness)

## Failure Modes
- **Static pool with large max_children**: Static = always running; waste 80% of workers during low traffic
- **On-demand for production traffic**: Worker creation overhead per request causes latency spikes
- **No monitoring of FPM metrics**: Not tracking `listen queue` or `max active processes`; flying blind

## Ecosystem Usage
- **4GB web server**: pm=dynamic, pm.max_children=70, pm.start_servers=25, pm.min_spare_servers=10, pm.max_spare_servers=35, pm.max_requests=500
- **2GB memory-constrained**: pm=dynamic, pm.max_children=35, pm.start_servers=10, pm.min_spare_servers=5, pm.max_spare_servers=20
- **High-traffic dedicated (8GB)**: pm=dynamic, pm.max_children=150, pm.start_servers=50, pm.min_spare_servers=20, pm.max_spare_servers=75

## Related Knowledge Units
- OPcache Tuning (ku-04)
- Octane Resource Usage (ku-05)
- VM Sizing (ku-01)

## Research Notes
Derived from Compute Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.