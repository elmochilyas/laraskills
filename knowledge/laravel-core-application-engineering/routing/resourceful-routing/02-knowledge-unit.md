# Resourceful Routing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Resourceful Routing
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-01

---

## Executive Summary

Resourceful routing (`Route::resource()`) generates seven RESTful routes from a single declaration, mapping standard CRUD operations to controller methods by convention. The pattern eliminates boilerplate for standard resource endpoints and enforces a consistent URL structure across the application. The `ResourceRegistrar` generates GET (index, create, show, edit), POST (store), PUT/PATCH (update), and DELETE (destroy) routes from a single resource call.

The critical engineering decision around resourceful routing is when to use it versus defining routes explicitly. `Route::resource()` optimizes for conciseness and consistency at the cost of transparency — the generated routes are invisible to static analysis, IDE "Find Usages," and casual reading. For applications where full CRUD for each resource is the norm (typical CRUD applications), the tradeoff favors resource routing. For applications where most resources deviate from standard CRUD (read-only, append-only, custom actions), explicit routes provide clarity.

The second critical decision is API resource routing. `Route::apiResource()` excludes `create` and `edit` routes — form-serving routes that have no meaning in JSON APIs. Using `Route::resource()` instead of `Route::apiResource()` for API endpoints registers five dead routes that pollute the route list and consume registration time.

---

## Core Concepts

### The Seven Standard Routes
`ResourceRegistrar::register()` generates exactly seven routes for a resource named `photos`:

| Verb | URI | Controller Method | Route Name |
|------|-----|-------------------|------------|
| GET | `/photos` | `index` | `photos.index` |
| GET | `/photos/create` | `create` | `photos.create` |
| POST | `/photos` | `store` | `photos.store` |
| GET | `/photos/{photo}` | `show` | `photos.show` |
| GET | `/photos/{photo}/edit` | `edit` | `photos.edit` |
| PUT/PATCH | `/photos/{photo}` | `update` | `photos.update` |
| DELETE | `/photos/{photo}` | `destroy` | `photos.destroy` |

Routes are registered in this specific order to ensure `create` matches before `{photo}` parameter catches it.

### apiResource vs resource
`Route::apiResource()` restricts to `only: ['index', 'show', 'store', 'update', 'destroy']` — omitting `create` and `edit`. These are HTML form-serving endpoints with no meaning in JSON API contexts.

### Partial Resources
`->only()` and `->except()` filter the generated route set. `only` is preferred because it declares exactly what exists (positive enumeration), while `except` requires the reader to know what was excluded.

### Nested Resources
A resource name with a slash (e.g., `users.photos`) creates nested routes:
```
GET  /users/{user}/photos           → PhotoController@index
POST /users/{user}/photos           → PhotoController@store
GET  /users/{user}/photos/{photo}   → PhotoController@show
```

Parent parameters use the singular form of the parent resource name. Nested parameters can be customized via `->parameters()`.

### Shallow Nesting
The `shallow` option removes parent parameters from routes that don't need them:
- Index, create, store routes: retain parent parameter (`/users/{user}/photos`)
- Show, edit, update, destroy routes: use only child parameter (`/photos/{photo}`)

Shallow nesting is the recommended default for nested resources when the child has a globally unique identifier.

### Custom Resource Verbs
`Route::resourceVerbs()` in `AppServiceProvider::boot()` allows localization of `create` and `edit` action names. For example, `['create' => 'crear', 'edit' => 'editar']` changes URI generation to `/photos/crear` and `/photos/{photo}/editar`.

---

## Mental Models

### Resource as Convention Contract
A resource route declares "this controller manages a full CRUD lifecycle for a specific entity type." The seven-standard-route contract is understood by every Laravel developer without documentation. Departing from this contract (via `only`, `except`, or additional custom routes) signals that the resource does not follow the standard lifecycle.

### URL as Resource Hierarchy
The URI structure mirrors the data hierarchy: collections without identifiers (`/photos`), collection members with identifiers (`/photos/{photo}`), and nested sub-collections within members (`/users/{user}/photos`). This RESTful convention maps URL depth to data containment depth.

### Registration as Side Effect
`Route::resource()` does not return the Route objects directly — it returns a `PendingResourceRegistration` that registers routes on `__destruct`. The resource routes are a side effect of the destructor executing. This design enables fluent chaining (`->only()->middleware()->name()`) without requiring a terminal method.

---

## Internal Mechanics

### ResourceRegistrar Registration Flow

