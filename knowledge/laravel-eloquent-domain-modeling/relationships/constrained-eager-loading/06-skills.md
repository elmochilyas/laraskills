# Constrained Eager Loading Skills

## Skill: Apply constrained eager loading with proper foreign key inclusion

### Purpose
Filter, order, and limit related records during eager loading using closure-based constraints while ensuring relationship hydration works correctly.

### When To Use
- Loading only active/approved/published related records
- Column reduction to avoid loading large text/JSON columns
- Ordered related records (by pivot column, by date, etc.)
- Loading specific subsets of large relationship sets

### When NOT To Use
- When all related records are needed (unconstrained `with()` is simpler)
- When using `limit()` and expecting per-parent behavior (use `limitBy()`)
- When the constraint matches 90%+ of rows (low selectivity — no benefit)

### Prerequisites
- Defined relationship on the parent model
- Understanding of the relationship's foreign key column(s)

### Inputs
- Relationship name string
- Constraint closure with query builder methods
- Foreign key column name (for select inclusion)

### Workflow
1. Start with `with(['relation' => fn($q) => ...])` syntax
2. Inside the closure, add `where`, `orderBy`, `select`, or other query builder methods
3. If using `select()` for column reduction, ALWAYS include the foreign key: `$q->select('id', 'user_id', 'title')`
4. For per-parent limiting, use `limitBy()` not `limit()`
5. Always pair `limit()`/`limitBy()` with `orderBy()` for deterministic results
6. Extract complex closures into named query scopes on the related model for reusability

### Validation Checklist
- [ ] Foreign key is included in any constrained `select()` call
- [ ] Per-parent limiting uses `limitBy()`, not `limit()` (unless global limit is intended)
- [ ] `limit()` is paired with `orderBy()` for deterministic results
- [ ] Complex constraints are extracted to named scopes when reused
- [ ] Constraint selectivity is verified — the constraint actually reduces the result set
- [ ] Generated SQL inspected via `toSql()` to confirm correctness

### Common Failures
- Omitting the foreign key from `select()` — Eloquent can't match related models to parents
- Using `limit()` expecting per-parent behavior but getting global limit
- No `orderBy()` with `limit()` — non-deterministic results
- Low-selectivity constraints (matching 90%+ of rows) — no benefit

### Decision Points
- **Inline closure or named scope?** — Use inline closures for simple one-off constraints; extract to named scopes when the same constraint is used in multiple places
- **Limit or limitBy?** — Use `limit()` only when the total related record count matters; use `limitBy()` (Laravel 8.52+) for per-parent limits

### Performance Considerations
- Constrained loading is the single most effective technique for controlling eager-loading memory usage (10–100× reduction)
- Column reduction prevents unnecessary data transfer from the database
- `limitBy()` uses window functions internally — test on large datasets
- Nested constraints add complexity but don't increase query count

### Security Considerations
- Constrained loading filters at the database level — no data reaches PHP that isn't explicitly selected
- Column reduction prevents exposing sensitive columns in API responses
- Ensure constraint closures don't leak sensitive data (e.g., eager-loading hidden relationships)

### Related Rules
- [Constrained-Select-Include-Foreign-Key](../constrained-eager-loading/05-rules.md)
- [Use-LimitBy-Not-Limit](../constrained-eager-loading/05-rules.md)
- [Extract-Complex-Closures](../constrained-eager-loading/05-rules.md)
- [Pair-OrderBy-With-Limit](../constrained-eager-loading/05-rules.md)
- [Verify-Constraint-Selectivity](../constrained-eager-loading/05-rules.md)
- [Nested-Constraint-Consistency](../constrained-eager-loading/05-rules.md)

### Related Skills
- Limit related records per parent using limitBy
- Count related records with constrained aggregates

### Success Criteria
- Eager loading returns only the intended subset of related records
- All related models are correctly matched to their parents
- Foreign key is never omitted from select
- Per-parent limits are correctly applied
- Generated SQL is correct and efficient

---

## Skill: Limit related records per parent using limitBy

### Purpose
Apply per-parent limits on eager-loaded relationships using `limitBy()` to load only the top N related records for each parent.

### When To Use
- Loading the 5 most recent posts per user
- Loading the 3 latest comments per post
- Loading the top N related records per parent for dashboards, feeds, or summaries

### When NOT To Use
- When global limiting is the actual requirement (use `limit()`)
- On Laravel versions before 8.52 (use alternative strategies)
- When all related records are needed for each parent

