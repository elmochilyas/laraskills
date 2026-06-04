# Skill: Implement Scoped Bindings for Nested Routes

## Purpose

Enable automatic scoped route model binding on nested routes so that child model resolution includes a `WHERE parent_id = ?` constraint, preventing cross-resource access where users could access child resources that don't belong to the specified parent.

## When To Use

- ALL nested resource routes
- Multi-tenant applications where resources must be scoped to the tenant
- API routes with parent-child relationships
- Routes where cross-resource access would be a security issue

## When NOT To Use

- Routes where the child resource is globally unique (e.g., UUID-based IDs)
- Routes where the parent-child relationship is optional
- When `withoutScopedBindings()` is explicitly needed for a specific use case

## Prerequisites

- Parent and child Eloquent models with proper `belongsTo`/`hasMany` relationships
- Route with nested parameters: `posts/{post}/comments/{comment}`
- Child table has a foreign key column referencing the parent

## Inputs

- Parent route parameter name
- Child route parameter name
- Route definition (resource or manual)

## Workflow

1. For nested resource routes, use `Route::resource('posts.comments', CommentController::class)` — scoping is automatic in Laravel 8+
2. For manual routes, chain `->scopeBindings()`: `Route::get('/posts/{post}/comments/{comment}', ...)->scopeBindings()`
3. In the controller, type-hint both parent and child models: `public function show(Post $post, Comment $comment)`
4. Verify scoping works: request `/posts/1/comments/999` where comment 999 belongs to post 2 — should return 404
5. If scoping needs to be disabled, use `->withoutScopedBindings()` with an inline comment explaining why
6. Add a composite database index on `(parent_id, id)` for the child table

## Validation Checklist

- [ ] Nested resource routes auto-scope (Laravel 8+)
- [ ] Manual nested routes use `->scopeBindings()`
- [ ] Controller type-hints both parent and child models
- [ ] Cross-resource requests return 404 (child not belonging to parent)
- [ ] `withoutScopedBindings()` has a comment explaining the exception
- [ ] Composite index `(parent_id, id)` exists on the child table
- [ ] Controller does NOT duplicate scoping with manual `$post->comments()->findOrFail()`

## Common Failures

### Not scoping nested routes
Defining nested routes without scoping allows access to child resources regardless of parent context. Always enable scoped bindings.

### Assuming resource routes are not scoped
Writing `$post->comments()->findOrFail($commentId)` in controllers when route scoping already handles it. Rely on route-level scoping and remove controller-level duplication.

### Disabling scoping without justification
Using `withoutScopedBindings()` for convenience during development creates production security gaps. Document every disablement.

## Decision Points

### Resource vs Manual routes for scoping?
Resource routes auto-scope — preferred when the standard 5/7 actions are needed. Manual routes need explicit `->scopeBindings()`.

### Scoped vs unscoped?
Enable scoping by default for all nested routes. Only disable when the child uses globally unique identifiers (UUIDs).

## Performance Considerations

- Scoped bindings add one WHERE clause to the child query — negligible overhead
- Composite index on `(parent_id, id)` ensures efficient query execution
- Without composite index, the database may scan rows matching `parent_id` to find the specific `id`
- The additional WHERE clause may improve performance by reducing the result set

## Security Considerations

- Scoped bindings prevent cross-resource access — a primary defense against IDOR (Insecure Direct Object Reference) vulnerabilities
- Scoped bindings do NOT replace authorization — authorization verifies user permissions, scoping verifies parent-child relationship
- In multi-tenant apps, scoped bindings prevent tenant A from accessing tenant B's child resources
- `withoutScopedBindings()` creates a security gap — document and review every usage

## Related Rules

- Enable Scoped Bindings for All Nested Routes
- Require Documentation for withoutScopedBindings()
- Prefer Resource Routes for Automatic Scoping
- Do Not Duplicate Scoping in Controllers

## Related Skills

