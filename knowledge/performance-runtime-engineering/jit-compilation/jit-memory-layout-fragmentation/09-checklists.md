# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Memory Layout and Fragmentation â€” Buffer Allocation, Code Segment Reuse
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Monitor eviction rate**: When evictions occur, JIT benefit diminishes. Increase buffer size or reduce fragmentation if evictions are frequent.
- [ ] **Use Tracing JIT**: Tracing JIT fragments 40-50% less than Function JIT due to more uniform code segment sizes.
- [ ] **Check compaction count**: opcache_get_status()['jit']['compaction_count'] shows how often compaction runs. High frequency indicates fragmentation pressure.
- [ ] **Increase buffer if compaction is frequent**: Frequent compaction means the buffer is too small for the working set. Increase jit_buffer_size.
- [ ] **Plan for 24h+ behavior**: Fragmentation develops over hours. Monitor buffer state at startup, 1h, 6h, and 24h to understand the degradation curve.
- [ ] Fragmentation understood (external vs internal)
- [ ] Tracing JIT used for long-running processes
- [ ] Eviction rate monitored (should be near zero)
- [ ] Compaction count tracked over process lifetime
- [ ] Buffer_free interpreted with fragmentation overhead in mind
- [ ] JIT buffer fragmentation diagnosed and documented
- [ ] Mitigation strategy implemented (buffer increase, max_requests reduction, or threshold tuning)
- [ ] CPU trend flattened over 24-hour observation period
- [ ] Buffer free space stabilized above 20%
- [ ] JIT buffer fragmentation diagnosed (low free + low compiled count)
- [ ] max_requests adjusted to limit fragmentation accumulation
- [ ] Buffer size increased if needed
- [ ] Hot path thresholds adjusted if too many functions compiled
- [ ] Buffer metrics monitored for 24 hours after changes
- [ ] CPU trend flattened after mitigation

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **Buffer Layout**: Single contiguous mmap'd region. Header at base, profiling counters, then variable-length compiled code segments toward the high end. Free space is tracked via a free-list.
- [ ] **Fragmentation Mechanics**: Small segments are freed when code is evicted, creating gaps. New compilations must fit into a contiguous gap. If no gap is large enough, eviction is triggered even if total free space is adequate.
- [ ] **Compaction Algorithm (PHP 8.4+)**: Mark-compact: mark live compiled code, compact to one end of the buffer, update all references. Pauses execution for ~50-200Âµs during compaction.
- [ ] **Eviction Policy**: Evicted code is selected by LRU order. Frequently-executed hot functions are less likely to be evicted, but fragmentation can force eviction of hot code if gaps can't accommodate new compilations.
- [ ] Document and follow through on architectural decision: How to handle JIT buffer fragmentation
- [ ] Document and follow through on architectural decision: When to increase buffer vs switch JIT mode
- [ ] Ensure architecture aligns with core concept: **Buffer Layout**: Header metadata â†’ profiling counters â†’ compiled code segments â†’ free space. Allocated from a single mmap() or VirtualAlloc() call at JIT initialization.
- [ ] Ensure architecture aligns with core concept: **Code Segment Allocation**: Each compiled function/trace gets a variable-length segment. Tracing JIT produces more uniform segments; Function JIT produces widely varying sizes.
- [ ] Ensure architecture aligns with core concept: **Fragmentation Types**: External (gaps between segments) and internal (unused space within segments). External fragmentation is the primary concern.
- [ ] Ensure architecture aligns with core concept: **Eviction Strategy**: When no free segment can accommodate a new compilation, the oldest compiled code is evicted (LRU-like). Fragmentation accelerates eviction.
- [ ] Ensure architecture aligns with core concept: **Buffer Compaction (PHP 8.4+)**: Rearranges compiled code to consolidate free space. Triggered when free space < 20% of total buffer.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Monitor eviction rate**: When evictions occur, JIT benefit diminishes. Increase buffer size or reduce fragmentation if evictions are frequent.
- [ ] **Use Tracing JIT**: Tracing JIT fragments 40-50% less than Function JIT due to more uniform code segment sizes.
- [ ] **Check compaction count**: opcache_get_status()['jit']['compaction_count'] shows how often compaction runs. High frequency indicates fragmentation pressure.
- [ ] **Increase buffer if compaction is frequent**: Frequent compaction means the buffer is too small for the working set. Increase jit_buffer_size.
- [ ] **Plan for 24h+ behavior**: Fragmentation develops over hours. Monitor buffer state at startup, 1h, 6h, and 24h to understand the degradation curve.
- [ ] Check JIT buffer metrics: `$jit = opcache_get_status(false)['jit']` â€” examine buffer_size, buffer_free, and compiled_funcs
- [ ] If buffer_free is low (<20%) but compiled_funcs is also low (<500), fragmentation is likely â€” evicted functions leave gaps
- [ ] Monitor compiled_funcs over time: if it increases then plateaus while buffer_free continues decreasing, fragmentation is occurring
- [ ] Reduce max_requests to recycle workers before fragmentation becomes severe (e.g., from 2000 to 1000)
- [ ] Increase jit_buffer_size by 50-100% to provide more contiguous space â€” reduces fragmentation probability
- [ ] If the application has many rarely-called functions compiled by JIT, raise hot path thresholds (jit_hot_func, jit_hot_loop)
- [ ] After changes, monitor for 24 hours: verify buffer_free stabilizes and CPU does not increase over time
- [ ] Document the fragmentation issue and mitigation configuration

