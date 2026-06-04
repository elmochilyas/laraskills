# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** Persistent vs Per-Request Allocators â€” GC_IMMUTABLE, Interned Strings, Shared Memory
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Monitor interned strings buffer**: Use `opcache_get_status()['interned_strings_usage']`. If near capacity, increase `opcache.interned_strings_buffer`.
- [ ] **Prefer per-request for request-scoped data**: Use persistent allocator only for data that genuinely spans requests (config, class metadata, connection pools).
- [ ] **GC_IMMUTABLE awareness**: Interned strings are never freed during a request. Don't intern dynamic strings that vary per request.
- [ ] **Persistent resource cleanup**: In Octane, persistent database connections must not leak transaction state between requests.
- [ ] Per-request vs persistent allocator difference understood
- [ ] Interned strings buffer sized appropriately (monitor usage via opcache_get_status())
- [ ] No request-scoped data stored in persistent memory
- [ ] Persistent resource cleanup implemented for Octane workers
- [ ] Worker RSS monitoring includes both per-request and persistent memory
- [ ] Persistent vs per-request allocation understood for the runtime
- [ ] Preloading and interned strings configured with awareness of their persistent nature
- [ ] Octane memory management practices applied
- [ ] Allocation model documented for team reference
- [ ] Runtime model identified (FPM vs Octane vs CLI)
- [ ] Persistent allocation sources identified (preloading, interned strings, OpCache)
- [ ] Per-request vs persistent distinction understood
- [ ] Octane: scoped() bindings used, unset() applied for large data
- [ ] Persistent data confirmed independent of opcache_reset()
- [ ] Allocation model documented
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance Ã¢â‚¬â€ requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] **Allocation speed**: Per-request allocator: ~5-15ns. Persistent allocator: ~50-200ns (system malloc). Use per-request for allocations in hot paths.
- [ ] **Mass free efficiency**: Per-request allocator frees all memory at request end in O(1) â€” just reset the chunk pointer. Persistent allocator must individually free each allocation.
- [ ] **Interned string deduplication**: A string appearing in 1000 places uses memory once with interning. Without interning: 1000 copies.
- [ ] **Octane memory model**: Per-request allocator still used for request-scoped data. Persistent allocator holds bootstrap results (config, service container, compiled routes).
- [ ] Document and follow through on architectural decision: Shared-nothing vs persistent memory runtime
- [ ] Document and follow through on architectural decision: State management strategy for persistent runtimes
- [ ] Ensure architecture aligns with core concept: **Per-request allocator (Zend MM)**: Chunked allocator optimized for request lifecycle. All memory freed at once when request ends (no individual frees needed). Low overhead but memory is request-scoped.
- [ ] Ensure architecture aligns with core concept: **Persistent allocator**: Uses system malloc() or shared memory (mmap). Memory persists across requests. Used by interned strings, OpCache, persistent resources (database connections in FrankenPHP/Swoole).
- [ ] Ensure architecture aligns with core concept: **GC_IMMUTABLE flag**: Marks a zend_refcounted value as never-to-be-freed. Used for interned strings â€” avoids unnecessary refcounting overhead. Set once at creation, never cleared.
- [ ] Ensure architecture aligns with core concept: **GC_PERSISTENT flag**: Marks an allocation as persistent (outside per-request heap). GC skips these during cycle collection â€” they cannot be freed per-request.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Monitor interned strings buffer**: Use `opcache_get_status()['interned_strings_usage']`. If near capacity, increase `opcache.interned_strings_buffer`.
- [ ] **Prefer per-request for request-scoped data**: Use persistent allocator only for data that genuinely spans requests (config, class metadata, connection pools).
- [ ] **GC_IMMUTABLE awareness**: Interned strings are never freed during a request. Don't intern dynamic strings that vary per request.
- [ ] **Persistent resource cleanup**: In Octane, persistent database connections must not leak transaction state between requests.
- [ ] Identify the runtime model: PHP-FPM (per-request heap), Octane (persistent heap with sandbox), CLI (single heap)
- [ ] For PHP-FPM: memory allocated during a request is freed automatically when the request ends â€” no manual cleanup needed
- [ ] For Octane: memory allocated on the persistent heap accumulates across requests â€” explicit unset() and worker recycling are required
- [ ] For preloaded classes: allocated with GC_PERSISTENT flag â€” never freed, survive opcache_reset()
- [ ] For interned strings: allocated with GC_IMMUTABLE flag â€” stored in shared interned strings table, never freed
- [ ] For OpCache shared memory: allocated at PHP-FPM startup â€” persists across all requests, never released
- [ ] For per-request data in Octane: ensure services use scoped() bindings (new instance per request), not singleton()
- [ ] Document the allocation model relevant to the runtime and its memory management implications

