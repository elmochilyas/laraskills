# Anti-Patterns: N+1 Query Detection

## AP-NPD-01: Globally Disabled Lazy Loading Guard

**Description:** Calling `Model::preventLazyLoading(false)` in production or disabling it without fixing the underlying N+1 patterns.

**Why It Happens:** The guard throws exceptions during development. To deploy quickly, developers disable the guard instead of fixing the N+1 patterns. The guard remains disabled indefinitely.

**Consequences:**
- All N+1 patterns that were hidden by disabling the guard silently degrade performance in production
- New N+1 patterns introduced after disabling are never caught
- Query count per request grows unbounded over time

**Detection:** Search for `preventLazyLoading(false)` or `preventLazyLoading()` without environment check in application code.

**Remediation:** Re-enable with environment-appropriate configuration: `Model::preventLazyLoading(! app()->isProduction())`. Fix all N+1 patterns that surface.

---

## AP-NPD-02: Over-Eager Loading

**Description:** Using `Model::with('all.possible.relationships')` to load every conceivable relationship regardless of whether it is actually used.

**Why It Happens:** Developers preemptively add all relationships to avoid any future N+1. A single `with()` call loads the entire model graph.

**Consequences:**
- Memory usage per record increases 5-10x from unnecessary relationship data
- Database query complexity increases with multiple JOINs or additional queries
- API response sizes grow with unused nested data

**Detection:** Check `with()` calls for relationships that are not accessed in the response or view. Remove unused relationships and measure memory improvement.

**Remediation:** Load only relationships that are actually consumed. Use selective columns to minimize data transfer. Document why each relationship is loaded.

---

## AP-NPD-03: Lazy Loading in Serilization

**Description:** Accessing `$this->relation` inside API Resource `toArray()` or Blade components without ensuring the relationship is already loaded.

**Why It Happens:** API Resources abstract data transformation. Developers access relationships naturally without considering whether they were eager loaded.

**Consequences:**
- Serialization triggers lazy loading queries, defeating the purpose of `with()` in the controller
- Query count doubles — one for the controller query, one for the serialization query
- N+1 in serialization is invisible to lazy loading guard if the resource is called after list iteration

**Detection:** Check `toArray()` methods for direct relationship access without `whenLoaded()` wrapper. If `$this->relation` is accessed without `whenLoaded()`, it may trigger lazy loading.

**Remediation:** Use `$this->whenLoaded('relation', fn() => ...)` in all API Resources. If the relationship is always loaded, add a static analysis rule or comment documenting the dependency.

---

## AP-NPD-04: Relationship Access in Loop Without Preloading

**Description:** Accessing `$item->relation->field` inside Blade `@foreach`, API collection mapping, or any iteration without pre-loading the relationship.

**Why It Happens:** The most common and most damaging N+1 pattern. Developers access model relationships inside loops naturally — it reads like imperative code.

**Consequences:**
- A loop of 100 items with 2 relationships each = 200 additional queries
- Response time increases from 50ms to 5000ms+
- The application "works" but is unusably slow

**Detection:** Search for `->` (object operator) access on model properties inside `@foreach` and `->each()` closures. Verify the accessed property is an Eloquent relationship.

**Remediation:** Identify which relationship is being accessed in the loop. Add `Model::with('relation')` before the loop. Or refactor to use a single query with JOIN.
