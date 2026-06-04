# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** resource-controllers
**Knowledge Unit:** Nested Resource Controllers
**Difficulty:** Intermediate
**Category:** Resource Controllers
**Last Updated:** 2026-06-03

---

# Overview

Nested Resource Controllers are Laravel controllers that handle CRUD operations for resources that belong to a parent resource — such as posts belonging to a user (`/users/{user}/posts`). They exist to represent hierarchical relationships in RESTful APIs where child resources only exist within the context of a parent.

Engineers must care because nested resource routes are the standard RESTful approach for related resources. However, deep nesting creates complex routes, performance issues, and maintenance challenges. Understanding when to nest, how to shallow, and how to structure nested controllers is essential for clean API design.

---

# Core Concepts

**Parent-Child Relationship:** A nested resource controller manages child resources scoped to a parent — the parent identifier is always required.

**Route Scoping:** `Route::resource('users.posts', PostController::class)` creates nested routes like `/users/{user}/posts/{post}`.

**Shallow Nesting:** Using `->shallow()` to avoid deeply nested URLs when the parent can be inferred — `/posts/{post}` instead of `/users/{user}/posts/{post}`.

**Explicit Route Binding:** Nested routes often need explicit `->scopeBindings()` to ensure the child belongs to the parent.

**Route Model Binding:** Laravel automatically resolves parent and child models from route parameters.

---

# When To Use

- Resources that only exist within a parent context (comments on posts, items in orders)
- APIs where hierarchical URL structure is meaningful
- Endpoints requiring parent-level authorization before accessing child resources

---

# When NOT To Use

- Resources that can exist independently — use top-level resources instead
- Deep nesting (>2 levels) — prefer shallow nesting or top-level resources
- Resources where the parent can be inferred from the child's attributes

---

# Best Practices

**Limit nesting to one level.** `users/{user}/posts` is acceptable. `users/{user}/posts/{post}/comments` is too deep.

**Use shallow nesting for non-scoped operations.** Show, update, and delete operations don't need the parent ID if the child ID is unique.

**Use scopeBindings() to validate parent-child relationships.** `Route::resource('users.posts', ...)->scopeBindings()` ensures the post belongs to the user.

**Use implicit route model binding.** Laravel automatically resolves `{user}` and `{post}` when the route parameter names match model variable names.

**Keep nested controllers focused on the child resource.** The controller operates on the child; the parent provides authorization context.

---

# Architecture Guidelines

**Nested controllers resolve the parent in the constructor or a helper method.** A `loadParent()` method extracts repeated parent resolution from each action.

**Authorization checks the parent context.** `$this->authorize('view', $parent)` before allowing access to child resources.

**Route model binding with scoping prevents unauthorized access.** `->scopeBindings()` ensures the child belongs to the parent automatically.

**Shallow routes use a separate controller or method.** Don't mix scoped and unscoped routes in the same controller.

---

# Performance Considerations

**Parent resolution adds one query per request.** Eager load the parent when the child will reference it.

**Nested resource listing requires parent query + child query.** Two queries minimum per list request.

**Deep nesting multiplies query count.** Each nesting level adds a query. Limit to 2 levels maximum.

---

# Security Considerations

**Scope binding prevents cross-parent access.** `->scopeBindings()` automatically verifies the child belongs to the specified parent.

**Authorization should verify parent access.** If the user cannot access the parent, they should not access the child.

**Parent IDs should not be predictable.** Use UUIDs for parent resource identifiers in nested routes.

---

# Common Mistakes

**Deep nesting beyond 2 levels.** Routes become unreadable; query performance degrades; authorization logic becomes complex.

**No scope binding.** Posts with `user_id=1` can be accessed via `/users/2/posts/1` without validation.

**Missing authorization on parent.** The controller checks authorization for the child but not the parent.

**Redundant parent in all routes.** Update, show, and delete operations scope the child by parent ID unnecessarily — use shallow nesting.

---

# Anti-Patterns

**Deep Nesting:** `users/{user}/posts/{post}/comments/{comment}/replies/{reply}` — impossible to navigate, slow queries.
**Better approach:** Max 2 levels. Use shallow nesting. Reference top-level resources where possible.

**No Parent Authorization:** Verifying access to the child resource but not the parent.
**Better approach:** Always authorize the parent context before child operations.

**Ignoring Scope Binding:** Loading the child without verifying it belongs to the parent.
**Better approach:** Use `->scopeBindings()` on nested routes to enforce parent-child relationships.

**Mixed Shallow and Deep:** Some routes use shallow nesting, others use deep nesting for the same resource.
**Better approach:** Consistent nesting strategy per resource. Document the approach.

---

# Examples

**Nested resource routes:**
```
Route::resource('users.posts', PostController::class)
    ->shallow()
    ->scopeBindings();
```

**Generated routes:**
```
GET    /users/{user}/posts          index
POST   /users/{user}/posts          store
GET    /posts/{post}                show
PUT    /posts/{post}                update
DELETE /posts/{post}                destroy
```

---

# Related Topics

**Prerequisites:**
- Resource Controller Pattern
- Route Model Binding

**Closely Related Topics:**
- Nested Resources Shallow Nesting — shallow nesting patterns
- Partial Resource Routes — subset of resource actions

**Advanced Follow-Up Topics:**
- Route File Organization — managing nested routes
- Explicit Route Binding — custom binding logic

**Cross-Domain Connections:**
- API URL Structure Design — URL hierarchy
- RESTful Resource Design — resource relationships