# Performance Checklist (from 04/06)
- [ ] Per-request allocator: Allocation in ~5-15ns. Mass free at request end: O(1) â€” just reset chunk pointer.
- [ ] Persistent allocator: Allocation in ~50-200ns (system malloc). Must be individually freed. Higher fragmentation.
- [ ] Interned string deduplication: PHP interned strings stored once â€” string appearing in 1000 places uses memory once. Without interning: 1000 copies.
- [ ] GC_IMMUTABLE eliminates refcounting overhead for interned strings â€” significant for frequently accessed strings.
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] Persistent memory in Octane can retain sensitive data across requests if not properly cleared
- [ ] Interned strings containing secrets (API keys, passwords) persist in shared memory â€” avoid interning sensitive values
- [ ] Multi-tenant Octane: one tenant's interned string allocations affect shared buffer capacity

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] Per-request vs persistent allocator difference understood
- [ ] Interned strings buffer sized appropriately (monitor usage via opcache_get_status())
- [ ] No request-scoped data stored in persistent memory
- [ ] Persistent resource cleanup implemented for Octane workers
- [ ] Worker RSS monitoring includes both per-request and persistent memory
- [ ] No sensitive data in interned strings (API keys, secrets)
- [ ] Persistent vs per-request allocation understood for the runtime
- [ ] Preloading and interned strings configured with awareness of their persistent nature
- [ ] Octane memory management practices applied
- [ ] Allocation model documented for team reference
- [ ] Runtime model identified (FPM vs Octane vs CLI)
- [ ] Persistent allocation sources identified (preloading, interned strings, OpCache)
- [ ] Per-request vs persistent distinction understood
- [ ] Octane: scoped() bindings used, unset() applied for large data
- [ ] Persistent data confirmed independent of opcache_reset()
- [ ] Allocation model documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Monitor interned strings buffer**: Use `opcache_get_status()['interned_strings_usage']`. If near capacity, increase `opcache.interned_strings_buffer`.
- [ ] **Prefer per-request for request-scoped data**: Use persistent allocator only for data that genuinely spans requests (config, class metadata, connection pools).
- [ ] **GC_IMMUTABLE awareness**: Interned strings are never freed during a request. Don't intern dynamic strings that vary per request.
- [ ] **Persistent resource cleanup**: In Octane, persistent database connections must not leak transaction state between requests.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming all memory is freed per-request
- [ ] Avoid: Interning dynamic strings
- [ ] Avoid: Using persistent allocator for request-scoped data
- [ ] Avoid: Not cleaning persistent resources
- [ ] Avoid anti-pattern: **Storing request-scoped data in persistent memory**: Causes state leaks between requests. Use per-request allocator.
- [ ] Avoid anti-pattern: **Over-interned strings buffer**: Allocating 64MB+ when only 10MB needed wastes shared memory. Monitor actual usage.
- [ ] Avoid anti-pattern: **Ignoring persistent memory in capacity planning**: Worker RSS includes both per-request and persistent allocations. Monitor total RSS, not just per-request peak.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste
- [ ] Hot-path data uses scalars
- [ ] No unnecessary string allocations in loops

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Per-request allocator (Zend MM)**: Chunked allocator optimized for request lifecycle. All memory freed at once when request ends (no individual frees needed). Low overhead but memory is request-scoped., **Persistent allocator**: Uses system malloc() or shared memory (mmap). Memory persists across requests. Used by interned strings, OpCache, persistent resources (database connections in FrankenPHP/Swoole)., **GC_IMMUTABLE flag**: Marks a zend_refcounted value as never-to-be-freed. Used for interned strings â€” avoids unnecessary refcounting overhead. Set once at creation, never cleared., **GC_PERSISTENT flag**: Marks an allocation as persistent (outside per-request heap). GC skips these during cycle collection â€” they cannot be freed per-request.
**Rules:**
- General: Account for Persistent Memory in Capacity Planning
**Skills:** PHP Memory Model, Octane Memory Management, Preloading Script Design Patterns, OpCache Configuration Overview
**Decision Trees:** Shared-nothing vs persistent memory runtime, State management strategy for persistent runtimes
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** Zend Memory Manager Chunked Allocator, Zval Structure and Reference Counting, OpCache Memory Sizing, Interned Strings Configuration

