# Singleton Routes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Singleton Routes
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Singleton routes (`Route::singleton()`) represent resources with exactly one instance — either "one of one" (a user's profile) or "zero or one" (a user's settings, a video's thumbnail). Introduced in Laravel 9.42 by Jess Archer (PR #44872), singleton routes generate CRUD routes without an identifier parameter because there is only one resource to operate on. The URL structure is flat: `/profile`, `/profile/edit` — no `{id}` segment.

The critical architectural distinction is that singleton routes do NOT perform route model binding for the singleton itself. Since there is no `{id}` parameter in the URL, there is nothing to bind against. The controller is entirely responsible for resolving the singleton resource — typically through the authenticated user (`$request->user()->profile`) or a fixed lookup key. This makes singleton routes fundamentally different from standard resourceful routing, where the model binding system automatically resolves `{id}`.

The naming debate around "singleton" (conflicting with the OOP singleton pattern) reflects a community tension between precise RESTful semantics and developer searchability. The term was accepted after significant debate and remains the established route type name.

---

## Core Concepts

### Default Singleton Actions
`Route::singleton($name, $controller)` generates:

| Verb | URI | Method | Route Name |
|------|-----|--------|------------|
| GET | `/{resource}` | `show` | `{resource}.show` |
| GET | `/{resource}/edit` | `edit` | `{resource}.edit` |
| PUT | `/{resource}` | `update` | `{resource}.update` |

No `index` (there is only one), no `create` or `store` (the singleton pre-exists or is created implicitly).

### Creatable and Destroyable Singletons
Adding `->creatable()` adds:
| Verb | URI | Method | Route Name |
|------|-----|--------|------------|
| GET | `/{resource}/create` | `create` | `{resource}.create` |
| POST | `/{resource}` | `store` | `{resource}.store` |
| DELETE | `/{resource}` | `destroy` | `{resource}.destroy` |

`->destroyable()` adds only `destroy`. `creatable()` includes `destroy` by default.

### Nested Singleton
`Route::singleton('videos.thumbnail', VideoThumbnailController::class)` generates:
- `/videos/{video}/thumbnail` (show)
- `/videos/{video}/thumbnail/edit` (edit)
- `/videos/{video}/thumbnail` (update, PUT)

The parent `{video}` parameter IS bound via implicit route model binding. Only the singleton itself is not bound.

### apiSingleton
`Route::apiSingleton()` excludes `edit` and `create` routes — equivalent to `->except('create', 'edit')` on a regular singleton.

---

## Mental Models

### Zero-or-One vs One-of-Many
A singleton resource has no collection context. You cannot list "all profiles" because a user has exactly one profile. You cannot create "a second profile." The URL directly addresses the singleton at the resource root, not as a member of a collection.

### Resource Without Identifier
Standard routes require an identifier to specify which resource member to operate on (`/posts/{post}`). Singleton routes omit the identifier because the mapping is implicit — typically through the authenticated user, a fixed configuration key, or a one-to-one relationship. The controller is responsible for resolving "which entity" from context.

### Name Confusion
The term "singleton" in routing conflicts with the OOP singleton pattern (a class that allows only one instance). In routing, "singleton" refers to the resource having one instance, not the controller class being a singleton. This naming confusion was extensively debated in the original PR and remains a source of cognitive overhead for new developers.

---

## Internal Mechanics

### PendingSingletonResourceRegistration
Similar to `PendingResourceRegistration`, the singleton variant uses `__destruct()` for deferred registration:

```php
Route::singleton('profile', ProfileController::class)
    ->creatable()
    ->middleware(['auth']);
```

The destructor calls `ResourceRegistrar::register()` with a singleton-specific options array (`singleton: true`).

### ResourceRegistrar Singleton Handling
`ResourceRegistrar::register()` checks for the `singleton` option. If true:
- No `index` route is generated
- No parameter wildcard is added to the URI
- Routes are generated without `/{wildcard}` in the URI path
- `creatable` adds create + store + destroy routes
- `destroyable` adds destroy route

### No Built-in Model Resolution
Unlike `Route::resource()` where the `{id}` parameter triggers automatic binding, singleton routes have no parameter. The controller must resolve the resource. Common strategies:
```php
public function show(Request $request) {
    return $request->user()->profile ?? redirect()->route('profile.create');
}
```

---

## Patterns

### Authenticated User Singleton
The most common pattern — a user's profile, settings, or preferences:
```php
Route::singleton('profile', ProfileController::class)->creatable();
```
Controller resolves via `$request->user()->profile`.

### Nested Parent Singleton
A singleton belonging to a parent resource:
```php
Route::singleton('videos.thumbnail', VideoThumbnailController::class);
```
The parent `{video}` is bound; the controller resolves the thumbnail from the video.

### API Singleton
Read-only or update-only singleton for API contexts:
```php
Route::apiSingleton('settings', SettingsController::class)->destroyable();
```

---

## Architectural Decisions

### Why No Built-in Resolution
The singleton's URL contains no identifier, so the framework cannot know which entity to resolve. Resolution depends on application context (authenticated user, parent resource, configuration key) and cannot be inferred from the URI alone. The controller must implement the resolution logic.

### Why Singleton Is a Resource Registrar Concern
Rather than a separate registration mechanism, singleton routes reuse the `ResourceRegistrar` with a `singleton` flag. This keeps route generation uniform and avoids duplicating the seven-route generation logic.

---

## Tradeoffs

### Route::singleton() vs Route::resource()

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Singleton: Clean URLs (no `{id}`) | No automatic model binding | Controller must resolve the resource manually |
| Singleton: Semantically correct for one-of resources | Non-obvious by name | Developers may confuse with OOP singleton |
| Resource: Consistent parameter pattern | Unnecessary `{id}` for one-of resources | URL has a parameter that is always the same value |

### creatable() vs No creatable()

| Benefit | Cost | Consequence |
|---------|------|-------------|
| creatable: Full lifecycle (create → store → destroy) | More routes to maintain | All routes must handle the "resource doesn't exist" state |
| No creatable: Simpler, resource always exists | Cannot create or delete via API | Requires alternative setup path |

---

## Performance Considerations

Singleton routes add minimal registration overhead — 3-5 Route objects instead of 7 for a full resource. No runtime performance difference. The absence of route model binding means one fewer database query per request (the resource is resolved by the controller instead of by the routing system).

---

## Production Considerations

### Singleton Existence Handling
Singletons that are "zero or one" (not pre-created) require the controller to handle the "doesn't exist" state in `show()`, `edit()`, and `update()`. Common approach: redirect to `create` route if not found, or return a default/empty state.

### Controller Method Requirements
Singleton controllers must implement matching methods (`show`, `edit`, `update`, optionally `create`, `store`, `destroy`). Missing methods produce `MethodNotAllowedHttpException` — the route exists but the controller method is not callable.

---

## Common Mistakes

### Using Route::resource() for Singletons
Why it happens: `Route::resource()` is more familiar. Why it's harmful: Generates unnecessary `index` route (meaningless for singletons) and an `{id}` parameter in all URIs. Better approach: Use `Route::singleton()` for one-of resources.

### Expecting Automatic Model Binding
Why it happens: Resource routes automatically bind `{id}`. Why it's harmful: Singleton routes have no `{id}`, so no binding occurs. The controller receives no model and must resolve one manually. Better approach: Resolve the singleton from the authenticated user or parent relationship in the controller.

### Not Handling the "Doesn't Exist" State
Why it happens: Resources always exist (they are seeded or pre-created). Why it's harmful: If the singleton doesn't exist for a user, `show()` and `edit()` return errors. Better approach: Use `->creatable()` to provide create/store/destroy, and handle the pre-creation state in `show()`.

---

## Failure Modes

### Missing Controller Method
A singleton route is registered for `show` but the controller doesn't have a `show()` method. The route exists and matches, but dispatch fails with `MethodNotAllowedHttpException` — a confusing error because the HTTP method is correct but the handler is missing.

### Singleton Not Found in Controller
`show()` accesses `$request->user()->profile` but `profile` is null because the singleton was never created. Returns 500 error instead of a user-friendly 404 or redirect. Controllers must handle the null state explicitly.

---

## Ecosystem Usage

### Laravel Framework
Jetstream uses singleton-like patterns for user profile management. No first-party package uses `Route::singleton()` directly — most predate its introduction.

### Community Adoption
Singleton routes are used in SaaS applications for tenant settings, user preferences, and API key management. Adoption is growing but not yet universal. The feature is primarily used in newer codebases (Laravel 10+).

---

## Related Knowledge Units

### Prerequisites
- Route Definition — Basic route registration mechanics
- Resourceful Routing — Understanding RESTful conventions for the full resource lifecycle

### Related Topics
- Scoped Bindings — Parent-child validation for nested singletons
- Route Model Binding Implicit — How the parent parameter is bound in nested singletons

### Advanced Follow-up Topics
- API Versioning — Versioning singleton API endpoints

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\Router.php` — `singleton()` and `apiSingleton()` methods
- `Illuminate\Routing\PendingSingletonResourceRegistration.php` — Deferred registration pattern
- `Illuminate\Routing\ResourceRegistrar.php` — Singleton option handling in `register()`
- PR #44872 (Jess Archer) — Original implementation with naming debate

### Key Insight
The naming debate around "singleton" reflects a broader tension in Laravel: terms are chosen for their RESTful semantics rather than their OOP familiarity. Developers coming from other frameworks should treat "singleton route" as an independent term with no relationship to the OOP singleton pattern.

### Version-Specific Notes
- Introduced in Laravel 9.42
- Behavior unchanged in Laravel 10-13
- `apiSingleton()` was added in Laravel 10 based on community feedback
