# ECC Standardized Knowledge — Scoped Bindings

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Routing System |
| **Knowledge Unit** | Scoped Bindings |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — Routing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Scoped bindings automatically scope nested route model bindings so that the child model is resolved within the parent model's context. For nested routes like `posts/{post}/comments/{comment}`, scoped bindings ensure that the comment belongs to the specified post by adding a `where('post_id', $post->id)` constraint to the comment query.

Without scoped bindings, a malicious or mistaken user could access `/posts/1/comments/999` where comment 999 belongs to a different post. With scoped bindings, this query returns 404 because the comment doesn't belong to post 1.

Scoped bindings are the primary defense against cross-resource access in nested routes. They should be enabled by default for all nested resources, especially in multi-tenant applications.

---

## Core Concepts

### Automatic Scoping
By default in Laravel 8+, nested resource routes are automatically scoped. `Route::resource('posts.comments', ...)` automatically scopes `{comment}` within `{post}`.

### Explicit Scoping
`Route::get('/posts/{post}/comments/{comment}', ...)->scopeBindings()` enables scoping for non-resource routes.

### Without Scoped Bindings
`->withoutScopedBindings()` disables scoping for specific routes where unscoped access is intended.

### Scoping Logic
The framework inspects the child model's foreign key relationship to the parent and adds a `where` constraint. For `comments` nested under `posts`, it adds `Comment::where('post_id', $post->id)->findOrFail($commentId)`.

---

## When To Use

- ALL nested resource routes
- Multi-tenant applications where resources must be scoped to the tenant
- API routes with parent-child relationships
- Routes where cross-resource access would be a security issue

---

## When NOT To Use

- Routes where the child resource is globally unique (e.g., UUID-based IDs)
- Routes where the parent-child relationship is optional
- When `withoutScopedBindings()` is explicitly needed for a specific use case

---

## Best Practices

### Enable Scoping by Default
Always use scoped bindings for nested routes. Only disable when explicitly justified.

**Why:** Scoped bindings prevent access to unowned child resources. Without them, any user can access any child resource by guessing its ID, regardless of the parent context.

### Use Resource Scoping
Use `Route::resource()` for nested resources whenever possible, as scoping is automatic.

**Why:** Resource routes handle scoping automatically. Manual route definitions require explicit `->scopeBindings()` calls.

### Audit Non-Scoped Routes
Document and review any route that disables scoping with `->withoutScopedBindings()`.

**Why:** Disabling scoping creates a security gap. The decision must be intentional and understood by the team.

---

## Architecture Guidelines

### Automatic Scoping (Resources)
```php
Route::resource('posts.comments', CommentController::class);
// {comment} is automatically scoped within {post}
```

### Explicit Scoping
```php
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show'])
    ->scopeBindings();
// Adds where('post_id', $post->id) to comment resolution
```

### Disabling Scoping
```php
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show'])
    ->withoutScopedBindings();
// {comment} resolved globally, regardless of {post}
```

---

## Performance Considerations

Scoped bindings add an additional WHERE clause to the child model query. This has negligible performance impact and may improve query efficiency by leveraging composite indexes. Ensure a composite index on `(parent_id, id)` for the child table.

---

## Security Considerations

### Cross-Resource Access
Without scoping, `/posts/1/comments/50` resolves comment 50 even if it belongs to post 2. This is a data exposure vulnerability. Scoped bindings are the primary defense.

### Multi-Tenant Isolation
In multi-tenant applications, scoped bindings prevent tenant A from accessing tenant B's child resources. Always scope nested bindings to the tenant context.

### Authorization Is Not Scoping
Scoped bindings prevent access to non-owned child resources but do not replace authorization (policies/gates). Authorization checks verify the user's permission to access the resource.

---

## Common Mistakes

### Not Scoping Nested Routes
Desc: Defining nested routes without scoped bindings.
Cause: Not knowing about the feature or relying on manual checks.
Consequence: Users can access child resources that don't belong to the parent.
Better: Always scope nested resource bindings.

### Assuming Resource Routes Are Not Scoped
Desc: Writing manual `where()` checks in controllers for nested resources.
Cause: Not knowing that resource routes auto-scope.
Consequence: Duplicated scoping logic, more controller code.
Better: Rely on route-level scoping; remove controller-level where checks.

### Disabling Scoping Without Justification
Desc: Using `withoutScopedBindings()` for convenience.
Cause: Getting 404 errors during development and disabling scoping.
Consequence: Security gap in production.
Better: Fix the underlying issue (wrong parent key, missing relationship).

---

## Anti-Patterns

### Manual Scoping in Controllers
Writing `$post->comments()->findOrFail($commentId)` in every controller method when route scoping would handle it automatically. This duplicates security logic and increases controller complexity.

### Scoping by Authorization Only
Relying solely on policies to verify parent-child ownership instead of using scoped bindings. Policy checks run AFTER binding resolution, meaning the wrong resource could be loaded before authorization rejects it.

---

## Examples

### Nested Resource with Auto-Scoping
```php
Route::resource('posts.comments', CommentController::class);
// In controller: Comment $comment is already scoped to $post
```

### Manual Route with Explicit Scoping
```php
Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show'])
    ->scopeBindings();
```

### Shallow Nested with Scoping
```php
Route::resource('posts.comments', CommentController::class)->shallow();
// show/update/destroy routes don't include {post}
// Scoping applies only when {post} is present
```

---

## Related Topics

### Prerequisites
- **Route Model Binding (Implicit)** — Foundation for all binding
- **Resourceful Routing** — Nested resource route generation

### Closely Related
- **Route Model Binding (Explicit)** — Custom scoping resolution
- **Route Groups** — Grouping scoped routes

### Cross-Domain
- **Security & Identity Engineering** — Authorization patterns for scoped resources

---

## AI Agent Notes

### Important Decisions
- Scoped bindings are automatic for `Route::resource()` since Laravel 8
- Explicit routes need `->scopeBindings()` to enable scoping
- Scoping adds `where(foreign_key, parent_id)` to the child query
- `withoutScopedBindings()` should be documented and justified

### Important Constraints
- Scoping relies on the foreign key convention (e.g., `post_id` for `posts`)
- The child model must have a `belongsTo` relationship to the parent
- Scoping only works for the immediate parent context

### Rules Generation Hints
- Enforce scoped bindings for all nested routes
- Require documentation for any `withoutScopedBindings()` usage
- Enforce composite indexes on `(parent_id, id)` for child tables

---

## Verification

This document has been validated against:
- `Illuminate\Routing\PendingResourceRegistration::scoped()` — resource route scoping
- `Illuminate\Routing\Route::scopeBindings()` — explicit scoping method
- `Illuminate\Routing\ImplicitRouteBinding::resolveForRoute()` — scoped resolution logic
