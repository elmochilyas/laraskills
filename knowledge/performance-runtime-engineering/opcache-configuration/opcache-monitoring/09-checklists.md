# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Monitoring â€” opcache_get_status(), Hit Rate Analysis, Metrics Collection, Alerting
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Set up OpCache metrics collection in your monitoring system (Prometheus, Datadog, etc.).
- [ ] Verify all 5 critical metrics are collected: cache_full, oom_restarts, hash_restarts, hit_rate, wasted_percentage.
- [ ] Set alerts on: cache_full=true, oom_restarts>0, hash_restarts>0, hit_rate<99%, wasted_percentage>5%.
- [ ] Verify monitoring endpoint is internal-only (not publicly accessible).
- [ ] Test post-deployment monitoring: deploy and observe hit rate recovery.
- [ ] OpCache metrics collected and displayed on dashboard
- [ ] Alerts configured for critical thresholds (hit rate, cache_full, memory)
- [ ] Multi-server monitoring in place
- [ ] Weekly trend analysis established
- [ ] Monitoring setup documented
- [ ] Metrics collection script created
- [ ] Metrics exposed to monitoring system
- [ ] Dashboard configured with key OpCache metrics
- [ ] Alerts created for hit rate, cache_full, and memory pressure
- [ ] Multi-server metrics aggregated
- [ ] Monitoring documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Monitoring data flow**: PHP-FPM status endpoint (or dedicated monitoring route) â†’ call `opcache_get_status(false)` â†’ format metrics â†’ push to monitoring system (Prometheus, Datadog, New Relic). Expose as a `/health/opcache` endpoint.
- [ ] **Hit rate trend analysis**: Sample hit rate at a fixed interval. Plot over time. A declining trend indicates gradual cache pressure. Investigate when hit rate drops below 99%.
- [ ] **Cache cycle detection**: After a deployment, hit rate starts at ~0% (cache cleared) and rises toward 99%+ as files are compiled. Expected stabilization time: 5â€“60 seconds. If hit rate stays low, files are being evicted faster than they're compiled â€” memory is too small.
- [ ] **Script-level analysis**: Occasionally (weekly or during debugging) run `opcache_get_status(true)` to identify files with high miss rates. Files that are frequently compiled but never stay cached indicate memory pressure. Files that are never cached indicate blacklist or _max_accelerated_files exhaustion.
- [ ] **Integration with APM**: OpCache metrics should be part of your APM dashboard alongside FPM metrics, request rates, and error rates. Correlate OpCache hit rate drops with CPU usage spikes.
- [ ] Document and follow through on architectural decision: OpCache monitoring metrics
- [ ] Document and follow through on architectural decision: Alert thresholds
- [ ] Ensure architecture aligns with core concept: **opcache_get_status(bool $include_scripts = false)**: Returns detailed OpCache status. When `$include_scripts=true`, returns individual file entries (expensive â€” use sparingly). When `false`, returns aggregate statistics.
- [ ] Ensure architecture aligns with core concept: **opcache_get_configuration()**: Returns current OpCache configuration values. Useful for verifying settings in production.
- [ ] Ensure architecture aligns with core concept: **Critical metrics**:
- [ ] Ensure architecture aligns with core concept: **Hit rate calculation**: `hits / (hits + misses) Ã— 100`. A miss occurs when a requested file is not in cache and must be compiled. Target: >99%.
- [ ] Ensure architecture aligns with core concept: **Wasted memory**: Memory that was used by evicted files and cannot be reused until compaction. High waste = cache thrashing.
- [ ] Ensure architecture aligns with core concept: **Monitoring frequency**: Collect metrics every 60â€“300 seconds in production. More frequently for debugging. `opcache_get_status(false)` is lightweight (~10Âµs).

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Create a monitoring script that calls `opcache_get_status(false)` and extracts key metrics: hit_rate, memory_usage (used/free/wasted), cache_full, num_cached_scripts, num_cached_keys, max_cached_keys
- [ ] For Prometheus: expose these metrics via a /metrics endpoint in the application
- [ ] For Datadog/New Relic: submit metrics via the agent API
- [ ] Set up a dashboard showing: hit rate over time, memory usage (used/total), cache_full indicator, cached file count
- [ ] Configure alerts: hit rate <95% (warning), hit rate <90% (critical), cache_full=true, free_memory <10% of total
- [ ] For multi-server deployments, collect metrics from each server and aggregate
- [ ] Set up weekly trend analysis: if memory usage grows >5% per week, plan for configuration increase
- [ ] Integrate OpCache metrics into the existing application performance dashboard
- [ ] Document the monitoring setup and alert thresholds

