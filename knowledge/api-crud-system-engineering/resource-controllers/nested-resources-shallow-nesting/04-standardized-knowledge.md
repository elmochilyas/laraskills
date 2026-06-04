| Section | Field | Content |
|---|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Nested Resources & Shallow Nesting |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Resource Controller Pattern, Route Model Binding |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Real-world domains nest resources: posts belong to users, comments belong to posts. Laravel supports nested resource routes via dot notation (`Route::resource('users.posts', PostController::class)`), generating URLs like `/users/{user}/posts/{post}`. The `shallow()` option removes parent parameters from actions where the child ID alone suffices for resolution, producing `/users/{user}/posts` for listing but `/posts/{post}` for show/update/destroy. This balances contextual scoping for collections with clean URLs for individual resources.

## Core Concepts

- **Dot-Notation Nesting**: `Route::resource('parent.child', Controller::class)` prefixes all routes with `parent/{parent}/child`.
- **Shallow Resource**: `->shallow()` removes the parent parameter from `show`, `edit`, `update`, `destroy` routes because the child ID is globally unique.
- **Scoped Bindings**: `->scoped(['child' => 'slug'])` customizes binding keys within nested resources.
- **Ownership Verification**: Shallow routes require explicit parent-child ownership checks since the URL no longer carries the parent context.
- **Deep Nesting Limit**: Laravel recommends at most one level of nesting; use shallow for deeper cases beyond that.

## When To Use

- Standard nested resources: users have posts, posts have comments.
- APIs where individual resources have globally unique IDs (UUID/ULID).
- Any nested resource where parent context is only needed for collection/index operations.
- Multi-tenant systems where the parent scope is required for listing but not for individual item access.

## When NOT To Use

- Resources with non-unique child IDs across parents (e.g., auto-increment IDs per parent).
- Web applications that rely on parent context for breadcrumbs, navigation, or authorization in show/update actions.
- Deep nesting (3+ levels) where shallow would create ambiguous top-level routes — restructure instead.
- When the parent-child relationship must be verified on every request and URL context is preferred over database checks.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Shallow by default for API routes | Child IDs are globally unique (UUID/ULID); parent context is redundant for individual resource access |
| Always pair shallow with `->scoped()` | Prevents ID tampering — shallow removes parent parameter so binding must be explicit |
| Validate parent-child ownership in policies, never rely on URL parameters alone | Shallow routes remove parent from URL; authorization must verify relationship independently |
| Limit nesting to one level maximum | Deep nesting produces fragile, hard-to-read URLs and computationally expensive resolution |
| Use `php artisan route:list` to verify shallow behavior | Confirms which routes include parent parameters and which do not |

## Architecture Guidelines

- Register nested resources with explicit scoping: `Route::resource('users.posts', PostController::class)->shallow()->scoped(['post' => 'uuid'])`.
- Document the nesting strategy in the API style guide: "All resources shall be shallow-nested at one level maximum."
- For 3+ levels of nesting, restructure the URL hierarchy (e.g., `/a/{a}/b` with shallow, then `/b/{b}/c` with shallow).
- In multi-tenant applications, always scope queries with tenant ID in addition to URL parameters.
- Use route name prefixes to avoid naming collisions between shallow-nested and top-level resources.

## Performance Considerations

- Shallow routes reduce model resolution queries — parent model is not resolved for show/update/destroy.
- Without shallow: two model resolutions per request (parent + child). With shallow: one resolution (child only).
- Scoped bindings add one database query to verify parent-child relationship — ensure foreign keys are indexed.
- Deep nesting (3+ levels) without shallow doubles or triples resolution queries.

## Security Considerations

- Shallow nesting removes the parent parameter, so the binding is lost — explicitly validate parent-child ownership.
- ID tampering vector: attacker changes POST ID in shallow route to access a post belonging to a different user.
- Use `->scoped()` with custom binding keys (UUID/ULID) to make IDs unpredictable.
- In multi-tenant systems, never rely on URL parameters alone for authorization — always check tenant scope in queries.
- Policy `view`/`update`/`delete` methods must verify the parent-child relationship independently.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Deep nesting without shallow: `Route::resource('a.b.c.d', ...)` | Mirroring database schema directly in URL structure | URLs become unwieldy, fragile, and expensive to resolve | Shallow at each level: `Route::resource('a.b', ...)->shallow()` then `Route::resource('b.c', ...)->shallow()` |
| Forgetting scoped binding with shallow | Assuming shallow preserves parent-child validation | Users access resources they don't own | Add `->scoped()` or validate ownership in policy/controller |
| Naming collision with non-nested resources | Shallow nesting generates `/posts/{post}` same as top-level `posts` resource | Route conflicts or ambiguous route names | Use route name prefixes: `->name('user.posts.')` on the nested resource |
| No ownership check in policy for shallow routes | Trusting URL parameters for authorization | Data leak across parent contexts | Always verify parent-child relationship in policy methods |

## Anti-Patterns

- **Three+ levels of nesting without restructuring**: `Route::resource('teams.users.posts.comments', ...)`. Restructure by shallow at each boundary.
- **Shallow on web routes where parent context is needed for breadcrumbs**: Web UIs need parent context for navigation; use standard (non-shallow) nesting or pass parent ID via query parameters.
- **Global ID collisions assumed**: Using shallow with auto-increment IDs that are not unique across parents. Always use UUID/ULID for child IDs when using shallow.
- **Inconsistent nesting style**: Some endpoints shallow, some not, without documented rationale. Team cannot predict URL patterns.

## Examples

- **Standard nested resource**: `Route::resource('users.posts', PostController::class);` — all routes include `{user}` prefix.
- **Shallow nested resource**: `Route::resource('users.posts', PostController::class)->shallow();` — index/store include `{user}`, show/update/destroy are `/posts/{post}`.
- **Scoped binding with shallow**: `Route::resource('users.posts', PostController::class)->shallow()->scoped(['post' => 'uuid']);`
- **API shallow nesting**: `Route::apiResource('users.posts', PostController::class)->shallow();`
- **Ownership verification**: Policy `update(User $user, Post $post)` checks `$post->user_id === $user->id`.

## Related Topics

- Resource Controller Pattern — Foundation for nested resource registration
- Partial Resource Routes — Filtering specific actions within nested resources
- Singleton Resource Controllers — One-to-one variant of nested resource routing
- Controller Middleware Assignment — Applying auth/scoping middleware to nested routes
- Controller Testing Strategies — Testing nested resource endpoints

## AI Agent Notes

- Generate nested resource routes with shallow by default for API contexts.
- Always pair `->shallow()` with `->scoped()` when binding keys differ from default.
- Include parent-child ownership verification in generated policies.
- Restructure any 3+ level nesting into two shallow levels.
- Use UUID/ULID bindings for child IDs when shallow nesting to prevent ID guessing.

## Verification

- [ ] Nested resource uses `->shallow()` by default for API routes
- [ ] `->scoped()` used alongside `->shallow()` for custom binding keys
- [ ] Parent-child ownership verified in policy methods for shallow routes
- [ ] No more than one level of nesting before shallow is applied
- [ ] Route name prefixes used to prevent conflicts with top-level resources
- [ ] `php artisan route:list` confirms expected shallow URI structure
