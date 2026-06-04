# Nested Resource Controllers

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** resource-controllers
- **Knowledge Unit:** Nested Resource Controllers
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Nested Resource Controllers handle CRUD operations for resources that belong to a parent resource (e.g., `GET /api/users/{user}/posts`). Proper nested controller design ensures clean URL hierarchies, correct authorization scoping, and efficient query loading.

---

## Core Concepts
- **Nested Routes**: Routes like `/api/users/{user}/posts/{post}` where child resources are scoped to a parent
- **Implicit Route Model Binding**: Laravel resolves `{user}` and `{post}` automatically from the URL
- **Shallow Nesting**: Only nesting one level deep — `/api/posts/{post}` instead of `/api/users/{user}/posts/{post}`
- **Authorization Scoping**: Verifying the current user has access to both the parent and child resource
- **Query Scoping**: Ensuring child queries are scoped to the parent: `$user->posts()->where('id', $postId)`
- **Resource Full Nesting**: Three-level nesting (rare) — `/api/teams/{team}/users/{user}/posts/{post}`

---

## Mental Models
1. **File System Folder Model**: Parent resources are folders; child resources are files inside. You navigate through folders to find files.
2. **Parent-Child Relationship Model**: The nested URL mirrors the database relationship — `users hasMany posts` → `/api/users/{user}/posts`.

---

## Internal Mechanics
Laravel's router registers nested route groups with `Route::resource('users.posts', PostController::class)`. The controller receives parent and child IDs via route model binding. `Post::where('user_id', $user->id)->findOrFail($postId)` scopes the child query to the parent. Nested resource routes are registered with `scoped()` to enforce child-parent relationships automatically.

---

## Patterns

### Pattern 1: Full Nesting
**Purpose**: `/api/users/{user}/posts/{post}` — every child route includes the parent
**Benefits**: Explicit URL; parent context always available
**Tradeoffs**: Long URLs; more route parameters to manage

### Pattern 2: Shallow Nesting
**Purpose**: Identify child resources uniquely, `/api/posts/{post}`, with parent context only in create/store
**Benefits**: Cleaner URLs; avoids deeply nested routes
**Tradeoffs**: Parent context may require an additional lookup

---

## Architectural Decisions
### When To Use
- Resources with clear hierarchical relationships
- APIs where the parent provides authorization context
- Resources that don't have globally unique identifiers

### When To Avoid
- Flat resource structures with independent child resources
- Very deep nesting (3+ levels) — refactor or use shallow nesting
- Resources where parent ID is not needed for authorization

### Alternatives
- Flat routes with parent ID in the request body or query string
- Shallow routes with unique child identifiers
- Separate endpoint per resource with explicit parent reference

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear resource hierarchy | Long, complex URLs | Use shallow nesting when possible |
| Parent context in controller | More route registration complexity | Use Route::resource with scoped() |
| Authorization scoped naturally | Extra database queries for parent | Eager load parent relationships |

---

## Performance Considerations
- Each nested level adds a database query for route model binding
- Use `scoped()` with `findOrFail` to query child + parent in one query
- Eager load the relationship when you know the parent context is needed
- Shallow nesting reduces query count by eliminating parent resolution

---

## Production Considerations
- Monitor nested route resolution times for slow queries
- Return meaningful 404 errors (parent not found vs child not found)
- Test authorization at both parent and child levels
- Document nested route structures clearly in API docs

---

## Common Mistakes
**Missing authorization at parent level**: Checking only child authorization can leak data across parent boundaries. Always verify parent access.
**Over-nesting (3+ levels)**: `/api/orgs/{org}/teams/{team}/users/{user}/posts` is unusably deep. Use shallow nesting or refactor.
**Not scoping child queries**: `Post::findOrFail($postId)` ignores the parent context, potentially returning data from another parent.

---

## Failure Modes
**BelongsTo-mismatch**: A post that doesn't belong to the specified user returns 404 but the same ID in another user's context works. *Detection:* Authorization audit. *Mitigation:* Always scope child queries to the parent.
**N+1 from nested eager loading**: Loading deeply nested relationships triggers many queries. *Detection:* Debugbar or query log. *Mitigation:* Use `with()` carefully and consider lazy eager loading.

---

## Ecosystem Usage
Laravel's `Route::resource('users.posts', PostController::class)` registers nested resource routes. `Route::resource('users.posts', PostController::class)->scoped()` enables automatic child-parent scoping. `shallow()` on a resource registration switches to shallow nesting.

---

## Related Knowledge Units
### Prerequisites
- Resource controller methods
- Route model binding

### Related Topics
- Controller middleware assignment
- Model authorization via policies

### Advanced Follow-up Topics
- Shallow nesting implementation strategies
- Multi-level nesting with authorization
- Performance optimization for nested routes

---

## Research Notes
- Laravel's `scoped()` method (available since Laravel 8) auto-scopes child lookup to parent
- `shallow()` resource prevents excessive nesting by creating separate routes for identified children
- JSON:API recommends using relationship routes (`/api/users/{user}/relationships/posts`) for nested resources
