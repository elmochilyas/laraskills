# Attribute Caching — Anti-Patterns

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Attributes & Casting |
| Knowledge Unit | Attribute Caching |
| Focus | Anti-patterns in accessor caching with `shouldCache` |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Caching Non-Deterministic Accessors | Reliability | High |
| 2 | Caching Accessors Dependent on Mutable State | Reliability | High |
| 3 | Uncached Expensive Accessor | Performance | High |
| 4 | Speculative Cache-All Approach | Performance | Medium |
| 5 | Legacy Syntax Blocking Caching | Maintainability | Medium |
| 6 | Cache as Substitute for Query Optimization | Design | High |

## Repository-Wide Cross-Cutting Patterns

- Many codebases apply `shouldCache` indiscriminately without considering determinism, stale state, or profiling
- The per-instance caching model is frequently misunderstood as a request-scoped or globally-scoped cache
- Caching decisions are often made at accessor-creation time without measuring actual read patterns, leading to both missing caches and wasted cache overhead

---

## 1. Caching Non-Deterministic Accessors

### Category
Reliability

### Description
Enabling `shouldCache: true` on accessors that return random values, current timestamps, UUIDs, or any value expected to differ on each read. The cache returns the same first-computed value for every subsequent access within the model instance lifecycle.

### Why It Happens
Developers apply `shouldCache` as a default optimization without analyzing whether the accessor is deterministic. The syntax encourages caching — `shouldCache` sounds like a universally good option.

### Warning Signs
- Accessors using `rand()`, `mt_rand()`, `random_int()`, `Str::random()`, `now()`, `Carbon::now()`
- Accessors returning `Str::uuid()`, `Ramsey\Uuid\*` values
- Tests failing because subsequent reads of a "random" accessor return the same value
- Accessors that call external APIs for time-sensitive data without considering caching behavior

