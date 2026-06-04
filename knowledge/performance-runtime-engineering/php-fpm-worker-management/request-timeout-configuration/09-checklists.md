# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Request Timeout Configuration â€” request_terminate_timeout, max_execution_time, max_input_time
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Set request_terminate_timeout 10-30s above p99 latency**: Too low causes 502 errors during normal operation. Monitor timeout hits in FPM error log.
- [ ] **Maintain the timeout hierarchy**: `max_input_time=60` > `max_execution_time=30` > `request_terminate_timeout=35`. Input time highest (wait for uploads), execution timeout catches runaway code, FPM timeout is the safety net.
- [ ] **Catch timeouts gracefully**: Use `register_shutdown_function()` for `max_execution_time` to return a proper error response instead of a blank 502.
- [ ] **Monitor timeout events**: Track timeout counts in your monitoring system. An increase may indicate a new performance regression.
- [ ] request_terminate_timeout set (value > 0)
- [ ] max_execution_time < request_terminate_timeout
- [ ] max_input_time configured for upload requirements
- [ ] Timeout hierarchy correct (input > execution < FPM)
- [ ] Shutdown handler registered for graceful timeout handling
- [ ] request_terminate_timeout configured for application needs
- [ ] Slow log enabled with appropriate threshold
- [ ] 504 errors from timeout = 0 for normal operation
- [ ] Slow log reviewed and actionable items addressed
- [ ] Configuration documented with rationale
- [ ] Request duration distribution profiled
- [ ] request_terminate_timeout set to 2-3x legitimate max
- [ ] request_slowlog_timeout set to P95 value
- [ ] Slow log path configured
- [ ] 504 errors monitored (should be 0 for normal operation)
- [ ] Slow log reviewed regularly

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Timeout hierarchy**: `max_input_time=60` > `max_execution_time=30` > `request_terminate_timeout=35`
- [ ] request_terminate_timeout is a SIGKILL â€” no shutdown handlers run. Use it as a last resort.
- [ ] max_execution_time throws a fatal error â€” shutdown handlers DO run. Prefer this for graceful handling.
- [ ] max_input_time runs from request start to completion of body reading.
- [ ] Document and follow through on architectural decision: request_terminate_timeout value
- [ ] Document and follow through on architectural decision: request_slowlog_timeout value
- [ ] Ensure architecture aligns with core concept: **request_terminate_timeout**: FPM master kills the worker if a request exceeds this time. No error handling â€” the connection dies with a 502. Set 10-30s above expected max response time.
- [ ] Ensure architecture aligns with core concept: **max_execution_time**: PHP internal timer. Throws a fatal error when exceeded. Can be caught with `register_shutdown_function()` for graceful error handling. Default: 30s.
- [ ] Ensure architecture aligns with core concept: **max_input_time**: Time to read POST data and file uploads. Default: 60s. For large uploads, this may need to be increased.
- [ ] Ensure architecture aligns with core concept: **Relationship**: `max_execution_time < request_terminate_timeout` â€” allow PHP to handle timeout gracefully before FPM kills the worker.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Set request_terminate_timeout 10-30s above p99 latency**: Too low causes 502 errors during normal operation. Monitor timeout hits in FPM error log.
- [ ] **Maintain the timeout hierarchy**: `max_input_time=60` > `max_execution_time=30` > `request_terminate_timeout=35`. Input time highest (wait for uploads), execution timeout catches runaway code, FPM timeout is the safety net.
- [ ] **Catch timeouts gracefully**: Use `register_shutdown_function()` for `max_execution_time` to return a proper error response instead of a blank 502.
- [ ] **Monitor timeout events**: Track timeout counts in your monitoring system. An increase may indicate a new performance regression.
- [ ] Profile request durations: determine P50, P95, P99, and absolute max for normal operation
- [ ] Set `request_terminate_timeout` to 2-3x the longest legitimate request duration
- [ ] For most web applications: 30-60 seconds is appropriate
- [ ] For API endpoints with long-running operations: 120-300 seconds (or split into background jobs)
- [ ] Set `request_slowlog_timeout` to the P95 value â€” requests exceeding this are logged for investigation
- [ ] Ensure `slowlog = /path/to/slow.log` is configured to capture slow request traces
- [ ] Monitor 504 errors after configuration â€” if increasing, timeouts may be too aggressive
- [ ] Review slow log regularly to identify endpoints that need optimization
- [ ] Adjust timeouts if the application has legitimate reasons for long-running requests
- [ ] Document the timeout configuration and rationale

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] request_terminate_timeout prevents resource exhaustion attacks (slow loris, large uploads)
- [ ] max_execution_time prevents infinite loops and runaway processes from consuming CPU
- [ ] max_input_time prevents slow upload attacks from occupying connections
- [ ] All three together provide defense in depth against denial of service

