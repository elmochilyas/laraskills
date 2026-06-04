# Custom Route Keys

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** Custom Route Keys
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Custom route keys allow developers to change the database column used for implicit route model binding — replacing the default auto-increment `id` with slugs, UUIDs, ULIDs, or any other column. Two mechanisms exist: inline syntax (`{post:slug}`) that specifies the key per-route, and model-level override (`getRouteKeyName()`) that specifies the key for all routes referencing that model.

The engineering significance of custom keys is threefold: security (UUIDs prevent sequential enumeration), SEO (slugs produce human-readable URLs), and architectural flexibility (the binding column is decoupled from the primary key). The choice between inline and model-level customization is a tradeoff between per-route flexibility and model-wide consistency.

Custom keys have performance implications that are often overlooked. Querying by UUID is slower than querying by auto-increment integer — approximately 2x slower for individual queries and significantly more for JOIN operations. Using UUID as a primary key for large tables with foreign key references degrades join performance because UUIDs are large (16 bytes for binary, 36 bytes for string) and random (poor index locality for B-tree). The production pattern is to keep auto-increment primary keys and use UUID/slug as a secondary query column for route binding.

---

## Core Concepts

### Inline Binding Field Syntax
`RouteUri.php` parses the `{param:field}` pattern from route URIs:
```
/users/{user:slug}        → binds via `where('slug', $value)`
/posts/{post:uuid}        → binds via `where('uuid', $value)`
/products/{product:sku}  → binds via `where('sku', $value)`
```

The parsing regex `/\{([\w\:]+?)\??\}/` detects colons within parameter braces. The binding field is extracted for:
- Implicit model binding (passed as `$field` to `resolveRouteBinding()`)
- Scoped binding (used as `$field` for `resolveChildRouteBinding()`)
- Route URL generation (the field is used when generating URLs via `route()`)

The route URI stores `{user}` (without the field suffix), and the binding field is maintained separately in the Route's `bindingFields` array.

### Model-Level Key Override
`Model::getRouteKeyName()` returns the column name used for binding. Default returns `$this->getKeyName()` (typically `'id'`). Override:
```php
public function getRouteKeyName(): string
{
    return 'uuid';
}
```

This affects:
- All implicit bindings for this model
- Automatic `resolveRouteBinding()` field selection
- URL generation for named routes

### Per-Route vs Model-Level Priority
When both are specified:
- Inline syntax `{post:slug}` takes precedence over `getRouteKeyName()` for that specific route
- Other routes referencing the same model use `getRouteKeyName()`

This allows per-route customization without changing the model's global behavior.

### resolveRouteBindingQuery Control
`resolveRouteBindingQuery($query, $value, $field)` provides the most granular control:
```php
protected function resolveRouteBindingQuery($query, $value, $field = null)
{
    if ($field === 'uuid') {
        return $query->whereUuid($value)->where('status', 'published');
    }
    return $query->where($field ?? $this->getRouteKeyName(), $value);
}
```

The method is called by the default `resolveRouteBinding()` and allows pre-query customization (scopes, additional conditions, eager loading constraints).

---

## Mental Models

### Column Selection as URL Design
The route key column is a design decision about what appears in URLs. Auto-increment IDs are short, numeric, and machine-friendly. Slugs are human-readable but require uniqueness enforcement. UUIDs are non-enumerable but long and ugly. The choice is a tradeoff between URL aesthetics, security, and database performance.

### Decoupling URL Identity from Primary Key
Using custom route keys decouples the public identity of a resource (what appears in URLs) from its internal database identity (the primary key). This enables:
- Primary key changes without URL breakage
- Multiple public identifiers per resource (UUID for API, slug for web)
- Primary key type changes without URL contract changes

### Per-Route vs Model-Level as Scope Decision
Inline syntax is a per-route decision: "this specific route should bind using this column." Model-level override is a global decision: "every route for this model should use this column." Inline is flexible but verbose (must specify on every route). Model-level is consistent but rigid (cannot have different routes using different keys).