### Why Harmful
- Breaks the principle of least surprise — callers expect different values on repeated reads
- Non-deterministic accessors lose their entire purpose when cached (e.g., a random discount that isn't random)
- Debugging becomes confusing — the accessor returns different values in `tinker` (new instance) vs runtime (cached instance)
- Subtle bugs in time-sensitive features (countdown timers, timeout calculations) appear only under certain access patterns

### Consequences
- Identical "random" values returned across a single request
- Stale timestamps causing incorrect time-sensitive calculations
- Confusing application behavior that is hard to reproduce or debug
- Violation of caller expectations for non-deterministic accessors

### Preferred Alternative
```php
// Use a regular method for non-deterministic values
public function getRandomDiscount(): int
{
    return rand(5, 20);
}
```

### Refactoring Strategy
1. Identify all cached accessors that use non-deterministic functions
2. Remove `shouldCache: true` and convert to regular method if non-deterministic
3. If the accessor must remain attribute syntax, remove `shouldCache`
4. Update callers to use method syntax where appropriate

### Detection Checklist
- [ ] Search for `rand(`, `mt_rand(`, `random_int(`, `Str::random(`, `now()`, `Carbon::now(` in accessor closures with `shouldCache`
- [ ] Check for `Str::uuid(`, `Str::ulid(` in cached accessors
- [ ] Review accessor logic for external API calls that return time-sensitive data
- [ ] Test: access the attribute twice and verify values can differ

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Use shouldCache for Non-Deterministic Accessors |
| Skill | `06-skills.md` — Step 3: Verify the accessor is deterministic |
| Decision Tree | `07-decision-trees.md` — Decision 2: Cached Accessor vs Regular Method |

---

## 2. Caching Accessors Dependent on Mutable State

### Category
Reliability

### Description
Enabling `shouldCache` on accessors whose return value depends on attributes or relationships that may change after first access. The cache returns the value computed at first read, ignoring subsequent mutations to the accessor's dependencies.

### Why It Happens
Developers don't trace all the accessor's dependencies. An accessor that reads `$this->items->count()` depends on the `items` relationship being loaded at the right time. If `items` is lazy-loaded after first access, the cached count may be incorrect.

### Warning Signs
- Cached accessor that reads `$this->relation` (lazy-loaded relationship) — cache is set before relationship is loaded
- Cached accessor that calls `$this->attribute` where that attribute may be set after the accessor is first read
- Intermittent bugs where cached accessor returns stale values when consumed in different orders
- Tests that must manipulate access order to reproduce results

### Why Harmful
- Cache returns stale values silently — no error, no warning
- Bugs depend on access order, making them non-deterministic and hard to reproduce
- Adding new code that modifies the accessor's dependencies may break the cached value
- Debugging requires tracing the entire request lifecycle to understand when the cache was first populated

### Consequences
- Stale data served for the model instance's lifetime
- Non-deterministic bugs that appear or disappear based on code changes in unrelated areas
- Increased debugging time to trace cache-first-access timing
- Relationship counts or computed values that are incorrect yet silently accepted

### Preferred Alternative
```php
// Ensure all dependencies are resolved before caching
protected function relatedCount(): Attribute
{
    return Attribute::make(
        get: fn ($value) => $this->items()->count(),
        shouldCache: true
    );
}
```

### Refactoring Strategy
1. Identify all dependencies of the cached accessor (attributes, relationships, methods)
2. Determine if each dependency is immutable during the model's lifetime
3. If mutable dependencies exist, either load them before first access or remove `shouldCache`
4. Consider eager-loading relationships before the first cached accessor read

### Detection Checklist
- [ ] Review cached accessors for `$this->relationName` (relationship reads)
- [ ] Check for accessors that read other model attributes that may be set after construction
- [ ] Test: set a dependency after first accessor read and verify no stale value
- [ ] Review the model lifecycle to understand when attributes are populated vs modified

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Do Not Cache Accessors Dependent on Mutable State |
| Skill | `06-skills.md` — Step 4: Ensure no mutable dependencies |
| Knowledge | `04-standardized-knowledge.md` — Cache is cleared when attribute changes via setAttribute |

---

## 3. Uncached Expensive Accessor

### Category
Performance

### Description
An accessor performing database queries, complex string formatting, relationship counts, or API calls without `shouldCache: true`. The expensive computation re-executes on every attribute read across Blade views, serialization, and API resources.

### Why It Happens
The `shouldCache` parameter is easily overlooked. Developers test accessors with a single read and miss the repeated-read pattern. Legacy accessor syntax doesn't support caching at all.

### Warning Signs
- Debug toolbar showing the same query executed multiple times for a single model instance
- Blade templates reading the same accessor in layout, partial, and content sections
- Accessor that calls `$this->relation()->count()`, `implode()`, `json_decode()`, `sprintf()` with complex arguments
- Slow page loads where profiler attributes time to attribute reads

### Why Harmful
- N+1 performance degradation within a single request — not for queries but for computation
- Computation cost scales with the number of reads, not the number of models
- Each Blade partial, API resource inclusion, or serialization call re-executes the entire accessor pipeline
- Performance issues are distributed across template rendering rather than localized in the accessor

### Consequences
- Redundant CPU usage from repeated computation
- Slower response times for pages with multiple views consuming the same attribute
- Database queries from accessors executing multiple times per request
- Difficult to optimize — spreading small costs across many template files

### Preferred Alternative
```php
protected function summary(): Attribute
{
    return Attribute::make(
        get: fn ($value) => implode(', ', $this->relatedItems()->pluck('name')->toArray()),
        shouldCache: true
    );
}
```

### Refactoring Strategy
1. Profile or audit accessor read frequency across the request lifecycle
2. Add `shouldCache: true` to accessors identified as frequently read and expensive
3. For legacy accessors, first migrate to `Attribute::make()` then add `shouldCache`
4. Verify improvement with profiling after caching

### Detection Checklist
- [ ] Review all accessors without `shouldCache` for expensive operations
- [ ] Check debug toolbar for repeated identical queries from a single model instance
- [ ] Search for DB queries, API calls, or heavy string manipulation in accessor closures
- [ ] Review Blade templates and API resources for multiple reads of the same accessor

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Use shouldCache for Expensive or Frequently-Accessed Accessors |
| Skill | `06-skills.md` — Add shouldCache to an Accessor |
| Decision Tree | `07-decision-trees.md` — Decision 1: Enable shouldCache vs Leave Uncached |

---

## 4. Speculative Cache-All Approach

### Category
Performance

### Description
Adding `shouldCache: true` to all accessors by default without profiling or evaluating actual performance impact. This includes trivial accessors (simple typecasts, null coalesce) where cache-lookup overhead exceeds computation cost.

### Why It Happens
Early optimization mindset: "Caching is good, so I'll cache everything." Teams adopt a blanket policy of adding `shouldCache` to all accessors without understanding the tradeoffs.

### Warning Signs
- Every accessor in the model uses `shouldCache: true` indiscriminately
- Accessors performing `(bool) $value`, `(int) $value`, or `$value ?? ''` are cached
- No profiling data was collected before adding caching
- Code review comments questioning the necessity of caching on trivial accessors

### Why Harmful
- Cache-lookup overhead (hash lookup, memory allocation) may exceed the cost of simple computation
- Memory pressure from storing all cached accessor values per model instance
- False sense of optimization — developers think they've optimized when they've only added complexity
- Cached values consume memory for the model's lifetime even if only read once

### Consequences
- Many accessors actually slower with caching than without (cache overhead > computation)
- Unnecessary memory consumption for cached trivial values
- Harder to reason about cache invalidation across all accessors
- Premature optimization adds code complexity without measurable benefit

### Preferred Alternative
```php
// Profile first — trivial accessors should NOT be cached
protected function isActive(): Attribute
{
    return Attribute::make(get: fn ($value) => (bool) $value);
}

// Cache only when profiling confirms benefit
protected function summary(): Attribute
{
    return Attribute::make(
        get: fn ($value) => implode(', ', $this->relatedItems()->pluck('name')->toArray()),
        shouldCache: true
    );
}
```

### Refactoring Strategy
1. Audit all accessors with `shouldCache: true` across the codebase
2. For each accessor, measure: is the computation expensive? Is it read multiple times?
3. Remove `shouldCache` from trivial accessors where cache overhead exceeds computation
4. Establish team guidelines: `shouldCache` is opt-in, not default

### Detection Checklist
- [ ] Count accessors with vs without `shouldCache` — are all or most cached?
- [ ] Review caching on trivial operations: typecasts, null coalesce, default values
- [ ] Check for profiling evidence (benchmarks, measurements) justifying cache usage
- [ ] Test: measure page load time with and without `shouldCache` on the accessor

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Profile Before Adding shouldCache |
| Decision Tree | `07-decision-trees.md` — Decision 1: Profile first if rarely accessed |
| Knowledge | `04-standardized-knowledge.md` — Premature caching advice |

---

## 5. Legacy Syntax Blocking Caching

### Category
Maintainability

### Description
Keeping legacy `get{Attribute}Attribute()` accessor methods in the codebase, preventing the use of `shouldCache` on expensive accessors. Legacy syntax has no caching parameter, forcing redundant computation on every read.

### Why It Happens
Legacy codebases accumulate old-style accessors over time. Teams deprioritize refactoring during feature development. Developers may not realize that legacy accessors cannot be cached.

### Warning Signs
- Models with a mix of `get{X}Attribute()` and `Attribute::make()` accessors
- Expensive computation in legacy accessor methods that cannot benefit from caching
- Performance tickets targeting accessor slowness where the fix requires syntax migration
- Accessor tests that don't include caching verification

### Why Harmful
- Performance benefits of `shouldCache` are entirely unavailable for legacy accessors
- Codebase inconsistency — two different accessor styles with different capabilities
- Team members may not know which style to use for new code without explicit standards
- Any performance optimization of legacy accessors requires a simultaneous syntax migration

### Consequences
- Performance "left on the table" — expensive legacy accessors recompute on every read
- Inconsistent coding patterns across the codebase
- Migration effort grows as more legacy accessors accumulate
- New developers unsure which syntax to use

### Preferred Alternative
```php
// Legacy syntax — no caching
public function getTotalLabelAttribute($value)
{
    return '$' . number_format($this->total_cents / 100, 2);
}

// Modern syntax — supports caching
protected function totalLabel(): Attribute
{
    return Attribute::make(
        get: fn ($value) => '$' . number_format($this->total_cents / 100, 2),
        shouldCache: true
    );
}
```

### Refactoring Strategy
1. Search for all `function get\w+Attribute(` method definitions in models
2. Prioritize migration by performance impact: expensive + frequently-read first
3. Convert each to `Attribute::make()` with appropriate `shouldCache` setting
4. Add CI linting to prevent new legacy accessors from being added
5. Schedule remaining migrations as technical debt

### Detection Checklist
- [ ] Search for `function get\w+Attribute(` in all model files
- [ ] Check for expensive legacy accessors that would benefit from `shouldCache`
- [ ] Verify new PRs don't introduce legacy accessor syntax
- [ ] Confirm migration pattern is documented for the team

### Related
| Reference | Link |
|---|---|
| Rule | `05-rules.md` — Migrate Legacy Accessors to Enable Caching |
| Decision Tree | `07-decision-trees.md` — Decision 3: Legacy vs Migrate to Attribute::make |
| Skill | `06-skills.md` — Prerequisite: Accessor defined via Attribute::make (not legacy) |

---

## 6. Cache as Substitute for Query Optimization

### Category
Design

### Description
Using `shouldCache` on an accessor to mask the performance cost of an expensive database query within the accessor, rather than optimizing the underlying query, adding proper eager loading, or restructuring the data access pattern.

### Why It Happens
`shouldCache` is a quick fix — adding a single parameter hides the symptom (repeated slow queries) without addressing the root cause (unoptimized query in the accessor). Teams may not have permission or time to refactor the query.

### Warning Signs
- Accessor running N+1 queries that is "fixed" by adding `shouldCache`
- Accessor loading relationships that should be eager-loaded but aren't
- Accessor performing aggregation queries that could be stored as DB columns or caches
- Cached accessors that still trigger slow queries on first access, just not on subsequent reads

### Why Harmful
- Treats a symptom, not the cause — the first read still pays the full query cost
- Masks poor data access patterns that affect the first page load, job execution, or API call
- Other consumers (new instances of the same model) don't benefit from the cache — each instance recomputes
- Missed opportunity to optimize at the database or application level for all consumers

### Consequences
- Slow first access to model attributes per instance
- N+1 query patterns persist but are hidden by per-instance caching
- Inconsistent performance — fast after first read, slow on fresh model loads
- Database load higher than necessary because caching covers up the query pattern

### Preferred Alternative
```php
// Instead of masking with shouldCache, optimize the query
class Order extends Model
{
    // Eager-load relationships or use subquery select
    public function scopeWithOptimizedSummary(Builder $query): void
    {
        $query->withCount('items')->addSelect(['last_item_name' => Item::select('name')
            ->whereColumn('order_id', 'orders.id')
            ->latest()
            ->limit(1)
        ]);
    }
}
```

### Refactoring Strategy
1. Identify the expensive operation inside the cached accessor (query, computation)
2. Determine if the operation can be optimized at the query level (eager loading, subquery select, computed column)
3. Apply the database-level optimization
4. Remove `shouldCache` or keep it only if the computation remains non-trivial after optimization
5. Verify performance improvement with profiling

### Detection Checklist
- [ ] Inspect accessor for DB queries that could be eager-loaded or computed at query time
- [ ] Check debug toolbar for slow queries on first accessor read per instance
- [ ] Review if `withCount`, `addSelect`, or subquery selects could replace accessor logic
- [ ] Assess if the accessor duplicates query work that could be done once at the database level
- [ ] Evaluate whether a stored column (denormalized) would be better than runtime computation

### Related
| Reference | Link |
|---|---|
| Knowledge | `04-standardized-knowledge.md` — Performance considerations (profiling first) |
| Rule | `05-rules.md` — Profile Before Adding shouldCache (root cause analysis) |
| Skill | `06-skills.md` — Step 1: Identify frequently-accessed accessors via profiling |
