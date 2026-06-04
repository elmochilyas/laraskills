# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** FPM Status Page Monitoring â€” Active Processes, Max Children Reached, Listen Queue
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Scrape every 10s into monitoring**: Prometheus, Datadog, or custom scripts. Alert on critical thresholds.
- [ ] **Alert on listen_queue > 0 for >30s**: Indicates sustained pool saturation. Immediate investigation required.
- [ ] **Alert on max_children_reached increasing**: Pool has been saturated at some point. Track the rate of increase.
- [ ] **Alert on active_processes = max_children for >10s**: Pool is fully utilized. Any additional traffic causes queuing.
- [ ] pm.status_path configured in pool config
- [ ] Status page accessible from monitoring system
- [ ] Status page restricted to localhost/internal network
- [ ] listen queue metric scraped and monitored
- [ ] Alert configured for listen_queue > 0 for >30s
- [ ] FPM status page enabled and protected
- [ ] Key metrics (active, idle, queue, max_children_reached) monitored
- [ ] Alerts configured for pool saturation conditions
- [ ] Metrics integrated into production dashboard
- [ ] Status page access documented
- [ ] pm.status_path configured in FPM pool
- [ ] Web server routes /status to FPM
- [ ] Status page accessible (protected)
- [ ] Key metrics identified for monitoring
- [ ] Alerts set for max_children_reached, queue_length > 0
- [ ] Metrics integrated into monitoring dashboard

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Monitor-then-size workflow**: 1) Enable FPM status page, 2) Measure average and P95 worker RSS under peak load, 3) Calculate max_children, 4) Set pm.max_children, 5) Verify listen queue stays at 0 under peak.
- [ ] The status page can output in HTML, XML, JSON, or full JSON formats.
- [ ] Protect the status page with firewall rules (localhost-only) â€” not application authentication.
- [ ] Document and follow through on architectural decision: Which FPM status metrics to monitor
- [ ] Document and follow through on architectural decision: Alert thresholds for pool saturation
- [ ] Ensure architecture aligns with core concept: **Enable via**: `pm.status_path=/fpm-status` in pool config. Access via web: `curl http://localhost/fpm-status`.
- [ ] Ensure architecture aligns with core concept: **Key metrics**: `pool`, `process manager`, `start time`, `start since`, `accepted conn`, `listen queue`, `max listen queue`, `listen queue len`, `idle processes`, `active processes`, `total processes`, `max active processes`, `max children reached`, `slow requests`.
- [ ] Ensure architecture aligns with core concept: **listen queue > 0**: Earliest indicator of pool saturation. Requests are waiting because all workers are busy. Increase max_children, optimize slow code, or scale horizontally.
- [ ] Ensure architecture aligns with core concept: **max children reached**: Incremented every time all children are busy and a new request arrives. If increasing over time, the pool has been saturated. Immediate action required.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Scrape every 10s into monitoring**: Prometheus, Datadog, or custom scripts. Alert on critical thresholds.
- [ ] **Alert on listen_queue > 0 for >30s**: Indicates sustained pool saturation. Immediate investigation required.
- [ ] **Alert on max_children_reached increasing**: Pool has been saturated at some point. Track the rate of increase.
- [ ] **Alert on active_processes = max_children for >10s**: Pool is fully utilized. Any additional traffic causes queuing.
- [ ] Enable the status page: set `pm.status_path = /status` in the FPM pool configuration
- [ ] Configure the web server to route `/status` to the FPM socket/address
- [ ] Restart PHP-FPM and web server
- [ ] Access the status page: `curl http://localhost/status?full` for full details
- [ ] Key metrics to monitor: `active processes`, `total processes`, `idle processes`, `max active processes`, `queue length`, `max children reached`, `slow requests`
- [ ] If `max children reached` > 0: the pool hit max_children â€” consider increasing max_children or optimizing request duration
- [ ] If `queue length` is consistently > 0: workers are backlogged â€” increase workers or optimize request time
- [ ] If `idle processes` is consistently high: too many workers allocated â€” reduce max_children for memory efficiency
- [ ] If `active processes` consistently equals max_children: pool is saturated â€” investigate or scale
- [ ] Integrate these metrics into the monitoring dashboard and set alerts

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] Status page reveals internal metrics â€” restrict to localhost or internal network
- [ ] Never expose the status page on public endpoints
- [ ] Use firewall rules, not application authentication, to protect it
- [ ] Full JSON format includes request URIs â€” may expose sensitive paths

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
- [ ] pm.status_path configured in pool config
- [ ] Status page accessible from monitoring system
- [ ] Status page restricted to localhost/internal network
- [ ] listen queue metric scraped and monitored
- [ ] Alert configured for listen_queue > 0 for >30s
- [ ] Alert configured for max_children_reached increasing
- [ ] Status page data used for capacity planning decisions
- [ ] FPM status page enabled and protected
- [ ] Key metrics (active, idle, queue, max_children_reached) monitored
- [ ] Alerts configured for pool saturation conditions
- [ ] Metrics integrated into production dashboard
- [ ] Status page access documented
- [ ] pm.status_path configured in FPM pool
- [ ] Web server routes /status to FPM
- [ ] Status page accessible (protected)
- [ ] Key metrics identified for monitoring
- [ ] Alerts set for max_children_reached, queue_length > 0
- [ ] Metrics integrated into monitoring dashboard
- [ ] Status page access secured (internal network)

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Scrape every 10s into monitoring**: Prometheus, Datadog, or custom scripts. Alert on critical thresholds.
- [ ] **Alert on listen_queue > 0 for >30s**: Indicates sustained pool saturation. Immediate investigation required.
- [ ] **Alert on max_children_reached increasing**: Pool has been saturated at some point. Track the rate of increase.
- [ ] **Alert on active_processes = max_children for >10s**: Pool is fully utilized. Any additional traffic causes queuing.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not enabling the status page
- [ ] Avoid: Exposing status page publicly
- [ ] Avoid: Not monitoring listen queue
- [ ] Avoid: Ignoring max_children_reached
- [ ] Avoid anti-pattern: **Monitoring only active processes**: Listen queue is the earliest indicator of saturation. Active processes = max_children is already too late.
- [ ] Avoid anti-pattern: **Using application authentication for the status page**: The status page must be accessible without session/auth for monitoring. Use firewall rules.
- [ ] Avoid anti-pattern: **Not scraping the status page**: Manual checks miss intermittent saturation events. Automate scraping into monitoring.
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
**Core Concepts:** **Enable via**: `pm.status_path=/fpm-status` in pool config. Access via web: `curl http://localhost/fpm-status`., **Key metrics**: `pool`, `process manager`, `start time`, `start since`, `accepted conn`, `listen queue`, `max listen queue`, `listen queue len`, `idle processes`, `active processes`, `total processes`, `max active processes`, `max children reached`, `slow requests`., **listen queue > 0**: Earliest indicator of pool saturation. Requests are waiting because all workers are busy. Increase max_children, optimize slow code, or scale horizontally., **max children reached**: Incremented every time all children are busy and a new request arrives. If increasing over time, the pool has been saturated. Immediate action required.
**Skills:** Capacity Planning and Safety Margins, Slow Log Configuration and Analysis, Request Timeout Configuration
**Decision Trees:** Which FPM status metrics to monitor, Alert thresholds for pool saturation
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** Pool Sizing Formula, PM Max Children P95 Calculation, Slow Log Configuration, Capacity Planning Safety Margins, FPM Monitoring and Alerting