---

## Internal Mechanics

### RouteUri Parsing
```
RouteUri::parse('/users/{user:slug}')
  ├── Regex match: \{([\w\:]+?)\??\}
  ├── Capture: 'user:slug'
  ├── Split on ':': ['user', 'slug']
  ├── bindingFields['user'] = 'slug'
  ├── URI: replace '{user:slug}' with '{user}'
  └── Return new RouteUri with modified URI + bindingFields
```

The binding field is stored in `Route::$bindingFields`:
```
$this->bindingFields = ['user' => 'slug'];
```

### Implicit Resolution with Binding Fields

```
ImplicitRouteBinding::resolveForRoute(...)
  ├── For each UrlRoutable parameter:
  │     ├── $field = $route->bindingFieldFor($parameterName)
  │     │     ├── If field exists → use it
  │     │     └── If null → use model's getRouteKeyName()
  │     └── $model->resolveRouteBinding($value, $field)
  │           └── resolveRouteBindingQuery → where($field, $value)
```

### URL Generation with Binding Fields

`RouteUrlGenerator::to()` for named routes:
```
route('posts.show', ['post' => $post])
  ├── If $post is an Eloquent model:
  │     ├── $post->getRouteKey() returns the key value
  │     └── If binding field is 'slug' → getRouteKey() still returns 'slug' value
  │         └── getRouteKey() returns $this->{$this->getRouteKeyName()}
```

This means `getRouteKeyName()` affects URL generation even when inline binding field is used for resolution. If the route uses `{post:slug}` but the model's `getRouteKeyName()` returns `'id'`, URL generation uses the `id`, not the `slug`.

---

## Patterns

### Slug-Based Public URLs
```php
// Route: /blog/{post:slug}
// Model: getRouteKeyName() returns 'id' (primary key)
// Resolution uses slug, URL generation uses id — mismatch!
```

For consistency, set `getRouteKeyName()` to return `'slug'` when all public routes use slugs.

### UUID as Secondary Column
```php
// Schema: id (auto-increment PK), uuid (unique, secondary)
// Route: /api/users/{user:uuid}
// Primary key: id (fast joins, compact foreign keys)
// Route key: uuid (non-enumerable, API-facing)
```

This is the recommended production pattern — keep integer PK for performance, use UUID for API routes.

### ULID for Sortable UUIDs
Laravel 12+ supports ULIDs (Universally Unique Lexicographically Sortable Identifiers):
```php
// Route: /users/{user}
// Model: uses HasUlids trait
// getRouteKeyName(): 'ulid'
```

ULIDs are sortable by creation time, improving B-tree index performance compared to random UUIDs.

### Multi-Column Binding Strategy
Using `resolveRouteBindingQuery()` for conditional column selection:
```php
protected function resolveRouteBindingQuery($query, $value, $field = null)
{
    if (is_numeric($value)) {
        return $query->where('id', $value);
    }
    return $query->where('slug', $value);
}
```
Allows both ID and slug-based URLs for the same model.

---

## Architectural Decisions

### Why Inline Syntax Exists
Inline syntax exists because model-level `getRouteKeyName()` is a global decision — every route for that model uses the same column. Applications often need different keys for different contexts (admin routes use IDs, public routes use slugs). Inline syntax allows per-route column selection without model changes.

### Why URL Generation Doesn't Respect Inline Binding Fields
`route()` helper generates URLs using `RouteUrlGenerator` which calls `Model::getRouteKey()`. `getRouteKey()` returns `$this->{$this->getRouteKeyName()}`, ignoring the inline binding field. This means the URL may contain an `id` even when the route uses `{post:slug}` for resolution. This is a known inconsistency — the framework resolves by the binding field but generates URLs by `getRouteKeyName()`.

