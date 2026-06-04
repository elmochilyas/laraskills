# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** JIT Compilation
**Knowledge Unit:** JIT Buffer Sizing Guidelines â€” 64MB-256MB Range and Fragmentation Management
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Start with 128MB**: This covers most applications. Only increase if monitoring shows >80% utilization.
- [ ] **Monitor utilization in first week**: Check jit_buffer_free daily. If it drops below 20% over 24h, increase buffer.
- [ ] **Use 256MB for large codebases**: Applications with >500K PHP LOC or those using aggressive inlining (O=4,5) benefit from larger buffers.
- [ ] **Account for fragmentation**: Monitoring buffer_free underestimates usable space due to fragmentation. If buffer_free is low but no eviction is happening, fragmentation is likely the issue.
- [ ] **Balance with OpCache memory**: JIT buffer + OpCache memory_consumption + interned_strings_buffer must fit within available RAM. Don't oversize one at the expense of others.
- [ ] Initial buffer size set (128MB or 256MB for large apps)
- [ ] Utilization monitored (jit_buffer_free > 20%)
- [ ] Compaction count checked for fragmentation issues
- [ ] Eviction rate monitored (should be near zero at steady state)
- [ ] Buffer size balanced with OpCache memory_consumption
- [ ] JIT buffer utilization maintained between 20-80% free
- [ ] No compilation thrashing observed (stable CPU, consistent JIT compilation count)
- [ ] Buffer size justified by utilization data
- [ ] Virtual memory allocation appropriate for the environment
- [ ] Current buffer utilization measured and documented
- [ ] Buffer size increased if free <20% (or decreased if free >50%)
- [ ] Buffer utilization re-checked after 24 hours of production traffic
- [ ] No compilation thrashing symptoms (CPU spikes, high JIT compilation count)
- [ ] Buffer sizing rationale documented
- [ ] **Enable JIT gradually**: Start with opcache.jit=1255 (tracing, default optimization) and 128MB buffer. Monitor for increased memory and compilation pauses.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Tracing vs Function JIT**: Tracing JIT optimizes hot loop paths, ideal for templating, data processing, and iterative algorithms. Function JIT optimizes entire functions, better for method-heavy code with predictable call patterns (ORMs, domain logic). When memory is constrained, Function JIT produces less fragmentation.
- [ ] **JIT buffer sizing**: 64MB minimum, 128MB default, 256MB for large applications. Buffer too small causes frequent compilation of the same hot paths. Buffer too large wastes virtual memory (not physical until used). Monitor jit_buffer_size and jit_buffer_free via opcache_get_status().
- [ ] **Buffer Layout**: Header metadata + profiling counters + compiled code segments + free space. Allocated from a single mmap()/VirtualAlloc() call.
- [ ] **Fragmentation Types**: External (gaps between segments) and internal (unused space within segments). External fragmentation is the primary concern.
- [ ] **Eviction Strategy**: When no free segment can accommodate a new compilation, the oldest compiled code is evicted (LRU-like). Fragmentation accelerates eviction.
- [ ] **Buffer Compaction (PHP 8.4+)**: Rearranges compiled code to consolidate free space. Triggered when free space < 20% of total buffer.
- [ ] Document and follow through on architectural decision: JIT buffer size selection
- [ ] Document and follow through on architectural decision: When to increase buffer size
- [ ] Ensure architecture aligns with core concept: **Buffer Allocation**: Contiguous memory segment at JIT initialization. Cannot be resized at runtime â€” requires PHP-FPM restart.
- [ ] Ensure architecture aligns with core concept: **Buffer Utilization**: Monitor via opcache_get_status()['jit']['buffer_size'] and buffer_free.
- [ ] Ensure architecture aligns with core concept: **Fragmentation**: Native code segments of varying sizes cause fragmentation over long-running processes. More severe with Function JIT than Tracing JIT.
- [ ] Ensure architecture aligns with core concept: **Buffer Overflow**: When full, oldest compiled code is evicted (LRU-like). Recompilation on next hot-path triggers, negating JIT benefits.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Start with 128MB**: This covers most applications. Only increase if monitoring shows >80% utilization.
- [ ] **Monitor utilization in first week**: Check jit_buffer_free daily. If it drops below 20% over 24h, increase buffer.
- [ ] **Use 256MB for large codebases**: Applications with >500K PHP LOC or those using aggressive inlining (O=4,5) benefit from larger buffers.
- [ ] **Account for fragmentation**: Monitoring buffer_free underestimates usable space due to fragmentation. If buffer_free is low but no eviction is happening, fragmentation is likely the issue.
- [ ] **Balance with OpCache memory**: JIT buffer + OpCache memory_consumption + interned_strings_buffer must fit within available RAM. Don't oversize one at the expense of others.
- [ ] Check current JIT buffer utilization: `$status = opcache_get_status(false)['jit']; $freePercent = $status['buffer_free'] / $status['buffer_size'] * 100;`
- [ ] If free percent >20%, the current buffer size is adequate â€” no change needed
- [ ] If free percent <20%, increase jit_buffer_size by 50% (e.g., 128MB -> 192MB) and restart PHP-FPM
- [ ] For initial configuration: start with 128MB for most applications, 256MB for large applications (20K+ files)
- [ ] For containerized environments: 64MB minimum, monitor after deployment
- [ ] After changing buffer size, monitor utilization over 24 hours of production traffic
- [ ] If free percent is consistently >50% after monitoring, consider reducing buffer size to save virtual memory
- [ ] Document the final buffer size and the utilization data that justifies it

