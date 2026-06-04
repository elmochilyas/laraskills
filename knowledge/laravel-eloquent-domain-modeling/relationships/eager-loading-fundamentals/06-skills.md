# Eager Loading Fundamentals Skills

## Skill: Prevent N+1 with strategic eager loading

### Purpose
Use `with()` at query time and `load()` on collections to eliminate the N+1 query problem when accessing relationships in loops, views, and API resources.

### When To Use
- Iterating models and accessing relationships in views, API resources, or loops
- Any request where relationship data is needed — default to eager loading over lazy loading
- Nested relationship access via dot notation for multi-level graphs

### When NOT To Use
- When the relationship is rarely needed (lazy loading may be more efficient for edge cases)
- After pagination if relationships are needed across pages
- When you don't know which relationships will be needed yet

### Prerequisites
- Defined relationship methods on the models
- Understanding of which relationships will be accessed

### Inputs
- Parent query builder instance
- List of relationship names to eager load
- Optional constraint closures for filtered loading

### Workflow
1. Before executing the parent query, call `->with(['relation1', 'relation2'])`
2. Use dot notation for nested relationships: `->with('posts.comments.author')`
3. Use conditional loading via `when()`:
   ```php
   User::when($loadPosts, fn($q) => $q->with('posts'))->get()
   ```
4. For post-retrieval loading, use `$collection->load('relation')` on a collection (not in a loop)
5. Use `$models->load('relation')` on a Collection — this batches to a single query
6. Enable `Model::preventLazyLoading()` in development to catch missing eager loads

### Validation Checklist
- [ ] N+1 is eliminated — query count is O(levels) not O(parents × levels)
- [ ] `with()` is used for relationships known at query time
- [ ] `load()` is used on the collection, not inside a loop
- [ ] Nested dot notation is used for multi-level graphs
- [ ] `preventLazyLoading()` is enabled in development
- [ ] Debugbar/Telescope shows expected query count

### Common Failures
- Calling `$model->load()` inside a loop (recreates N+1)
- Not eager-loading before pagination — only current page gets relationships
- Assuming nested eager loading is 1 query — each dot adds a separate query
- Eager loading after pagination for cross-page relationship access

### Decision Points
- **with() vs load()?** — Use `with()` when relationships are known at query time; use `load()` when relationships are needed conditionally after the query
- **load() on collection vs loop?** — Always call `load()` on the collection (1 query); never call `load()` inside a loop (N queries)

### Performance Considerations
- Eager loading guarantees O(levels) queries rather than O(parents × levels)
- Memory cost scales with total related rows — all related models are hydrated
- Very large parent sets (>10,000) may hit SQL `max_allowed_packet` on `WHERE IN`
- Each relationship level adds exactly one query regardless of parent set size

### Security Considerations
- Eager loading doesn't bypass model security — relationships must be defined explicitly
- Ensure eager-loaded relationships are authorized if they contain sensitive data

### Related Rules
- [Always-Eager-Load-In-Loops](../eager-loading-fundamentals/05-rules.md)
- [Prevent-Lazy-Loading-Dev](../eager-loading-fundamentals/05-rules.md)
- [Dots-Add-Queries](../eager-loading-fundamentals/05-rules.md)
- [Not-Load-In-Loops](../eager-loading-fundamentals/05-rules.md)
- [Selective-Eager-Loading](../eager-loading-fundamentals/05-rules.md)

### Related Skills
- Use loadMissing for defensive relationship loading
- Profile and verify query count expectations

### Success Criteria
- Query count is fixed regardless of parent record count
- No lazy loading violations in development
- All relationship access in loops is preceded by eager loading
- API resources and Blade templates don't trigger N+1

---

## Skill: Use loadMissing for defensive relationship loading

### Purpose
Use `loadMissing()` in API resources, middleware, and reusable components to load relationships only if they aren't already loaded, preventing redundant queries.

### When To Use
- API resources that access relationships in `toArray()`
- Reusable view components that need relationship data
- Middleware that enriches models with additional data
- Any context where the relationship may or may not be pre-loaded

### When NOT To Use
- When the relationship is never pre-loaded by calling code (use `load()` instead)
- When you always want to refresh the relationship data

### Prerequisites
- Model collection or instance
- Relationship name to load

