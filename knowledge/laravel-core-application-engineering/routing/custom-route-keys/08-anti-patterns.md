# Anti-Patterns: Custom Route Keys

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Routing System |
| Knowledge Unit | Custom Route Keys |
| Difficulty | Intermediate |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Missing Database Index on Custom Key Column | Performance | Critical |
| 2 | Using UUID as Primary Key on Large Tables | Performance | High |
| 3 | Inline Syntax Without Matching `getRouteKeyName()` for URL Generation | Reliability | High |
| 4 | Model-Level Override for Single-Route Need | Architecture | Medium |
| 5 | Non-Unique Custom Key Column | Reliability | Critical |

---

## Anti-Pattern 1: Missing Database Index on Custom Key Column

### Category
Performance

### Description
Adding a custom route key like `{post:slug}` or `{user:uuid}` without creating a database index on the `slug` or `uuid` column. Every route model binding query performs a full table scan to resolve the model.

### Why It Happens
Developers focus on the route definition and the model setup but forget to update the migration. The index is an invisible requirement — the custom key works correctly without an index, just slowly. As the table grows, the performance degradation is gradual and often attributed to other causes.

### Warning Signs
- Route uses `{post:slug}` but the migration has no index on `slug`
- Database query log shows full table scans for route binding queries
- Response time for bound routes increases linearly with table size
- EXPLAIN on binding query shows `type: ALL` (full table scan)
- Adding a new model with a custom key does not include the index in the migration

### Why Harmful
Route model binding queries are executed on every request to a bound route. A full table scan on a table with 100,000 rows takes 50-200ms per request. With 100 requests/second, this adds 5-20 seconds of database time per second — completely saturating the database. The performance impact scales with table size, making the application slower over time without any code changes.

### Real-World Consequences
- `Post` model uses `{post:slug}` for SEO-friendly URLs
- Migration creates `slug` column without index
- Blog grows to 50,000 posts over 6 months
- Binding query `SELECT * FROM posts WHERE slug = ? LIMIT 1` takes 150ms (full table scan)
- Each blog post page loads in 200ms (50ms framework + 150ms binding)
- Adding index: `ALTER TABLE posts ADD INDEX(slug)` → binding query is 1ms
- Page load drops to 51ms — instant improvement

### Preferred Alternative
Always add a database index (preferably unique) on any column used as a custom route key.

```php
// Wrong: no index on slug
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->string('slug');
    // ...
});

// Correct: unique index on slug
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    // ...
});

// For non-unique columns: add a regular index
Schema::create('posts', function (Blueprint $table) {
    $table->id();
    $table->string('uuid');
    $table->index('uuid');
});
```

### Refactoring Strategy
1. Audit all custom route key columns (`{param:field}` usage in route files)
2. Check database schema for indexes on those columns
3. Create migration to add missing indexes
4. Test binding query performance before and after
5. Add database review to code checklist: "All custom key columns are indexed"

### Detection Checklist
- [ ] Every custom key column has a database index
- [ ] Unique index is present for uniqueness-dependent keys (slugs, UUIDs)
- [ ] Binding query EXPLAIN shows index usage (not full table scan)
- [ ] Migration files include index for each custom key column
- [ ] New resources with custom keys automatically include index in migration

### Related Rules/Skills/Trees
- Rule: Always index custom route key columns
- Rule: Missing index causes full table scan on every binding
- Related KU: Database Indexing, Route Model Binding

---

## Anti-Pattern 2: Using UUID as Primary Key on Large Tables

### Category
Performance

### Description
Using a UUID (version 4) as the primary key for large tables with foreign key relationships, instead of keeping an auto-increment integer as the primary key and using UUID as a secondary indexed column for route binding.

### Why It Happens
UUIDs are conceptually appealing — globally unique, non-enumerable, and distribution-friendly. Developers see them as "better IDs" and make them the primary key. The performance implications (index fragmentation, large foreign keys, slow joins) are not immediately visible in development or on small datasets.

