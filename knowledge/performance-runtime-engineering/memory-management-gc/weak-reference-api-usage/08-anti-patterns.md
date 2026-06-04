# ECC Anti-Patterns — Weak Reference API Usage in Laravel

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | WeakReferenceApiUsage |
| **Knowledge Unit** | WeakReferenceApiUsage |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. WeakReference as a Crutch for Unclear Ownership
2. Global WeakMap Registries Without Bounded Keys
3. WeakMap for Request-Scoped Data
4. Skipping Profiling Before Applying Weak References
5. Storing WeakMaps in Sessions or Caches

---

## Repository-Wide Anti-Patterns

- Hardcoded Configuration
- Duplicate Business Logic

---

## Anti-Pattern 1: WeakReference as a Crutch for Unclear Ownership

### Category
Design

### Description
Using weak references to compensate for unclear ownership semantics in object relationships. Instead of clearly defining which object owns which, weak references are used to avoid fixing ownership design. Weak references should be an optimization, not a design tool.

### Warning Signs
- WeakReference used in every object relationship
- Cannot answer "who owns this object" for any given relationship
- WeakReference introduced before profiling memory issues
- Multiple objects hold weak references to the same target without clear ownership

### Why It Is Harmful
Weak references obscure object lifecycle expectations. When a `WeakReference::get()` returns null, it's unclear whether the object was legitimately GC'd or there's a logic bug. Clear ownership design makes object lifecycle predictable and debuggable.