### Why UUID/ULID Is Not the Default
Laravel's default primary key is auto-increment integer — the most performant option for joins, indexes, and storage. UUIDs are available via traits (`HasUuids`, `HasUlids`) but are opt-in. The decision reflects the principle of progressive enhancement: start with the simplest performant option, add complexity (UUID/ULID) only when the use case requires it.

---

## Tradeoffs

### Auto-Increment vs UUID vs Slug

| Aspect | Auto-Increment | UUID (v4) | Slug |
|--------|---------------|-----------|------|
| URL appearance | `/users/42` | `/users/550e8400-...` | `/users/john-doe` |
| Enumerability | Sequential (reveals count) | Random (non-enumerable) | Semantic (no enumeration) |
| Query performance | Fastest (integer B-tree) | 2x slower (random B-tree inserts) | Fast if indexed, depends on length |
| Join performance | Excellent (compact FK) | Poor (large FK, random distribution) | Poor (large FK, variable length) |
| Uniqueness | Automatic (auto-increment) | Statistical (collision probability ~2^-122) | Manual (must validate uniqueness) |
| Human readability | Not readable | Not readable | Readable |
| URL length | 1-10 chars | 36 chars | 5-200 chars |

### Inline vs Model-Level Customization

| Aspect | Inline Syntax | Model-Level Override |
|--------|-------------|---------------------|
| Scope | Per-route | All routes for this model |
| Visibility | In route definition | In model class |
| Consistency risk | Different routes may use different keys | Single source of truth |
| URL generation | Uses getRouteKeyName() (potential mismatch) | Uses getRouteKeyName() (consistent) |

---

## Performance Considerations

### UUID Query Performance
Laravel Daily benchmarks show:
- UUID as primary key with joins: ~25ms for relationship queries
- Integer as primary key with UUID secondary: ~12ms (2x faster)
- UUIDv7 (time-ordered): better than UUIDv4 for index performance, but still larger than integer

### Index Requirements
Custom key columns MUST be indexed:
```php
// Schema: $table->string('slug')->unique();
// OR: $table->uuid('uuid')->unique();
```

Missing index on the custom key column causes full table scans on every binding resolution.

### URL Generation Cost
Route URL generation requires computing `getRouteKey()` for each bound model in the parameters. This is a property access or method call — negligible cost for typical use.

---

## Production Considerations

### Slug Uniqueness Enforcement
Slugs require explicit uniqueness validation at the application level:
- Database unique index on slug column
- Collision handling (increment suffix: `john-doe-2`)
- Consider case-insensitive uniqueness for PostgreSQL (`CREATE UNIQUE INDEX ... ON posts (LOWER(slug))`)

### UUIDv7 Adoption
Laravel 12+ defaults to UUIDv7 in `HasUuids` trait. UUIDv7 is time-ordered, improving database index performance compared to UUIDv4. Existing applications using UUIDv4 should consider migrating if index performance is a concern.

### Deployment Impact
Changing a model's `getRouteKeyName()` after an application is deployed:
- Existing URLs with the old key format continue to work IF the old column still exists and is populated
- New URLs are generated using the new key format
- External consumers of your API may depend on the old URL format

---

## Common Mistakes

### Not Indexing the Custom Key Column
Why it happens: Developers add inline `{post:slug}` but don't create a database index on `slug`. Why it's harmful: Every binding query performs a full table scan. Worse as the table grows. Better approach: `$table->string('slug')->unique()` in migration.

### Using UUID as Primary Key on Large Tables
Why it happens: UUIDs are conceptually cleaner. Why it's harmful: Random UUID (v4) causes B-tree index fragmentation, increasing insert time and reducing cache hit rate. Foreign key storage blows up (36 bytes per reference instead of 4-8). Better approach: Integer primary key for relationships, UUID secondary column for route binding.

