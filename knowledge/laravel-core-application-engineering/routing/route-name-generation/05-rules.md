## Name Every Route

Every route must have a unique name. Call `->name()` on every explicit route definition.

---

## Category

Maintainability

---

## Rule

All routes (both explicit and resource-generated) must have a unique name assigned via `->name()` or via resource naming conventions. Do not leave any route unnamed.

---

## Reason

Named routes enable URL generation via `route()`, decouple URL references from URI patterns, and allow URI changes without updating every reference. Without names, developers hardcode URIs throughout the codebase, making route changes costly and error-prone.

---

## Bad Example

```php
Route::get('/users/{user}', [UserController::class, 'show']);
// No name — must hardcode '/users/5' everywhere
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

Redirect-only routes (`Route::redirect()`) and view routes (`Route::view()`) may skip naming if they are never referenced. However, naming them for consistency is still recommended.

---

## Consequences Of Violation

Hardcoded URIs throughout the codebase; brittle URLs that break on route changes; inability to use `route()` in tests and views.

---

## Use Dot Notation Naming

Use hierarchical dot notation for route names: `resource.action` (e.g., `users.show`, `admin.users.index`).

---

## Category

Maintainability

---

## Rule

Name routes using dot-separated hierarchical notation. The first segment should be the resource or domain name, followed by the action or sub-resource.

---

## Reason

Dot notation mirrors the route hierarchy and resource structure. It provides predictable naming that developers can guess without checking route files. Resource routes automatically follow this convention.

---

## Bad Example

```php
Route::get('/users/{user}', ...)->name('showUser');
// Flat naming — no hierarchy, hard to guess
```

---

## Good Example

```php
Route::get('/users/{user}', ...)->name('users.show');
// Hierarchical — resource.action, predictable
```

---

## Exceptions

No common exceptions. Dot notation is the standard Laravel convention.

---

## Consequences Of Violation

Inconsistent naming; difficulty guessing route names; no hierarchical organization for `route()` calls.

---

## Match Name Prefixes to URL Prefixes

When using `Route::prefix('admin')`, also use `Route::name('admin.')`.

---

## Category

Maintainability

---

## Rule

Every `Route::prefix()` call should have a corresponding `Route::name()` call with the matching prefix and a trailing dot.

---

## Reason

Consistent prefixing makes route names predictable: URL `/admin/users` → route name `admin.users`. Developers can infer the route name from the URL and vice versa. Mismatched or missing name prefixes break this predictability.

---

## Bad Example

```php
Route::prefix('admin')->group(function () {
    Route::get('/users', ...)->name('users.index');
    // URL: /admin/users, Name: users.index — mismatch
});
```

---

## Good Example

```php
Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', ...)->name('users.index');
    // URL: /admin/users, Name: admin.users.index — consistent
});
```

---

## Exceptions

Routes under a domain group (`Route::domain(...)`) that do not have a URL prefix may omit the name prefix if the domain alone does not justify a naming segment.

---

## Consequences Of Violation

Unpredictable route names; difficulty inferring route names from URLs; broken naming conventions in nested groups.

---

## Ban Hardcoded URLs

Never hardcode URI strings like `/users/5` in views, controllers, or tests. Always use the `route()` helper.

---

## Category

Maintainability

---

## Rule

Any reference to a route URL must use `route('route.name', $parameters)`. Do not concatenate URI strings or use placeholder URIs.

---

## Reason

Hardcoded URLs break when route URIs change. Named routes abstract the URI away, so changing a URI only requires updating the route definition. Tests using `route('name')` continue to work unchanged.

---

## Bad Example

```php
// Blade template — hardcoded URI
<a href="/users/{{ $user->id }}/edit">Edit</a>

// Test — hardcoded URI
$response = $this->get('/users/5');

// Controller — hardcoded redirect
return redirect('/users');
```

---

## Good Example

```php
{{-- Blade template --}}
<a href="{{ route('users.edit', $user) }}">Edit</a>

// Test
$response = $this->get(route('users.show', $user));

// Controller
return redirect()->route('users.index');
```

---

## Exceptions

External URLs (links to other applications) are not Laravel routes and should be configured via configuration files, not hardcoded in templates.

---

## Consequences Of Violation

Brittle code that breaks when URIs change; difficult refactoring; tests that silently pass against wrong URLs.

---

## Ensure Globally Unique Route Names

Do not define two routes with the same name. Route names must be globally unique.

---

## Category

Reliability

---

## Rule

Every route name in the application must be unique. Do not reuse a route name even in different route files or groups.

---

## Reason

Duplicate route names silently overwrite — the later registration wins, and the first route becomes unreachable by name. `route('name')` always resolves to the later route. This can silently redirect users to the wrong endpoint.

---

## Bad Example

```php
Route::get('/users', [UserController::class, 'index'])->name('users.index');
Route::get('/api/users', [ApiUserController::class, 'index'])->name('users.index');
// First name overwritten — route('users.index') points to API endpoint
```

---

## Good Example

```php
Route::get('/users', [UserController::class, 'index'])->name('users.index');
Route::get('/api/users', [ApiUserController::class, 'index'])->name('api.users.index');
// Both names are globally unique
```

---

## Exceptions

No common exceptions. Route names must be globally unique by design.

---

## Consequences Of Violation

`route()` resolves to the wrong route; silent redirection to unintended endpoints; difficult debugging when named routes behave unexpectedly.
