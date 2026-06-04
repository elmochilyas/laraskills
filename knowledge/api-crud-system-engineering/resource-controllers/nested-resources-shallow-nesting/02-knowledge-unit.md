# Nested Resources & Shallow Nesting

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Nested Resources & Shallow Nesting
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Real-world domains nest resources: posts belong to users, comments belong to posts. Laravel supports nested resource routes through `Route::resource('users.posts', PostController::class)`, which generates routes like `/users/{user}/posts/{post}`. Deeply nested routes become unwieldy, so the framework provides a `shallow` option that removes parent parameters from actions where the child ID alone is sufficient for resolution.

Shallow nesting produces URLs like `/users/{user}/posts` for listing and `/posts/{post}` for show/update/destroy. This balances context (you need the parent for index/store) with conciseness (the child ID is globally unique for show/update/destroy). Understanding when and how to shallow-nest is critical for designing clean, RESTful API URL structures.

---

## Core Concepts

- **Dot-Notation Nesting**: `Route::resource('users.posts', ...)` creates routes prefixed with `users/{user}/posts`.
- **Shallow Resource**: `Route::resource('users.posts', ...)->shallow()` removes parent `{user}` from show/update/destroy routes.
- **Scoped Bindings**: Nested resources use scoped route model binding to ensure the child belongs to the parent.
- **apiResource Nesting**: `Route::apiResource('users.posts', ...)` works identically but drops create/edit routes.
- **Deep Nesting Limit**: Laravel recommends at most one level of nesting; use shallow for deeper cases.

---

## Mental Models

- **Parent as Scoping Context**: The parent ID scopes the collection (index and store). Individual items (show, update, destroy) are uniquely identifiable by their own ID.
- **URL Depth Budget**: Each nesting level adds cognitive load. Shallow nesting reclaims that budget by flattening the read/update/delete URLs.
- **Ownership Chain**: The route structure mirrors the ownership chain in the database: user owns posts, post owns comments.

---

## Internal Mechanics

When `Route::resource('users.posts', PostController::class)` is called, the `ResourceRegistrar` parses the dot notation into a parent-child relationship. It registers routes with a `{user}` parameter prefix.

**Standard nesting (no shallow) — explicit verbose routes:**

| Verb | URI | Action |
|------|-----|--------|
| GET | `/users/{user}/posts` | index |
| GET | `/users/{user}/posts/create` | create |
| POST | `/users/{user}/posts` | store |
| GET | `/users/{user}/posts/{post}` | show |
| GET | `/users/{user}/posts/{post}/edit` | edit |
| PUT/PATCH | `/users/{user}/posts/{post}` | update |
| DELETE | `/users/{user}/posts/{post}` | destroy |

**Shallow nesting:**

| Verb | URI | Action |
|------|-----|--------|
| GET | `/users/{user}/posts` | index |
| POST | `/users/{user}/posts` | store |
| GET | `/posts/{post}` | show |
| PUT/PATCH | `/posts/{post}` | update |
| DELETE | `/posts/{post}` | destroy |

The `shallow` option works by overriding the `addResourceShow`, `addResourceEdit`, `addResourceUpdate`, and `addResourceDestroy` methods in the registrar to use only the child parameter.

---

## Patterns

- **Standard Nested Resource**:
  ```php
  Route::resource('users.posts', PostController::class);
  // index: /users/{user}/posts
  // show:  /users/{user}/posts/{post}
  ```
- **Shallow Nested Resource**:
  ```php
  Route::resource('users.posts', PostController::class)->shallow();
  // index: /users/{user}/posts
  // show:  /posts/{post}
  ```
- **Scoped Binding Customization**:
  ```php
  Route::resource('users.posts', PostController::class)
      ->scoped(['post' => 'slug']); // uses slug instead of id
  ```
- **API-aware Shallow Nesting**:
  ```php
  Route::apiResource('users.posts', PostController::class)->shallow();
  // Only API methods, with shallow nesting
  ```

---

## Architectural Decisions

- **Why shallow by default for APIs?** API clients typically have access to globally unique resource IDs. Requiring the parent ID for every request over-fetches data and complicates client logic.
- **Why not automatically shallow?** Web applications often rely on the parent context for authorization and breadcrumb generation. Shallow would break that context.
- **Why limit nesting depth?** Deep nesting (3+ levels) produces URLs that are fragile, hard to read, and computationally expensive to resolve.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Shorter, cleaner URLs for individual resources | Parent context is lost in the URL | Controllers must independently verify parent-child relationship |
| Reduced coupling between parent and child | Inconsistent URL patterns (mixed depth) | Developers must remember which routes are shallow and which are not |
| Aligns with RESTful resource identification | Requires globally unique child IDs | May conflict with soft-delete or multi-tenant ID schemes |

