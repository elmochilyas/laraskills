# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP Memory Management & Garbage Collection
Knowledge Unit: By-Reference Implications — Opt-Out of CoW, zend_reference Container, Unexpected Copies
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

By-reference assignment (`$b = &$a`) creates a `zend_reference` container that aliases two variables to the same memory location. This bypasses CoW entirely — any write through `$a` or `$b` modifies the same underlying value. While useful for certain patterns, references introduce complexity: unexpected copies when arrays containing references are copied, and increased mental overhead for tracking aliases.

---

# Core Concepts

- **zend_reference**: An intermediate container holding a zval with refcount tracking. `$a` and `$b` both point to the same `zend_reference`, which points to the actual value.
- **CoW bypass**: Because both variables must always see changes, separation never occurs. CoW's memory-sharing benefits are lost.
- **Array separation with references**: When an array containing references is copied, PHP must create new references for each referenced element — this is expensive and can cause unexpected memory growth.
- **foreach with references**: `foreach ($arr as &$val)` — the `$val` reference persists after the loop ends, causing subtle bugs. Always `unset($val)` after reference foreach.

---

# Common Mistakes

**Using references for function arguments to "save memory"**: PHP already uses CoW — passing a large array to a function that only reads it costs zero copy. Adding `&` only introduces aliasing complexity without benefit.

---

# Performance Considerations

- Reference counting overhead: each zval assignment/deletion manipulates refcount; hot loops see measurable CPU cost
- GC collection pauses execution for 1-10ms depending on root buffer size and number of cycles
- Copy-on-write: array/string modification triggers duplication; use SplFixedArray for large fixed-size arrays
- Zend MM uses per-request heap; persistent allocator reduces fragmentation in long-running processes
- WeakReference resolution requires hash table lookup (~0.1us); negligible for occasional use

---

# Related Knowledge Units

Copy-on-Write Mechanics | Zval Structure and Reference Counting | Memory Leak Pattern Catalog

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
