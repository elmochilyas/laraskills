# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Laravel Octane
**Knowledge Unit:** # Octane Metrics and Benchmarks â€” Benchmark Ranges, Performance Measurement, Observation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `php artisan octane:status` and verify all workers are in "ready" state.
- [ ] Run a 30-second warm-up phase followed by a 30-second benchmark with `wrk`.
- [ ] Measure p50/p95/p99 latency and compare against your SLO targets.
- [ ] Monitor worker RSS over a 1-hour soak test â€” verify growth <10%.
- [ ] Run `octane:profile-memory` and identify top memory consumers.
- [ ] FPM baseline captured and Octane improvement quantified with realistic workloads
- [ ] Full percentile distribution reported (not just average)
- [ ] 24-hour soak test confirms stable RSS (<10% growth per hour)
- [ ] OpCache hit rate >99% verified under sustained load
- [ ] CI/CD pipeline catches performance regressions (RPS drop >10%, p99 increase >20%)
- [ ] Performance dashboard provides real-time visibility into Octane metrics
- [ ] Team can identify and investigate memory leaks from RSS monitoring data
- [ ] Benchmark history enables trend analysis and capacity planning
- [ ] PHP-FPM baseline captured at multiple concurrency levels
- [ ] Octane benchmarked with realistic workloads after warm-up
- [ ] Full percentile distribution reported (p50, p95, p99, max) not just average
- [ ] 24-hour soak test completed with RSS growth <10% per hour
- [ ] `octane:profile-memory` run and top memory consumers identified
- [ ] OpCache hit rate >99% verified under load
- [ ] CI/CD benchmark regression detection configured with thresholds

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Benchmarking methodology**: Use `wrk` or `wrk2` for HTTP-level benchmarking. Use `k6` for user-journey simulation. Use `phpbench` for micro-benchmarks.
- [ ] **Metrics collection**: Expose Prometheus metrics from Octane via the `laravel/prometheus` package or custom middleware. Track RPS, latency, worker count, connection pool size, and GC status.
- [ ] **Continuous benchmarking**: Integrate benchmarks into CI/CD. Compare against a baseline commit. Fail the pipeline if throughput drops by >10% or p99 increases by >20%.
- [ ] **Octane status command**: `php artisan octane:status` provides a snapshot of worker health. Use it in health check endpoints and monitoring dashboards.
- [ ] **Memory profiling**: Run `php artisan octane:profile-memory` during development to identify services that consume excessive memory in the persistent worker context.
- [ ] **Application performance monitoring**: Send Octane metrics to APM tools (Datadog, New Relic, Sentry). Set up dashboards for p50/p95/p99 latency, RPS, and error rate.
- [ ] Document and follow through on architectural decision: Octane performance benchmark methodology
- [ ] Ensure architecture aligns with core concept: **Throughput (RPS)**: Requests per second the server can handle. Varies dramatically by workload â€” API endpoints achieve 10â€“20Ã— gains, while full-page rendering achieves 2.5â€“3Ã—.
- [ ] Ensure architecture aligns with core concept: **Latency percentiles**: p50 (median), p95 (slowest 5%), p99 (slowest 1%). Octane's bootstrap elimination reduces the floor, making tail latency more dependent on I/O variability.
- [ ] Ensure architecture aligns with core concept: **Worker memory (RSS)**: Resident Set Size per worker. Baseline ~65MB, growing with request count. Stable RSS indicates no memory leak; growing RSS indicates a leak.
- [ ] Ensure architecture aligns with core concept: **`octane:status`**: Shows worker count, request count, and status. Quick health check for Octane servers.
- [ ] Ensure architecture aligns with core concept: **`octane:profile-memory`**: Profiles memory usage per service provider, identifying providers that consume excessive memory in persistent workers.
- [ ] Ensure architecture aligns with core concept: **Connection pool utilization**: Database and Redis connection usage. In Octane, workers hold persistent connections â€” monitor pool exhaustion.
- [ ] Ensure architecture aligns with core concept: **GC telemetry**: `gc_status()` output â€” root buffer entries, collection count, GC time. Essential for detecting cycle accumulation in long-running workers.
- [ ] Ensure architecture aligns with core concept: **Hit rate**: OpCache hit rate must remain >99% under Octane. Cache eviction forces recompilation, defeating Octane's purpose.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Octane's throughput improvement varies by framework version (Laravel 11 vs 12), driver (RoadRunner vs Swoole vs FrankenPHP), and workload (API vs full page).
- [ ] API-only endpoints see 10â€“20Ã— gains. Full-stack pages with Blade rendering see 2.5â€“3Ã— gains. The difference is proportional to the bootstrap-to-execution ratio.
- [ ] Each Octane worker uses 30â€“80MB RSS. Total memory = workers Ã— per-worker RSS. Monitor closely â€” memory leaks accumulate.
- [ ] Octane drops 40â€“60% throughput when memory pressure triggers swap. Ensure adequate RAM for peak load.
- [ ] The primary bottleneck shifts from framework boot to database/API I/O under Octane. Optimize external calls after deploying Octane.
- [ ] OpCache hit rate must remain >99%. A 1% hit rate decrease adds ~0.5â€“1% CPU usage from recompilation.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Benchmarking endpoints can overwhelm the server if exposed publicly. Use internal or authenticated endpoints for monitoring.
- [ ] `octane:profile-memory` output may reveal internal application structure. Do not expose this in production.
- [ ] APM tools that capture request data may inadvertently log sensitive information. Configure data scrubbing rules.
- [ ] Health check endpoints should return minimal information â€” worker count and status only, not detailed metrics.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Run `php artisan octane:status` and verify all workers are in "ready" state.
- [ ] Run a 30-second warm-up phase followed by a 30-second benchmark with `wrk`.
- [ ] Measure p50/p95/p99 latency and compare against your SLO targets.
- [ ] Monitor worker RSS over a 1-hour soak test â€” verify growth <10%.
- [ ] Run `octane:profile-memory` and identify top memory consumers.
- [ ] Compare throughput with PHP-FPM baseline at the same concurrency level.
- [ ] Verify OpCache hit rate >99% under load.
- [ ] Set up Prometheus/Grafana dashboard for Octane metrics.
- [ ] Integrate benchmark comparison into CI/CD pipeline.
- [ ] Document baseline metrics and performance targets.
- [ ] FPM baseline captured and Octane improvement quantified with realistic workloads
- [ ] Full percentile distribution reported (not just average)
- [ ] 24-hour soak test confirms stable RSS (<10% growth per hour)
- [ ] OpCache hit rate >99% verified under sustained load
- [ ] CI/CD pipeline catches performance regressions (RPS drop >10%, p99 increase >20%)
- [ ] Performance dashboard provides real-time visibility into Octane metrics
- [ ] Team can identify and investigate memory leaks from RSS monitoring data
- [ ] Benchmark history enables trend analysis and capacity planning
- [ ] PHP-FPM baseline captured at multiple concurrency levels
- [ ] Octane benchmarked with realistic workloads after warm-up
- [ ] Full percentile distribution reported (p50, p95, p99, max) not just average
- [ ] 24-hour soak test completed with RSS growth <10% per hour
- [ ] `octane:profile-memory` run and top memory consumers identified
- [ ] OpCache hit rate >99% verified under load
- [ ] CI/CD benchmark regression detection configured with thresholds
- [ ] Performance dashboard created with key Octane metrics
- [ ] Alert rules configured for worker count drop, RSS anomalies, p99 SLO
- [ ] Benchmark history stored for trend analysis

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Benchmarking with `php artisan serve`
- [ ] Avoid: Ignoring warm-up phase
- [ ] Avoid: Only measuring throughput (RPS)
- [ ] Avoid: Not monitoring worker memory
- [ ] Avoid: Benchmarking with unrealistic data
- [ ] Avoid anti-pattern: **Single-metric optimization**: Optimizing only for RPS while ignoring memory, latency, and error rate. Always consider the full picture.
- [ ] Avoid anti-pattern: **Comparing against a non-baseline**: Comparing Octane's unoptimized configuration to FPM's optimized configuration. Benchmark both with optimal settings.
- [ ] Avoid anti-pattern: **Benchmarking on development hardware**: Development machines have different CPU, memory, and I/O characteristics than production. Always benchmark on production-equivalent hardware.
- [ ] Avoid anti-pattern: **Ignoring coordinated omission**: Closed-loop benchmark tools (wrk, ab) can miss tail latency because they start the next request when the previous finishes. Use open-loop tools (wrk2) for accurate tail latency.
- [ ] Guard against anti-pattern: Application State Leaking Across Requests
- [ ] Guard against anti-pattern: Not Configuring max_requests for Worker Recycling
- [ ] Guard against anti-pattern: Database Connection Pool Exhaustion
- [ ] Guard against anti-pattern: Running Queue Workers Inside Octane
- [ ] Guard against anti-pattern: Not Using Octane Table for Cross-Worker State

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Throughput (RPS)**: Requests per second the server can handle. Varies dramatically by workload â€” API endpoints achieve 10â€“20Ã— gains, while full-page rendering achieves 2.5â€“3Ã—., **Latency percentiles**: p50 (median), p95 (slowest 5%), p99 (slowest 1%). Octane's bootstrap elimination reduces the floor, making tail latency more dependent on I/O variability., **Worker memory (RSS)**: Resident Set Size per worker. Baseline ~65MB, growing with request count. Stable RSS indicates no memory leak; growing RSS indicates a leak., **`octane:status`**: Shows worker count, request count, and status. Quick health check for Octane servers., **`octane:profile-memory`**: Profiles memory usage per service provider, identifying providers that consume excessive memory in persistent workers.
**Decision Trees:** Octane performance benchmark methodology
**Anti-Patterns:** Application State Leaking Across Requests, Not Configuring max_requests for Worker Recycling, Database Connection Pool Exhaustion, Running Queue Workers Inside Octane, Not Using Octane Table for Cross-Worker State
**Related Topics:** Octane Architecture and Execution Model, Benchmarking Methodology (wrk/wrk2/k6), Worker Configuration by Driver, State Management and Leak Prevention, Profiling Tools (Blackfire, Tideways)