### Prerequisites
- Laravel 8.52+ (for `limitBy()`)
- Defined relationship on the parent model

### Inputs
- Relationship name string
- Maximum number of related records per parent
- Ordering criteria (must be paired with `orderBy()`)

### Workflow
1. Use `with(['relation' => fn($q) => $q->orderBy('column', 'desc')->limitBy($n)])`
2. Always specify `orderBy()` before `limitBy()` for deterministic results
3. Verify with `toSql()` that the generated query uses window functions (ROW_NUMBER)
4. Test with realistic data volumes — `limitBy()` uses window functions which have performance characteristics

### Validation Checklist
- [ ] `limitBy()` is used instead of `limit()` (confirm per-parent behavior)
- [ ] `orderBy()` is specified before `limitBy()` for deterministic results
- [ ] Generated SQL uses ROW_NUMBER window function (verify via `toSql()`)
- [ ] Performance is acceptable with realistic data volumes

### Common Failures
- Using `limit()` instead of `limitBy()` — returns N total records not N per parent
- Not pairing with `orderBy()` — non-deterministic which records are returned
- Using on pre-8.52 Laravel — `limitBy()` doesn't exist

### Decision Points
- **limitBy vs custom joins?** — Prefer `limitBy()` for simplicity; use custom join + subquery only when `limitBy()` doesn't meet your needs

### Performance Considerations
- `limitBy()` uses ROW_NUMBER() OVER (PARTITION BY ...) internally
- On large datasets, window functions can be expensive — profile with `EXPLAIN`
- The partitioned column should be indexed for best performance

### Security Considerations
- None specific — it's a data retrieval optimization

### Related Rules
- [Use-LimitBy-Not-Limit](../constrained-eager-loading/05-rules.md)
- [Pair-OrderBy-With-Limit](../constrained-eager-loading/05-rules.md)

### Related Skills
- Apply constrained eager loading with proper foreign key inclusion

### Success Criteria
- Each parent gets exactly N (or fewer) related records
- Results are deterministic with explicit ordering
- Generated query uses ROW_NUMBER window function
- Performance is acceptable for the dataset

---

## Skill: Count related records with constrained aggregates

### Purpose
Use `withCount()` with constraint closures to count filtered related records without hydrating full model instances.

### When To Use
- Displaying counts of related records (comment count, post count)
- Filtering parents by related record count (posts with >5 approved comments)
- When only the count is needed, not the actual models

### When NOT To Use
- When the actual related models are needed for display alongside the count
- When the count is unconstrained (simple `withCount('relation')` suffices)

### Prerequisites
- Defined relationship on the parent model
- Understanding of the constraint conditions

### Inputs
- Relationship name string
- Constraint closure with where conditions

### Workflow
1. Use `withCount(['relation' => fn($q) => $q->where('condition')])`
2. Access the count via `$parent->relation_count` (or `relation_count` for custom name)
3. Use constrained `has()` for filtering by count: `->has('comments', '>', 5)` or `->whereHas('comments', fn($q) => ...)`
4. Extract complex count constraints into named scopes for reusability

### Validation Checklist
- [ ] Count is obtained via `withCount()`, not by loading + PHP counting
- [ ] Constraint correctly filters only the relevant related records
- [ ] Count is accessed via the `_count` suffix attribute
- [ ] Performance is verified with realistic data volumes

### Common Failures
- Loading full related models just to count them (memory bloat)
- Constrained eager loading + `->count()` in PHP instead of `withCount()`
- Forgetting to access the count via the correct attribute name

### Decision Points
- **withCount vs load Count?** — Use `withCount()` when the count is needed alongside the parent records; use `loadCount()` for lazy-loaded counts
- **Constrained has vs collection filter?** — Use `has()`/`whereHas()` for database-level filtering; use collection filtering when parents are already loaded

### Performance Considerations
- `withCount()` adds a single subquery — zero model hydration
- Constrained `withCount()` runs one aggregate query regardless of parent count
- The subquery uses the relationship's foreign key — ensure it's indexed

### Security Considerations
- Constrained count queries filter at database level — no data leakage

### Related Rules
- [Constrained-Count-Not-Load](../constrained-eager-loading/05-rules.md)

### Related Skills
- Apply constrained eager loading with proper foreign key inclusion

### Success Criteria
- Counts are accurate and reflect the constraints
- No model hydration occurs for counting purposes
- Single query (plus parent query) for all counts
