# Resource Naming Conventions

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: resource-naming-conventions
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Resource naming conventions define the rules for constructing URI paths that identify resources. Consistent naming reduces client confusion, enables predictable endpoint discovery, and is the most visible aspect of API design quality. The core conventions cover pluralization (plural nouns for collections), casing (kebab-case as the dominant standard), relationship depth (nested paths for sub-resources), and special-case handling (singular resources, controller resources).

The dominant industry convention is: plural nouns, kebab-case, lowercase, with forward-slash separation for hierarchy. The most impactful rule is consistency — clients can adapt to any convention if applied uniformly. Inconsistency is the only universal anti-pattern.

## Core Concepts
- **Plural for Collections**: `/users`, `/orders`, `/order-items`. Collection paths use plural nouns.
- **Singular for Parameters**: `/users/{user}`, `/orders/{order}`. The identifier segment uses the singular form.
- **kebab-case for URIs**: `/order-items`, `/user-profiles`. Industry standard for URI path segments.
- **Nested Resources**: `/users/{user}/orders/{order}`. Encodes parent-child relationships. Limit to 3 levels.
- **Controller Resources**: `/profile`, `/settings`. Singular names for singletons — resources of which there is only one per context.
- **No Verbs in URIs**: HTTP methods encode actions. `/users/activate` should be `POST /users/{id}/activate` or `PATCH /users/{id}`.
- **Query Parameters for Filtering**: `?filter[status]=active&sort=-created_at&include=posts`.

## When To Use
- **Plural**: All collection endpoints (lists of resources)
- **Singular**: Singleton resources (profile, settings, dashboard)
- **kebab-case**: All URI path segments (industry standard)
- **Nested**: Parent-child resource relationships with clear ownership
- **Shallow**: Resources with global identifiers — reference directly rather than nesting deeply

## When NOT To Use
- **Verbs in URIs**: `GET /users/getActiveUsers` — the verb is implicit in the HTTP method
- **Deep Nesting**: Beyond 3 levels — `/a/b/c/d/e` is a design smell
- **Mixed Casing**: camelCase or PascalCase in URI paths — use kebab-case consistently
- **Inconsistent Pluralization**: Some resources plural, some singular for collections
- **Database Names as Resource Names**: Exposing table names directly as API resources

## Best Practices (WHY)
- **Use plural nouns consistently for collections**: `/users`, `/orders`, `/products`. Clients can predict 80% of endpoints just by knowing the resource name.
- **Limit nesting to 2-3 levels maximum**: Deep nesting creates fragile, long URLs that are error-prone for clients. Use shallow nesting with global identifiers beyond 2 levels.
- **Use kebab-case for all URI segments**: kebab-case is the RFC 3986-recommended format, case-insensitive, and readable. snake_case is Laravel's internal convention but differs from industry API standards.
- **Never use verbs in URIs**: The HTTP method IS the verb. `GET /users` reads, `POST /users` creates. Adding verbs to URIs (`/users/getAll`) conflates resource identification with operation.
- **Standardize identifier type across the API**: All resources should use the same identifier type (auto-increment, UUID, or slug) for consistency. Mixing types confuses clients and complicates caching.

## Architecture Guidelines
- Use `Route::apiResource()` for CRUD endpoints — it follows standard naming conventions automatically.
- Customize route parameter names for irregular plurals: `Str::singular('series')` returns `'serie'` — use `parameters()` to fix.
- For kebab-case resource names like `order-items`, Laravel generates parameter `order_item`. Ensure controllers use the correct parameter name.
- Use route model binding with custom keys: `Route::get('users/{user:slug}', ...)` to bind by slug instead of ID.
- When renaming a resource, use a dual-path migration period: support both old and new URIs for one version.

## Performance
- URI length beyond 2,048 characters may be truncated by proxies/CDNs — keep paths short.
- Route parameter binding adds one database query per nesting level for implicit binding. Shallow nesting reduces query count.
- Case-insensitive URI matching requires normalization — enforce lowercase to prevent cache splits (`/Users/42` vs `/users/42` producing different cache entries).
- `php artisan route:cache` optimizes route registration regardless of naming convention.

