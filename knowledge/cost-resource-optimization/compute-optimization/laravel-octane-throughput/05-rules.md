## Enable Octane by Default for Production
---
## Performance
---
Always enable Laravel Octane for production deployments handling >100K requests per day; never default to PHP-FPM for new projects.
---
Octane delivers 3-10x throughput improvement over PHP-FPM, directly reducing server count and compute costs by 50-80%. The effort is one-time; benefits compound with every request.
---
New Laravel project: install Octane + FrankenPHP from the start. 2 servers handle what 10 did before.
---
PHP-FPM as default for new production deployment at 1000 req/s.
---
Simple apps with <100 requests/day where cost difference is negligible.
---
50-80% higher compute costs, missed throughput gains, harder Octane migration later.
---
## Use FrankenPHP for New Deployments
---
## Architecture
---
Prefer FrankenPHP for new Laravel deployments and Swoole for maximum self-managed throughput.
---
FrankenPHP is Docker-native, PHP 8.3+ integrated, and the recommended Octane server for Laravel Cloud; Swoole has the most mature ecosystem and highest throughput for self-managed EC2/Fargate.
---
Cloud deployment: FrankenPHP in container with Octane. Self-managed: Swoole on EC2.
---
Running FrankenPHP on bare EC2 where Swoole would give 10% more throughput.
---
Self-managed EC2 needing peak throughput (use Swoole); or Laravel Cloud (use FrankenPHP).
---
Suboptimal throughput from server-engine mismatch.
---
## Set max_requests to 1000-5000
---
## Reliability
---
Always set `max_requests` (Octane) to 1000-5000 per worker to prevent memory leak accumulation.
---
Octane workers accumulate memory over time; max_requests restarts workers after N requests, releasing accumulated memory and preventing OOM kills that cause 5-30s downtime.
---
Octane config: `max_requests = 2000`.
---
No max_requests set; workers run until OOM kill.
---
Workloads with zero memory leak verified through 48h+ monitoring.
---
OOM kills, lost in-flight requests, periodic downtime during worker crashes.
---
## Set Worker Count to n+1 for CPU-Bound, 2n-4n for I/O-Bound
---
## Performance
---
Set Octane workers to CPU cores + 1 for CPU-bound workloads; 2x to 4x CPU cores for I/O-bound workloads.
---
CPU-bound workers saturate CPU; extra workers cause context switching without benefit. I/O-bound workers yield during waits (database, cache, HTTP), so more workers run concurrently without CPU contention.
---
4-core CPU-bound: workers=5. 4-core I/O-heavy: workers=8-16.
---
workers=32 on a 4-core server for a CPU-bound API.
---
Balanced workloads with mixed CPU and I/O; benchmark to find the sweet spot.
---
CPU thrashing from over-allocation (CPU-bound) or under-utilized capacity (I/O-bound).
---
## Test Packages for Octane Compatibility
---
## Testing
---
Always test all critical third-party packages on Octane before production deployment; never assume PHP-FPM compatibility implies Octane compatibility.
---
Packages using `__destruct()` for request cleanup, static properties, or global state break in Octane's long-lived process model; testing catches these before they cause production data leaks.
---
Run `php artisan octane:start` locally; execute 10,000 test requests via load testing tool.
---
Deploying Octane to production without testing package compatibility.
---
All packages audited and confirmed Octane-safe through code review; still test to verify.
---
Cross-request data leakage, resource leaks, user data exposure, production rollback.
---
## Monitor Resident Memory Over 24 Hours
---
## Monitoring
---
Always monitor Octane worker resident memory for 24 hours post-deployment; investigate if memory grows >10KB per request.
---
Gradual memory leaks cause workers to grow until OOM; early detection prevents production incidents and identifies problematic code paths.
---
CloudWatch: worker memory at 100MB at start, 120MB after 2000 requests = 10KB/request — acceptable.
---
No Octane memory monitoring; "we'll notice if workers crash."
---
Short-lived worker pools with max_jobs < 500; monitoring still recommended.
---
OOM incidents, undetected memory leaks, reactive debugging.
