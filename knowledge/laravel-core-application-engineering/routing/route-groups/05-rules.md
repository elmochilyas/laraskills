## Limit Group Nesting to Three Levels

Do not nest route groups more than 3 levels deep.

---

## Category

Maintainability

---

## Rule

Keep route group nesting to a maximum of 3 levels. Avoid 4+ level nesting.

---

## Reason

Deep nesting makes attribute merging non-obvious. Developers must trace through multiple group levels to understand which middleware, prefixes, and names apply to a given route. At 4+ levels, the merged result is no longer predictable by visual inspection.

---

## Bad Example

```php
Route::prefix('api')->name('api.')->group(function () {
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::prefix('v2')->name('v2.')->group(function () {
            Route::prefix('teams')->name('teams.')->group(function () {
                Route::get('/users', ...); // 4 levels deep
            });
        });
    });
});
```

---

## Good Example

```php
Route::prefix('api/admin/v2/teams')->name('api.admin.v2.teams.')->group(function () {
    Route::get('/users', ...);
});
// Single group, explicit prefix
```

---

## Exceptions

API versioning with namespace and domain groups may reasonably reach 3 levels. Never exceed 3.

---

## Consequences Of Violation

Unpredictable attribute merging; difficult debugging when routes have unexpected middleware or names; increased onboarding time for new developers.

---

## Always Include Trailing Dot in Name Prefixes

Use `Route::name('admin.')` not `Route::name('admin')`.

---

## Category

Framework Usage

---

## Rule

Every `Route::name()` call that defines a prefix must include the trailing dot separator. The prefix must end with `.` to produce correctly formatted route names.

---

## Reason

Name prefixes are prepended directly to route names via string concatenation. Without the trailing dot, route names become `adminusers.index` instead of `admin.users.index`. The missing separator creates unreadable, non-hierarchical names.

---

## Bad Example

```php
Route::name('admin')->group(function () {
    Route::get('/users', ...)->name('users.index');
    // Result: name is "adminusers.index" — missing separator
});
```

---

## Good Example

```php
Route::name('admin.')->group(function () {
    Route::get('/users', ...)->name('users.index');
    // Result: name is "admin.users.index" — correct
});
```

---

## Exceptions

No common exceptions. Always include the trailing dot in name prefixes.

---

## Consequences Of Violation

Malformed route names; broken `route()` calls; confusing naming that does not reflect the URL hierarchy.

---

## Understand Attribute Merging Rules

Know that group attributes merge differently: middleware arrays merge, prefixes concatenate, name prefixes prepend, and domain replaces.

---

## Category

Maintainability

---

## Rule

When nesting groups, understand the merge behavior for each attribute type before relying on it. Verify the merged result with `php artisan route:list`.

---

## Reason

Each attribute type has a different merge rule: middleware is merged (not deduplicated), prefix is concatenated, name is prepended, domain is replaced. Misunderstanding these rules causes routes to have unexpected middleware, prefixes, or names that can introduce security gaps or broken URIs.

---

## Bad Example

```php
Route::middleware(['auth'])->group(function () {
    Route::middleware(['auth'])->group(function () {
        Route::get('/users', ...);
        // 'auth' middleware runs TWICE — merged, not deduplicated
    });
});
```

---

## Good Example

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', ...);
    Route::get('/users', ...);
});
// Flat middleware list — no duplicates, clear intent
```

---

## Exceptions

No common exceptions for the merge behavior itself. If you need middleware deduplication, flatten the group structure rather than relying on merge semantics.

---

## Consequences Of Violation

Middleware running multiple times; duplicated prefix segments; broken route names; silent security gaps where expected middleware is absent.

---

## Group by Middleware Stack First

Organize groups primarily by middleware requirement, then by URL prefix.

---

## Category

Architecture

---

## Rule

When structuring route groups, choose the outermost grouping dimension based on middleware requirements (auth, guest, throttle). Apply prefixes and name prefixes within that middleware group.

---

## Reason

Middleware determines the request's security model. Grouping by middleware makes it immediately clear which routes share authentication, rate limiting, and verification requirements. Prefix-based grouping first can accidentally mix routes with different security contexts.

---

## Bad Example

```php
Route::prefix('admin')->group(function () {
    Route::get('/login', [AuthController::class, 'login'])->withoutMiddleware('auth');
    // Public login route mixed inside admin auth group
    Route::get('/users', [UserController::class, 'index'])->middleware('auth');
});
```

---

## Good Example

```php
// Public routes first
Route::get('/admin/login', [AuthController::class, 'login']);

// Authenticated routes grouped by middleware
Route::prefix('admin')->middleware('auth')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
});
```

---

## Exceptions

Domain-based groups (e.g., `Route::domain('admin.example.com')`) may be the outermost layer for subdomain isolation, with middleware groups nested inside.

---

## Consequences Of Violation

Accidental exposure of authenticated routes to unauthenticated users; confusing group organization that mixes security contexts.

---

## Do Not Create Groups for Visual Organization Only

Only create route groups when routes share actual attributes. Do not group routes purely for visual nesting.

---

## Category

Code Organization

---

## Rule

Every route group must apply at least one shared attribute (middleware, prefix, name prefix, or domain). Do not wrap routes in empty `Route::group()` calls solely for visual organization.

---

## Reason

Empty groups provide no functional benefit but add nesting complexity. Developers reading the file must navigate the group structure to find routes, with no attribute benefit. Use comments or separate files for visual organization.

---

## Bad Example

```php
// Group with no shared attributes — purely visual
Route::group(function () {
    Route::get('/users', ...)->name('users.index');
    Route::post('/users', ...)->name('users.store');
});
// No prefix, middleware, or name applied — group is useless
```

---

## Good Example

```php
// No group — routes are clear without nesting
Route::get('/users', ...)->name('users.index');
Route::post('/users', ...)->name('users.store');

// Or use a group with actual shared attributes
Route::prefix('admin')->middleware('auth')->group(function () {
    Route::get('/users', ...)->name('users.index');
});
```

---

## Exceptions

No common exceptions. Every group must serve a functional purpose.

---

## Consequences Of Violation

Unnecessary nesting; reduced readability; confusion about whether a group applies hidden attributes.
