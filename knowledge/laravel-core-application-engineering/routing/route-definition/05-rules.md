## Use Controller Array Syntax

Always use `[Controller::class, 'method']` array syntax for route actions. Do not use the string `'Controller@method'` syntax.

---

## Category

Framework Usage

---

## Rule

Every route action referencing a controller must use the array syntax: `[UserController::class, 'index']`. Never use the string syntax `'UserController@index'`.

---

## Reason

Array syntax enables IDE "Go to Definition" navigation, static analysis, and automated refactoring tools. String syntax is opaque — the IDE cannot resolve the class reference, search for usages, or detect method signature changes.

---

## Bad Example

```php
Route::get('/users', 'UserController@index');
// IDE cannot resolve UserController or index method
```

---

## Good Example

```php
Route::get('/users', [UserController::class, 'index']);
// Full IDE support: Go to Definition, rename refactoring
```

---

## Exceptions

No common exceptions. The string syntax is a legacy pattern from Laravel 7 and earlier.

---

## Consequences Of Violation

IDE cannot navigate to controller classes; automated refactoring tools skip route-controller bindings; increased difficulty in discovering which controllers a route uses.

---

## Ban Closure Routes in Production

Every route must use a controller reference. Never use Closure-based route handlers.

---

## Category

Performance

---

## Rule

All route handlers must be controller references (`[Controller::class, 'method']` or invokable classes). Zero Closure routes are allowed in production code.

---

## Reason

A single Closure route blocks `php artisan route:cache` for the entire application, degrading route matching performance by up to 5x. This is a framework-level constraint — the serializer throws on Closure routes.

---

## Bad Example

```php
Route::get('/status', function () {
    return ['status' => 'ok'];
});
// Blocks caching for every other route
```

---

## Good Example

```php
// Invokable controller
class StatusController
{
    public function __invoke(): array
    {
        return ['status' => 'ok'];
    }
}

Route::get('/status', StatusController::class);
```

---

## Exceptions

Development-only routes in `local` environment may use Closures. Never deploy Closure routes to production.

---

## Consequences Of Violation

Entire application loses route caching benefit; 5-15ms route matching instead of 1-2ms; higher server costs at scale.

---

## Name Every Route

Call `->name()` on every route definition.

---

## Category

Maintainability

---

## Rule

Every route must have a unique name assigned via `->name()`. Do not leave routes unnamed.

---

## Reason

Named routes enable URL generation via `route()` helper, prevent hardcoded URIs in views and tests, and allow URI changes without breaking references. Without names, changing a URI requires finding and updating every hardcoded reference.

---

## Bad Example

```php
Route::get('/users/{user}', [UserController::class, 'show']);
// No name — must hardcode /users/5 everywhere
```

---

## Good Example

```php
Route::get('/users/{user}', [UserController::class, 'show'])
    ->name('users.show');
// route('users.show', $user) — URI changes are isolated
```

---

## Exceptions

Redirect-only or fallback routes may skip names if they are never referenced by `route()`. However, naming them is still harmless and recommended for consistency.

---

## Consequences Of Violation

Hardcoded URIs throughout the codebase; brittle URLs that break on route changes; inability to use `route()` in tests and views.

---

## Use Explicit HTTP Verb Methods

Use `Route::get()`, `Route::post()`, etc. Do not use `Route::any()` or `Route::match()` without an explicit verb list.

---

## Category

Security

---

## Rule

Always use the specific HTTP verb method (`get()`, `post()`, `put()`, `patch()`, `delete()`). Never use `Route::any()`. Use `Route::match()` only when you can list all intended verbs explicitly.

---

## Reason

`Route::any()` allows ALL HTTP methods (including HEAD, OPTIONS, TRACE) to reach the handler. This violates HTTP semantics and may expose handlers to unintended methods. Verb-specific routes are self-documenting and prevent method confusion vulnerabilities.

---

## Bad Example

```php
Route::any('/users/{user}', [UserController::class, 'show']);
// DELETE, PATCH, OPTIONS all reach the show handler
```

---

## Good Example

```php
Route::get('/users/{user}', [UserController::class, 'show']);
Route::post('/users', [UserController::class, 'store']);
```

---

## Exceptions

Use `Route::match(['GET', 'POST'], ...)` for routes that intentionally accept multiple verbs (e.g., form submission with fallback).

---

## Consequences Of Violation

Unintended HTTP methods hitting handlers that expect different semantics; security scanning flags; non-compliant RESTful design.

---

## Split Route Files by Domain at Scale

Split `routes/web.php` into feature-based files when the route count exceeds 50.

---

## Category

Code Organization

---

## Rule

When a route file exceeds approximately 50 routes, split it into multiple files organized by feature, domain, or module. Load these files via `Route::group()` and `require`.

---

## Reason

A single route file with 200+ routes causes merge conflicts, slow navigation, and unclear ownership. Feature-based files provide team ownership boundaries, reduce merge conflicts, and keep each file focused on a single domain.

---

## Bad Example

```php
// routes/web.php — 300 lines, 80 routes
Route::get('/users', ...);
Route::post('/users', ...);
// ... 78 more routes mixed together
```

---

## Good Example

```php
// routes/admin.php
Route::middleware(['auth', 'admin'])->prefix('admin')->group(function () {
    Route::resource('users', Admin\UserController::class);
    Route::resource('settings', Admin\SettingController::class);
});

// routes/web.php
require __DIR__.'/admin.php';
require __DIR__.'/billing.php';
require __DIR__.'/reports.php';
```

---

## Exceptions

Applications with fewer than 50 routes may stay in a single file. Small teams with low route change frequency may also tolerate larger files.

---

## Consequences Of Violation

Merge conflicts in the route file; slow navigation; unclear ownership of specific route groups.

---

## Keep Business Logic Out of Route Files

Route files must contain only route definitions. No business logic, queries, or complex computations.

---

## Category

Architecture

---

## Rule

Route files must be thin registrations — just URI, handler, middleware, and name. Do not include business logic, Eloquent queries, or complex computations in route files.

---

## Reason

Route files are loaded at bootstrap time. Business logic in route files runs during application boot, not during request handling. It cannot be cached, tested in isolation, or reused. Controllers and services are the correct location for business logic.

---

## Bad Example

```php
Route::get('/recent-posts', function () {
    return Post::where('created_at', '>=', now()->subDays(7))
        ->with('user')
        ->get()
        ->map(fn ($post) => ['title' => $post->title]);
});
// Query logic in route file — untestable, unreusable
```

---

## Good Example

```php
// routes/web.php
Route::get('/recent-posts', [PostController::class, 'recent']);

// PostController.php
public function recent()
{
    return Post::recentPosts()->map->toSummaryArray();
}
```

---

## Exceptions

Simple redirects (`Route::redirect(...)`) and view returns (`Route::view(...)`) are acceptable as they contain no business logic.

---

## Consequences Of Violation

Untestable logic; logic runs during boot; cannot reuse the logic in other contexts; refactoring requires touching route files.