# Performance Checklist (from 04/06)
- [ ] `opcache_get_status(false)` call cost: ~10Âµs. Safe to call every 60 seconds.
- [ ] `opcache_get_status(true)` call cost: ~100Âµsâ€“10ms depending on file count (returns all 20K entries). Use sparingly (weekly or on-demand).
- [ ] Monitoring memory overhead: Negligible â€” just a small PHP array serialized to monitoring system.
- [ ] High monitor frequency (every 5 seconds): Adds unnecessary load. 60 seconds is sufficient for trend detection.
- [ ] Cache profiling impact: Parsing individual file entries (`true` mode) adds CPU and memory. Restrict to low-traffic periods.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] OpCache status endpoint: Do not expose the raw `opcache_get_status()` output publicly. It reveals filesystem paths, file counts, and configuration details. Restrict to internal networks or authentication.
- [ ] Script-level information: `opcache_get_status(true)` returns file paths. An attacker could use this to discover application structure. Never expose this data externally.
- [ ] Monitoring access: Ensure monitoring systems access OpCache status via an authenticated endpoint or internal route.
- [ ] Failure mode: If monitoring detects `cache_full=true` but the configuration cannot be changed immediately, implement rate limiting or add servers to reduce per-server cache pressure.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Set up OpCache metrics collection in your monitoring system (Prometheus, Datadog, etc.).
- [ ] Verify all 5 critical metrics are collected: cache_full, oom_restarts, hash_restarts, hit_rate, wasted_percentage.
- [ ] Set alerts on: cache_full=true, oom_restarts>0, hash_restarts>0, hit_rate<99%, wasted_percentage>5%.
- [ ] Verify monitoring endpoint is internal-only (not publicly accessible).
- [ ] Test post-deployment monitoring: deploy and observe hit rate recovery.
- [ ] Create a dashboard showing OpCache metrics alongside PHP-FPM metrics.
- [ ] Document the monitoring setup and alert thresholds.
- [ ] OpCache metrics collected and displayed on dashboard
- [ ] Alerts configured for critical thresholds (hit rate, cache_full, memory)
- [ ] Multi-server monitoring in place
- [ ] Weekly trend analysis established
- [ ] Monitoring setup documented
- [ ] Metrics collection script created
- [ ] Metrics exposed to monitoring system
- [ ] Dashboard configured with key OpCache metrics
- [ ] Alerts created for hit rate, cache_full, and memory pressure
- [ ] Multi-server metrics aggregated
- [ ] Monitoring documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Only monitoring hit rate
- [ ] Avoid: Alerting on hit rate too aggressively
- [ ] Avoid: Not tracking hit rate trend
- [ ] Avoid: Using `opcache_get_status(true)` in routine monitoring
- [ ] Avoid: Not monitoring after deployment
- [ ] Avoid anti-pattern: **Dashboard overload**: Monitoring every OpCache metric without understanding what's actionable. Focus on the 5 critical metrics: cache_full, oom_restarts, hash_restarts, hit_rate, wasted_percentage.
- [ ] Avoid anti-pattern: **Manual monitoring**: Checking `opcache_get_status()` via SSH once a week. Automate collection into your monitoring system.
- [ ] Avoid anti-pattern: **Ignoring stale cache indicators**: `wasted_memory` and `cache_full` are early warning signs. Act on them when they appear, not when hit rate drops.
- [ ] Avoid anti-pattern: **Monitoring only one server**: In a cluster, one server may have different OpCache metrics than others. Monitor all servers individually.
- [ ] Guard against anti-pattern: Undersized OpCache Memory Allocation
- [ ] Guard against anti-pattern: Not Configuring max_accelerated_files
- [ ] Guard against anti-pattern: Disabling validate_timestamps in Development
- [ ] Guard against anti-pattern: Not Monitoring OpCache Hit Rate
- [ ] Guard against anti-pattern: Forgetting opcache_reset() After Deployment

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
**Core Concepts:** **opcache_get_status(bool $include_scripts = false)**: Returns detailed OpCache status. When `$include_scripts=true`, returns individual file entries (expensive â€” use sparingly). When `false`, returns aggregate statistics., **opcache_get_configuration()**: Returns current OpCache configuration values. Useful for verifying settings in production., **Critical metrics**:, **Hit rate calculation**: `hits / (hits + misses) Ã— 100`. A miss occurs when a requested file is not in cache and must be compiled. Target: >99%., **Wasted memory**: Memory that was used by evicted files and cannot be reused until compaction. High waste = cache thrashing.
**Rules:**
- General: Do Not Expose Raw OpCache Status Publicly
**Skills:** OpCache Memory Sizing, OpCache Max Accelerated Files Calculation, OpCache Revalidation Configuration, Profiling vs Monitoring
**Decision Trees:** OpCache monitoring metrics, Alert thresholds
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Memory Consumption Monitoring, OpCache Error Handling and Diagnostics, OpCache Max Accelerated Files, Deployment Cache Invalidation, PHP-FPM Status Page Monitoring

