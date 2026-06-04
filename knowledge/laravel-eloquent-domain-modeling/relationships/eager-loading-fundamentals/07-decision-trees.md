## Eager Loading Method (with vs load vs loadMissing)

Choosing between `with()` at query time, `load()` on existing collections, and `loadMissing()` for defensive loading.

---

## Decision Context

When you need related models loaded alongside parents, you must decide which eager loading method to use based on when the relationship need is known.

---

## Decision Criteria

* whether the relationship need is known before or after the parent query
* whether the relationship may already be loaded
* performance trade-off of defensive loading
* code structure (controller vs resource vs middleware)

---

## Decision Tree

Need to load a relationship?

↓

Is the relationship need known before the query executes?

YES → Use `with('relation')` in the parent query builder

    Use `with()` with constraint closures: `with(['posts' => fn($q) => $q->whereActive()])`

NO → Are models already hydrated?

    YES → Use `load('relation')` on the collection or model

        Is the relationship possibly already loaded?

        YES → Use `loadMissing('relation')` (defensive pattern)

        NO → Use `load('relation')`

    Is this in an API resource or reusable component?

    YES → Always use `loadMissing()` in `toArray()` for defensive loading

---

## Rationale

`with()` is most efficient because the framework optimizes the eager load queries together with the parent query. `load()` is for post-retrieval scenarios where you discover a need. `loadMissing()` is essential in reusable components (API resources, view composers) that don't know if callers have already loaded the relationship.

---

## Recommended Default

**Default:** `with()` at query time when possible; `loadMissing()` in reusable components
**Reason:** `with()` integrates with query optimization; `loadMissing()` prevents redundant queries

---

## Risks Of Wrong Choice

N+1 from not loading before access, redundant queries from unconditional `load()`, eager loading after pagination.

---

## Related Rules

- Always-Eager-Load-In-Loops (eager-loading-fundamentals/05-rules.md)
- LoadMissing-Defensive-Pattern (eager-loading-fundamentals/05-rules.md)

---

## Related Skills

- Prevent N+1 with strategic eager loading (eager-loading-fundamentals/06-skills.md)
- Use loadMissing for defensive relationship loading (eager-loading-fundamentals/06-skills.md)

---

## N+1 Prevention Strategy (Development vs Production)

Choosing the right N+1 detection and prevention strategy for different environments.

---

## Decision Context

N+1 problems must be caught and fixed. The strategy differs between development (detect all) and production (fix, monitor).

---

## Decision Criteria

* development vs production environment
* team maturity with eager loading
* performance monitoring capability
* tolerance for lazy loading in specific cases

---

## Decision Tree

Implementing N+1 prevention?

↓

Is this the development environment?

YES → Enable `Model::preventLazyLoading(true)` in AppServiceProvider

    Use Laravel Debugbar per-request query monitoring

    Add query count assertions in CI tests

NO (production)

    Monitor query counts via Telescope or similar tooling

    Do NOT enable `preventLazyLoading()` (may break legitimate lazy loading)

↓

Have you added `loadMissing()` to API resources?

YES → Defensive loading is in place

NO → Add `loadMissing()` to all resource `toArray()` methods

---

## Rationale

`preventLazyLoading()` throws exceptions for any lazy load, catching N+1 at development time. This is too strict for production where some intentional lazy loading is acceptable. Telescope provides production query monitoring without breaking functionality.

---

## Recommended Default

**Default:** `preventLazyLoading()` in development; query monitoring in production
**Reason:** Catches N+1 early without breaking production workflows

---

## Risks Of Wrong Choice

Undetected N+1 reaching production, production crashes from prevented lazy loading, false sense of security from dev-only checks.

---

## Related Rules

- Prevent-Lazy-Loading-Dev (eager-loading-fundamentals/05-rules.md)
- Selective-Eager-Loading (eager-loading-fundamentals/05-rules.md)

---

## Related Skills

- Profile and verify query count expectations (eager-loading-fundamentals/06-skills.md)

---

## Constrained vs Unconstrained Eager Loading

Choosing between loading all related records and applying constraints to limit what's loaded.

---

## Decision Context

When eager loading a HasMany or BelongsToMany relationship, you may need to load only a subset of related records rather than all of them.

---

## Decision Criteria

* total number of related records per parent
* whether only a subset is needed for display
* memory constraints
* query performance vs additional queries for filtered data

---

## Decision Tree

Eager loading a collection relationship (HasMany, BelongsToMany)?

↓

Will all related records be displayed/used?

YES → Eager load without constraints

NO → Constrain the eager load with a closure

    `with(['posts' => fn($q) => $q->where('active', true)->limit(5)])`

    Are you constraining to a specific date range?

    YES → Use `whereDate` or `where` in the closure

    Are you limiting the number of related records?

    YES → Use `->limit()` inside the closure

---

## Rationale

Loading all related records when only a few are needed wastes memory and bandwidth. Constrained eager loading filters at the database level. However, constrained loading can be counterintuitive — `$user->posts` will only contain the constrained subset, which may surprise consumers who expect all posts.

---

## Recommended Default

**Default:** Load all related records unless memory or performance constraints dictate otherwise
**Reason:** Unconstrained loading is simpler and avoids confusing partial collections

---

## Risks Of Wrong Choice

Memory exhaustion from loading too many related records, confusing partial collections from constrained loading, N+1 from compensating queries after constrained loading.

---

## Related Rules

- Selective-Eager-Loading (eager-loading-fundamentals/05-rules.md)
- Dots-Add-Queries (eager-loading-fundamentals/05-rules.md)

---

## Related Skills

- Prevent N+1 with strategic eager loading (eager-loading-fundamentals/06-skills.md)
