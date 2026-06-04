# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** Memory Leak Detection Patterns â€” Growing Static Collections, Closure Accumulation, Checkpointing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Memory leak triage**: 1) Check if baseline RSS increases over time, 2) Use `gc_collect_cycles()` to rule out cycle accumulation, 3) Profile with memory-focused tools (Blackfire, SPX), 4) Binary search: disable half the codebase, test, repeat.
- [ ] **Don't just recycle, fix the leak**: pm.max_requests masks leaks but doesn't fix them. At scale, constant worker recycling (~200ms spawn overhead) adds significant CPU cost.
- [ ] **Checkpoint memory at request boundaries**: Log `memory_get_usage()` at start and end of each request. Rising baseline across requests = leak.
- [ ] **Binary search debugging**: Disable half the service providers. If leak stops, it's in that half. Repeat to isolate.
- [ ] Memory checkpoint logging configured at request boundaries
- [ ] Static property audit completed for Octane migration
- [ ] pm.max_requests set but not relied upon as leak solution
- [ ] Closure accumulation checked in service provider boot() methods
- [ ] Binary search procedure documented for leak isolation
- [ ] All seven leak patterns audited across the codebase
- [ ] Each identified leak fixed with appropriate mitigation
- [ ] 4-hour memory test confirms stable RSS
- [ ] Patterns documented for ongoing development standards
- [ ] Static properties audited and refactored where needed
- [ ] Singleton registries checked for unbounded growth
- [ ] Closure scopes reviewed for unnecessary captures
- [ ] Event listener registrations moved to boot-time only
- [ ] Circular references resolved with WeakReference or unset
- [ ] All resources explicitly closed
- [ ] In-memory caches have size limits or TTL

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- [ ] **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance Ã¢â‚¬â€ requiring explicit memory management via sandbox patterns and WeakReference.
- [ ] **Static property audit**: Search codebase for `static` properties. Each must be justified as intentionally shared state or eliminated. `grep -r "static \$" app/` â€” expect zero results for request-scoped data in Octane.
- [ ] **Closure lifecycle**: In Octane, closures registered in service provider boot() persist across requests. Ensure closures don't capture request-scoped variables.
- [ ] **WeakReference for caches**: Cache maps should use WeakReference as values, allowing objects to be freed when no longer externally referenced.
- [ ] Document and follow through on architectural decision: Whether RSS growth indicates a memory leak
- [ ] Document and follow through on architectural decision: How to fix identified memory leaks
- [ ] Ensure architecture aligns with core concept: **Growing static collections**: `public static array $cache = []` that never clears. Each request adds entries. Over 10,000 requests = 10,000 entries. Fix: LRU-size-bound caches or WeakReference-based caches.
- [ ] Ensure architecture aligns with core concept: **Closure accumulation**: Event listeners registered per-request but never removed. Each closure captures scope variables, preventing their memory from being freed. Fix: register listeners at boot time (Octane), not per-request (FPM).
- [ ] Ensure architecture aligns with core concept: **Circular reference leaks**: Complex object graphs where GC cannot determine reachability. Rare but catastrophic. Fix: audit with memory profiling, use WeakReference.
- [ ] Ensure architecture aligns with core concept: **Checkpoint technique**: `memory_get_usage()` at request boundaries. If baseline increases by >5% over 1000 requests, a leak exists. `memory_get_peak_usage()` shows worst-case allocation.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Memory leak triage**: 1) Check if baseline RSS increases over time, 2) Use `gc_collect_cycles()` to rule out cycle accumulation, 3) Profile with memory-focused tools (Blackfire, SPX), 4) Binary search: disable half the codebase, test, repeat.
- [ ] **Don't just recycle, fix the leak**: pm.max_requests masks leaks but doesn't fix them. At scale, constant worker recycling (~200ms spawn overhead) adds significant CPU cost.
- [ ] **Checkpoint memory at request boundaries**: Log `memory_get_usage()` at start and end of each request. Rising baseline across requests = leak.
- [ ] **Binary search debugging**: Disable half the service providers. If leak stops, it's in that half. Repeat to isolate.
- [ ] Scan for static properties: `grep -rn "static \$" app/ --include="*.php"` â€” each static property is a potential leak vector
- [ ] Scan for singleton registries: classes that accumulate data in static arrays (event listeners, middleware registries)
- [ ] Scan for closures that capture large scopes: closures defined inside loops or request handlers that capture `$this` or large variables
- [ ] Scan for event listeners registered per-request (hook into a framework's event system from within a controller)
- [ ] Scan for circular references: parent-child relationships where both sides hold strong references
- [ ] Scan for unclosed resources: fopen(), mysql_connect(), curl_init() without corresponding fclose(), mysql_close(), curl_close()
- [ ] Scan for growing caches: in-memory caches (static arrays, APCu) that never expire entries
- [ ] For each pattern found, implement the fix based on the specific cause
- [ ] Verify the fix with a 4-hour memory growth test
- [ ] Document the patterns found and fixes applied

# Performance Checklist (from 04/06)
- [ ] Reference counting overhead: each zval assignment/deletion manipulates refcount; hot loops see measurable CPU cost
- [ ] GC collection pauses execution for 1-10ms depending on root buffer size and number of cycles
- [ ] Copy-on-write: array/string modification triggers duplication; use SplFixedArray for large fixed-size arrays
- [ ] Zend MM uses per-request heap; persistent allocator reduces fragmentation in long-running processes
- [ ] WeakReference resolution requires hash table lookup (~0.1Âµs); negligible for occasional use
- [ ] gc_disable()
- [ ] Persistent memory (Octane)
- [ ] Per-request cleanup (FPM)
- [ ] WeakReference

# Security Checklist (from 04/06 - only if relevant)
- [ ] State leaks between requests can expose sensitive data (e.g., user A sees user B's database results)
- [ ] Static property caches may retain PII across requests if not properly scoped
- [ ] In multi-tenant Octane, one tenant's memory leak can cause OOM affecting all tenants

# Reliability Checklist (from 04/05/06)
- [ ] **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- [ ] **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- [ ] **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.
- [ ] **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- [ ] **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- [ ] **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- [ ] **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

# Testing Checklist (from 04/06)
- [ ] Memory checkpoint logging configured at request boundaries
- [ ] Static property audit completed for Octane migration
- [ ] pm.max_requests set but not relied upon as leak solution
- [ ] Closure accumulation checked in service provider boot() methods
- [ ] Binary search procedure documented for leak isolation
- [ ] Alert threshold defined for >20% RSS drift over 1000 requests
- [ ] All seven leak patterns audited across the codebase
- [ ] Each identified leak fixed with appropriate mitigation
- [ ] 4-hour memory test confirms stable RSS
- [ ] Patterns documented for ongoing development standards
- [ ] Static properties audited and refactored where needed
- [ ] Singleton registries checked for unbounded growth
- [ ] Closure scopes reviewed for unnecessary captures
- [ ] Event listener registrations moved to boot-time only
- [ ] Circular references resolved with WeakReference or unset
- [ ] All resources explicitly closed
- [ ] In-memory caches have size limits or TTL
- [ ] 4-hour memory test passed
- [ ] Patterns documented for team training

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Memory leak triage**: 1) Check if baseline RSS increases over time, 2) Use `gc_collect_cycles()` to rule out cycle accumulation, 3) Profile with memory-focused tools (Blackfire, SPX), 4) Binary search: disable half the codebase, test, repeat.
- [ ] **Don't just recycle, fix the leak**: pm.max_requests masks leaks but doesn't fix them. At scale, constant worker recycling (~200ms spawn overhead) adds significant CPU cost.
- [ ] **Checkpoint memory at request boundaries**: Log `memory_get_usage()` at start and end of each request. Rising baseline across requests = leak.
- [ ] **Binary search debugging**: Disable half the service providers. If leak stops, it's in that half. Repeat to isolate.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming pm.max_requests solves memory leaks
- [ ] Avoid: Not checking static property accumulation
- [ ] Avoid: Registering listeners per-request
- [ ] Avoid: Ignoring vendor package leaks
- [ ] Avoid: Not using checkpoint technique
- [ ] Avoid anti-pattern: **Relying solely on pm.max_requests**: Worker recycling hides the symptom but wastes CPU on constant restarts. Fix the leak.
- [ ] Avoid anti-pattern: **Adding memory_limit as the only defense**: Hard limit prevents OOM kill but causes 500 errors. Detect leaks early.
- [ ] Avoid anti-pattern: **Blindly adding gc_collect_cycles()**: If leak is from static properties, not cycles, GC collection won't help. Profile first.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste
- [ ] Hot-path data uses scalars

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
**Core Concepts:** **Growing static collections**: `public static array $cache = []` that never clears. Each request adds entries. Over 10,000 requests = 10,000 entries. Fix: LRU-size-bound caches or WeakReference-based caches., **Closure accumulation**: Event listeners registered per-request but never removed. Each closure captures scope variables, preventing their memory from being freed. Fix: register listeners at boot time (Octane), not per-request (FPM)., **Circular reference leaks**: Complex object graphs where GC cannot determine reachability. Rare but catastrophic. Fix: audit with memory profiling, use WeakReference., **Checkpoint technique**: `memory_get_usage()` at request boundaries. If baseline increases by >5% over 1000 requests, a leak exists. `memory_get_peak_usage()` shows worst-case allocation.
**Skills:** PHP Memory Model, GC Telemetry and Root Buffer, Circular Reference Detection, Octane Memory Management
**Decision Trees:** Whether RSS growth indicates a memory leak, How to fix identified memory leaks
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** GC Telemetry and Root Buffer Monitoring, Memory Drift Detection and Mitigation, PM Max Requests Tuning, Static Property Audit Methodology

