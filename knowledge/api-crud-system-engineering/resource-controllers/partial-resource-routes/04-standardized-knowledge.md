| Section | Field | Content |
|---|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Resource Controllers |
| **Metadata** | Knowledge Unit | Partial Resource Routes |
| **Metadata** | Difficulty | Foundation |
| **Metadata** | Dependencies | Resource Controller Pattern, Route Registration Basics |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Not every resource controller needs all seven default methods. Read-only resources expose only `index` and `show`. Write-only logs expose only `store` and `destroy`. Laravel's `only()` and `except()` fluent methods whitelist or blacklist specific actions from a resource route, reducing the registered route set to exactly what the controller implements. Custom non-CRUD actions (search, restore, archive) are registered manually alongside the resource declaration, with careful attention to route ordering.

## Core Concepts

- **only()**: Whitelist — accepts an array of action names; all other actions are excluded from route registration.
- **except()**: Blacklist — accepts an array of action names; all other actions are included.
- **Custom Route Registration**: Non-CRUD methods registered manually via `Route::get()`, `Route::post()`, etc.
- **Route Ordering**: Custom routes must appear before `Route::resource()` to prevent wildcard parameter capture.
- **Action-Controller Mismatch**: `only()` and `except()` filter routes only; they do not validate that the controller implements the corresponding methods.

## When To Use

- Read-only resources (reports, logs, dashboards) — `only(['index', 'show'])`.
- Write-only resources (webhook receivers, event collectors) — `only(['store', 'update', 'destroy'])`.
- API endpoints replacing `Route::resource()` with `Route::apiResource()->only()` for explicit action whitelisting.
- Adding custom actions (search, restore, archive, bulk operations) beyond the seven default methods.
- Forward-compatible route declarations where future actions may be added to the controller.

## When NOT To Use

- Full CRUD resources with all seven actions — use `Route::resource()` without filtering.
- When `except()` is used to exclude `destroy` as a security measure — use authorization policies instead.
- When the controller implements methods not in the whitelist — remove unreachable methods to avoid dead code.
- For single-action endpoints — use invokable controllers instead of a resource controller with `only(['show'])`.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Prefer `only()` over `except()` | `only()` self-documents exactly what the controller supports; `except()` requires knowing the full default set and subtracting |
| Remove controller methods excluded by `only()` | Unimplemented methods become dead code that confuses maintainers and linters |
| Register custom routes BEFORE the resource route | Laravel matches routes sequentially; a wildcard `{photo}` swallows `/search` if resource is registered first |
| Use `->name()` on custom routes for naming consistency | Custom actions should follow the same naming pattern as resource routes (`photos.search`) |
| Use `Route::apiResource()->only()` for APIs | Combines the API-only action set with explicit whitelisting for maximum clarity |

## Architecture Guidelines

- Place custom routes in a clearly demarcated section above the resource declaration with an ordering comment.
- Use `apiResource()` as the base and `only()` to further restrict — this is the standard API pattern.
- Every action in `only()` must have a corresponding controller method; dead methods should be removed.
- For forward-compatibility, prefer `only()` over `except()` — a Laravel upgrade adding new default methods would not leak unintended routes.
- Consider a CI lint rule: "All resource declarations must use `only()`." This enforces explicit action whitelisting.

## Performance Considerations

- Route caching works identically for partial and full resource routes — no difference.
- Fewer routes mean marginally faster matching, though negligible below ~500 routes.
- Each custom route adds one entry to the compiled dictionary with the same cost as any manual route.
- `only()` and `except()` are evaluated at route registration time, not request time.

## Security Considerations

- `except(['destroy'])` is NOT a security measure — authorization policies must control deletion access.
- Custom routes registered after the resource route silently fail (404) — verify ordering in CI.
- Ensure custom action names do not collide with resource action names (e.g., `show` vs `search`).
- Authorization for custom actions must be handled separately from resource authorization.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Custom route after resource route: `Route::resource()` then `Route::get('/search')` | Intuitive ordering — resource first, custom second | `/search` captured by `{photo}` wildcard, causing 404 or incorrect model binding | Always register specific routes before wildcard resource routes |
| Dead code from missing `only()`: controller has 7 methods but route uses `only(['index', 'show'])` | Developer forgets to remove unused methods | 5 methods are unreachable, confusing maintainers | Remove unused controller methods when applying `only()`; use PHPStan to detect dead methods |
| Using `except()` for security: excluding `destroy` as auth substitute | Assumes route exclusion is authorization | Policy change later can expose deletion without authorization | Use authorization policies and model-level guards, not route exclusion |
| Inconsistent action set between `only()` and existing form requests | `only(['index', 'show'])` but `StorePhotoRequest` exists | Dead form request class | Review form request existence against whitelisted routes |

## Anti-Patterns

- **`except()` as security boundary**: Blocking `destroy` in routes but having no authorization policy. Route exclusion is configuration, not security.
- **Resource controller with 20+ custom routes**: Adding search, restore, archive, bulkDelete, export etc. directly alongside the resource. Split into dedicated controllers.
- **No `only()` on API resources**: Using `Route::resource()` (which includes `create`/`edit`) for a JSON API. Use `Route::apiResource()`.
- **Silent dead code**: Controller implements 7 methods, route registers only 3 via `only()`, no compiler warning about the 4 unreachable methods.

## Examples

- **Read-only resource**: `Route::apiResource('photos', PhotoController::class)->only(['index', 'show']);`
- **Write-only resource**: `Route::apiResource('photos', PhotoController::class)->only(['store', 'update', 'destroy']);`
- **Resource with custom action**: `Route::get('/photos/search', [PhotoController::class, 'search'])->name('photos.search'); Route::apiResource('photos', PhotoController::class);`
- **Custom route before resource**: `// Custom routes must be before resource to avoid wildcard capture. Route::get('/photos/recent', ...); Route::apiResource('photos', ...);`

## Related Topics

- Resource Controller Pattern — Base pattern that partial routes filter
- API Resource Controllers — Simplified resource registration for APIs
- Single-Action Invokable Controllers — Alternative for endpoints that don't fit resource pattern
- Controller Code Limits — Keeping partial-action controllers within size limits
- Thin Controller Enforcement — Automated rules for controller structure

## AI Agent Notes

- Generate `Route::apiResource()->only()` for all partial resource routes.
- Always place custom routes before the resource route declaration.
- Use `only()` never `except()` for route filtering.
- Remove controller methods that are not in the `only()` whitelist.
- Name custom routes with `->name('resource.action')` to match resource naming conventions.

## Verification

- [ ] `Route::apiResource()->only()` used instead of `Route::resource()->except()`
- [ ] Custom routes registered before the resource route declaration
- [ ] No dead controller methods — every method in the controller has a corresponding route
- [ ] Route names for custom actions follow the `resource.action` naming convention
- [ ] `php artisan route:list` confirms custom routes appear before wildcard resource routes
