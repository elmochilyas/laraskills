# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP Memory Management & Garbage Collection
Knowledge Unit: Cyclic GC Algorithm — Root Buffer, Mark-Grey/Scan/Sweep Phases
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

PHP's cyclic garbage collector implements the **Bacon-Rajan algorithm** — a concurrent tri-color marking scheme. It operates in three phases: **Mark-Grey** (decrement refcounts of all children), **Scan** (evaluate which nodes can be reached from roots), and **Sweep** (free unreachable cycles). The collector is triggered when the root buffer (default 10,000 entries) fills.

---

# Core Concepts

- **Root buffer**: Array of `zend_refcounted*` pointers tracking potential cycle roots. Default size: 10,000. When full, GC is triggered automatically.
- **Mark-Grey phase**: Walk all children of each root, decrement their refcounts by 1 (simulating removal of the root's reference). Nodes with refcount > 0 after this are still reachable from outside the cycle.
- **Scan phase**: Walk all children again, incrementing refcounts of reachable nodes (restoring them). Nodes that remain refcount=0 are unreachable cycle members.
- **Sweep phase**: Free all unreachable cycle members. These are the actual garbage.
- **gc_status()**: Returns `{ 'running', 'protected', 'root_buffer_size', 'root_buffer_entries', 'collectable', 'collected' }`.

---

# Performance Considerations

- Full GC cycle: 50-500µs depending on number of roots and depth of structures
- GC pauses — the algorithm runs inline (stop-the-world) during the sweep phase
- PHP 8.5 improvements: Skip static fake closures (first-class callables) and Enum singletons — common false positives that wasted GC cycles

---

# Common Mistakes

- Assuming unset() immediately frees memory: objects in circular references remain until GC runs
- Not calling gc_collect_cycles() in long-running processes: Octane/Swoole workers accumulate cycles
- Using static properties for request-scoped data: static state leaks between requests in Octane
- Ignoring copy-on-write in loops: modifying arrays in foreach with reference can cause massive duplication
- Not monitoring worker RSS: memory leaks manifest as gradual RSS growth; alert on >10% over 1000 requests

---

# Related Knowledge Units

Root Buffer Dynamics and Threshold Tuning | gc_collect_cycles() Strategic Calling | GC Enable/Disable Patterns

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