### Warning Signs
- Migration uses `$table->uuid('id')->primary()` instead of `$table->id()`
- Foreign key columns are `uuid` type (16-36 bytes each instead of 4-8 bytes)
- JOIN queries on large tables are slow despite proper indexing
- B-tree index size is 4-5x larger than equivalent integer primary key
- Insert performance degrades as table grows (random UUID distribution causes page splits)

### Why Harmful
UUID primary keys degrade database performance in three ways. First, index size: a UUID primary key index stores 16-36 bytes per entry vs 4-8 bytes for an integer — 4x storage for the same index. Second, join performance: every foreign key reference is 16-36 bytes, increasing memory and disk I/O for JOIN operations. Third, insert performance: random UUIDs (v4) cause B-tree page splits because new rows insert at random positions rather than at the end, increasing index maintenance overhead.

### Real-World Consequences
- `users` table has UUID primary key (36 chars)
- `posts` table has `user_id` foreign key (UUID, 36 chars)
- 1 million users, 5 million posts
- Index on `posts.user_id`: ~180MB for UUID vs ~40MB for integer
- JOIN query: `SELECT * FROM posts JOIN users ON posts.user_id = users.id`
- UUID: ~25ms per query; Integer: ~12ms per query
- Total index space: 500MB vs 120MB

### Preferred Alternative
Keep auto-increment integer as the primary key for relationships. Add a UUID column as a secondary unique index for route binding.

```php
// Wrong: UUID as primary key
Schema::create('users', function (Blueprint $table) {
    $table->uuid('id')->primary();
    // Foreign keys in related tables must also be UUID
});

// Correct: integer primary key + UUID secondary column
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->uuid('uuid')->unique(); // For route binding
    // Foreign keys use integer for performance
});

// Route uses the secondary column
Route::get('/api/users/{user:uuid}', [UserController::class, 'show']);

// Model sets the route key
class User extends Model
{
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }
}
```

### Refactoring Strategy
1. If using UUID primary key, evaluate table size and join frequency
2. For large tables with frequent joins, consider migrating to integer primary key
3. Add UUID secondary column with unique index
4. Update `getRouteKeyName()` to use the secondary UUID column
5. Update foreign key references to use the integer primary key
6. Test join performance before and after migration

### Detection Checklist
- [ ] Primary keys are auto-increment integers (not UUIDs) on large tables
- [ ] Foreign keys are integers (not UUIDs)
- [ ] UUID columns exist as secondary unique indexes for route binding
- [ ] Join performance is optimal (no UUID overhead)
- [ ] Index size is proportional to data volume (not inflated by UUID width)

### Related Rules/Skills/Trees
- Rule: Use integer primary keys for relationships, UUID secondary for route binding
- Rule: UUID primary keys degrade join performance on large tables
- Related KU: Database Indexing, Eloquent Model Keys

---

## Anti-Pattern 3: Inline Syntax Without Matching `getRouteKeyName()` for URL Generation

### Category
Reliability

### Description
Using inline syntax `{post:slug}` in the route definition for resolution but leaving `getRouteKeyName()` returning `'id'`. The route resolves by `slug` but `route('posts.show', $post)` generates URLs with the `id` — creating a mismatch between resolution and URL generation.

### Why It Happens
Developers fix the binding resolution (using `{post:slug}` to bind by slug) but forget that URL generation uses `getRouteKeyName()` independently. The `route()` helper calls `$model->getRouteKey()`, which returns `$this->{$this->getRouteKeyName()}`, ignoring the inline syntax.

### Warning Signs
- Route uses `{post:slug}` but `getRouteKeyName()` returns `'id'`
- URLs generated by `route('posts.show', $post)` contain numeric IDs instead of slugs
- Generated URLs work but look wrong (`/posts/42` instead of `/posts/my-post`)
- Mixed URLs in the application: some generated URLs use slugs, some use IDs
- Frontend developers report inconsistent URL patterns

### Why Harmful
URLs generated by the application are inconsistent with the route definition. The route resolves by slug, but generated URLs contain the ID. This means links generated by the application do not match the URL pattern consumers expect. SEO is affected (duplicate URLs with different parameters). If the route has `where` constraints expecting a slug pattern (`[a-z-]+`), the generated numeric ID may not match, causing 404s.

