# Lazy Eager Loading Skills

## Skill: Apply lazy eager loading with load() and loadMissing()

### Purpose
Use `load()` and `loadMissing()` to post-retrieval load relationships on already-hydrated models and collections, with defensive patterns to prevent redundant queries and N+1.

### When To Use
- Conditional loading based on runtime logic (admin users get extra relations)
- API resources: defensive `loadMissing()` to ensure relationships are available
- Middleware: loading relationships on the request model for downstream use
- Deferred loading: load common relations first, defer expensive ones

### When NOT To Use
- In a loop (use `load()` on the collection, not individual models)
- When `with()` would be more efficient (relationships known at query time)
- When serializing the model before calling `load()`

### Prerequisites
- Model with defined relationship methods
- Model collection or instance already hydrated

### Inputs
- Model collection or instance
- Relationship name(s) to load
- Optional constraint closures

### Workflow
1. Call `$collection->load('relation')` to batch-load a relationship on all models
2. For conditional loading: `if ($condition) { $model->load('expensiveRelation'); }`
3. In API resources: `$this->resource->loadMissing('comments')` — only loads if not already present
4. Use constraint closures: `$collection->load(['relation' => fn($q) => $q->where('active', true)])`
5. Batch independent loads: `$collection->load(['rel1', 'rel2', 'rel3'])`
6. Never call `$model->load()` inside a loop — call `$collection->load()` instead

### Validation Checklist
- [ ] No `load()` calls inside loops
- [ ] `loadMissing()` is used in reusable components and API resources
- [ ] Relationships known at query time use `with()` instead of `load()`
- [ ] Independent relationships are batched into a single `load()` call
- [ ] No redundant `load()` calls on already-loaded relationships
- [ ] `preventLazyLoading()` is enabled in development

### Common Failures
- Calling `load()` in a loop — recreates N+1
- Using `load()` when `with()` is more efficient — extra round trip
- Not using `loadMissing()` — redundant queries when multiple components load the same relation
- Serializing before calling `load()` — relationship data missing from output
- `load()` on large collections without memory awareness

### Decision Points
- **load() vs with()?** — Use `with()` when relationships are known at query time; use `load()` for conditional or deferred loading
- **load() vs loadMissing()?** — Use `loadMissing()` defensively when the relationship may already be loaded; use `load()` when you know it's never pre-loaded

### Performance Considerations
- Each `load()` call executes a separate database query — batch independent relationships
- `loadMissing()` is very cheap (array key lookup) before optional query
- `load()` on large collections has same memory footprint as `with()`
- For 10,000+ models with large relationships, use chunking instead

### Security Considerations
- `load()` does not bypass authorization — relationships loaded are those defined
- `loadMissing()` prevents redundant queries but doesn't add authorization checks

### Related Rules
- [Not-Load-In-Loops](../lazy-eager-loading/05-rules.md)
- [Prefer-With-Over-Load](../lazy-eager-loading/05-rules.md)
- [LoadMissing-For-Reusable-Components](../lazy-eager-loading/05-rules.md)
- [Batch-Independent-Loads](../lazy-eager-loading/05-rules.md)
- [Load-Memory-Awareness](../lazy-eager-loading/05-rules.md)
- [Load-After-Pagination-Correct](../lazy-eager-loading/05-rules.md)

### Related Skills
- Prevent N+1 with strategic eager loading

### Success Criteria
- Relationships are correctly loaded on post-retrieval models
- No `load()` calls inside loops
- `loadMissing()` prevents redundant queries in reusable components
- Batch `load()` calls reduce round trips
- No lazy loading violations

---

## Skill: Batch independent relationship loads for performance

### Purpose
Combine multiple `load()` calls into a single batch to reduce database round trips and consolidate query execution.

### When To Use
- Loading multiple relationships on the same collection
- When independent relationships need to be loaded together
- Any post-retrieval loading that isn't conditional

### When NOT To Use
- When some loads depend on results of previous loads (cannot batch)
- When using `loadMissing()` where relationships may already be loaded

### Prerequisites
- Model collection or instance
- List of relationship names to load

### Inputs
- Collection or model instance
- Array of relationship names: `['posts', 'profile', 'roles']`

### Workflow
1. Replace chained `$collection->load('rel1'); $collection->load('rel2');` with `$collection->load(['rel1', 'rel2'])`
2. This still executes one query per relationship, but the queries are dispatched together
3. Use constraint closures within the batch when needed: `$collection->load(['posts' => fn($q) => $q->where('published', true), 'profile'])`
4. For conditional batching, load all unconditionally needed relations first, then conditionally load the rest

### Validation Checklist
- [ ] Separate `load()` calls are combined into a single batch
- [ ] Query count is reduced (same number of queries, fewer round trips)
- [ ] Constraint closures work correctly within the batch

### Common Failures
- Not batching independent loads — extra round trips
- Batching loads that should be conditional (loaded even when not needed)

### Decision Points
- **Batch or separate?** — Batch when all loads are independent and needed; separate when some are conditional

### Performance Considerations
- Batching reduces round trips but doesn't reduce total query count
- Most impactful on high-latency database connections
- Negligible difference on local development databases

### Security Considerations
- None — batching doesn't change what data is loaded

### Related Rules
- [Batch-Independent-Loads](../lazy-eager-loading/05-rules.md)

### Related Skills
- Apply lazy eager loading with load() and loadMissing()

### Success Criteria
- Multiple relationships loaded in a single batch call
- Round trips minimized
- No functional difference from separate calls
