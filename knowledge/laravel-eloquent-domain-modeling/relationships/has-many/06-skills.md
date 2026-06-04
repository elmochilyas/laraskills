# HasMany Skills

## Skill: Configure HasMany with cascade deletes and ordering

### Purpose
Define a one-to-many `HasMany` relationship with proper foreign key indexing, cascade deletes, default ordering, and the inverse `BelongsTo` on the child model.

### When To Use
- One-to-many hierarchies: User→Posts, Category→Products, Team→Members
- Any relationship where a parent aggregates a collection of subordinate records
- Self-referential hierarchies: Post→Comments

### When NOT To Use
- Many-to-many relationships (use `BelongsToMany`)
- Singular relationships (use `HasOne`)
- Through-related distant models (use `HasManyThrough`)
- Polymorphic relationships (use `MorphMany`)

### Prerequisites
- Parent model and child model
- Child table with foreign key column

### Inputs
- Relationship method name
- Foreign key column name (defaults to snake_case parent + `_id`)
- Local key on parent (defaults to `id`)
- Optional default ordering

### Workflow
1. In the child migration: `$table->foreignId('parent_id')->constrained()->cascadeOnDelete()->index()`
2. On the parent model, define `return $this->hasMany(Child::class)`
3. For non-conventional keys: `$this->hasMany(Child::class, 'foreign_key', 'local_key')`
4. Add default ordering when order matters: `->hasMany(Comment::class)->latest()`
5. Always define the inverse `BelongsTo` on the child model
6. Use `$parent->children()->create($data)` to create children with auto-assigned FK

### Validation Checklist
- [ ] Child table has foreign key column indexed
- [ ] Foreign key has `cascadeOnDelete()` (or cleanup is handled in events)
- [ ] Inverse `BelongsTo` is defined on the child model
- [ ] Default ordering is set when order matters for the domain
- [ ] `$parent->children` returns a Collection (not null when empty)
- [ ] `create()` through relationship auto-assigns the FK

### Common Failures
- Missing cascade delete — orphaned children accumulate
- Missing inverse `BelongsTo` — child can't navigate to parent
- No default ordering — unpredictable child order across requests
- Missing FK index — slow eager loading and existence queries
- Unbounded `get()` on large child sets — memory exhaustion

### Decision Points
- **Required or optional relationship?** — Use `cascadeOnDelete()` for required; use `nullOnDelete()` or event-based cleanup for optional
- **Default ordering or consumer-specified?** — Set default on relationship definition for consistent default; let consumers override with `->reorder()`

### Performance Considerations
- Eager loading is essential: `Parent::with('children')->get()` = 2 queries
- `withCount('children')` is more efficient than loading + PHP counting
- Index the FK column for all relationship queries
- Use `chunkById()` or `lazy()` for memory-safe batch processing of large sets

### Security Considerations
- Ensure child model has `$fillable` configured for relationship creation
- Validate parent existence before bulk child creation
- Mass assignment protection applies through relationship creation

### Related Rules
- [HasMany-Cascade-Or-Cleanup](../has-many/05-rules.md)
- [HasMany-Inverse-BelongsTo](../has-many/05-rules.md)
- [HasMany-Ordering-For-Consistency](../has-many/05-rules.md)
- [HasMany-Filter-In-DB-Not-PHP](../has-many/05-rules.md)
- [HasMany-Chunk-For-Large-Sets](../has-many/05-rules.md)

### Related Skills
- Eager load and paginate HasMany relationships
- Count children without loading them

### Success Criteria
- `$parent->children` returns a Collection (empty when no children)
- Deleting parent cascades to children
- Children have consistent default ordering
- Inverse navigation works (child→parent)
- FK column is indexed

---

## Skill: Eager load and paginate HasMany relationships

### Purpose
Eager-load `HasMany` relationships to prevent N+1 and use pagination to keep memory usage bounded for large child collections.

### When To Use
- Displaying parent-child lists with children in views or APIs
- Any page where parent models and their children are accessed in a loop
- List endpoints where parents may have thousands of children

### When NOT To Use
- When only a count is needed (use `withCount()`)
- When iterating fewer than 5 parent models

### Prerequisites
- Defined `HasMany` relationship on the parent
- Defined `BelongsTo` on the child

### Inputs
- Parent query builder instance
- Relationship name to eager load
- Pagination page size