# Performance Checklist (from 04/06)
- [ ] Fragmentation reduces effective buffer capacity by 15-30% over 24h in Function JIT mode
- [ ] Tracing JIT fragments 40-50% less than Function JIT due to more uniform code sizes
- [ ] Buffer compaction pauses execution for ~50-200Âµs â€” negligible for web requests
- [ ] Eviction cost: recompilation of evicted code on next hot-path trigger (50-500Âµs)
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
- [ ] Fragmentation understood (external vs internal)
- [ ] Tracing JIT used for long-running processes
- [ ] Eviction rate monitored (should be near zero)
- [ ] Compaction count tracked over process lifetime
- [ ] Buffer_free interpreted with fragmentation overhead in mind
- [ ] PHP 8.4+ compaction enabled (default)
- [ ] Buffer size validated against 24h fragmentation behavior
- [ ] JIT buffer fragmentation diagnosed and documented
- [ ] Mitigation strategy implemented (buffer increase, max_requests reduction, or threshold tuning)
- [ ] CPU trend flattened over 24-hour observation period
- [ ] Buffer free space stabilized above 20%
- [ ] JIT buffer fragmentation diagnosed (low free + low compiled count)
- [ ] max_requests adjusted to limit fragmentation accumulation
- [ ] Buffer size increased if needed
- [ ] Hot path thresholds adjusted if too many functions compiled
- [ ] Buffer metrics monitored for 24 hours after changes
- [ ] CPU trend flattened after mitigation

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Monitor eviction rate**: When evictions occur, JIT benefit diminishes. Increase buffer size or reduce fragmentation if evictions are frequent.
- [ ] **Use Tracing JIT**: Tracing JIT fragments 40-50% less than Function JIT due to more uniform code segment sizes.
- [ ] **Check compaction count**: opcache_get_status()['jit']['compaction_count'] shows how often compaction runs. High frequency indicates fragmentation pressure.
- [ ] **Increase buffer if compaction is frequent**: Frequent compaction means the buffer is too small for the working set. Increase jit_buffer_size.
- [ ] **Plan for 24h+ behavior**: Fragmentation develops over hours. Monitor buffer state at startup, 1h, 6h, and 24h to understand the degradation curve.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Function JIT in 24h+ processes
- [ ] Avoid: Not monitoring evictions
- [ ] Avoid: Ignoring fragmentation in capacity planning
- [ ] Avoid: Oversized buffer for fragmentation mitigation
- [ ] Avoid anti-pattern: **Assuming buffer_free accurately reflects usable space**: Fragmentation creates unusable gaps between segments. buffer_free overestimates usable capacity.
- [ ] Avoid anti-pattern: **Disabling compaction**: PHP 8.4+ compaction is beneficial. Disabling it accelerates fragmentation-driven eviction.
- [ ] Avoid anti-pattern: **Setting huge buffer to avoid monitoring**: Large buffers delay but don't prevent fragmentation. Monitor regardless of buffer size.
- [ ] Guard against anti-pattern: Assuming buffer_free Accurately Reflects Usable Space
- [ ] Guard against anti-pattern: Disabling PHP 8.4+ Buffer Compaction
- [ ] Guard against anti-pattern: Setting Huge Buffer to Avoid Monitoring Fragmentation
- [ ] Guard against anti-pattern: Function JIT in Long-Running Processes
- [ ] Guard against anti-pattern: Not Monitoring Eviction Count as Primary Health Indicator
- [ ] Eviction count monitored as primary indicator
- [ ] Compaction count tracked

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
**Core Concepts:** **Buffer Layout**: Header metadata â†’ profiling counters â†’ compiled code segments â†’ free space. Allocated from a single mmap() or VirtualAlloc() call at JIT initialization., **Code Segment Allocation**: Each compiled function/trace gets a variable-length segment. Tracing JIT produces more uniform segments; Function JIT produces widely varying sizes., **Fragmentation Types**: External (gaps between segments) and internal (unused space within segments). External fragmentation is the primary concern., **Eviction Strategy**: When no free segment can accommodate a new compilation, the oldest compiled code is evicted (LRU-like). Fragmentation accelerates eviction., **Buffer Compaction (PHP 8.4+)**: Rearranges compiled code to consolidate free space. Triggered when free space < 20% of total buffer.
**Skills:** JIT Buffer Sizing Guidelines, JIT Configuration for Production, Worker Recycling and Max Requests Tuning
**Decision Trees:** How to handle JIT buffer fragmentation, When to increase buffer vs switch JIT mode
**Anti-Patterns:** Assuming buffer_free Accurately Reflects Usable Space, Disabling PHP 8.4+ Buffer Compaction, Setting Huge Buffer to Avoid Monitoring Fragmentation, Function JIT in Long-Running Processes, Not Monitoring Eviction Count as Primary Health Indicator
**Related Topics:** JIT Buffer Sizing Guidelines, JIT for Long-Running Processes, JIT Mode Comparison, JIT Configuration for Production