### Inline Syntax Without Matching getRouteKeyName() for URL Generation
Why it happens: Route uses `{post:slug}` for resolution but `getRouteKeyName()` returns `'id'`. Why it's harmful: `route('posts.show', $post)` generates `/posts/42` instead of `/posts/my-post`. Links are broken. Better approach: Set `getRouteKeyName()` to match the binding field, or override `getRouteKey()` to return the binding field value.

### Forcing UUIDs for Internal-Only Applications
Why it happens: UUIDs are trendy. Why it's harmful: Adds performance overhead with zero benefit (internal users don't enumerate resources). Better approach: Use auto-increment for internal apps, UUID for public-facing APIs.

---

## Failure Modes

### Binding Column Contains Non-Unique Values
If the custom key column is not unique, `resolveRouteBinding()` returns the first match. Subsequent matches are ignored. The behavior is non-deterministic for non-unique columns. Fix: Always enforce uniqueness (database constraint + application validation).

### Case-Sensitive Slug Mismatches
MySQL with default collation is case-insensitive for string comparisons. PostgreSQL is case-sensitive. A route with slug `John-Doe` may match `john-doe` on MySQL but not on PostgreSQL. Fix: Use case-insensitive index or normalize slugs to lowercase during creation.

### Missing Binding Field in URL Generation
If `{post:slug}` is used but `getRouteKeyName()` returns `'id'`, `route('posts.show', $post)` generates a URL with the `id`, which then resolves via `slug` if the route has `{post:slug}`. The generated URL is incorrect but the route still resolves — creating confusion about which key is actually used.

---

## Ecosystem Usage

### Laravel Framework
Laravel's first-party packages use auto-increment primary keys by default. No first-party package changes `getRouteKeyName()`. The `HasUuids` and `HasUlids` traits are available for applications that want UUID/ULID keys.

### Spatie Packages
Spatie packages that use Eloquent models do not override `getRouteKeyName()`. They rely on the default auto-increment binding. Applications using Spatie packages with custom keys must ensure the binding column is correctly configured.

### Monica CRM
Monica uses auto-increment primary keys with `getRouteKeyName()` returning `'id'` for all models. No custom route keys are used. This is consistent with its internal-usage pattern (authenticated users only).

### Laravel Jetstream
Jetstream uses auto-increment keys for all built-in routes. Team and user binding use the default `id` column.

---

## Related Knowledge Units

### Prerequisites
- Route Model Binding Implicit — The binding mechanism that uses custom keys
- Route Definition — Parameter syntax in route URIs

### Related Topics
- Route Model Binding Explicit — Custom resolution logic when inline syntax is insufficient
- Scoped Bindings — How binding fields interact with child route resolution
- Route Name Generation — How `getRouteKeyName()` affects URL generation

### Advanced Follow-up Topics
- Database Indexing — Performance implications of UUID/slug indexes
- Application Localization — Slug localization for multi-language applications

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\RouteUri.php` — `parse()` regex for `{param:field}` pattern
- `Illuminate\Routing\Route.php` — `bindingFieldFor()`, `bindingFields` storage
- `Illuminate\Routing\RouteUrlGenerator.php` — URL generation uses `getRouteKey()` from model
- `Illuminate\Database\Eloquent\Model.php` — `getRouteKeyName()`, `getRouteKey()`, `resolveRouteBindingQuery()`

### Key Insight
The URL generation mismatch (inline binding field affects resolution but not URL generation) is the most common source of custom key bugs. The framework uses `getRouteKeyName()` for URL generation regardless of inline syntax. This means `{post:slug}` + `getRouteKeyName() = 'id'` produces URLs with IDs that resolve via slugs — a confusing inconsistency.

### Version-Specific Notes
- Inline binding field syntax is stable across Laravel 8-13
- `HasUuids` trait uses UUIDv7 by default in Laravel 12+
- `HasUlids` trait is stable across Laravel 10-13
- `resolveRouteBindingQuery()` is stable across Laravel 8-13
