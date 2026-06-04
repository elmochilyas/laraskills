# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Multi-Pool Isolation Strategies â€” Per-Tenant pm.max_children Budgeting
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always use per-tenant pools in multi-tenant environments**: A single shared pool means one tenant's traffic spike can exhaust all workers, causing downtime for all tenants.
- [ ] **Budget total workers across pools**: Sum of all pool max_children must not exceed server capacity. Over-allocation defeats isolation.
- [ ] **Consider separate FPM instances for OpCache isolation**: OpCache memory is shared across pools within one FPM instance. For strong isolation, run separate FPM instances with separate OpCache.
- [ ] **Monitor per-pool status**: Each pool has its own status page. Monitor listen queue and max_children_reached per pool.
- [ ] Separate pool configurations per tenant
- [ ] Total worker budget calculated and within server capacity
- [ ] Each pool has its own Unix socket
- [ ] Nginx configured to route requests to the correct pool
- [ ] Per-pool status pages accessible and monitored
- [ ] Applications/endpoints isolated into separate pools
- [ ] Per-pool resource limits prevent noisy-neighbor issues
- [ ] Resource spike in one pool does not affect others
- [ ] Separate monitoring and logging per pool
- [ ] Configuration documented with isolation rationale
- [ ] Applications/endpoints grouped by isolation requirements
- [ ] Per-pool configuration files created
- [ ] Per-pool pm.max_children set within resource budget
- [ ] Separate listen sockets configured
- [ ] Separate slow logs per pool
- [ ] Web server routes traffic to correct pool

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Tiered pricing by pool**: Basic plan pool = 5 max_children, Professional = 20, Enterprise = 50. Each pool independently constrained. No noisy-neighbor problem.
- [ ] **Separate Unix sockets**: Each pool listens on its own Unix socket. Nginx routes requests to the appropriate socket based on server_name or URL prefix.
- [ ] **Per-pool logging**: Each pool has its own slow log, access log, and error log. Troubleshooting is isolated and focused.
- [ ] Document and follow through on architectural decision: Single vs multiple FPM pools
- [ ] Ensure architecture aligns with core concept: **Pool configuration**: Each pool has its own `.conf` file in `/etc/php/*/fpm/pool.d/`. Separate Unix sockets, separate `pm.*` settings, separate slow logs, separate status pages.
- [ ] Ensure architecture aligns with core concept: **Per-tenant budgeting**: `pool_1.max_children = 20`, `pool_2.max_children = 10`. Total allocated children = total server capacity / safety margin. Over-allocation defeats isolation.
- [ ] Ensure architecture aligns with core concept: **Shared memory**: OpCache memory is shared across all pools. A tenant filling OpCache affects all other tenants. Consider separate FPM instances with separate OpCache for strong isolation.
- [ ] Ensure architecture aligns with core concept: **Listen queue per pool**: Each pool has its own listen queue. Tenant A's queue buildup does not affect Tenant B's queue.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always use per-tenant pools in multi-tenant environments**: A single shared pool means one tenant's traffic spike can exhaust all workers, causing downtime for all tenants.
- [ ] **Budget total workers across pools**: Sum of all pool max_children must not exceed server capacity. Over-allocation defeats isolation.
- [ ] **Consider separate FPM instances for OpCache isolation**: OpCache memory is shared across pools within one FPM instance. For strong isolation, run separate FPM instances with separate OpCache.
- [ ] **Monitor per-pool status**: Each pool has its own status page. Monitor listen queue and max_children_reached per pool.
- [ ] Identify groups that need isolation: different applications, admin vs public, high-traffic vs low-traffic
- [ ] Create a separate pool configuration file for each group in `/etc/php/X.Y/fpm/pool.d/`
- [ ] Configure each pool with: `[poolname]`, `listen = /run/php/poolname.sock`, `user`, `group`, and pm settings
- [ ] Set per-pool `pm.max_children` based on the group's resource budget
- [ ] Configure separate `pm.status_path` per pool if monitoring individually
- [ ] Configure separate slow log per pool: `slowlog = /var/log/php/poolname-slow.log`
- [ ] Configure separate `request_terminate_timeout` per pool if different endpoint types need different timeouts
- [ ] Update web server configuration to route traffic to the appropriate pool socket
- [ ] Verify isolation: a resource spike in one pool should not affect other pools
- [ ] Document the pool configuration and isolation boundaries

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] Pool isolation prevents one tenant's traffic spike from affecting other tenants
- [ ] Separate Unix sockets with different permissions control which users can communicate with each pool
- [ ] A compromised tenant cannot exhaust workers needed by other tenants
- [ ] For strong security isolation, consider separate FPM instances or containerization

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
- [ ] Separate pool configurations per tenant
- [ ] Total worker budget calculated and within server capacity
- [ ] Each pool has its own Unix socket
- [ ] Nginx configured to route requests to the correct pool
- [ ] Per-pool status pages accessible and monitored
- [ ] Per-pool slow logs configured
- [ ] OpCache isolation strategy considered (separate FPM instances if needed)
- [ ] Applications/endpoints isolated into separate pools
- [ ] Per-pool resource limits prevent noisy-neighbor issues
- [ ] Resource spike in one pool does not affect others
- [ ] Separate monitoring and logging per pool
- [ ] Configuration documented with isolation rationale
- [ ] Applications/endpoints grouped by isolation requirements
- [ ] Per-pool configuration files created
- [ ] Per-pool pm.max_children set within resource budget
- [ ] Separate listen sockets configured
- [ ] Separate slow logs per pool
- [ ] Web server routes traffic to correct pool
- [ ] Isolation verified (resource spike in one pool does not affect others)
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always use per-tenant pools in multi-tenant environments**: A single shared pool means one tenant's traffic spike can exhaust all workers, causing downtime for all tenants.
- [ ] **Budget total workers across pools**: Sum of all pool max_children must not exceed server capacity. Over-allocation defeats isolation.
- [ ] **Consider separate FPM instances for OpCache isolation**: OpCache memory is shared across pools within one FPM instance. For strong isolation, run separate FPM instances with separate OpCache.
- [ ] **Monitor per-pool status**: Each pool has its own status page. Monitor listen queue and max_children_reached per pool.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: One pool for all tenants
- [ ] Avoid: Over-allocating total workers
- [ ] Avoid: Ignoring OpCache sharing
- [ ] Avoid: Not monitoring per-pool
- [ ] Avoid anti-pattern: **Single pool for all tenants**: The default configuration is a shared pool. This is acceptable for single-tenant apps but dangerous for multi-tenant environments.
- [ ] Avoid anti-pattern: **Setting per-pool budgets without total budget**: The sum of per-pool max_children must fit within available RAM. Over-allocation defeats the purpose of isolation.
- [ ] Avoid anti-pattern: **Assuming pool isolation includes OpCache**: OpCache is shared across pools in a single FPM instance. Worker isolation â‰  data isolation.
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
**Core Concepts:** **Pool configuration**: Each pool has its own `.conf` file in `/etc/php/*/fpm/pool.d/`. Separate Unix sockets, separate `pm.*` settings, separate slow logs, separate status pages., **Per-tenant budgeting**: `pool_1.max_children = 20`, `pool_2.max_children = 10`. Total allocated children = total server capacity / safety margin. Over-allocation defeats isolation., **Shared memory**: OpCache memory is shared across all pools. A tenant filling OpCache affects all other tenants. Consider separate FPM instances with separate OpCache for strong isolation., **Listen queue per pool**: Each pool has its own listen queue. Tenant A's queue buildup does not affect Tenant B's queue.
**Skills:** FPM Process Manager Mode Selection, Capacity Planning and Safety Margins, FPM Status Page Monitoring
**Decision Trees:** Single vs multiple FPM pools
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** Pool Sizing Formula, FPM Status Page Monitoring, FPM Process Manager Modes, Capacity Planning Safety Margins, PM Max Children P95 Calculation

