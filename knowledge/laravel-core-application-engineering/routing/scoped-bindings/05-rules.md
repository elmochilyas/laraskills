## Enable Scoped Bindings for All Nested Routes

Every nested route must have scoped bindings enabled. Use `Route::resource()` for automatic scoping or call `->scopeBindings()` on manual routes.

---

## Category

Security

---

## Rule

Enable scoped bindings on all nested route definitions. Resource-level nested routes auto-scope since Laravel 8. Manual nested routes must explicitly chain `->scopeBindings()`.

---

## Reason

Without scoped bindings, any user can access child resources by guessing IDs, regardless of parent context. `/posts/1/comments/999` resolves comment 999 even if it belongs to post 2. Scoped bindings add a `where(post_id, $post->id)` constraint that prevents cross-resource access.

---

## Bad Example

```php
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show']);
// No scoping — comment 999 from post 2 accessible via /posts/1/comments/999
```

---

## Good Example

```php
// Resource routes auto-scope
Route::resource('posts.comments', CommentController::class);

// Manual routes need explicit scoping
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show'])
    ->scopeBindings();
```

---

## Exceptions

Routes where the child resource uses a globally unique identifier (e.g., UUID primary key) and the parent context is only for URL organization may omit scoping. Document this decision with a comment.

---

## Consequences Of Violation

Data exposure — users can access child resources that don't belong to the parent; cross-tenant data access in multi-tenant applications.

---

## Require Documentation for withoutScopedBindings()

Every use of `->withoutScopedBindings()` must include an inline comment explaining why scoping was disabled.

---

## Category

Maintainability

---

## Rule

When disabling scoped bindings with `->withoutScopedBindings()`, add a comment above or beside the route definition explaining the specific reason scoping is not needed.

---

## Reason

Disabling scoped bindings removes a security layer that prevents cross-resource access. The decision must be intentional, documented, and reviewable. Without documentation, future developers may not realize a security boundary was deliberately removed.

---

## Bad Example

```php
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show'])
    ->withoutScopedBindings();
// No explanation — why is scoping disabled?
```

---

## Good Example

```php
// UUID-based comments are globally unique — parent scoping is redundant
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show'])
    ->withoutScopedBindings();
```

---

## Exceptions

No common exceptions. Every disablement must be documented.

---

## Consequences Of Violation

Security gap without awareness; future developers may not realize scoping is disabled; hard-to-detect cross-resource access in code review.

---

## Add Composite Indexes on (parent_id, id)

Add a composite database index on `(parent_id, id)` for all child tables used in scoped bindings.

---

## Category

Performance

---

## Rule

For every child table that participates in scoped binding, add a composite database index on `(foreign_key, id)` where `foreign_key` references the parent table.

---

## Reason

Scoped bindings query the child table with `WHERE parent_id = ? AND id = ?`. Without a composite index, this query uses either the foreign key index (filtering parent_id, then scanning for id) or the primary key index (finding by id, then checking parent_id). A composite index covers both columns in a single index seek.

---

## Bad Example

```php
// Migration — separate indexes, no composite
Schema::table('comments', function (Blueprint $table) {
    $table->foreignId('post_id')->index(); // Single-column index
    // No composite on (post_id, id)
});
```

---

## Good Example

```php
Schema::table('comments', function (Blueprint $table) {
    $table->foreignId('post_id')->constrained();
    $table->index(['post_id', 'id']); // Composite index for scoped binding
});
```

---

## Exceptions

Tables with very low row counts (< 1000) may not benefit from composite indexes. Add them anyway for future-proofing — the index overhead is negligible.

---

## Consequences Of Violation

Slower scoped binding queries on large tables; table scans or inefficient index usage; increased database CPU for every request to nested resource routes.

---

## Prefer Resource Routes for Automatic Scoping

Use `Route::resource()` for nested resources to get automatic scoping with no additional configuration.

---

## Category

Framework Usage

---

## Rule

When defining nested resource routes, use `Route::resource('parent.child', ...)` instead of manual route definitions. Resource routes automatically enable scoped bindings.

---

## Reason

Resource routes handle scoping automatically since Laravel 8. Manual routes require explicit `->scopeBindings()` calls, which are easy to forget. Using resource routes for nested resources eliminates the risk of accidentally omitting scoping.

---

## Bad Example

```php
// Manual routes — easy to forget scopeBindings()
Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show']);
```

---

## Good Example

```php
// Resource route — automatic scoping
Route::resource('posts.comments', CommentController::class);
```

---

## Exceptions

When the nested resource needs only a subset of standard actions that cannot be expressed with `->only()`, manual routes may be clearer. In that case, always chain `->scopeBindings()`.

---

## Consequences Of Violation

Potential omission of scoped bindings on manually defined nested routes; inconsistent application of security boundaries.

---

## Do Not Duplicate Scoping in Controllers

Do not write `$post->comments()->findOrFail($commentId)` in controllers when route-level scoping already handles this.

---

## Category

Architecture

---

## Rule

When a route has scoped bindings enabled, controller methods must type-hint the child model directly. Do not manually query from the parent relationship.

---

## Reason

Route-level scoping already ensures the child belongs to the parent. Manual `$post->comments()->findOrFail()` in the controller duplicates this logic, adds unnecessary queries, and violates the principle that the route layer should handle parameter resolution.

---

## Bad Example

```php
class CommentController
{
    public function show(Post $post, string $commentId)
    {
        $comment = $post->comments()->findOrFail($commentId);
        // Manual scoping — duplicates route-level behavior
    }
}
```

---

## Good Example

```php
class CommentController
{
    public function show(Post $post, Comment $comment)
    {
        // Route scoping already ensures $comment belongs to $post
    }
}
```

---

## Exceptions

When the route does not have scoped bindings enabled (intentionally disabled), manual controller-level scoping is necessary. Document why scoping was disabled at the route level.

---

## Consequences Of Violation

Duplicate scoping logic; redundant database queries (parent loaded, then relationship filtered); violation of separation of concerns.