### Workflow
1. Eager load before iteration: `Parent::with('children')->get()` or `Parent::with('children')->paginate()`
2. Use pagination on the relationship for individual parent child lists: `$parent->children()->paginate(20)`
3. For constrained child loading, use closures: `Parent::with(['children' => fn($q) => $q->where('active', true)])`
4. Never call `$model->load('children')` inside a loop — call `$collection->load('children')` instead
5. Never eager load after pagination — call `with()` before `paginate()`

### Validation Checklist
- [ ] N+1 is prevented — query count is fixed regardless of parent count
- [ ] Pagination is used instead of unbounded `get()` on relationship
- [ ] `with()` is called before `paginate()` (not after)
- [ ] `load()` is called on the collection, not inside a loop
- [ ] No memory exhaustion from giant unconstrained loads

### Common Failures
- Accessing `$user->posts` inside `@foreach` without prior eager loading
- `get()` without `limit()` or `paginate()` — loads all children into memory
- Calling `load()` in a loop — recreates N+1
- Eager loading after pagination — only current page gets relationships

### Decision Points
- **paginate() or cursorPaginate()?** — Use `paginate()` for traditional page-based pagination with total count; use `cursorPaginate()` for infinite scroll/comments (no count query)

### Performance Considerations
- Pagination limits both query rows and memory usage
- `cursorPaginate()` avoids count query overhead for large datasets
- For constrained loading use closures inside `with()` to reduce related data

### Security Considerations
- Ensure paginated relationship data respects authorization boundaries
- Don't expose total counts that could leak sensitive information

### Related Rules
- [HasMany-Eager-Load-Loops](../has-many/05-rules.md)
- [HasMany-Paginate-Not-Get](../has-many/05-rules.md)

### Related Skills
- Configure HasMany with cascade deletes and ordering

### Success Criteria
- Query count is fixed (2 queries: parents + children)
- Pagination correctly limits rows returned
- No memory issues with large child collections
- No N+1 in views or API resources

---

## Skill: Count children without loading them

### Purpose
Use `withCount()` to retrieve child record counts as aggregates without hydrating full child model instances.

### When To Use
- Displaying counts alongside parent records (comment count, post count, member count)
- Filtering parents by child count (posts with >5 comments)
- Any context where only the number of children is needed

### When NOT To Use
- When the actual child models are needed for display alongside the count
- When the count needs to be filtered by child attributes (use constrained `withCount()`)

### Prerequisites
- Defined `HasMany` relationship on the parent

### Inputs
- Parent query builder instance
- Relationship name(s) to count

### Workflow
1. Add `->withCount('children')` to the parent query
2. Access the count via `$parent->children_count` (auto-generated attribute)
3. For filtered counts, use a closure: `->withCount(['comments' => fn($q) => $q->where('approved', true)])`
4. Access filtered count via the same `_count` suffix pattern
5. Use `whereHas()` or `has()` for filtering parents by count conditions

### Validation Checklist
- [ ] Count is obtained via `withCount()`, not by loading + PHP counting
- [ ] Count attribute is accessed as `$parent->children_count`
- [ ] Constrained counts correctly filter only relevant children
- [ ] No child model hydration occurs for counting

### Common Failures
- Loading full child models just to count them (`$user->load('posts'); $user->posts->count()`)
- Using `withCount()` when actual child models are also needed (use `with()` + `withCount()`)
- Not using constrained `withCount()` when counting filtered subsets

### Decision Points
- **withCount or with + PHP count?** — Always use `withCount()` when only the count is needed; use `with()` when actual models are needed (can use both)

### Performance Considerations
- `withCount()` adds a single aggregate subquery — zero model hydration
- Index the FK column for fast COUNT queries
- Constrained `withCount()` runs one subquery regardless of parent count

### Security Considerations
- Count values are integers — no sensitive data leakage
- Avoid exposing precise counts in contexts where information hiding is important

### Related Rules
- [HasMany-Use-WithCount-Over-Load](../has-many/05-rules.md)
- [HasMany-Filter-In-DB-Not-PHP](../has-many/05-rules.md)

### Related Skills
- Configure HasMany with cascade deletes and ordering

### Success Criteria
- Counts are accurate and match actual child count
- No child model instances are hydrated
- `$parent->children_count` is accessible as an integer
- Constrained counts correctly filter only matching children