## Security
- Never expose database column names or internal table names as resource names.
- Auto-increment IDs in URLs expose record count and growth rate — use UUIDs or hashids for public APIs.
- Slug-based resources can change — ensure slug changes redirect old URLs or maintain slug history.
- Case-insensitive comparison of identifiers can cause collisions — normalize to lowercase.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Inconsistent pluralization | Some resources plural, others singular for collections | Different developers, no style guide | Clients cannot predict endpoint names | Establish style guide with explicit rules for every resource |
| Over-nesting | `/schools/1/departments/2/courses/3/students/4` | Mapping DB foreign key hierarchy directly to URLs | Fragile, long URLs; high error rates | Limit to 2-3 levels; use shallow nesting with resource references |
| Verbs in URI paths | `/users/getActiveUsers`, `/orders/createOrder` | Action-oriented thinking | Breaks resource model; confuses HTTP method semantics | Use query parameters: `GET /users?filter[status]=active` |
| Mixed casing | Some endpoints kebab-case, others snake_case or camelCase | No enforced convention | Inconsistent API surface; cache splits | Enforce kebab-case across the entire API |
| Singularization errors | `Str::singular('series')` → `'serie'` | Laravel's automatic singularization | Wrong parameter name in routes | Explicitly set parameters for irregular plurals |
| Using verbs as resource names | `/search`, `/login` as collections | Convenience over convention | Not a collection — clients expect pagination and CRUD | Use controller resources or action endpoints |

## Anti-Patterns
- **Verbs in URIs**: HTTP methods are the verbs — don't repeat them in the path.
- **Deep Nesting**: `/schools/1/departments/2/courses/3/students/4` — use shallow references.
- **Mixed Casing**: camelCase AND kebab-case AND snake_case in the same API. Pick one.
- **Database Names as API**: Exposing table columns directly as resource fields.
- **Auto-Increment in Public URL**: `/users/42` reveals user count — use UUIDs for public APIs.

## Examples
```php
// Standard naming with kebab-case
Route::apiResource('order-items', OrderItemController::class);
// GET /order-items → index
// POST /order-items → store
// GET /order-items/{order_item} → show
// etc.

// Nested with kebab-case
Route::apiResource('users.orders', OrderController::class);
// GET /users/{user}/orders
// GET /users/{user}/orders/{order}

// Custom route key
Route::get('posts/{post:slug}', [PostController::class, 'show']);
// GET /posts/my-blog-post

// Shallow nesting
Route::get('users/{user}/orders', [OrderController::class, 'index']);  // needs parent
Route::get('orders/{order}', [OrderController::class, 'show']);         // global ID
Route::patch('orders/{order}', [OrderController::class, 'update']);     // global ID
Route::delete('orders/{order}', [OrderController::class, 'destroy']);   // global ID

// Controller resource (singleton)
Route::get('profile', [ProfileController::class, 'show']);
Route::patch('profile', [ProfileController::class, 'update']);
```

## Related Topics
- **Prerequisites**: url-structure-design, resource-vs-action-orientation
- **Related**: http-method-semantics, resourceful-routing, rest-purity-vs-pragmatic
- **Advanced**: api-versioning, api-documentation-generation

## AI Agent Notes
- Use plural kebab-case for collections, singular for route parameters.
- Limit nesting to 2-3 levels — use shallow references beyond that.
- Use `Route::apiResource()` for CRUD — excludes `create`/`edit` routes.
- Fix irregular pluralization with explicit `parameters()` configuration.
- Never use verbs in URI paths — HTTP methods encode the action.
- Standardize on one identifier type (UUID, slug, or auto-increment) across the API.

## Verification
- All collection endpoints use plural nouns (`/users`, `/orders`).
- All URI segments use kebab-case consistently.
- No verbs appear in URI paths (HTTP methods are sufficient).
- Nesting depth does not exceed 3 levels.
- Singleton resources use singular names (`/profile`, `/settings`).
- Identifier type is consistent across all resources.
- `create` and `edit` routes are not present in API routes (using `apiResource`).
