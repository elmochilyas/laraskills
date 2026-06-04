# Skill: Select the Optimal Octane Driver for Your Application

## Purpose
Evaluate RoadRunner, Swoole, and FrankenPHP Octane drivers against your application's workload profile, operational constraints, and team expertise — producing a data-driven driver selection with documented rationale.

## When To Use
- Before the first Octane deployment for a new project
- When evaluating Octane for an existing PHP-FPM application
- When experiencing performance issues with the current Octane driver and considering switching
- When infrastructure requirements change (single-server vs multi-server, new ops team, new deployment model)

## When NOT To Use
- When Octane is not being considered (remaining on PHP-FPM)
- When the application has already been deployed with one driver and there is no performance issue driving the evaluation
- When the team has already standardized on one driver and the application is performing well

## Prerequisites
- Laravel application ready for Octane deployment (service providers audited, static properties eliminated)
- Staging environment capable of running all three drivers
- PHP-FPM baseline performance metrics (RPS, p95 latency, memory usage per request, I/O profile)
- Team familiarity with evaluation criteria (throughput, operational complexity, feature requirements)
- List of all third-party packages and their coroutine safety (for Swoole evaluation)

## Inputs
- Application workload characteristics (CPU-bound vs I/O-bound, average latency per request, database/API response times)
- Server specifications (CPU cores, RAM, storage type)
- Existing infrastructure (web server, load balancer, deployment pipeline)
- Team expertise (PHP extensions experience, coroutine knowledge, ops complexity tolerance)
- Feature requirements (HTTP/3, WebSocket, gRPC, task workers, automatic HTTPS)

## Workflow

### 1. Characterize Application Workload Profile
- Measure average database query time and API call latency
- If average I/O latency < 10ms: workload is CPU-bound or low-I/O — RoadRunner or FrankenPHP likely optimal
- If average I/O latency > 50ms: workload is high-I/O — Swoole's coroutine advantage may be significant
- If mixed (10-50ms): benchmark all three drivers to determine the winner
- Classify the application as API-heavy (largest Octane gain), mixed, or UI-heavy (moderate gain)

### 2. Assess Operational Complexity Tolerance
- Evaluate team experience with PHP extensions compilation and ZTS builds
- If team has no extension compilation experience: prefer RoadRunner (no extension required)
- If team has Caddy/Go experience and wants single-binary deployment: evaluate FrankenPHP
- If team has non-blocking I/O experience (Node.js, ReactPHP): consider Swoole
- Evaluate ops overhead willingness: RoadRunner (separate binary + PHP), Swoole (extension + PHP), FrankenPHP (single binary)

### 3. Evaluate Feature Requirements
- List required features beyond basic HTTP serving:
  - WebSocket: Swoole (native), RoadRunner (via plugin), FrankenPHP (via Mercure)
  - gRPC: RoadRunner (native plugin support)
  - Task workers for blocking operations: Swoole (native), RoadRunner (via jobs plugin)
  - Automatic HTTPS/ACME: FrankenPHP (built-in via Caddy)
  - HTTP/3: FrankenPHP (built-in via Caddy)
- Match features to driver capabilities and eliminate drivers that lack required features

### 4. Benchmark All Three Drivers in Staging
- Deploy the application with each driver under identical conditions
- Run workload-specific benchmarks: use your actual API endpoints, not synthetic tests
- Measure RPS, p95 latency, memory usage per worker, and error rate for each driver
- Run each benchmark for minimum 30 minutes to reach steady state
- Document results in a comparison table

### 5. Run 24-Hour Soak Test with Top Candidates
- For the top 1-2 drivers, run a 24-hour soak test with production-representative traffic
- Monitor: per-worker RSS growth, worker crash frequency, database connection usage, p95 latency trend
- Check for memory leaks, state contamination, or driver-specific issues
- Validate graceful reload (`php artisan octane:reload`) works correctly

### 6. Check Package Compatibility
- For Swoole: verify all third-party packages are coroutine-safe
  - Search for blocking I/O calls (file_get_contents, curl_exec, PDO without pool)
  - Check for `sleep()`, `usleep()`, `time_nanosleep()` — these block all coroutines in the same worker
  - Review package documentation for Swoole/Open Swoole compatibility notes
- For RoadRunner: minimal compatibility concerns (process isolation prevents coroutine issues)
- For FrankenPHP: check ZTS compatibility for all PHP extensions in use

### 7. Make Driver Selection Decision
- Default to RoadRunner unless specific criteria for Swoole or FrankenPHP are met
- Select Swoole if: high-I/O workload (50ms+), team has coroutine experience, AND benchmarks show >30% throughput improvement over RoadRunner
- Select FrankenPHP if: single-binary deployment priority, automatic HTTPS/HTTP/3 required, AND all extensions are ZTS-compatible OR can be removed
- Document the decision with rationale, benchmark data, and excluded alternatives