```
ResourceRegistrar::register($name, $controller, $options)
  ├── Determine base URI: getResourcePrefix($name) — handles nested names
  ├── Determine parameter wildcard: getResourceWildcard($lastName) — singular form
  ├── Build route array
  │     ├── index:   GET    "/{resource}"             → {resource}.index
  │     ├── create:  GET    "/{resource}/create"      → {resource}.create
  │     ├── store:   POST   "/{resource}"             → {resource}.store
  │     ├── show:    GET    "/{resource}/{wildcard}"  → {resource}.show
  │     ├── edit:    GET    "/{resource}/{wildcard}/edit" → {resource}.edit
  │     ├── update:  [PUT,PATCH] "/{resource}/{wildcard}" → {resource}.update
  │     └── destroy: DELETE "/{resource}/{wildcard}" → {resource}.destroy
  ├── Apply options: only, except, names, parameters, middleware, where, scoped
  └── Register each route via Router::resource() call
```

### PendingResourceRegistration Deferred Registration
`Route::resource()` instantiates `PendingResourceRegistration`, which stores the registrar and parameters. On `__destruct()`, it calls `$this->registrar->register(...)` unless `$this->registered` is already true. This deferred pattern enables:

```php
Route::resource('photos', PhotoController::class)
    ->only(['index', 'show'])
    ->middleware(['auth', 'verified']);
```

Without deferred registration, each chained method would need to mutate routes already registered.

### Singularization and Parameter Naming
`getResourceWildcard()` applies `Str::singular()` to the resource name. The global `$singularParameters` static on `ResourceRegistrar` controls this behavior. Parameter names can be customized via the `parameters` option:
```php
Route::resource('users', UserController::class)->parameters(['users' => 'user_slug']);
```

### Shallow Nesting Mechanics
When `shallow` is true:
- `getShallowName()` extracts the last segment of the dotted resource name
- Routes for show, edit, update, destroy use the last segment as the URI without parent prefix
- Index, create, store retain the parent context

---

## Patterns

### Full Resource Pattern
Using `Route::resource()` for entities that genuinely have full CRUD lifecycles. Appropriate for admin panels, content management systems, and entity management interfaces where all seven operations are meaningful.

### API Resource Pattern
Using `Route::apiResource()` for RESTful JSON APIs. Excludes the form-serving `create` and `edit` routes. This is the universal recommendation for API development.

### Read-Only Resource Pattern
`Route::apiResource()->only(['index', 'show'])` for resources that should be publicly readable but not modifiable through the API. Examples: product catalogs, documentation, reference data.

### Custom Action Integration
Adding non-CRUD routes alongside a resource:
```php
Route::resource('users', UserController::class);
Route::post('users/{user}/restore', [UserController::class, 'restore'])->name('users.restore');
```

### Shallow Nesting Pattern
```php
Route::resource('users.photos', PhotoController::class)->shallow();
```
Generates `/users/{user}/photos` (index, create, store) and `/photos/{photo}` (show, edit, update, destroy).

---

## Architectural Decisions

### Deferred Registration Design
The `__destruct()` registration pattern is deliberate: it enables fluent API design without a terminal method. The tradeoff is that exceptions during `__destruct()` are hard to debug because PHP's destructor error handling is limited. The `registered` flag prevents double-registration if `register()` is called explicitly.

### Seven Routes by Default
The seven-route default (not five, not nine) reflects the standard RESTful resource lifecycle: list, create-form, store, show, edit-form, update, delete. Adding `create` and `edit` as defaults rather than optional routes serves the framework's original HTML application focus. The `apiResource()` variant corrects this for API contexts.

### Singular Parameter Convention
Using singular parameter names (`{photo}` for resource `photos`) follows the Rails convention and matches English grammar conventions (`/photos/{photo}` reads as "specific photo within the photos collection"). This is a convention that developers either find intuitive or must learn once.

---

## Tradeoffs

### Route::resource() vs Explicit Routes

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Conciseness: 1 line replaces 7 | Hidden routes: cannot see them in the file | New developers must know the seven-route convention |
| Consistency: Every resource follows the same pattern | Rigidity: Deviating requires extra explicit routes | Developers may cram non-standard operations into standard methods |
| Automatic naming: `photos.index`, `photos.show` | Name collision risk across resources | Must ensure resource names are globally unique |

### Shallow vs Full Nesting

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Shallow: Cleaner URLs for child resources | Shallow: Parent context lost in show/edit/update/destroy | Cannot determine parent from URL alone (requires DB query) |
| Full nesting: URL encodes full context | Full nesting: Long, fragile URLs (`/a/b/c/d/e`) | URL changes when any parent key changes |

### apiResource() vs resource()

| Benefit | Cost | Consequence |
|---------|------|-------------|
| apiResource: Cleaner route list for APIs | apiResource: Must switch to `resource()` if form routes are needed later | Requires knowing the difference exists |
| resource: Works for all contexts | resource: Registers dead routes for APIs | Five unused routes per resource in API context |

---

## Performance Considerations

### Registration Overhead
Each resource registers 7 Route objects. For 20 resources, that's 140 routes — the same as 140 explicit `Route::get/post/...` calls. Registration cost is linear and identical to manual registration.

