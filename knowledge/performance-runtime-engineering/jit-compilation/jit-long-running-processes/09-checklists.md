# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Compilation for Long-Running Processes â€” Code Caching and Compilation Latency Amortization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Pre-warm JIT**: Execute representative requests after worker start but before accepting traffic. Triggers JIT compilation of hot paths, reducing cold-start latency variance.
- [ ] **Lower hot-path thresholds**: In long-running processes, lower jit_hot_func and jit_hot_loop to accelerate warm-up. The compilation cost is a one-time investment amortized over thousands of requests.
- [ ] **Monitor buffer fragmentation**: In long-running processes, fragmentation reduces effective capacity. Monitor compaction count and eviction rate. Increase buffer if fragmentation is high.
- [ ] **Use Tracing JIT for less fragmentation**: Tracing JIT fragments 40-50% less than Function JIT. For processes running 24h+, tracing is preferred.
- [ ] **Schedule periodic worker recycling**: Even in long-running processes, occasional recycling (every 5000-10000 requests) prevents fragmentation from degrading performance.
- [ ] Pre-warming configured for long-running workers
- [ ] JIT thresholds adjusted for persistent processes
- [ ] Tracing JIT used for 24h+ processes
- [ ] Buffer fragmentation monitored over process lifetime
- [ ] Compaction count tracked for fragmentation pressure
- [ ] Pre-warming configured and verified to reduce cold-start latency
- [ ] Latency delta between cold-start and steady-state <10%
- [ ] max_requests set appropriately for JIT amortization
- [ ] Pre-warm endpoints documented and maintained
- [ ] JIT buffer utilization stays within acceptable range
- [ ] Cold-start vs steady-state latency measured
- [ ] Pre-warming implemented using per-worker initialization hook
- [ ] Pre-warm endpoints cover critical application paths
- [ ] max_requests configured appropriately (500-1000)
- [ ] JIT buffer utilization monitored after warmup

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **JIT in Octane**: Octane workers persist across requests. JIT buffer persists within each worker. JIT compilation cost is incurred once per worker per function. After warm-up, all hot code runs compiled.
- [ ] **JIT in FrankenPHP**: Threads within a FrankenPHP process share the same OpCache and JIT buffer. JIT compilation in one thread benefits all threads.
- [ ] **JIT in PHP-FPM**: Each worker has independent JIT buffer. Worker recycling (pm.max_requests) periodically resets the buffer. JIT warm-up is repeated for each worker.
- [ ] **Fragmentation Management**: PHP 8.4+ buffer compaction rearranges compiled code to consolidate free space. Triggered when free space < 20%.
- [ ] Document and follow through on architectural decision: JIT strategy for long-running workers
- [ ] Document and follow through on architectural decision: Pre-warming strategy for JIT
- [ ] Ensure architecture aligns with core concept: **Compilation Amortization**: In PHP-FPM with pm.max_requests=500, JIT compilation cost is spread across at most 500 requests per worker. In Octane, it's spread across 5000-10000+ requests.
- [ ] Ensure architecture aligns with core concept: **JIT Buffer Persistence**: In PHP-FPM, each worker has its own JIT buffer when using separate processes. In FrankenPHP, threads share a single JIT buffer within the process.
- [ ] Ensure architecture aligns with core concept: **Warm-Up Time**: JIT compilation happens on first encounter of hot code. Workers need ~100-500 requests before JIT reaches steady-state performance.
- [ ] Ensure architecture aligns with core concept: **Memory Fragmentation Over Time**: Long-running processes accumulate compiled code fragments. PHP 8.4+ improved buffer compaction to reduce fragmentation.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Pre-warm JIT**: Execute representative requests after worker start but before accepting traffic. Triggers JIT compilation of hot paths, reducing cold-start latency variance.
- [ ] **Lower hot-path thresholds**: In long-running processes, lower jit_hot_func and jit_hot_loop to accelerate warm-up. The compilation cost is a one-time investment amortized over thousands of requests.
- [ ] **Monitor buffer fragmentation**: In long-running processes, fragmentation reduces effective capacity. Monitor compaction count and eviction rate. Increase buffer if fragmentation is high.
- [ ] **Use Tracing JIT for less fragmentation**: Tracing JIT fragments 40-50% less than Function JIT. For processes running 24h+, tracing is preferred.
- [ ] **Schedule periodic worker recycling**: Even in long-running processes, occasional recycling (every 5000-10000 requests) prevents fragmentation from degrading performance.
- [ ] Measure cold-start latency: time the first 10 requests on a fresh worker vs requests 500-510 on a warm worker
- [ ] If cold-start latency is >20% higher than steady-state, JIT pre-warming is needed
- [ ] Create a pre-warm endpoint list: 3-5 endpoints covering critical application paths
- [ ] Implement pre-warming in the worker boot sequence using Octane::booted() or equivalent
- [ ] For Octane: add `Octane::booted(function () { /* hit warmup endpoints */ })` in AppServiceProvider
- [ ] For Swoole: use `onWorkerStart` callback to execute warmup requests
- [ ] For RoadRunner: implement a warmup plugin or execute requests in the worker initialization
- [ ] Configure max_requests to balance JIT amortization with memory safety (500-1000 for most applications)
- [ ] Benchmark: compare cold-start latency with and without pre-warming
- [ ] Document the pre-warming configuration and its measured impact

