## Register Explicit Bindings in a Dedicated Service Provider

Place all `Route::bind()` and `Route::model()` calls in a dedicated `BindingsServiceProvider`, not in `AppServiceProvider`.

---

## Category

Code Organization

---

## Rule

Create a dedicated service provider (e.g., `BindingsServiceProvider`) for explicit route model binding registration. Do not add binding logic to `AppServiceProvider`.

---

## Reason

Binding registration is a distinct architectural concern. A dedicated provider makes bindings easy to audit, test, and maintain. Mixing bindings with other provider concerns (event registrations, gate definitions, etc.) creates a cluttered, hard-to-maintain provider.

---

## Bad Example

```php
class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // Binding mixed with other concerns
        Route::bind('user', fn ($v) => User::whereSlug($v)->firstOrFail());
        
        Gate::define('admin', fn ($user) => $user->isAdmin());
        
        Event::listen(UserRegistered::class, SendWelcomeEmail::class);
    }
}
```

---

## Good Example

```php
class BindingsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Route::bind('user', fn ($v) => User::whereSlug($v)->firstOrFail());
        Route::bind('team', fn ($v) => Team::whereUuid($v)->firstOrFail());
    }
}
```

---

## Exceptions

Applications with only one or two simple bindings may keep them in `AppServiceProvider`. Extract to a dedicated provider when the binding count exceeds 2 or when bindings require significant logic.

---

## Consequences Of Violation

Cluttered `AppServiceProvider`; difficulty auditing all active bindings; bindings hidden among unrelated provider registrations.

---

## Use Route::bind() Over Route::model()

Use `Route::bind()` with an explicit closure instead of `Route::model()` for non-standard resolution.

---

## Category

Maintainability

---

## Rule

When registering explicit bindings, use `Route::bind('parameter', fn ($value) => ...)` with an explicit closure. Do not use `Route::model('parameter', Model::class)`.

---

## Reason

`Route::bind()` documents the resolution logic explicitly — the closure shows exactly how the parameter is resolved. `Route::model()` only says "resolve this parameter using this class" which adds marginal clarity over implicit binding. If you need explicit documentation of default behavior, use `Route::bind()` with an explicit closure that mirrors the default resolution.

---

## Bad Example

```php
Route::model('user', User::class);
// Not clearer than implicit binding — just adds a registration call
```

---

## Good Example

```php
Route::bind('user', function (string $value): User {
    return User::where('uuid', $value)->firstOrFail();
});
// Clear, explicit, documents the column used for resolution
```

---

## Exceptions

Use `Route::model()` only for soft-delete binding with `->withTrashed()`, where `Route::model('user', User::class)->withTrashed()` is the correct API.

---

## Consequences Of Violation

Misleading documentation when `Route::model()` is used for what looks like custom logic; no obvious indication of which column is used for binding.

---

## Ban Business Logic and Authorization From Binding Closures

Binding closures must contain only value resolution logic. Do not add validation, authorization, logging, or side effects.

---

## Category

Architecture

---

## Rule

Explicit binding closures must perform exactly one operation: resolve a value from a source and return it. Do not add authorization checks, validation logic, audit logs, or any side effects inside the closure.

---

## Reason

Binding closures run before middleware and before controller code. Authorization checks in bindings bypass middleware-based protections. Validation in bindings runs on every request that matches the route, even when the route could have been rejected by middleware first. Side effects in bindings are invisible, untestable, and violate separation of concerns.

---

## Bad Example

```php
Route::bind('user', function (string $value) {
    // Authorization — runs before auth middleware
    if (! Gate::allows('view-user', User::class)) {
        abort(403);
    }
    
    // Logging side effect
    Log::info('User binding resolved', ['slug' => $value]);
    
    return User::where('slug', $value)->firstOrFail();
});
```

---

## Good Example

```php
Route::bind('user', function (string $value): User {
    return Cache::remember("user.slug.{$value}", 3600, function () use ($value) {
        return User::where('slug', $value)->firstOrFail();
    });
});

// Authorization in controller or middleware
class UserController
{
    public function show(User $user)
    {
        $this->authorize('view', $user);
        // ...
    }
}
```

---

## Exceptions

No common exceptions. Binding closures must remain focused on resolution only.

---

## Consequences Of Violation

Authorization running before middleware is initialized; security bypasses; hard-to-debug side effects; untestable logic embedded in route binding.

---

## Cache Expensive Binding Resolution

Cache the result of expensive binding resolution when the same model may be resolved multiple times per request.

---

## Category

Performance

---

## Rule

If a binding closure performs expensive operations (external API calls, complex queries with joins, composite key lookups), cache the result using `Cache::remember()` with the route parameter value as part of the cache key.

---

## Reason

Binding closures run on every request that matches the route. If the resolution involves API calls or multi-join queries, each request pays the cost. Caching avoids redundant resolution for repeated requests to the same resource.

---

## Bad Example

```php
Route::bind('user', function (string $value): User {
    // Complex query with joins — runs on EVERY request
    return User::with('profile', 'settings', 'roles.permissions')
        ->where('uuid', $value)
        ->firstOrFail();
});
```

---

## Good Example

```php
Route::bind('user', function (string $value): User {
    return Cache::remember("user.{$value}", 3600, function () use ($value) {
        return User::with('profile', 'settings', 'roles.permissions')
            ->where('uuid', $value)
            ->firstOrFail();
    });
});
```

---

## Exceptions

Do not cache when the resolved model may change frequently and stale data is unacceptable for the route's purpose (e.g., real-time status endpoints). For most CRUD routes, a short TTL (60-300 seconds) provides the right balance.

---

## Consequences Of Violation

Unnecessary repeated database queries for the same model; higher database load; slower response times for frequently accessed resources.