### 8. Create Driver-Specific Configuration
- RoadRunner: configure `.rr.yaml` with `http.pool.num_workers`, `http.pool.max_jobs`, `http.pool.supervisor.max_worker_memory`
- Swoole: configure in `config/octane.php` with `task_worker_num`, SSL settings, max coroutine limit
- FrankenPHP: configure Caddyfile with `php_server`, `worker.num_threads`, `worker.max_threads`
- Update deployment scripts, supervisor config, and CI pipeline for chosen driver

## Validation Checklist
- [ ] Workload characterized as CPU-bound, I/O-bound, or mixed with latency data
- [ ] All three drivers benchmarked in staging with application's actual workload
- [ ] 24-hour soak test completed with top candidate drivers
- [ ] Swoole package compatibility verified (if Swoole is a candidate)
- [ ] FrankenPHP ZTS extension compatibility verified (if FrankenPHP is a candidate)
- [ ] Driver selection documented with benchmark data and rationale
- [ ] Driver-specific configuration created and tested
- [ ] Graceful reload (`octane:reload`) verified for chosen driver
- [ ] Reverse proxy configured for chosen driver (all drivers benefit from one)
- [ ] Deployment pipeline updated with driver-specific start command

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Swoole underperforms RoadRunner | Benchmarks show Swoole slower | Low-I/O workload where coroutine overhead dominates | Switch to RoadRunner; Swoole only benefits high-I/O patterns |
| Package incompatibility with Swoole | Intermittent corruption or crashes | Non-coroutine-safe package with blocking I/O | Audit packages; use RoadRunner (process isolation) instead |
| FrankenPHP crashes on start | Process exits with ZTS error | Non-ZTS-compatible PHP extension | Remove incompatible extensions or switch to RoadRunner |
| Soak test reveals memory growth | RSS increases >10% per hour | Driver-specific memory leak or state contamination | Investigate leak; if driver-specific, switch to alternative driver |
| Benchmark results don't match published numbers | Real throughput lower than expected | Workload characteristics differ from published benchmarks | Trust your measurements, not published numbers |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| RoadRunner vs Swoole vs FrankenPHP | Default RoadRunner. Choose Swoole if I/O >50ms AND team has coroutine experience AND benchmark >30% gain. Choose FrankenPHP if single-binary ops simplicity is the priority |
| Continue with current driver vs switch | Switch only if current driver has measurable problems (performance, stability, ops overhead) AND the alternative shows clear improvement in staging |
| FrankenPHP for multi-server? | FrankenPHP's single-binary advantage diminishes in multi-server environments — prefer RoadRunner for orchestrated deployments |
| Benchmark duration | Minimum 30 minutes per driver for steady-state comparison; 24 hours for chosen candidate to detect memory leaks |

## Performance Considerations
- RoadRunner 2.1× vs FPM (low I/O), 1.7× (high I/O) — best all-around performance with process isolation
- Swoole 0.9× vs FPM (low I/O), 3.2× (high I/O) — can be SLOWER than FPM for CPU-bound workloads
- FrankenPHP 1.8× vs FPM (low I/O), 2.5× (high I/O) — strong performance with simple operations
- Each worker uses 30-80MB RSS; total server memory must accommodate all workers + overhead
- Swoole coroutines can reduce total worker count (one Swoole worker handles multiple concurrent requests)
- Switching drivers after production deployment requires restarting all workers — schedule maintenance window

## Security Considerations
- RoadRunner provides strongest security isolation (separate process per worker)
- Swoole coroutines share process memory — a vulnerability or memory corruption in one coroutine affects all
- FrankenPHP single binary reduces attack surface (no separate web server process to harden)
- All drivers require reverse proxy in front for SSL termination, rate limiting, and attack protection
- When switching drivers, re-validate health check endpoints, reverse proxy rules, and monitoring

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Start with RoadRunner as the default Octane driver | `05-rules.md:1` | Step 7: default recommendation |
| Benchmark all three Octane drivers with your specific workload | `05-rules.md:26` | Step 4: workload-specific benchmarking |
| Never run Octane without a reverse proxy in front of it | `05-rules.md:51` | Step 8: driver-agnostic security requirement |
| Run a 24-hour soak test with your chosen driver | `05-rules.md:80` | Step 5: soak test validation |

## Related Skills

| Skill | Relation |
|-------|----------|
| Install and Configure Octane for a Laravel Project | Follows driver selection to install and configure the chosen driver |
| Audit and Adapt Laravel Application for Octane's Persistent Execution Model | Prerequisite — application must be Octane-ready before driver selection matters |
| Benchmark Octane Performance Gain Estimation | Provides the measurement methodology for Step 4 |
| Configure Octane Workers by Driver | Detailed worker and pool configuration for the chosen driver |
| Perform FPM-to-Octane Migration | This skill is the driver selection phase of the broader migration |

## Success Criteria
- Driver selected with documented rationale based on application workload, team expertise, and operational requirements
- All three drivers benchmarked with the application's actual workload (not synthetic tests)
- 24-hour soak test completed with no memory leaks or state corruption
- Package compatibility verified for the chosen driver
- Driver-specific configuration created, tested, and deployed
- Graceful reload verified for the chosen driver
- Selection decision recorded in architecture decision record for future reference
