# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Slow Log Configuration and Analysis â€” request_slowlog_timeout, Slow Log Interpretation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Start at p90 and lower gradually**: Setting threshold too low (e.g., p50) generates too many entries, overwhelming the log. Start at p90, analyze, then lower to p75.
- [ ] **Analyze frequency, not just individual entries**: A function appearing in 80% of slow log entries is the root cause. Count unique stack frames.
- [ ] **Triage workflow**: 1) Count unique stack frames in slow log, 2) Identify most frequent functions, 3) Profile those functions with Xdebug to get full callgraph, 4) Optimize or cache.
- [ ] **Pair with profiling**: Slow log identifies the slow function; profiling explains why it's slow.
- [ ] request_slowlog_timeout configured with appropriate threshold
- [ ] Pool-specific slowlog path configured
- [ ] Frequency analysis performed on slow log entries
- [ ] Most frequent slow functions identified and investigated
- [ ] Slow log file rotation configured
- [ ] Slow log configured with appropriate threshold
- [ ] Log rotation in place
- [ ] Recurring patterns identified and addressed
- [ ] Slow log volume within actionable range (5-50 entries/min)
- [ ] Configuration documented
- [ ] slowlog path configured
- [ ] request_slowlog_timeout set to appropriate value
- [ ] Log rotation configured (logrotate or similar)
- [ ] Slow log volume reviewed (5-50 entries/minute is normal)
- [ ] Recurring patterns identified from slow log entries
- [ ] Bottlenecks fixed based on slow log analysis

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Slow log triage**: 1) Count unique stack frames, 2) Identify most frequent functions, 3) Profile with Xdebug, 4) Optimize.
- [ ] **request_slowlog_timeout** fires a timer signal (SIGPROF) that captures the current stack trace via `zend_execute_data->prev_execute_data` chain.
- [ ] The slow log is a sampling profiler built into FPM â€” no additional extension needed.
- [ ] Document and follow through on architectural decision: slowlog threshold and configuration
- [ ] Ensure architecture aligns with core concept: **Configuration**: `request_slowlog_timeout=5` (seconds). `slowlog=/var/log/php-slow.log`. Must have a pool-specific log path.
- [ ] Ensure architecture aligns with core concept: **Output**: Timestamp, PID, request URI, and full PHP stack trace showing function/method/line at the timeout point.
- [ ] Ensure architecture aligns with core concept: **Sampling principle**: At p75, 25% of requests trigger slow log entries. Focus analysis on the most-frequent slow frames. A function appearing in 80% of slow logs is the root cause.
- [ ] Ensure architecture aligns with core concept: **Request duration**: Slow log shows where the request was WHEN the timeout fired, not the entire request profile. For detailed profiling, use Xdebug or Blackfire.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Start at p90 and lower gradually**: Setting threshold too low (e.g., p50) generates too many entries, overwhelming the log. Start at p90, analyze, then lower to p75.
- [ ] **Analyze frequency, not just individual entries**: A function appearing in 80% of slow log entries is the root cause. Count unique stack frames.
- [ ] **Triage workflow**: 1) Count unique stack frames in slow log, 2) Identify most frequent functions, 3) Profile those functions with Xdebug to get full callgraph, 4) Optimize or cache.
- [ ] **Pair with profiling**: Slow log identifies the slow function; profiling explains why it's slow.
- [ ] Set `slowlog = /var/log/php/fpm-slow.log` in the pool configuration
- [ ] Set `request_slowlog_timeout = P95_duration` â€” captures the slowest 5% of requests
- [ ] For initial setup: set to 5s (typical) and adjust based on observed log volume
- [ ] Restart PHP-FPM to apply
- [ ] Monitor log volume: if > 100 entries/minute, increase threshold (it is too low)
- [ ] If < 1 entry/hour, decrease threshold (may be missing slow requests)
- [ ] Analyze slow log entries: look for repeated patterns â€” same endpoint, same function, same database query
- [ ] Trace the backtrace in each entry: the last entry in the backtrace is typically where time is spent
- [ ] Correlate slow log entries with application profiling for deeper analysis
- [ ] Fix the identified bottlenecks and verify improvement in slow log entries
- [ ] Document the slow log configuration and recurring patterns

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] Slow logs contain stack traces revealing internal code paths â€” restrict log access
- [ ] URIs in slow logs may contain sensitive data (query parameters, POST data)
- [ ] Rotate slow logs regularly and limit retention
- [ ] Never expose slow logs on public endpoints

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
- [ ] request_slowlog_timeout configured with appropriate threshold
- [ ] Pool-specific slowlog path configured
- [ ] Frequency analysis performed on slow log entries
- [ ] Most frequent slow functions identified and investigated
- [ ] Slow log file rotation configured
- [ ] Log access restricted to authorized personnel
- [ ] Profiling performed on identified slow functions
- [ ] Slow log configured with appropriate threshold
- [ ] Log rotation in place
- [ ] Recurring patterns identified and addressed
- [ ] Slow log volume within actionable range (5-50 entries/min)
- [ ] Configuration documented
- [ ] slowlog path configured
- [ ] request_slowlog_timeout set to appropriate value
- [ ] Log rotation configured (logrotate or similar)
- [ ] Slow log volume reviewed (5-50 entries/minute is normal)
- [ ] Recurring patterns identified from slow log entries
- [ ] Bottlenecks fixed based on slow log analysis
- [ ] Slow log reviewed weekly for new patterns

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Start at p90 and lower gradually**: Setting threshold too low (e.g., p50) generates too many entries, overwhelming the log. Start at p90, analyze, then lower to p75.
- [ ] **Analyze frequency, not just individual entries**: A function appearing in 80% of slow log entries is the root cause. Count unique stack frames.
- [ ] **Triage workflow**: 1) Count unique stack frames in slow log, 2) Identify most frequent functions, 3) Profile those functions with Xdebug to get full callgraph, 4) Optimize or cache.
- [ ] **Pair with profiling**: Slow log identifies the slow function; profiling explains why it's slow.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting request_slowlog_timeout too low
- [ ] Avoid: Not setting pool-specific slow log path
- [ ] Avoid: Ignoring call frequency
- [ ] Avoid: Using slow log as permanent monitoring
- [ ] Avoid anti-pattern: **Using slow log as a permanent profiler**: The slow log adds overhead and log volume. Enable during investigation windows, not permanently.
- [ ] Avoid anti-pattern: **Analyzing individual entries without frequency**: A single slow entry may be an outlier. Always analyze across all entries to find consistent patterns.
- [ ] Avoid anti-pattern: **Ignoring the slow log entirely**: The slow log is a free, built-in diagnostic tool. Use it before reaching for external profilers.
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
**Core Concepts:** **Configuration**: `request_slowlog_timeout=5` (seconds). `slowlog=/var/log/php-slow.log`. Must have a pool-specific log path., **Output**: Timestamp, PID, request URI, and full PHP stack trace showing function/method/line at the timeout point., **Sampling principle**: At p75, 25% of requests trigger slow log entries. Focus analysis on the most-frequent slow frames. A function appearing in 80% of slow logs is the root cause., **Request duration**: Slow log shows where the request was WHEN the timeout fired, not the entire request profile. For detailed profiling, use Xdebug or Blackfire.
**Skills:** Request Timeout Configuration, FPM Status Page Monitoring, Profiling and Callgraph Analysis
**Decision Trees:** slowlog threshold and configuration
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** Request Timeout Configuration, FPM Status Page Monitoring, Callgraph Analysis Techniques, Xdebug Profiling Setup, Blackfire Installation