### Real-World Consequences
- Route: `/blog/{post:slug}` — resolves by slug
- `getRouteKeyName()` returns `'id'` (default)
- `route('posts.show', Post::find(42))` generates `/blog/42`
- Request to `/blog/42` → route resolves `{post}` → tries to bind by slug → `Post::where('slug', 42)->first()` → null → 404
- All generated links to blog posts are broken
- Fix: override `getRouteKeyName()` to return `'slug'`

### Preferred Alternative
When using inline syntax `{post:slug}`, also set `getRouteKeyName()` to return the same field name so that URL generation produces correct URLs.

```php
// Route definition
Route::get('/blog/{post:slug}', [PostController::class, 'show'])->name('posts.show');

// If using inline syntax only on specific routes: override getRouteKey()
// Or use inline + set getRouteKeyName() to match
class Post extends Model
{
    public function getRouteKeyName(): string
    {
        return 'slug'; // Match the inline binding field
    }
}

// Now route('posts.show', $post) generates /blog/my-post
// And the route resolves by slug — consistent!
```

### Refactoring Strategy
1. Audit all inline binding field usages (`{param:field}`) in route files
2. For each, check if `getRouteKeyName()` matches the binding field
3. Update `getRouteKeyName()` to return the binding field for affected models
4. Or override `getRouteKey()` to return the binding field value
5. Test URL generation produces correct URLs matching the route pattern

### Detection Checklist
- [ ] `route()` helper generates URLs matching the route's binding field
- [ ] No mismatch between inline syntax and `getRouteKeyName()`
- [ ] Generated URLs work when loaded in the browser
- [ ] SEO URLs contain semantic identifiers (slugs), not numeric IDs
- [ ] All URL generation paths produce consistent patterns

### Related Rules/Skills/Trees
- Rule: URL generation uses getRouteKeyName(), not inline binding field
- Rule: Inline syntax without matching getRouteKeyName() produces broken URLs
- Related KU: Route Name Generation, Route Model Binding

---

## Anti-Pattern 4: Model-Level Override for Single-Route Need

### Category
Architecture

### Description
Overriding `getRouteKeyName()` on the model to change binding for a single route, when only that one route needs a non-default key. The global override changes binding behavior for ALL routes referencing that model, potentially breaking routes that expect ID-based binding.

### Why It Happens
Developers discover `getRouteKeyName()` first — it is prominently documented and straightforward to implement. The inline syntax `{post:slug}` is less visible and may be unknown. The model-level override seems like "the right way" to set the route key.

### Warning Signs
- `getRouteKeyName()` is overridden but only one or two routes actually use the custom key
- Admin routes that should use IDs for binding are suddenly using slugs
- URL generation changes for all routes (both public and admin)
- API consumers receive IDs in responses even though the model uses slug binding
- Inconsistency: admin panel uses slugs in URLs (less readable) while API uses IDs

### Why Harmful
A model-level override is an implicit global change. Every route, every URL generation, every binding — all are affected. An admin route `/admin/users/{user}` that previously used IDs now uses slugs, breaking existing admin bookmarks and automation scripts. A new developer adds a route and expects ID binding but gets slug binding silently. The change is not visible in the route file — it is hidden in the model.

### Real-World Consequences
- `User::getRouteKeyName()` returns `'slug'` for public profile URLs
- Admin routes use the same model: `/admin/users/{user}` now binds by slug
- Admin has bookmarks: `/admin/users/42` — 404 because 42 is not a slug
- Admin automation scripts use IDs to reference users: all break
- Fix: remove model override, use inline `{user:slug}` only on public routes

### Preferred Alternative
Use inline syntax `{user:slug}` in the route definition for routes that need a custom key. Reserve model-level `getRouteKeyName()` for when ALL routes of that model should use the same non-default key.

```php
// Wrong: model-level override that affects all routes
class User extends Model
{
    public function getRouteKeyName(): string
    {
        return 'slug';
    }
}

// Admin routes also bind by slug (unintended)
Route::get('/admin/users/{user}', [Admin\UserController::class, 'show']);

// Correct: inline syntax only on public routes
Route::get('/users/{user:slug}', [UserController::class, 'show']); // Slug
Route::get('/admin/users/{user}', [Admin\UserController::class, 'show']); // ID (default)
```

