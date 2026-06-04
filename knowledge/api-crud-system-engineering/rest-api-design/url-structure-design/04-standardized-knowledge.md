# URL Structure Design

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: url-structure-design
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
URL structure design defines the hierarchy, identifiers, query parameters, and versioning strategy for an API's URI space. A well-designed URL structure makes the API intuitive, predictable, and stable over time. The URL is the primary interface contract between client and server — every change to a URL is a breaking change for clients that have hardcoded it.

The key design dimensions are: path hierarchy (how resources nest), identifier strategy (IDs, UUIDs, slugs), query parameter conventions (filtering, sorting, including), and versioning placement (path prefix, header, or query param). URL stability is more important than URL aesthetics — a slightly ugly URL that never changes is better than a clean URL that breaks every six months.

## Core Concepts
- **Path Hierarchy**: Collection (`/users`), member (`/users/42`), nested collection (`/users/42/orders`), nested member (`/users/42/orders/99`).
- **Identifier Strategies**: Auto-increment IDs (short, fast, predictable), UUIDs (globally unique, not predictable), slugs (human-readable, SEO-friendly, may change), hashids (obfuscated IDs, short).
- **Query Parameter Conventions**: `filter[field]=value` for filtering, `sort=-field` for descending sort, `page[size]=25&page[number]=2` for pagination, `include=relation` for eager loading.
- **Versioning Strategies**: URL path prefix (`/v1/users`), Accept header (`Accept: application/vnd.myapp.v2+json`), query parameter (`?api_version=2`).
- **Nesting Depth**: 1 level (simple, flat) recommended for most APIs. 2 levels for clear parent-child. 3 levels maximum. 4+ is a design smell.

## When To Use
- **Auto-increment IDs**: Internal APIs, low traffic, no security concerns around predictable IDs
- **UUIDs**: Public APIs, high traffic, security through non-predictability
- **Slugs**: User-facing resources where readability matters (blog posts, products)
- **Path versioning**: Major API versions — most explicit, easy to test manually
- **Header versioning**: Minor revisions, cleaner URLs — harder to test
- **Shallow nesting**: Resources with global identifiers — reference directly

## When NOT To Use
- **Deep nesting (4+ levels)**: Design smell — use shallow nesting with resource references
- **Inconsistent identifier types**: Some resources using IDs, others UUIDs, others slugs — standardize
- **Changing identifier strategy after launch**: All existing client URLs break
- **Unnecessary path segments**: `/api` prefix when on `api.` subdomain, `/rest` when obviously REST
- **Verbs in URL paths**: HTTP methods encode the action — don't repeat in the path

## Best Practices (WHY)
- **Design URLs for permanence**: A URL that never changes is better than a clean URL that breaks. Choose identifier types and nesting patterns that won't need restructuring.
- **Limit nesting to 2-3 levels**: Deep nesting creates fragile, long URLs. `/schools/1/departments/2/courses/3/students/4/enrollments/5` is unreasonably fragile. Use shallow references.
- **Use UUIDs for public APIs**: Auto-increment IDs expose record count and sequential enumeration. UUIDs are globally unique and non-predictable without the complexity of hashids.
- **Standardize query parameter conventions**: Use consistent `filter[field]`, `sort`, `include`, `page[size]` conventions across all endpoints. Document these in the API style guide.
- **Use path prefix for major versions**: `/v1/users`, `/v2/users` — most explicit, easy to route, hard to forget. Use Accept header for minor revisions within a version.

## Architecture Guidelines
- Laravel route group prefixing supports versioning: `Route::prefix('v1')->group(...)`.
- Use route model binding with custom keys for non-ID identifiers: `Route::get('users/{user:slug}', ...)`.
- Normalize URLs to lowercase — enforce via middleware. `/Users/42` should redirect to `/users/42`.
- Choose a trailing slash policy and enforce it — `/users/` vs `/users`. Redirect the non-canonical form.
- Deprecated URLs should continue working with `Deprecation` header — don't break old URLs without migration period.
- Use `php artisan route:cache` for versioned route groups — registration time doubles with each version.

## Performance
- URLs over 2,048 characters may be truncated by proxies/CDNs. Keep paths short and queries efficient.
- Integer IDs are fastest for database lookups and smallest indexes. UUIDs are 4x larger with slower index performance.
- Route parameter binding adds one DB query per nesting level for implicit binding — shallow nesting reduces query count.
- Route caching (`php artisan route:cache`) mitigates registration overhead from versioned route groups.

