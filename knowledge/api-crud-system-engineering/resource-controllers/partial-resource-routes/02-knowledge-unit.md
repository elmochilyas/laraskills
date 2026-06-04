# Partial Resource Routes

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Partial Resource Routes
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Not every resource controller needs all seven (or five) default methods. Read-only resources expose only `index` and `show`. Write-only logs expose only `store` and `destroy`. Laravel provides the `only()` and `except()` fluent methods to whitelist or blacklist specific actions from a resource route, reducing the registered route set to exactly what the controller implements.

Beyond filtering, partial resource routes cover adding custom methods that do not fit the seven-mold—search, restore, archive, batch operations. These custom routes must be registered manually alongside the resource declaration, typically before or after the `Route::resource()` call, with careful attention to route ordering.

---

## Core Concepts

- **only()**: Accepts an array of action names to whitelist. All other actions are excluded.
- **except()**: Accepts an array of action names to blacklist. All other actions are included.
- **Mixing Resource + Custom Routes**: Resource routes coexist with manually-defined routes for non-CRUD actions.
- **Route Ordering**: Custom routes must be registered before the resource route to avoid URL parameter conflicts.
- **Named Custom Actions**: Use `->name('resource.search')` to maintain consistent naming with resource routes.

---

## Mental Models

- **Whitelist Over Blacklist**: Prefer `only()` to declare what the controller does; `except()` hides intent. Whitelist is explicit, blacklist is implicit.
- **Controller as Action Set**: Think of a controller as a set of actions, not a file. `only()` is the set definition; the controller should only contain the whitelisted methods.
- **URL Routing Priority**: Custom routes are more specific and must be registered first. Laravel's router matches top-to-bottom.

---

## Internal Mechanics

`only()` and `except()` are implemented in `PendingResourceRegistration`. They filter the internal `$options['only']` or `$options['except']` array, which is passed to `ResourceRegistrar::register()`. The registrar checks these arrays before calling each `addResource*` method.

```php
public function only($methods)
{
    $this->options['only'] = is_array($methods) ? $methods : func_get_args();
    return $this;
}

public function except($methods)
{
    $this->options['except'] = is_array($methods) ? $methods : func_get_args();
    return $this;
}
```

In `ResourceRegistrar::register()`, the logic for each action is:
```php
if ($this->matches($action, $options)) {
    $this->{"addResource{$action}")($name, $base, $controller, $options);
}
```

Custom routes must be registered before the resource route because Laravel's route matcher compares in registration order. If `Route::resource('photos', ...)` is registered first, a subsequent `Route::get('/photos/search', ...)` will never match because `/photos/{photo}` captures the path.

---

## Patterns

- **Read-Only Resource**:
  ```php
  Route::apiResource('photos', PhotoController::class)->only(['index', 'show']);
  ```
- **Write-Only Resource**:
  ```php
  Route::apiResource('photos', PhotoController::class)->only(['store', 'update', 'destroy']);
  ```
- **Resource with Custom Action**:
  ```php
  Route::get('/photos/search', [PhotoController::class, 'search'])->name('photos.search');
  Route::get('/photos/recent', [PhotoController::class, 'recent'])->name('photos.recent');
  Route::apiResource('photos', PhotoController::class);
  ```
- **Except Example**:
  ```php
  Route::resource('photos', PhotoController::class)->except(['create', 'edit']);
  // Equivalent to apiResource — avoids the two view methods
  ```

---

## Architectural Decisions

- **Why `only()` over `except()`?** `only()` is self-documenting: it declares exactly what the controller supports. `except()` requires the reader to know the full default set and subtract.
- **Why custom routes before resource?** Laravel resolves routes sequentially. A wildcard `{photo}` would swallow `/search`. Ordering custom routes first ensures they match before the wildcard.
- **Why not define custom methods inside the resource controller without routes?** Defining a public method in the controller but not registering a route creates dead code. Registering a route without a matching method throws a clearer error.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Explicit controller scope with `only()` | Must update `only()` when adding new actions | Adding `edit` in a later iteration requires touching both controller and route |
| Fewer registered routes = smaller route table | Requires awareness of what actions exist | Team must learn the default action set to understand what is excluded |
| Custom methods keep logic in the same controller | Route ordering fragility | Moving `Route::get()` after `Route::resource()` silently breaks the route |

