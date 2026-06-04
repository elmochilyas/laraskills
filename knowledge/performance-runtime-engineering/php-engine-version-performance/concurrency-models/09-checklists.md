# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** Concurrency Models â€” Process, Thread, Coroutine, Goroutine
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Match model to workload**: Process for isolation, threads for moderate concurrency, coroutines for I/O-heavy, goroutines for throughput.
- [ ] **Consider team expertise**: Process-based (FPM) is universally understood. Coroutine-based (Swoole) requires async programming knowledge.
- [ ] **Measure overhead per concurrent unit**: Process: 30-80MB each. Thread: 10-20MB each. Coroutine: ~2KB each. Goroutine: ~4KB each.
- [ ] Concurrency model matched to workload characteristics (CPU vs I/O bound)
- [ ] Team has expertise to operate the chosen model
- [ ] Memory budget calculated for chosen concurrency model
- [ ] Isolation requirements satisfied by chosen model
- [ ] Benchmark validates model choice for specific workload
- [ ] Concurrency model matches workload I/O profile
- [ ] 24-hour soak test passes with stable RSS and no degradation
- [ ] Throughput improvement over PHP-FPM measured and meets expectations
- [ ] Team trained and deployment pipeline configured for chosen runtime
- [ ] I/O wait percentage measured and documented
- [ ] Throughput and latency requirements defined
- [ ] Candidate runtime(s) benchmarked with production workload
- [ ] 24-hour soak test completed with no memory leaks or degradation
- [ ] Rollback plan documented (parallel FPM deployment)
- [ ] Team trained on runtime operations and troubleshooting
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] Document and follow through on architectural decision: Which concurrency model to select
- [ ] Document and follow through on architectural decision: Coroutine-based vs process-based for workload
- [ ] Ensure architecture aligns with core concept: **Process-based (FPM)**: Each request in a separate OS process. Maximum isolation, highest memory overhead (~30-80MB per worker). No shared state between requests.
- [ ] Ensure architecture aligns with core concept: **Thread-based (FrankenPHP)**: Multiple threads within a single process sharing OpCache and allocated memory. ZTS (Zend Thread Safety) required. Lower per-thread overhead (~10-20MB).
- [ ] Ensure architecture aligns with core concept: **Coroutine-based (Swoole)**: Multiple coroutines within a single OS thread. Cooperative scheduling (coroutines yield on I/O). Near-zero context switch overhead. ~1M+ coroutines on 1GB RAM.
- [ ] Ensure architecture aligns with core concept: **Goroutine-based (RoadRunner)**: Go runtime manages goroutines (lightweight threads). PHP workers receive requests via Goridge binary protocol. Combines Go scheduler efficiency with standard PHP workers.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Match model to workload**: Process for isolation, threads for moderate concurrency, coroutines for I/O-heavy, goroutines for throughput.
- [ ] **Consider team expertise**: Process-based (FPM) is universally understood. Coroutine-based (Swoole) requires async programming knowledge.
- [ ] **Measure overhead per concurrent unit**: Process: 30-80MB each. Thread: 10-20MB each. Coroutine: ~2KB each. Goroutine: ~4KB each.
- [ ] Measure the application's I/O wait percentage â€” profile with Blackfire or Tideways to determine PHP execution vs I/O time
- [ ] If I/O wait <30% of wall time and throughput requirement <1000 RPS, stay with PHP-FPM (process-per-request is simplest)
- [ ] If I/O wait >30% or throughput requirement >1000 RPS, evaluate memory-resident models
- [ ] For high-latency I/O (database queries >50ms, external API calls), select Swoole (coroutine-based, auto-hooks PDO/MySQLi/Redis/cURL)
- [ ] For mixed I/O with moderate latency, select RoadRunner (goroutine scheduler + PHP workers, no PHP extension required)
- [ ] For maximum operational simplicity (single binary, HTTP/3, automatic HTTPS), select FrankenPHP (thread-based, Caddy module)
- [ ] For Laravel applications, select RoadRunner as default (best Octane integration) unless specific I/O profile dictates otherwise
- [ ] Validate selection with a 24-hour soak test under production-representative traffic
- [ ] Document concurrency model, worker count, connection pooling, and expected throughput

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] Process-based provides hardware-level isolation â€” a crash in one worker never affects others
- [ ] Thread-based shares memory within a process â€” one thread can corrupt shared state
- [ ] Coroutine-based shares everything within a thread â€” a memory corruption affects all coroutines
- [ ] Goroutine-based isolates PHP workers as separate processes â€” Go runtime handles scheduling safely

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] Concurrency model matched to workload characteristics (CPU vs I/O bound)
- [ ] Team has expertise to operate the chosen model
- [ ] Memory budget calculated for chosen concurrency model
- [ ] Isolation requirements satisfied by chosen model
- [ ] Benchmark validates model choice for specific workload
- [ ] State management implications understood for memory-resident models
- [ ] Concurrency model matches workload I/O profile
- [ ] 24-hour soak test passes with stable RSS and no degradation
- [ ] Throughput improvement over PHP-FPM measured and meets expectations
- [ ] Team trained and deployment pipeline configured for chosen runtime
- [ ] I/O wait percentage measured and documented
- [ ] Throughput and latency requirements defined
- [ ] Candidate runtime(s) benchmarked with production workload
- [ ] 24-hour soak test completed with no memory leaks or degradation
- [ ] Rollback plan documented (parallel FPM deployment)
- [ ] Team trained on runtime operations and troubleshooting

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Match model to workload**: Process for isolation, threads for moderate concurrency, coroutines for I/O-heavy, goroutines for throughput.
- [ ] **Consider team expertise**: Process-based (FPM) is universally understood. Coroutine-based (Swoole) requires async programming knowledge.
- [ ] **Measure overhead per concurrent unit**: Process: 30-80MB each. Thread: 10-20MB each. Coroutine: ~2KB each. Goroutine: ~4KB each.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using FPM for sub-50ms APIs
- [ ] Avoid: Using Swoole for fast queries
- [ ] Avoid: Not isolating tenants with FPM
- [ ] Avoid: ZTS not enabled for FrankenPHP
- [ ] Avoid anti-pattern: **Using coroutines for CPU-bound work**: Coroutines don't parallelize CPU-bound code within a thread. Use multiple processes or threads for CPU parallelism.
- [ ] Avoid anti-pattern: **Assuming "more workers = more throughput"**: Beyond the optimal point, additional workers increase context switching and memory pressure without throughput gain.
- [ ] Avoid anti-pattern: **Ignoring state management in memory-resident models**: Static properties and singletons persist across requests. Audit all global state when migrating from FPM.
- [ ] Guard against anti-pattern: Treating All Concurrency Models as Equivalent
- [ ] Guard against anti-pattern: Using Process-Based Concurrency for I/O-Bound Workloads
- [ ] Guard against anti-pattern: Ignoring Shared State Mutability in Coroutine Models
- [ ] Guard against anti-pattern: Assuming More Workers Always Increases Throughput
- [ ] Guard against anti-pattern: Blocking the Event Loop in Async Runtimes
- [ ] Concurrency model choice documented with rationale
- [ ] Workload profile (CPU/I/O ratio) informs model selection

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Process-based (FPM)**: Each request in a separate OS process. Maximum isolation, highest memory overhead (~30-80MB per worker). No shared state between requests., **Thread-based (FrankenPHP)**: Multiple threads within a single process sharing OpCache and allocated memory. ZTS (Zend Thread Safety) required. Lower per-thread overhead (~10-20MB)., **Coroutine-based (Swoole)**: Multiple coroutines within a single OS thread. Cooperative scheduling (coroutines yield on I/O). Near-zero context switch overhead. ~1M+ coroutines on 1GB RAM., **Goroutine-based (RoadRunner)**: Go runtime manages goroutines (lightweight threads). PHP workers receive requests via Goridge binary protocol. Combines Go scheduler efficiency with standard PHP workers.
**Rules:**
- General: Ensure ZTS Build for Thread-Based Runtimes
**Skills:** Runtime Selection Decision Tree, Octane Architecture and Execution Model, PHP-FPM Process Manager Mode Selection
**Decision Trees:** Which concurrency model to select, Coroutine-based vs process-based for workload
**Anti-Patterns:** Treating All Concurrency Models as Equivalent, Using Process-Based Concurrency for I/O-Bound Workloads, Ignoring Shared State Mutability in Coroutine Models, Assuming More Workers Always Increases Throughput, Blocking the Event Loop in Async Runtimes
**Related Topics:** Shared-Nothing Architecture, Memory-Resident Architecture, PHP-FPM Process Manager Modes, Swoole Architecture, FrankenPHP Worker Mode, RoadRunner Architecture