## Security
- Auto-increment IDs in URLs expose record count, growth rate, and enable sequential enumeration — use UUIDs or hashids for public APIs.
- Slugs can change — maintain slug history or redirect old URLs to prevent dead links.
- UUID case sensitivity: normalize to lowercase in route bindings — uppercase vs lowercase UUIDs should resolve to the same resource.
- Never expose internal identifiers (database primary keys) directly in URLs for public APIs.
- Query parameters that enable data filtering must respect authorization — a user should not be able to filter by fields they shouldn't access.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Nesting beyond 3 levels | `/a/b/c/d/e` — mapping DB foreign keys to URLs | Convenient but fragile | Long URLs, high client error rates | Use shallow nesting with resource references |
| Inconsistent identifier types | IDs for users, UUIDs for orders, slugs for posts | Different teams, different decisions | Clients must handle multiple identifier types | Standardize on one identifier type across the API |
| Changing identifier after launch | Migrating from auto-increment to UUIDs | Security concerns discovered late | All existing client URLs break | Support both identifiers through migration period |
| Unnecessary path segments | `/api/v1/rest/users` when on `api.example.com` | Convention copy-paste | URL noise without value | Use subdomain for API/UI separation |
| Verb in URL path | `GET /users/getActiveUsers` | Action-oriented thinking | Verb is redundant with HTTP method | Use query parameters: `?filter[status]=active` |
| Trailing slash inconsistency | Some endpoints with trailing slash, some without | No enforced policy | Cache splits, client confusion | Choose one policy and enforce via redirect |

## Anti-Patterns
- **Deep Nesting**: Beyond 3 levels of path hierarchy. Use shallow references.
- **Inconsistent Identifier Strategy**: Mixing IDs, UUIDs, and slugs across the same API.
- **Unnecessary Prefixes**: `/api`, `/rest`, `/v1` when already on API subdomain.
- **Verbs in Paths**: `getUsers`, `createOrder` in URL segments.
- **Mutable Identifiers**: Using values that can change (email, username) as the primary identifier.
- **Case-Insensitive Assumptions**: Not normalizing UUIDs or slugs to lowercase.

## Examples
```php
// Path versioning with route groups
Route::prefix('v1')->group(function () {
    Route::apiResource('users', V1\UserController::class);
    Route::apiResource('users.orders', V1\OrderController::class);
});

Route::prefix('v2')->group(function () {
    Route::apiResource('users', V2\UserController::class);
    // V2 uses shallow nesting for orders
    Route::apiResource('orders', V2\OrderController::class);
});

// Custom route key binding
Route::get('posts/{post:slug}', [PostController::class, 'show']);
// GET /posts/my-blog-post

// Query parameter conventions
Route::get('users', function (Request $request) {
    $query = User::query();
    
    if ($request->filled('filter.status')) {
        $query->where('status', $request->input('filter.status'));
    }
    
    $sortField = ltrim($request->input('sort', '-created_at'), '-');
    $sortDir = str_starts_with($request->input('sort', '-created_at'), '-') ? 'desc' : 'asc';
    $query->orderBy($sortField, $sortDir);
    
    if ($request->filled('include')) {
        $query->with(explode(',', $request->input('include')));
    }
    
    return UserResource::collection($query->paginate());
});

// UUID normalization in route binding
public function boot(): void
{
    Route::bind('user', function (string $value) {
        return User::where('uuid', strtolower($value))->firstOrFail();
    });
}

// URL structure conventions:
//   /v1/users                  — collection
//   /v1/users/{user}           — member
//   /v1/users/{user}/orders    — nested collection (max 3 levels)
//   /v1/users/{user}/orders/{order} — nested member
//   /v1/orders/{order}         — shallow reference (global ID)
//   ?filter[status]=active     — filtering
//   &sort=-created_at           — sorting (descending)
//   &include=posts,profile      — inclusion
//   &page[size]=25&page[number]=2 — pagination
```

## Related Topics
- **Prerequisites**: rest-architectural-constraints, resource-naming-conventions
- **Related**: api-versioning, resource-vs-action-orientation, pagination-strategies
- **Advanced**: route-model-binding, route-caching

## AI Agent Notes
- Use path prefix versioning (`/v1/`) for major versions — most explicit and testable.
- Limit nesting to 2-3 levels — use shallow references for deeper relationships.
- Standardize on one identifier type (UUID recommended for public APIs) across all resources.
- Use consistent query parameter conventions: `filter[field]`, `sort`, `include`, `page`.
- Normalize URLs to lowercase with enforced trailing slash policy.
- Design for permanence — changing URLs breaks existing clients.

## Verification
- All URLs use lowercase with no mixed casing.
- Nesting depth does not exceed 3 levels.
- Identifier type is consistent across all resources.
- No verbs appear in URL paths.
- Trailing slash policy is consistent (enforced via redirect).
- Query parameter conventions are uniform across all endpoints.
- Versioning strategy is consistent (path prefix or header — not both).
- Deprecated URLs include `Deprecation` header and continue working during migration.
- Route caching is enabled for versioned route groups.