### Resource Route Ordering
The specific registration order (index → create → store → show → edit → update → destroy) matters for matching correctness. If `show` (`/{resource}/{id}`) registered before `create` (`/{resource}/create`), the literal string "create" would be matched by the parameter pattern `{id}`. The ordering guarantees literal routes (`create`, `edit`) are checked before parameterized routes.

### Custom Resource Verb Impact
Changing `create` and `edit` verbs via `Route::resourceVerbs()` affects URI generation at registration time only — no runtime impact.

---

## Production Considerations

### Route List Verification
After defining resources, run `php artisan route:list` to verify the generated routes match expectations. Filter by path: `php artisan route:list --path=photos`.

### Resource Name Consistency
Resource names should be consistent across the application. Mixing singular and plural resource names (`user` vs `users`) creates confusion about which convention to follow for new resources. Laravel convention: plural names for resource declarations.

### Nested Resource Depth Limit
Nested resources beyond 3 levels create unmanageable URLs and parameter passing. The practical maximum is 2 levels of nesting. Beyond that, consider restructuring the URL hierarchy or using explicit routes.

---

## Common Mistakes

### Using Route::resource() for APIs
Why it happens: `Route::resource()` is the most visible routing method. Why it's harmful: registers `create` and `edit` form-serving routes that return 404 or error in API contexts. Better approach: `Route::apiResource()` for all JSON API endpoints.

### Deep Nesting Without Shallow
Why it happens: Shallow nesting is not the default. Why it's harmful: URLs like `/projects/1/tasks/5/subtasks/3/comments/7` are fragile and unreadable. Better approach: Enable shallow nesting for nested resources.

### Using resource() for Non-CRUD Entities
Why it happens: Convenience — one call for all routes. Why it's harmful: Registers unused routes (e.g., `create` for a read-only resource). Better approach: `->only(['index', 'show'])` for read-only resources.

### Not Customizing Parameter Names
Why it happens: Default singularization works well for English nouns. Why it's harmful: Irregular nouns ("children" → "child" is correct, but "series" → "serie" is incorrect). Better approach: Use `->parameters(['series' => 'series'])` to fix irregular plurals.

---

## Failure Modes

### Resource Name Collision
Two resources with the same name in different route groups create route name collisions. The later registration silently overwrites the earlier route name in `nameList`. Routes still match via URI but cannot be referenced by `route()` helper.

### Irregular Plural Singularization
`Str::singular()` produces incorrect singular forms for irregular English nouns (`series` → `serie`, `sheep` → `shep`). The parameter name in the URI is incorrect, causing route model binding to fail silently.

### Shallow Nesting Without Global Identifiers
Shallow nesting assumes the child resource can be uniquely identified without the parent context. If the child uses auto-increment IDs scoped per parent (not globally unique), shallow nesting may resolve the wrong child across parent boundaries.

---

## Ecosystem Usage

### Laravel Framework
Jetstream and Breeze use `Route::resource()` for team management routes. Horizon uses explicit routes, not resource routing. Cashier and Spark use explicit routes for subscription management.

### Spatie Packages
`spatie/laravel-permission` registers explicit permission/role management routes, not resource routes. `spatie/laravel-medialibrary` uses explicit routes for media downloads.

### Monica CRM
Monica uses `Route::resource()` for contact management routes. It supplements with explicit routes for non-CRUD actions (search, logs, archive).

### Akaunting
Akaunting explicitly defines each route per module — it does not use `Route::resource()` in production. All routes are individually declared with explicit names.

---

## Related Knowledge Units

### Prerequisites
- Route Definition — Basic route registration mechanics
- Route Groups — Prefix and middleware inheritance for resource groups

### Related Topics
- Singleton Routes — Single-instance resource pattern
- Scoped Bindings — Parent-child validation for nested resources
- Route Name Generation — Resource-autogenerated route names

### Advanced Follow-up Topics
- API Versioning — Versioning resourceful API routes
- Route Model Binding — Parameter resolution for bound models

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\ResourceRegistrar.php` — Full route generation logic, verb mapping, singularization
- `Illuminate\Routing\PendingResourceRegistration.php` — Deferred `__destruct()` registration pattern
- `Illuminate\Routing\Router.php` — `resource()`, `apiResource()`, `resources()` methods

### Key Insight
The `__destruct()` registration pattern is unique to resource routes in the Laravel routing system. No other route registration method uses deferred destruction for registration. This inconsistency in the API is a deliberate design choice for fluent chaining.

### Version-Specific Notes
- Resource routing behavior is unchanged across Laravel 10-13
- Singleton routes were added in Laravel 9.42 but use a similar `PendingSingletonResourceRegistration` pattern
- The `scoped()` method on resources was refined in Laravel 11 for automatic binding field inference