### Real-World Consequences
A team uses WeakReference for all cross-service object references. A null reference causes a production bug; the team cannot determine if the null was expected (object legitimately GC'd) or unexpected (reference dropped too early). Debugging takes 3 days. The root cause is a missing strong reference, not a weak reference issue.

### Preferred Alternative
Design explicit ownership semantics first. Use weak references only after profiling confirms a memory leak from the ownership pattern, and only when the ownership design cannot be changed.

### Refactoring Strategy
1. Audit all WeakReference usages and identify the ownership relationship for each
2. Clarify ownership: which object creates, holds, and destroys the referenced object?
3. Replace WeakReference with strong reference where ownership is unclear
4. Only keep WeakReference where the reference is truly optional and ownership is proven
5. Document lifetime expectations for remaining weak references

### Detection Checklist
- [ ] WeakReference used without clear ownership documentation
- [ ] No memory profiling performed before introducing weak references
- [ ] Weak references used in business logic (not infrastructure)

### Related Rules
- (Rule: Use weak references as optimization, not as a design tool for ownership)

### Related Skills
- (Related: Implement WeakMap for Object-Keyed Cache — preconditions section)

---

## Anti-Pattern 2: Global WeakMap Registries Without Bounded Keys

### Category
Scalability

### Description
A single global WeakMap accumulating object-keyed entries across the entire process lifetime without ensuring that key objects have bounded lifetimes. The WeakMap itself persists forever; entries only clean up if key objects are GC'd. If key objects never go out of scope, the WeakMap behaves like a memory leak.

### Warning Signs
- Singleton service holds a WeakMap that grows over process lifetime
- WeakMap key objects are also singletons or long-lived services
- Memory usage in Octane workers increases linearly with request count
- WeakMap entries are never observed being evicted

### Why It Is Harmful
A WeakMap is only as good as its key objects' lifetimes. If keys are long-lived (singletons, config objects, persistent entities), entries are never evicted. The WeakMap becomes a regular map with the overhead of weak reference tracking but none of the memory management benefit.

### Real-World Consequences
An Octane application uses a global WeakMap to cache computed permissions. The keys are a set of 500 service objects that persist across all requests. The cache entries are never evicted. After 24 hours, the WeakMap holds 500 entries of 50KB each (25MB). The worker's memory grows linearly and is OOM-killed weekly.

### Preferred Alternative
Ensure WeakMap key objects have bounded lifetimes. For long-lived keys, use explicit cache invalidation (TTL, event-driven) instead of WeakMap auto-eviction.

### Refactoring Strategy
1. Audit WeakMap key objects: what is their lifetime?
2. If keys are long-lived, replace WeakMap with explicit cache with TTL or event-driven invalidation
3. If keys are short-lived but many persist, fix the root cause of key persistence
4. Add memory monitoring to detect WeakMap growth over time
5. Consider per-request WeakMaps instead of global singleton

### Detection Checklist
- [ ] WeakMap keys are long-lived objects (singletons, services)
- [ ] WeakMap entry count grows over process lifetime
- [ ] Memory usage in workers increases over time
- [ ] No mechanism to evict entries independent of GC

### Related Rules
- (Rule: Ensure WeakMap key objects have bounded lifetimes)
- (Rule: Never use WeakMap with long-lived key objects for memory management)

### Related Skills
- (Related: Implement WeakMap for Object-Keyed Cache — key object lifetime section)

---

## Anti-Pattern 3: WeakMap for Request-Scoped Data

### Category
Performance

### Description
Using WeakMap to cache data within a single HTTP request when request-scoped arrays or properties are simpler and faster. WeakMap is designed for process-lifetime data where automatic eviction is needed at object destruction. For request-scoped data (freed at end of request), WeakMap adds unnecessary complexity and overhead.

### Warning Signs
- WeakMap used in non-singleton service (created per-request)
- WeakMap entries keyed by request-scoped objects
- WeakMap created and discarded within a single request
- Simple `$this->cache = []` would suffice

### Why It Is Harmful
WeakMap introduces indirection (hash table lookup, weak ref management) for data that will be freed at end of request anyway. A simple associative array is faster, clearer, and uses less memory. WeakMap should only be used when the data spans process lifetime and needs GC-driven eviction.

### Real-World Consequences
A developer uses WeakMap in a per-request middleware to cache computed route permissions. The WeakMap is created on every request, populated, and discarded at request end. A performance profile shows WeakMap operations consuming 0.5ms per request — negligible for one request but significant at 1000 RPM (500ms CPU per minute wasted on unnecessary indirection).

### Preferred Alternative
Use a simple array property on the service for request-scoped caching. Reserve WeakMap for process-lifetime caches in singleton services.

### Refactoring Strategy
1. Identify all WeakMap usages in per-request (non-singleton) services
2. Replace with `$this->cache = []` and manual key management
3. Verify memory usage is unaffected (freed at request end)
4. Only keep WeakMap where the service is a singleton and keys are objects

### Detection Checklist
- [ ] WeakMap used in non-singleton service
- [ ] WeakMap data scoped to single request
- [ ] No process-lifetime benefit from auto-eviction

### Related Rules
- (Rule: Use WeakMap only for process-lifetime, not request-scoped data)

### Related Skills
- (Related: Implement WeakMap for Object-Keyed Cache — appropriate scope section)

---

## Anti-Pattern 4: Skipping Profiling Before Applying Weak References

### Category
Process

### Description
Introducing weak references without first profiling memory usage to confirm there is a memory problem. Weak references add complexity and potential for bugs (null returns, premature GC). Without profiling, the team doesn't know whether weak references solve a real problem or add unnecessary complexity.

### Warning Signs
- Weak references introduced in a code review without associated profiling data
- Memory usage is within acceptable limits before weak references
- Team cannot quantify the memory improvement from weak references
- Weak references added "because Octane" without measuring Octane memory

### Why It Is Harmful
Adding weak references without profiling is speculative optimization. The complexity cost (null checks, testing GC behavior, maintenance overhead) may not be justified by actual memory savings. Weak references should be a targeted fix for a measured problem, not a blanket pattern.

### Real-World Consequences
A team adds WeakMap to every service in an Octane application as a "best practice." Three months later, a bug where a WeakMap returns null causes a production outage. No one has measured memory usage. The profiling would have shown that only two services had memory issues; the other 15 WeakMaps were unnecessary complexity.

### Preferred Alternative
Profile memory usage in staging with production traffic before introducing weak references. Only apply weak references to confirmed memory leaks.

### Refactoring Strategy
1. Profile memory usage in the target process (e.g., Octane worker over 1000 requests)
2. Identify specific memory leak locations with `memory_get_usage()` or profiling tools
3. Apply weak references only to confirmed problem areas
4. Profile again after implementation to measure improvement
5. Remove weak references that show zero measurable improvement

### Detection Checklist
- [ ] Weak references introduced without profiling data
- [ ] No before/after memory comparison available
- [ ] Memory usage was within limits before weak references

### Related Rules
- (Rule: Profile before applying weak references — measure, then optimize)

### Related Skills
- (Related: Profile Memory Usage in Octane Workers — pre-optimization section)

---

## Anti-Pattern 5: Storing WeakMaps in Sessions or Caches

### Category
Implementation

### Description
Attempting to persist WeakMap or WeakReference objects across requests by storing them in sessions, caches, or queue payloads. WeakMap and WeakReference cannot be serialized because they contain pointers to PHP object memory addresses that are meaningless in a different process.

### Warning Signs
- WeakMap or WeakReference objects passed to `session()->put()` or `Cache::put()`
- Serialization errors in logs mentioning WeakMap or WeakReference
- Queue jobs with WeakMap payload properties
- Data loss across requests when using WeakMap

### Why It Is Harmful
PHP's `WeakMap` and `WeakReference` classes do not implement `Serializable` or support `__serialize()`/`__unserialize()`. Attempting to serialize them throws a fatal error or produces an empty/invalid representation. The weak reference concept is inherently process-memory-only — it points to a specific PHP object in memory that doesn't exist in another process.

### Real-World Consequences
A developer stores a WeakMap in the session to persist cached data across requests. When the session is serialized, PHP throws a fatal error. The request returns a 500 error. The user is logged out. The development team investigates for hours before discovering that WeakMap cannot be serialized.

### Preferred Alternative
Use Laravel Cache for cross-request data persistence. WeakMaps are for process-lifetime data only — use TTL-based cache (Redis, file, database) for data that must survive across requests.

### Refactoring Strategy
1. Identify all locations where WeakMap/WeakReference is stored in sessions, caches, or queues
2. Replace with serializable alternatives (arrays, Cache facade, database)
3. For process-lifetime data, ensure WeakMap is never exposed outside the service
4. Add a test that verifies the service serializes correctly without the WeakMap

### Detection Checklist
- [ ] WeakMap stored in session or cache
- [ ] WeakReference in queue job payload
- [ ] Serialization errors related to WeakMap
- [ ] Data loss or inconsistencies across requests

### Related Rules
- (Rule: Never serialize WeakMap or WeakReference — process-memory only)

### Related Skills
- (Related: Implement WeakMap for Object-Keyed Cache — serialization restrictions section)
