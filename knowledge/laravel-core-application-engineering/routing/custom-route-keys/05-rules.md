## Prefer Inline Custom Key Syntax

Use `{user:slug}` in route definitions instead of overriding `getRouteKeyName()` on the model.

---

## Category

Framework Usage

---

## Rule

When a single route or a subset of routes needs a custom binding column, use the inline `{parameter:column}` syntax. Do not override `getRouteKeyName()` unless every binding of that model should use the custom key.

---

## Reason

Inline syntax is explicit at the route level and scoped to only the routes that need it. `getRouteKeyName()` changes the binding column globally for all routes referencing that model, which silently breaks routes that expect ID-based binding.

---

## Bad Example

```php
class User extends Model
{
    public function getRouteKeyName(): string
    {
        return 'slug'; // Affects ALL {user} bindings
    }
}

Route::get('/api/users/{user}', [ApiController::class, 'show']);
// Admin route broken — now expects slug instead of id
Route::get('/admin/users/{user}', [AdminController::class, 'edit']);
```

---

## Good Example

```php
// Inline syntax — only this route uses slug binding
Route::get('/users/{user:slug}', [UserController::class, 'show']);
// Admin route still uses default ID binding
Route::get('/admin/users/{user}', [AdminController::class, 'edit']);
```

---

## Exceptions

Override `getRouteKeyName()` only when the model has no auto-increment ID or when the application uses a non-ID key (e.g., UUID) for ALL interactions with that model.

---

## Consequences Of Violation

Maintenance risks from globally changed behavior; runtime bugs when routes unexpectedly resolve by the wrong column.

---

## Enforce Unique Constraints on Custom Key Columns

Every column used as a custom route key must have a database unique constraint.

---

## Category

Reliability

---

## Rule

Add a `unique()` index to any migration column that will be used as a custom route key. Do not bind on columns that allow duplicate values.

---

## Reason

Route model binding resolves via `Model::where(key, value)->firstOrFail()`. If the column is not unique, `firstOrFail()` silently returns the first matching record, which may be the wrong record. A unique constraint guarantees deterministic resolution.

---

## Bad Example

```php
Route::get('/users/{user:first_name}', [UserController::class, 'show']);
// first_name is not unique — two users named "John" cause
// unpredictable binding
```

---

## Good Example

```php
// Migration
Schema::table('users', function (Blueprint $table) {
    $table->string('slug')->unique();
});

Route::get('/users/{user:slug}', [UserController::class, 'show']);
```

---

## Exceptions

No common exceptions. Deterministic binding requires unique resolution.

---

## Consequences Of Violation

Data integrity risks from resolving the wrong model; unpredictable 404 vs 200 behavior for the same URL when duplicates exist.

---

## Index Custom Key Columns

Always add a database index to any column used as a custom route key.

---

## Category

Performance

---

## Rule

Every column used in a custom route key must have a database index. Add the index in the column's migration.

---

## Reason

Route binding queries the custom key column on every matching request. Without an index, each binding query performs a full table scan. On large tables, this adds milliseconds or seconds to every request.

---

## Bad Example

```php
// Migration — no index on slug
Schema::table('posts', function (Blueprint $table) {
    $table->string('slug'); // No index
});

// Route — binding by slug, but no index
Route::get('/posts/{post:slug}', [PostController::class, 'show']);
```

---

## Good Example

```php
Schema::table('posts', function (Blueprint $table) {
    $table->string('slug')->unique()->index();
});

Route::get('/posts/{post:slug}', [PostController::class, 'show']);
```

---

## Exceptions

UUID and ULID columns are indexed by default when using `uuid()` or `ulid()` column types. Verify the index exists rather than assuming.

---

## Consequences Of Violation

Performance degradation proportional to table size; increased database CPU and IO for every route request with that binding.

---

## Avoid Exposing Auto-Increment IDs in Public URLs

Do not use the default `{user}` (ID-based) binding for publicly accessible routes.

---

## Category

Security

---

## Rule

Use custom keys (slugs, UUIDs, ULIDs) for public-facing route parameters. Reserve auto-increment ID binding for internal or admin routes.

---

## Reason

Auto-increment IDs in URLs expose database structure (entity count, insertion rate) and enable sequential enumeration of resources. Custom keys decouple the public identifier from the internal primary key.

---

## Bad Example

```php
// Public profile URL exposes sequential user IDs
Route::get('/users/{user}', [UserController::class, 'show']);
// /users/1, /users/2, /users/3 — enumeration possible
```

---

## Good Example

```php
Route::get('/users/{user:uuid}', [UserController::class, 'show']);
// /users/550e8400-e29b-41d4-a716-446655440000
```

---

## Exceptions

Internal admin routes or routes behind authentication where all users are authorized may use ID-based binding, since there is no public enumeration risk.

---

## Consequences Of Violation

Information disclosure (entity count, growth rate); enumeration attacks on sequential IDs; potential misuse of exposed primary keys in CSRF or IDOR attacks.

---

## Document Custom Keys in Route Files

Add inline comments near route definitions that use custom keys.

---

## Category

Maintainability

---

## Rule

Every route definition using a custom key should include a comment indicating which model column is used for binding.

---

## Reason

Custom key resolution is implicit — a developer reading the route file must look at the model to determine the binding column. An inline comment makes the binding column obvious without cross-file navigation.

---

## Bad Example

```php
Route::get('/posts/{post:slug}', [PostController::class, 'show']);
// No comment — developer must check Post model to confirm binding
```

---

## Good Example

```php
// Binds by 'slug' column
Route::get('/posts/{post:slug}', [PostController::class, 'show']);
```

---

## Exceptions

Use the default `{parameter}` syntax without comment if binding by the primary key. Comments are only required for non-default custom keys.

---

## Consequences Of Violation

Maintenance risks from developers not knowing which column is used for binding; confusion during debugging when binding behavior is unexpected.