### Refactoring Strategy
1. Audit all `getRouteKeyName()` overrides in models
2. For each, determine if all routes or only some routes need the custom key
3. If only some routes: remove model override, add inline syntax to specific routes
4. If all routes: keep the override but document the decision
5. Test that URL generation and binding work correctly for both custom and default routes

### Detection Checklist
- [ ] `getRouteKeyName()` is only overridden when ALL routes need the custom key
- [ ] Single-route custom keys use inline syntax, not model override
- [ ] Admin and internal routes use IDs (default binding) unless explicitly needed otherwise
- [ ] No silent binding changes across route types
- [ ] Custom key behavior is visible in route definition, not hidden in model

### Related Rules/Skills/Trees
- Rule: Use inline syntax for single-route custom keys, model override for global changes
- Rule: Model-level override affects all routes — use sparingly
- Related KU: Route Model Binding, Route Definition

---

## Anti-Pattern 5: Non-Unique Custom Key Column

### Category
Reliability

### Description
Using a non-unique column for route model binding. `resolveRouteBinding()` calls `where($field, $value)->firstOrFail()`, which returns the first matching row. If multiple rows have the same value, the behavior is non-deterministic.

### Why It Happens
Developers use columns like `status`, `type`, or `category` — values that are not unique by nature — as route keys. The binding works during development because the dataset is small and duplicates are unlikely. The non-deterministic behavior only manifests when duplicates are introduced.

### Warning Signs
- Custom key column has no unique constraint in the database
- Column values are inherently non-unique (`status`, `type`, `first_name`)
- Binding queries sometimes return the wrong model for the same URL
- The bug is intermittent: refreshing the page sometimes shows different data
- Database has duplicate values for the binding column but no constraint violation error

### Why Harmful
Route model binding assumes a 1:1 mapping between URL segment and model. When duplicates exist, the binding silently returns the first match (database-dependent, typically the first inserted row or the first found by the query planner). The same URL may resolve to different models at different times (if the query planner changes its execution plan after ANALYZE). This is a data integrity issue that creates unpredictable behavior.

### Real-World Consequences
- `Product` model using `{product:name}` for binding (not unique)
- Two products named "Widget" exist in different categories
- URL `/products/widget` resolves via `Product::where('name', 'Widget')->firstOrFail()`
- Sometimes returns the first "Widget" (category A), sometimes the second (category B)
- Users see different products for the same URL depending on query order
- Customer reports: "I shared a link with my colleague and they see a different product"

### Preferred Alternative
Only bind on columns with unique constraints. If a column must be non-unique, combine it with scoped binding or use explicit binding with additional where clauses.

```php
// Wrong: non-unique column for binding
Route::get('/products/{product:name}', [ProductController::class, 'show']);

// Correct: unique column for binding
Schema::table('products', function (Blueprint $table) {
    $table->string('slug')->unique();
});
Route::get('/products/{product:slug}', [ProductController::class, 'show']);

// Alternative: scoped binding with parent context
Route::get('/categories/{category}/products/{product:name}', [ProductController::class, 'show'])
    ->scoped();

// Or explicit binding with additional constraints
Route::bind('product', function (string $value) {
    return Product::where('name', $value)
        ->where('category_id', request()->route('category'))
        ->firstOrFail();
});
```

### Refactoring Strategy
1. Audit all custom key columns for uniqueness
2. Add unique constraints to binding columns that should be unique
3. For columns that cannot be unique, add scoped binding or parent context
4. Add database-level unique constraints to prevent future duplicates
5. Test binding with duplicate values to ensure deterministic behavior

### Detection Checklist
- [ ] All custom key columns have unique constraints
- [ ] Binding queries return deterministic, single results
- [ ] No duplicate values exist in binding columns
- [ ] Scoped binding is used when parent context is needed for uniqueness
- [ ] Database enforces uniqueness (not just application-level)

### Related Rules/Skills/Trees
- Rule: Only bind on columns with unique constraints
- Rule: Non-unique binding columns cause non-deterministic resolution
- Related KU: Route Model Binding, Scoped Bindings