# Performance Checklist (from 04/06)
- [ ] 64MB minimum, 128MB default, 256MB recommended for large applications
- [ ] Buffer too small: compilation thrashing, JIT benefit diminished
- [ ] Buffer too large: wastes virtual memory (not physical until used)
- [ ] Fragmentation reduces effective buffer capacity by 15-30% over 24h in Function JIT mode
- [ ] Tracing JIT fragments 40-50% less than Function JIT
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
- [ ] Initial buffer size set (128MB or 256MB for large apps)
- [ ] Utilization monitored (jit_buffer_free > 20%)
- [ ] Compaction count checked for fragmentation issues
- [ ] Eviction rate monitored (should be near zero at steady state)
- [ ] Buffer size balanced with OpCache memory_consumption
- [ ] Restart planned if buffer size needs adjustment
- [ ] JIT buffer utilization maintained between 20-80% free
- [ ] No compilation thrashing observed (stable CPU, consistent JIT compilation count)
- [ ] Buffer size justified by utilization data
- [ ] Virtual memory allocation appropriate for the environment
- [ ] Current buffer utilization measured and documented
- [ ] Buffer size increased if free <20% (or decreased if free >50%)
- [ ] Buffer utilization re-checked after 24 hours of production traffic
- [ ] No compilation thrashing symptoms (CPU spikes, high JIT compilation count)
- [ ] Buffer sizing rationale documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Start with 128MB**: This covers most applications. Only increase if monitoring shows >80% utilization.
- [ ] **Monitor utilization in first week**: Check jit_buffer_free daily. If it drops below 20% over 24h, increase buffer.
- [ ] **Use 256MB for large codebases**: Applications with >500K PHP LOC or those using aggressive inlining (O=4,5) benefit from larger buffers.
- [ ] **Account for fragmentation**: Monitoring buffer_free underestimates usable space due to fragmentation. If buffer_free is low but no eviction is happening, fragmentation is likely the issue.
- [ ] **Balance with OpCache memory**: JIT buffer + OpCache memory_consumption + interned_strings_buffer must fit within available RAM. Don't oversize one at the expense of others.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Undersized buffer
- [ ] Avoid: Oversized buffer for small app
- [ ] Avoid: Not accounting for fragmentation
- [ ] Avoid: Function JIT with 64MB buffer
- [ ] Avoid anti-pattern: **Resizing buffer without restart**: JIT buffer is allocated at startup. Changes require PHP-FPM restart. Plan changes during maintenance windows.
- [ ] Avoid anti-pattern: **Setting buffer to 1GB unnecessarily**: Huge buffers waste address space. Physical memory is allocated on demand, but virtual address space can be constrained in 32-bit environments.
- [ ] Avoid anti-pattern: **Ignoring fragmentation in long-running processes**: Over hours/days, fragmentation reduces effective capacity. Monitor compaction count and eviction rate.
- [ ] Guard against anti-pattern: Undersized Buffer Causing Compilation Thrashing
- [ ] Guard against anti-pattern: Not Monitoring Buffer Utilization After Deployment
- [ ] Guard against anti-pattern: Ignoring Fragmentation in Effective Capacity Planning
- [ ] Guard against anti-pattern: Function JIT with Minimum Buffer (64MB)
- [ ] Guard against anti-pattern: Resizing Buffer Without PHP-FPM Restart
- [ ] Buffer utilization monitored
- [ ] buffer_free > 20% at steady state

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
**Core Concepts:** **Buffer Allocation**: Contiguous memory segment at JIT initialization. Cannot be resized at runtime â€” requires PHP-FPM restart., **Buffer Utilization**: Monitor via opcache_get_status()['jit']['buffer_size'] and buffer_free., **Fragmentation**: Native code segments of varying sizes cause fragmentation over long-running processes. More severe with Function JIT than Tracing JIT., **Buffer Overflow**: When full, oldest compiled code is evicted (LRU-like). Recompilation on next hot-path triggers, negating JIT benefits.
**Skills:** JIT Configuration for Production, JIT Memory Layout and Fragmentation, OpCache Memory Sizing
**Decision Trees:** JIT buffer size selection, When to increase buffer size
**Anti-Patterns:** Undersized Buffer Causing Compilation Thrashing, Not Monitoring Buffer Utilization After Deployment, Ignoring Fragmentation in Effective Capacity Planning, Function JIT with Minimum Buffer (64MB), Resizing Buffer Without PHP-FPM Restart
**Related Topics:** JIT Configuration for Production, JIT Memory Layout and Fragmentation, JIT Mode Comparison, OpCache Memory Consumption