# Performance Checklist (from 04/06)
- [ ] JIT benefit amplifies in long-running workers: 3-8% additional gain over FPM+JIT for CPU-heavy endpoints
- [ ] JIT compilation overhead (~1-5% of total CPU) is negligible in long-running processes
- [ ] Buffer fragmentation reduces capacity by 15-30% over 24h in Function JIT mode
- [ ] Pre-warming reduces cold-start latency from ~100 requests to ~10 requests
- [ ] JIT enabled
- [ ] Tracing mode
- [ ] Function mode
- [ ] Large buffer (256MB)

# Security Checklist (from 04/06 - only if relevant)
- [ ] Review for security implications of implementation choices
- [ ] Validate input boundaries and type safety

# Reliability Checklist (from 04/05/06)
- [ ] **JIT buffer exhaustion**: Buffer utilization reaches 100%. Symptom: JIT compilation stalls, hot paths revert to interpreter. Mitigation: Increase jit_buffer_size, monitor jit_buffer_free.
- [ ] **Segfault on native code execution**: JIT produces incorrect native code (rare, fixed in updates). Symptom: PHP-FPM worker crashes with SIGSEGV. Mitigation: Disable JIT, upgrade PHP, file bug report.
- [ ] **Compilation pause spikes**: JIT compilation during request causes latency spikes. Symptom: Occasional p99 latency spikes (10-100ms). Mitigation: Use less aggressive JIT mode (1254 vs 1235), increase trigger thresholds.
- [ ] **Type guard failures**: Incorrect type guard elimination causes wrong computation results. Symptom: Silent data corruption in JIT-compiled code. Mitigation: Keep PHP updated, report as PHP bug.
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory Ã¢â‚¬â€ ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Testing Checklist (from 04/06)
- [ ] Pre-warming configured for long-running workers
- [ ] JIT thresholds adjusted for persistent processes
- [ ] Tracing JIT used for 24h+ processes
- [ ] Buffer fragmentation monitored over process lifetime
- [ ] Compaction count tracked for fragmentation pressure
- [ ] Worker recycling interval balanced (5000-10000 requests)
- [ ] JIT enabled on all queue/cron workers
- [ ] Pre-warming configured and verified to reduce cold-start latency
- [ ] Latency delta between cold-start and steady-state <10%
- [ ] max_requests set appropriately for JIT amortization
- [ ] Pre-warm endpoints documented and maintained
- [ ] JIT buffer utilization stays within acceptable range
- [ ] Cold-start vs steady-state latency measured
- [ ] Pre-warming implemented using per-worker initialization hook
- [ ] Pre-warm endpoints cover critical application paths
- [ ] max_requests configured appropriately (500-1000)
- [ ] JIT buffer utilization monitored after warmup
- [ ] Cold-start latency reduced compared to baseline
- [ ] Documentation created for pre-warming setup

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Pre-warm JIT**: Execute representative requests after worker start but before accepting traffic. Triggers JIT compilation of hot paths, reducing cold-start latency variance.
- [ ] **Lower hot-path thresholds**: In long-running processes, lower jit_hot_func and jit_hot_loop to accelerate warm-up. The compilation cost is a one-time investment amortized over thousands of requests.
- [ ] **Monitor buffer fragmentation**: In long-running processes, fragmentation reduces effective capacity. Monitor compaction count and eviction rate. Increase buffer if fragmentation is high.
- [ ] **Use Tracing JIT for less fragmentation**: Tracing JIT fragments 40-50% less than Function JIT. For processes running 24h+, tracing is preferred.
- [ ] **Schedule periodic worker recycling**: Even in long-running processes, occasional recycling (every 5000-10000 requests) prevents fragmentation from degrading performance.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not pre-warming JIT in Octane
- [ ] Avoid: Using same thresholds as FPM
- [ ] Avoid: Ignoring fragmentation over time
- [ ] Avoid: Function JIT in 24h+ processes
- [ ] Avoid anti-pattern: **Frequent worker recycling in Octane**: Recycling Octane workers every 100 requests defeats JIT warm-up. Use 5000-10000 max_requests for long-running workers.
- [ ] Avoid anti-pattern: **Assuming JIT doesn't benefit long-running processes**: JIT benefit amplifies in persistent workers due to amortization. It's MORE important, not less.
- [ ] Avoid anti-pattern: **Not monitoring buffer over process lifetime**: Fragmentation develops over hours. Monitor throughout, not just at startup.
- [ ] Guard against anti-pattern: Frequent Worker Recycling Defeating JIT Warm-Up
- [ ] Guard against anti-pattern: Not Pre-Warming JIT in Persistent Workers
- [ ] Guard against anti-pattern: Using Function JIT for 24h+ Processes
- [ ] Guard against anti-pattern: Same Hot-Path Thresholds as FPM for Long-Running Processes
- [ ] Guard against anti-pattern: Not Monitoring Fragmentation Over Full Process Lifetime
- [ ] max_requests > 5000 for long-running workers
- [ ] JIT compilation counts stabilize between recycling

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.
- [ ] **Warm-up period**: JIT requires 1000-10000 requests to reach peak performance. Generate production traffic after deploy before measuring JIT impact.
- [ ] **Memory commitment**: JIT buffer is committed as virtual memory Ã¢â‚¬â€ ensure swap is configured if buffer is large.
- [ ] **Monitoring**: Check opcache_get_status()['jit'] for uffer_size, uffer_free. If buffer utilization > 80%, increase jit_buffer_size.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Compilation Amortization**: In PHP-FPM with pm.max_requests=500, JIT compilation cost is spread across at most 500 requests per worker. In Octane, it's spread across 5000-10000+ requests., **JIT Buffer Persistence**: In PHP-FPM, each worker has its own JIT buffer when using separate processes. In FrankenPHP, threads share a single JIT buffer within the process., **Warm-Up Time**: JIT compilation happens on first encounter of hot code. Workers need ~100-500 requests before JIT reaches steady-state performance., **Memory Fragmentation Over Time**: Long-running processes accumulate compiled code fragments. PHP 8.4+ improved buffer compaction to reduce fragmentation.
**Skills:** Octane Architecture and Execution Model, Worker Configuration by Driver, JIT Configuration for Production
**Decision Trees:** JIT strategy for long-running workers, Pre-warming strategy for JIT
**Anti-Patterns:** Frequent Worker Recycling Defeating JIT Warm-Up, Not Pre-Warming JIT in Persistent Workers, Using Function JIT for 24h+ Processes, Same Hot-Path Thresholds as FPM for Long-Running Processes, Not Monitoring Fragmentation Over Full Process Lifetime
**Related Topics:** JIT Buffer Sizing Guidelines, JIT Memory Layout and Fragmentation, JIT Configuration for Production, Laravel Octane Performance


