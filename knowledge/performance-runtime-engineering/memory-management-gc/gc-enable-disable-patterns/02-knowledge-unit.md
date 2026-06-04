# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP Memory Management & Garbage Collection
Knowledge Unit: gc_enable/gc_disable — Time-Sensitive Code Sections, gc_status() Pre/Post
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`gc_disable()` turns off automatic cycle collection, preventing stop-the-world GC pauses during time-sensitive code. `gc_enable()` re-enables it. The correct pattern: disable GC before a latency-critical section, call `gc_collect_cycles()` at boundaries, and re-enable after. Never permanently disable GC in long-running processes — unbounded root buffer growth will eventually exhaust memory.

---

# Core Concepts

- **gc_disable()**: Sets the `gc_protected` flag. The root buffer continues accumulating entries but collection is not triggered. Pauses are eliminated.
- **gc_enable()**: Clears protection. If root buffer is over threshold, collection triggers immediately.
- **gc_status()['protected']**: Boolean indicating whether GC is currently disabled. Check before/after critical sections.
- **Risk of permanent disable**: In long-running processes (Octane workers), permanently disabled GC causes unbounded root buffer growth → eventual OOM. Always re-enable.

---

# Patterns

**High-frequency trading / real-time**: `gc_disable()` at worker start, `gc_collect_cycles()` every 100 requests, `gc_enable()` only on graceful shutdown. This gives predictable latency with controlled memory growth.

---

# Performance Considerations

- GC pause avoidance: Disabling GC during critical sections eliminates latency spikes but defers collection cost
- The deferred cost is identical — GC still takes 50-500μs when eventually triggered
- PHP-FPM's shared-nothing architecture makes GC disable safer (process resets after each request) than Octane's persistent workers

---

# Common Mistakes

**Permanently disabling GC in PHP-FPM**: Each request gets a fresh process. Memory is freed regardless of GC. Disabling GC is harmless in FPM. In Octane/Swoole workers, permanent GC disable causes memory exhaustion.

---

# Related Knowledge Units

Cyclic GC Algorithm | gc_collect_cycles() Strategic Calling | GC Telemetry and Root Buffer Monitoring

---

## Mental Models

**Lending library model**: Each zval is a book with a checkout counter (refcount). Patrons check out copies (assignments), and when everyone returns them (refcount=0), the book is recycled. The garbage collector is the auditor who finds books stuck in circular lending loops. Interned strings are reference-only books that never leave the library.

---

## Internal Mechanics

PHP's memory manager allocates from the system via mmap in large chunks (256KB default). The Zend Memory Manager (zend_mm_heap) uses a three-tier allocator: large blocks (>3072 bytes) via mmap directly, small blocks via segregated storage bins (2^n bins from 8 to 3072 bytes), and cached blocks via free list. Each PHP-FPM worker has its own heap, destroyed at request end. Reference counting is built into the zend_refcounted_h header common to all reference-counted types. The garbage collector maintains a root buffer of zend_refcounted* pointers (default 10,000 entries) that triggers the tri-color marking algorithm when full.

---

## Patterns

**Leak detection patrol**: 1) Monitor process RSS over time, 2) If RSS grows >20% over 1000 requests, investigate with memory profiler, 3) Check circular references in long-lived objects, 4) Use WeakReference for cache-like patterns, 5) Set pm.max_requests to recycle workers every N requests.

---

## Architectural Decisions

- **Reference counting vs cycle collection**: Reference counting provides immediate, deterministic memory reclamation for linear structures. Cycle collection is deferred, non-deterministic, and only handles the minority case (cycles). PHP correctly prioritizes RC for performance.
- **Per-request heap vs shared heap**: PHP-FPM's per-request allocation ensures complete memory isolation and automatic cleanup at request end. Octane's persistent memory trades this safety for performance â€” requiring explicit memory management via sandbox patterns and WeakReference.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| gc_disable() | Zero GC pauses | Unbounded root buffer growth â†’ OOM risk |
| Persistent memory (Octane) | Bootstrap once, fast requests | Memory leak detection and prevention required |
| Per-request cleanup (FPM) | Automatic, hard isolation | 10-40ms bootstrap per request |
| WeakReference | Avoid cycles, enable caching | Manual lifecycle management, indirection overhead |

---

## Production Considerations

- **RSS monitoring**: Track PHP-FPM worker RSS via Prometheus + node_exporter. Alert if P95 RSS exceeds 80% of expected maximum.
- **pm.max_requests**: Set to 500-1000 for PHP-FPM to recycle workers before memory leaks accumulate.
- **Worker memory limits**: Set php_admin_value[memory_limit] in FPM pool config to 256MB per request. Individual requests exceeding this are terminated.
- **Swap awareness**: When PHP hits swap, performance degrades catastrophically. Set m.swappiness=10 and monitor swap usage.

---

## Failure Modes

- **Circular reference leak**: Long-running process accumulates cycles that GC can't collect efficiently. Symptom: Memory grows linearly with request count. Mitigation: Call gc_collect_cycles() periodically, check WeakReference usage.
- **GC pause storm**: Root buffer fills frequently, causing repeated stop-the-world GC cycles. Symptom: Latency spikes every N requests. Mitigation: Increase GC threshold, or strategically disable/re-enable GC around critical sections.
- **Reference counting overflow**: refcount wraps on extremely shared values (rare, >4 billion references). Symptom: Memory corruption or segfault. Mitigation: Avoid sharing the same zval across millions of containers.

---

## Ecosystem Usage

- **Laravel**: Laravel Octane workers require careful memory management. Static properties on service providers are the most common leak source. Use $app->forgetInstance() and $app->forgetScopedInstances() to clear request-scoped singletons.
- **Doctrine**: Doctrine's entity manager stores cached objects in memory. In Octane, use EntityManagerInterface::clear() after each request to prevent memory growth.
- **Carbon**: Carbon instances (immutable date objects) are created per-request. Ensure no static caching of Carbon instances across requests.

---

## Research Notes

- PHP 8.1 introduced zend_refcounted_h TRY semantics â€” avoids atomic operations on known-immutable values, reducing refcount manipulation overhead by ~5-10% in hot code paths.
- PHP 8.5 improvements: Skip static closures and Enum singletons in GC root buffer detection â€” eliminates ~30% of false-positive GC runs in framework-heavy apps.
- Research area: Arena-based allocation for Octane/FrankenPHP to enable bulk memory reclamation instead of per-object refcounting â€” could reduce GC overhead in long-running processes by 40-60%.