- Add Composite Indexes for Scoped Binding Performance
- Implement Implicit Route Model Binding
- Configure Nested Resources with Shallow Nesting

## Success Criteria

- Nested routes with scoped bindings return 404 for child resources not belonging to the parent
- No manual `$parent->children()->findOrFail()` duplication in controllers
- `withoutScopedBindings()` usage is documented and justified
- Composite indexes exist on child tables for scoped queries
- Multi-tenant isolation is maintained through scoped bindings

---

# Skill: Add Composite Indexes for Scoped Binding Performance

## Purpose

Create composite database indexes on `(parent_id, id)` for child tables used in scoped route bindings, ensuring that the scoped binding query `WHERE parent_id = ? AND id = ?` executes as a single index seek rather than a table scan or inefficient multi-index lookup.

## When To Use

- All child tables in nested resource routes with scoped bindings
- Tables with more than 1000 rows where scoped binding queries execute frequently
- Any table where `WHERE parent_id = ? AND id = ?` is a common query pattern

## When NOT To Use

- Tables with very low row counts (< 1000) where the index overhead may not justify the benefit
- Tables where the child resource uses a UUID primary key and scoping is not needed

## Prerequisites

- Child table with a foreign key column referencing the parent
- Scoped binding configured on the nested route
- Understanding of composite index column order

## Inputs

- Child table name
- Foreign key column name (e.g., `post_id`)
- Primary key or binding column name (e.g., `id`)

## Workflow

1. Identify all nested routes with scoped bindings in the application
2. For each child table, identify the parent foreign key column
3. Open the child table's migration file
4. Add a composite index: `$table->index(['post_id', 'id']);`
5. Run `php artisan migrate` to create the index
6. Verify the index with `php artisan db:show --table=comments` or database tooling
7. Monitor query performance to confirm the index is used (EXPLAIN SELECT)

## Validation Checklist

- [ ] Composite index exists on `(foreign_key, id)` for every child table
- [ ] The foreign key column is the first column in the composite index
- [ ] The child table has a proper foreign key constraint (optional but recommended)
- [ ] Migration has been run and the index is active
- [ ] EXPLAIN shows the composite index is used for scoped binding queries

## Common Failures

### Separate indexes instead of composite
Having separate indexes on `post_id` and `id` does not optimize the combined query. A composite index on both columns in the correct order is needed.

### Wrong column order
Indexing `(id, post_id)` is less effective because the primary key already provides uniqueness. The foreign key must be the first column in the composite index.

### Missing index entirely
Without an index, the scoped binding query must scan the entire child table. Add the index in the migration, not after deployment.

## Decision Points

### Composite vs individual indexes?
Composite `(parent_id, id)` for scoped binding queries. Individual `parent_id` index is also useful but does not optimize the combined WHERE clause.

### When to add the index?
Add in the column's original migration for new tables. Add in a new migration for existing tables.

## Performance Considerations

- Scoped binding query: `SELECT * FROM comments WHERE post_id = ? AND id = ?`
- Without composite index: either index on `post_id` (filter by parent, then scan for id) or PK index (find by id, then check parent_id)
- With composite index `(post_id, id)`: single B-tree seek to the exact row
- Index overhead: additional storage (~20 bytes per row for the index entry) and write-time cost during inserts/updates

## Security Considerations

- No direct security impact — indexes only affect query performance
- A missing index can cause slow page loads under load, enabling timing-based attacks in extreme cases

## Related Rules

- Add Composite Indexes on (parent_id, id)
- Enable Scoped Bindings for All Nested Routes
- Prefer Resource Routes for Automatic Scoping

## Related Skills

- Implement Scoped Bindings for Nested Routes
- Configure Custom Route Keys (indexing related)
- Implement Implicit Route Model Binding

## Success Criteria

- Composite `(parent_id, id)` index exists for every child table in scoped binding routes
- EXPLAIN shows index seek for scoped binding queries
- Migration code is committed and deployed
- No performance degradation from scoped binding queries under load
