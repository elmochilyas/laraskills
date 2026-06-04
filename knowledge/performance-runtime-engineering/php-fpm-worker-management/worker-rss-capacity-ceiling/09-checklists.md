# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Worker RSS and pm.max_children Jointly Determine Server Capacity Ceiling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **RAM is the typical bottleneck**: CPU-bound workloads are rare in PHP web apps. Most deployments are RAM-constrained by worker count.
- [ ] **Measure actual RSS, don't guess**: Worker RSS varies by application, framework, and even specific request paths. Always measure under realistic load.
- [ ] **The optimal point is below the ceiling**: Don't set max_children to the absolute maximum. Leave 15%+ RAM free for OS page cache and unexpected spikes.
- [ ] **Monitor to find the optimal point**: Start conservative, increase gradually while monitoring listen queue and free RAM.
- [ ] Worker RSS measured under realistic production load
- [ ] Capacity ceiling calculated from available RAM
- [ ] max_children set below the ceiling (10-20% headroom)
- [ ] CPU utilization monitored to check for context switching overhead
- [ ] FPM status page confirms listen queue stays at 0
- [ ] Capacity ceiling calculated and documented
- [ ] max_children set at 70% or below ceiling
- [ ] No swap activity at peak traffic
- [ ] Worker RSS monitored as percentage of ceiling
- [ ] Ceiling recalculated after any server or application changes
- [ ] Total RAM measured
- [ ] OS + services baseline measured
- [ ] Per-worker peak RSS measured
- [ ] Absolute ceiling calculated
- [ ] Safety margin applied (30% below ceiling)
- [ ] Ceiling documented with all inputs

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Scaling methodology**: Start with conservative max_children -> stress test -> monitor RSS and CPU -> increase until listen queue disappears or RAM hits 85% utilization -> back off 10% for safety margin.
- [ ] **The capacity ceiling is not the target**: The ceiling is the theoretical maximum. The optimal operating point is below the ceiling, balancing throughput and safety margin.
- [ ] Document and follow through on architectural decision: Worker RSS ceiling determination
- [ ] Ensure architecture aligns with core concept: **Capacity equation**: Concurrent request ceiling = min(CPU capacity, RAM capacity). RAM is typically the binding constraint.
- [ ] Ensure architecture aligns with core concept: **CPU vs RAM bound**: CPU-bound workloads saturate CPU before memory (workers idle less). I/O-bound workloads accumulate many waiting workers, consuming memory without using CPU.
- [ ] Ensure architecture aligns with core concept: **Worker RSS determination**: Average memory per worker under load. Varies by application complexity (50MB for simple sites, 120MB+ for large frameworks with heavy memory usage).
- [ ] Ensure architecture aligns with core concept: **Optimal max_children**: The highest value where: 1) RAM stays 15%+ free, 2) CPU is utilized but not saturated, 3) Listen queue stays at 0.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **RAM is the typical bottleneck**: CPU-bound workloads are rare in PHP web apps. Most deployments are RAM-constrained by worker count.
- [ ] **Measure actual RSS, don't guess**: Worker RSS varies by application, framework, and even specific request paths. Always measure under realistic load.
- [ ] **The optimal point is below the ceiling**: Don't set max_children to the absolute maximum. Leave 15%+ RAM free for OS page cache and unexpected spikes.
- [ ] **Monitor to find the optimal point**: Start conservative, increase gradually while monitoring listen queue and free RAM.
- [ ] Measure total server RAM: `cat /proc/meminfo | grep MemTotal` or `Get-WmiObject Win32_ComputerSystem | Select-Object TotalPhysicalMemory` (on Windows)
- [ ] Measure OS + services baseline memory: check free/available memory with zero PHP-FPM workers active
- [ ] Measure per-worker RSS at peak: capture RSS during a request that uses maximum memory
- [ ] Calculate available PHP memory: total_RAM - OS_services_baseline
- [ ] Calculate maximum workers: available_PHP_memory / peak_worker_RSS
- [ ] This is the absolute ceiling â€” do not configure max_children at this value
- [ ] Apply safety margin: ceiling Ã— 0.7 (30% below ceiling) for production
- [ ] Validate: if max_children Ã— peak_worker_RSS < available_PHP_memory Ã— 0.7, configuration is safe
- [ ] If swap is active at any point, reduce max_children or add RAM
- [ ] Document the ceiling calculation

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] OOM from over-provisioned workers can crash the entire server
- [ ] Swap usage from memory pressure severely degrades performance and can cause timeouts
- [ ] Proper capacity planning is a security control against resource exhaustion
- [ ] Worker RSS varies â€” monitor for unexpected increases (potential memory leak or attack)

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
- [ ] Worker RSS measured under realistic production load
- [ ] Capacity ceiling calculated from available RAM
- [ ] max_children set below the ceiling (10-20% headroom)
- [ ] CPU utilization monitored to check for context switching overhead
- [ ] FPM status page confirms listen queue stays at 0
- [ ] RAM stays 15%+ free under peak load
- [ ] Capacity reviewed quarterly
- [ ] Capacity ceiling calculated and documented
- [ ] max_children set at 70% or below ceiling
- [ ] No swap activity at peak traffic
- [ ] Worker RSS monitored as percentage of ceiling
- [ ] Ceiling recalculated after any server or application changes
- [ ] Total RAM measured
- [ ] OS + services baseline measured
- [ ] Per-worker peak RSS measured
- [ ] Absolute ceiling calculated
- [ ] Safety margin applied (30% below ceiling)
- [ ] Ceiling documented with all inputs

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **RAM is the typical bottleneck**: CPU-bound workloads are rare in PHP web apps. Most deployments are RAM-constrained by worker count.
- [ ] **Measure actual RSS, don't guess**: Worker RSS varies by application, framework, and even specific request paths. Always measure under realistic load.
- [ ] **The optimal point is below the ceiling**: Don't set max_children to the absolute maximum. Leave 15%+ RAM free for OS page cache and unexpected spikes.
- [ ] **Monitor to find the optimal point**: Start conservative, increase gradually while monitoring listen queue and free RAM.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting max_children too high
- [ ] Avoid: Ignoring context switching overhead
- [ ] Avoid: Not measuring RSS under load
- [ ] Avoid: Assuming ceiling = optimal
- [ ] Avoid anti-pattern: **Maximizing max_children**: The highest possible value is not the best value. Leave headroom for variance and OS needs.
- [ ] Avoid anti-pattern: **Setting max_children once and forgetting**: Worker RSS changes with code, data size, and traffic patterns. Review quarterly.
- [ ] Avoid anti-pattern: **Ignoring the CPU dimension**: RAM provides the ceiling, but CPU utilization determines the optimal operating point below that ceiling.
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
**Core Concepts:** **Capacity equation**: Concurrent request ceiling = min(CPU capacity, RAM capacity). RAM is typically the binding constraint., **CPU vs RAM bound**: CPU-bound workloads saturate CPU before memory (workers idle less). I/O-bound workloads accumulate many waiting workers, consuming memory without using CPU., **Worker RSS determination**: Average memory per worker under load. Varies by application complexity (50MB for simple sites, 120MB+ for large frameworks with heavy memory usage)., **Optimal max_children**: The highest value where: 1) RAM stays 15%+ free, 2) CPU is utilized but not saturated, 3) Listen queue stays at 0.
**Skills:** Capacity Planning and Safety Margins, Pool Sizing Formula Rationale, PM Max Children P95 Calculation
**Decision Trees:** Worker RSS ceiling determination
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** Pool Sizing Formula, PM Max Children P95 Calculation, CPU vs I/O Bound Worker Ratios, Capacity Planning Safety Margins, FPM Status Page Monitoring