---

## Performance Considerations

- Shallow routes reduce URL parsing overhead marginally (one fewer route parameter).
- Scoped bindings add a database query to verify parent-child relationship. Use `whereBelongsTo()` or indexed foreign keys for performance.
- Without shallow nesting, Eloquent resolves both `{user}` and `{post}`, doubling model resolution queries. Shallow nesting reduces this to one.

---

## Production Considerations

- Use `php artisan route:list` to verify shallow behavior on every resource declaration.
- Always use `scoped()` along with shallow to prevent ID tampering (a user accessing another user's post by knowing the post ID).
- Document the nesting strategy in the API style guide: "All resources shall be shallow-nested at one level maximum."
- In multi-tenant applications, never rely solely on URL parameters for authorization—always check parent-child ownership in the controller or policy.

---

## Common Mistakes

- **Deep nesting without shallow**: `Route::resource('users.posts.comments', ...)` creating 3+ levels of nesting.
  - *Why it happens:* Mirroring database schema directly in URL structure.
  - *Why it's harmful:* URLs become unwieldy and fragile.
  - *Better approach:* Use shallow at the second level: `Route::resource('users.posts', ...)->shallow();` then `Route::resource('posts.comments', ...)->shallow();`.

- **Forgetting scoped binding with shallow**: Using shallow but not verifying that the post actually belongs to the user.
  - *Why it happens:* Shallow removes the parent parameter, so the binding is lost.
  - *Why it's harmful:* Users can access resources they do not own.
  - *Better approach:* Add scoped binding or validate ownership in the controller/policy.

- **Naming collision with non-nested resources**: A top-level `posts` resource conflicts with shallow `posts` routes from nesting.
  - *Why it happens:* Shallow nesting generates `/posts/{post}`, same as a regular resource.
  - *Why it's harmful:* Route conflicts or ambiguous route names.
  - *Better approach:* Use route name prefixes: `Route::resource('users.posts', ...)->names('user.posts')`.

---

## Failure Modes

- **Route resolution ambiguity**: A top-level `PostController` and a nested `PostController` share `/posts/{post}`. *Detection:* Route matching the wrong controller. *Mitigation:* Avoid duplicate shallow routes; alias names explicitly.

- **Parent ID injection attacks**: Client sends a post ID that belongs to a different parent. *Detection:* Unauthorized data access. *Mitigation:* Always validate parent-child relationship in a policy or controller action, even with shallow routes.

- **Missing scoped bindings on multi-tenant systems**: Tenant A accesses Tenant B's resource via shallow route. *Detection:* Data leak. *Mitigation:* Global scope queries with tenant ID; never rely on URL parameters alone.

---

## Ecosystem Usage

- **Laravel Spark (Invoices)**: Uses shallow nesting for `/teams/{team}/invoices` but `/invoices/{invoice}` for individual access.
- **Laravel Nova (Actions)**: Nova's action endpoints use shallow-like nesting: resource detail URLs include parent context only for collections.
- **GitHub API**: A real-world shallow nesting example—`/repos/{owner}/{repo}/issues` but `/issues/{issue_id}` for individual issue access.

---

## Related Knowledge Units

### Prerequisites
- Resource Controller Pattern
- Route Model Binding

### Related Topics
- Partial Resource Routes
- Singleton Resource Controllers

### Advanced Follow-up Topics
- Controller Middleware Assignment
- Controller Testing Strategies

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\ResourceRegistrar::addResourceShow()` — shallow vs. non-shallow logic
- `Illuminate\Routing\PendingResourceRegistration::shallow()` — fluent shallow toggle
- `Illuminate\Routing\Router::resource()` — dot-notation parsing

### Key Insight
Shallow nesting reflects a fundamental REST principle: collection endpoints need context (parent ID), item endpoints need only the item's identifier. Laravel's implementation is automatic and toggleable.

### Version-Specific Notes
- Shallow nesting has been available since Laravel 4.2.
- `scoped()` method added in Laravel 8 for custom binding keys in nested resources.
- `shallow()` behavior unchanged across Laravel 8–11.