# Reliability Checklist (from 04/05/06)
- [ ] **max_children exhaustion**: All workers busy, request queue grows. Symptom: FPM log "server reached pm.max_children setting". Nginx returns 502/504. Mitigation: Increase max_children, optimize response time, add more servers.
- [ ] **OOM killer**: Linux OOM killer terminates PHP-FPM workers. Symptom: dmesg "oom-killer" events, FPM logs SIGKILL. Mitigation: Reduce max_children, add RAM, enable swap.
- [ ] **Slow request cascade**: One slow request holds a worker, reducing capacity, causing queuing, which creates more slow requests (snowball effect). Symptom: Latency degrades non-linearly with traffic increase. Mitigation: Set request_terminate_timeout, enable slow log, identify bottleneck.
- [ ] **PHP-FPM master crash**: Master process dies due to bug or resource exhaustion. Symptom: All workers die, site down. Mitigation: systemd auto-restart, monitoring alert.
- [ ] **Status page**: Enable pm.status_path = /status in pool config. Monitor: ctive processes, idle processes, listen queue, max children reached, slow requests.
- [ ] **Logging**: Enable slow log (equest_slowlog_timeout = 2, slowlog = /path). Configure catch_workers_output = yes to capture PHP errors.
- [ ] **Emergency restart**: Set emergency_restart_threshold = 3 and emergency_restart_interval = 60s to auto-recover from OpCache memory corruption.
- [ ] **Capacity alerts**: Alert when max_children_reached counter increments Ã¢â‚¬â€ indicates pool exhaustion. Alert when listen queue consistently above 0.

# Testing Checklist (from 04/06)
- [ ] request_terminate_timeout set (value > 0)
- [ ] max_execution_time < request_terminate_timeout
- [ ] max_input_time configured for upload requirements
- [ ] Timeout hierarchy correct (input > execution < FPM)
- [ ] Shutdown handler registered for graceful timeout handling
- [ ] Timeout events monitored in FPM error log
- [ ] Timeout values reviewed against p99 latency
- [ ] request_terminate_timeout configured for application needs
- [ ] Slow log enabled with appropriate threshold
- [ ] 504 errors from timeout = 0 for normal operation
- [ ] Slow log reviewed and actionable items addressed
- [ ] Configuration documented with rationale
- [ ] Request duration distribution profiled
- [ ] request_terminate_timeout set to 2-3x legitimate max
- [ ] request_slowlog_timeout set to P95 value
- [ ] Slow log path configured
- [ ] 504 errors monitored (should be 0 for normal operation)
- [ ] Slow log reviewed regularly
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Set request_terminate_timeout 10-30s above p99 latency**: Too low causes 502 errors during normal operation. Monitor timeout hits in FPM error log.
- [ ] **Maintain the timeout hierarchy**: `max_input_time=60` > `max_execution_time=30` > `request_terminate_timeout=35`. Input time highest (wait for uploads), execution timeout catches runaway code, FPM timeout is the safety net.
- [ ] **Catch timeouts gracefully**: Use `register_shutdown_function()` for `max_execution_time` to return a proper error response instead of a blank 502.
- [ ] **Monitor timeout events**: Track timeout counts in your monitoring system. An increase may indicate a new performance regression.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting request_terminate_timeout too low
- [ ] Avoid: Not setting request_terminate_timeout
- [ ] Avoid: Reversed hierarchy (FPM timeout < PHP timeout)
- [ ] Avoid: Raising timeouts instead of fixing code
- [ ] Avoid anti-pattern: **Setting request_terminate_timeout=0**: Disables the most important safety net. A single infinite loop can exhaust the entire FPM pool.
- [ ] Avoid anti-pattern: **Using timeouts as performance targets**: Timeouts should be safety nets, not performance goals. If requests are timing out, optimize the code.
- [ ] Avoid anti-pattern: **Ignoring timeout events**: Each timeout is a signal of a performance problem. Monitor and investigate.
- [ ] Guard against anti-pattern: pm.max_children Set Arbitrarily Without Calculation
- [ ] Guard against anti-pattern: Using Dynamic Process Manager for Consistent Workloads
- [ ] Guard against anti-pattern: pm.max_requests Too High - Memory Drift Unchecked
- [ ] Guard against anti-pattern: pm.min_spare_servers Too Low Causing Cold Requests
- [ ] Guard against anti-pattern: Ignoring pm.status_page in Production
- [ ] Calculated from RSS data
- [ ] No swap under load

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Status page**: Enable pm.status_path = /status in pool config. Monitor: ctive processes, idle processes, listen queue, max children reached, slow requests.
- [ ] **Logging**: Enable slow log (equest_slowlog_timeout = 2, slowlog = /path). Configure catch_workers_output = yes to capture PHP errors.
- [ ] **Emergency restart**: Set emergency_restart_threshold = 3 and emergency_restart_interval = 60s to auto-recover from OpCache memory corruption.
- [ ] **Capacity alerts**: Alert when max_children_reached counter increments Ã¢â‚¬â€ indicates pool exhaustion. Alert when listen queue consistently above 0.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **request_terminate_timeout**: FPM master kills the worker if a request exceeds this time. No error handling â€” the connection dies with a 502. Set 10-30s above expected max response time., **max_execution_time**: PHP internal timer. Throws a fatal error when exceeded. Can be caught with `register_shutdown_function()` for graceful error handling. Default: 30s., **max_input_time**: Time to read POST data and file uploads. Default: 60s. For large uploads, this may need to be increased., **Relationship**: `max_execution_time < request_terminate_timeout` â€” allow PHP to handle timeout gracefully before FPM kills the worker.
**Skills:** Slow Log Configuration and Analysis, FPM Status Page Monitoring, Request Duration Profiling
**Decision Trees:** request_terminate_timeout value, request_slowlog_timeout value
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** Slow Log Configuration and Analysis, FPM Status Page Monitoring, CPU vs I/O Bound Worker Ratios, PHP Error Handling