---

## Performance Considerations

- Route caching works identically for partial and full resource routes.
- Fewer routes mean slightly faster route matching, though the difference is negligible below ~500 routes.
- Each custom route adds one entry to the compiled route dictionary; same cost as any manual route.

---

## Production Considerations

- Use `Route::apiResource()->only([...])` instead of `Route::resource()->except([...])` for APIs.
- Add a CI lint rule: "All resource declarations must use `only()`." This enforces explicit action whitelisting.
- Place custom routes in a clearly demarcated section above the resource declaration, with a comment explaining ordering dependency.
- Run `php artisan route:list` after adding custom routes to verify they appear before the wildcard resource route.

---

## Common Mistakes

- **Custom route after resource route**: `Route::resource('photos', ...)` then `Route::get('/photos/search', ...)`. The `/search` path is captured by `{photo}`.
  - *Why it happens:* Intuitive ordering (resource first, custom second).
  - *Why it's harmful:* Silent 404 or incorrect model binding (`search` passed as photo ID).
  - *Better approach:* Always register specific routes before wildcard routes.

- **Dead code from missing `only()`**: Controller implements 7 methods but route uses `only(['index', 'show'])`. The other 5 methods are unreachable.
  - *Why it happens:* Developer forgets to remove unused methods when restricting routes.
  - *Why it's harmful:* Confusion during maintenance — are these methods used elsewhere?
  - *Better approach:* Remove unused controller methods when applying `only()`, or use PHPStan to detect unused controller methods.

- **Using `except()` for security**: Excluding `destroy` via `except()` as a security measure.
  - *Why it happens:* Assumes route exclusion is a substitute for authorization.
  - *Why it's harmful:* If the policy or route is later changed, deletion becomes possible without authorization.
  - *Better approach:* Use authorization policies and model-level guards instead of route exclusion.

---

## Failure Modes

- **Route collision with custom action and model binding**: `{photo}` binding resolves to numeric ID, but `/photos/search` passes 'search' as the ID. *Detection:* Model-not-found exception. *Mitigation:* Add `Route::bind()` validation or register custom routes before resource.

- **Inconsistent action set between `only()` and form requests**: `only(['index', 'show'])` but `StorePhotoRequest` exists. *Detection:* Dead form request class. *Mitigation:* Review form request existence against allowed routes.

- **`except()` leaking unintended routes**: After a Laravel upgrade that adds new default resource methods, `except()` would not block them. *Detection:* New routes appear in `route:list`. *Mitigation:* Prefer `only()` for forward-compatibility.

---

## Ecosystem Usage

- **Laravel Telescope**: Uses partial resource routes for read-only monitoring dashboards (only `index`, `show`).
- **Laravel Horizon**: Queue monitoring controllers expose only `index` and `show` for read-only queue inspection.
- **Laravel Cashier**: Billing webhook controllers often expose only `store` (receiving Stripe webhooks) via partial resource routes.

---

## Related Knowledge Units

### Prerequisites
- Resource Controller Pattern
- Route Registration Basics

### Related Topics
- API Resource Controllers
- Single-Action Invokable Controllers

### Advanced Follow-up Topics
- Controller Code Limits
- Thin Controller Enforcement

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\PendingResourceRegistration::only()` — whitelist method
- `Illuminate\Routing\PendingResourceRegistration::except()` — blacklist method
- `Illuminate\Routing\ResourceRegistrar::matches()` — filtering logic

### Key Insight
`only()` and `except()` are filter arrays, not structural constraints. A controller may define a method that has no route; the framework does not warn about this mismatch.

### Version-Specific Notes
- `only()`/`except()` have existed since Laravel 4 with identical semantics.
- Laravel 8+ added `apiResource()` which internally uses `only()`.
- No behavioral changes across Laravel 8–11.