### Inputs
- Model collection or instance
- Relationship name(s) to load if missing

### Workflow
1. In API resource `toArray()`, call `$this->resource->loadMissing('relation')`
2. The method checks the model's `$relations` array before querying
3. If the relationship is already loaded (from `with()` or prior `load()`), no query is executed
4. Use for multiple relationships: `$model->loadMissing(['relation1', 'relation2'])`

### Validation Checklist
- [ ] `loadMissing()` is used instead of `load()` in reusable components
- [ ] Redundant relationship queries are eliminated
- [ ] Calling code can pre-load relationships without triggering duplicate queries
- [ ] Resource works correctly whether relationship is pre-loaded or not

### Common Failures
- Using `load()` unconditionally in API resources — loads relationship even if pre-loaded
- Not using `loadMissing()` in view composers or Blade components that render relationship data
- Assuming `loadMissing()` refreshes stale data — it only loads if absent

### Decision Points
- **loadMissing vs load?** — Always prefer `loadMissing()` in reusable components where calling code may have already eager-loaded; use `load()` when you know the relationship is never pre-loaded

### Performance Considerations
- `loadMissing()` eliminates redundant queries in composed/stacked rendering scenarios
- Zero overhead when relationship is already loaded — just a property check
- Most impactful in deeply nested view hierarchies or chained API resources

### Security Considerations
- `loadMissing()` doesn't add authorization — relationships are loaded regardless of permissions

### Related Rules
- [LoadMissing-Defensive-Pattern](../eager-loading-fundamentals/05-rules.md)

### Related Skills
- Prevent N+1 with strategic eager loading

### Success Criteria
- API resources work correctly whether or not the relationship is pre-loaded
- No redundant relationship queries from reusable components
- Calling code can optimize hot paths without breaking defensive loading

---

## Skill: Profile and verify query count expectations

### Purpose
Use Laravel Debugbar, Telescope, or manual query logging to verify that eager loading is working correctly and the N+1 problem is eliminated.

### When To Use
- After adding eager loading to verify it works
- During code review to spot missing `with()` calls
- Performance investigation of slow pages
- CI pipelines to enforce query count limits

### When NOT To Use
- In production without monitoring tooling (use Telescope in production)

### Prerequisites
- Laravel Debugbar or Telescope installed (development)
- Defined relationship methods

### Inputs
- Route/controller code with model queries
- Debugbar panel or Telescope query screen

### Workflow
1. Install Laravel Debugbar (development) or Telescope (development/production)
2. For any endpoint or command, check the query count in Debugbar
3. Verify that iterating 100 models with relationship access shows exactly 2 queries (1 parent + 1 relationship), not 101
4. For nested loading, verify the query count matches expected: `with('a.b.c')` = 4 queries
5. Enable `Model::preventLazyLoading()` in AppServiceProvider (development only)
6. For CI, use PHPUnit constraints that assert query count with `DB::enableQueryLog()`

### Validation Checklist
- [ ] Query count matches expectations (1 + relationships accessed)
- [ ] No unexpected queries from lazy loading
- [ ] `preventLazyLoading()` is enabled in development
- [ ] Debugbar/Telescope confirms N+1 is resolved
- [ ] CI test asserts query count for critical endpoints

### Common Failures
- Debugbar showing 101 queries for a 100-item loop with relationship access
- Nested dot notation producing unexpected query count
- `load()` in loops not detected without profiling
- `$with` on model adding hidden queries not visible in controller code

### Decision Points
- **Debugbar or Telescope?** — Debugbar for per-request debugging in development; Telescope for aggregated query monitoring in development/staging

### Performance Considerations
- Debugbar adds overhead — disable in production
- Telescope is lighter but still has overhead — use selectively in production

### Security Considerations
- Debugbar exposes query data — never enable in production
- Telescope can be secured via gate authorization

### Related Rules
- [Always-Eager-Load-In-Loops](../eager-loading-fundamentals/05-rules.md)
- [Prevent-Lazy-Loading-Dev](../eager-loading-fundamentals/05-rules.md)

### Related Skills
- Prevent N+1 with strategic eager loading

### Success Criteria
- Query count is verified against expectations
- No lazy loading violations
- CI prevents query count regressions
- Team has visibility into query behavior
