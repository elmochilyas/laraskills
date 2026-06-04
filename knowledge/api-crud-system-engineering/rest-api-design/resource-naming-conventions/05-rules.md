# Resource Naming Conventions

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: resource-naming-conventions
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Use Plural Nouns For Collection Endpoints
---
## Category
Design
---
## Rule
Always use plural nouns for collection endpoint paths (`/users`, `/orders`, `/order-items`) — never use singular nouns for collections.
---
## Reason
Plural nouns are the universal industry convention. A collection contains multiple resources — the path should reflect that. Clients can predict 80% of endpoint paths just by pluralizing the resource name. Singular nouns for collections (`/user`, `/order`) create confusion about whether the path refers to a collection or a singleton resource.
---
## Bad Example
```php
Route::apiResource('user', UserController::class);
// Singular — looks like a singleton, not a collection
```

## Good Example
```php
Route::apiResource('users', UserController::class);
// Plural — clearly a collection
```

## Exceptions
Singleton resources of which there is only one per context (`/profile`, `/settings`, `/dashboard`). Use singular for these — they are not collections.

## Consequences Of Violation
Inconsistent API surface; client confusion about resource type; integration errors when clients assume plural convention; poor developer experience for new API consumers.
---

## Use kebab-case For All URI Path Segments
---
## Category
Maintainability
---
## Rule
Always use kebab-case (lowercase with hyphens) for all URI path segments (`/order-items`, `/user-profiles`) — never use snake_case, camelCase, or PascalCase.
---
## Reason
kebab-case is the RFC 3986-recommended format for URI paths. It is case-insensitive (URLs are case-insensitive by default), human-readable (hyphens are more legible than underscores in URLs), and the universal industry standard for REST APIs. snake_case (Laravel's internal convention) works in the codebase but differs from API URI standards.
---
## Bad Example
```php
Route::apiResource('order_items', OrderItemController::class);
// snake_case — uncommon in API URIs
```

## Good Example
```php
Route::apiResource('order-items', OrderItemController::class);
// kebab-case — industry standard
```

## Exceptions
When the organization has an established snake_case API convention with existing clients. Consistency within the API is more important than following the industry standard — but document the choice.

## Consequences Of Violation
Inconsistent API surface; client confusion about casing convention; cache splits from case-sensitive CDN caching (though URLs are case-insensitive by spec, some systems are case-sensitive).
---

## Limit Nesting To 2-3 Levels Maximum
---
## Category
Architecture
---
## Rule
Always limit URL nesting to a maximum of 3 levels (`/users/{user}/orders/{order}/items`) — never create paths with 4+ levels of nesting.
---
## Reason
Deep nesting creates fragile, long URLs that are error-prone for clients. Each nesting level adds a failure point (a missing parent 404s the entire path). Beyond 3 levels, the URL encodes a database foreign key hierarchy rather than a meaningful resource relationship. Use shallow references with global identifiers for deeper relationships.
---
## Bad Example
```php
// 5 levels of nesting — fragile and unreadable
Route::apiResource('schools.departments.courses.enrollments.students', ...);
```

## Good Example
```php
// 2 levels for parent-child, then shallow reference
Route::apiResource('schools.departments', DepartmentController::class);
Route::apiResource('courses', CourseController::class); // shallow — global ID
Route::apiResource('enrollments', EnrollmentController::class); // shallow
```

## Exceptions
When the resource hierarchy is genuinely necessary for access control (each level provides context for authorization). Even then, limit to 3 levels and document the rationale.

## Consequences Of Violation
Fragile URLs with multiple failure points; long URLs that exceed proxy/CDN limits; poor developer experience; difficulty evolving the resource hierarchy.
---

## Never Use Verbs In URI Paths
---
## Category
Design
---
## Rule
Never include verbs in URI paths (`/users/getActiveUsers`, `/orders/createOrder`) — the HTTP method is the verb and encodes the action.
---
## Reason
URIs identify resources (nouns), not actions (verbs). The HTTP method (GET, POST, PUT, PATCH, DELETE) specifies the operation to perform on the resource. Adding verbs to URIs conflates resource identification with operation, creating redundant, confusing paths. Clients cannot distinguish between reading a resource and performing an action when both use the same HTTP method with different path verbs.
---
## Bad Example
```php
Route::get('users/getActiveUsers', [UserController::class, 'getActive']);
// Verb in path — redundant with GET
```

## Good Example
```php
Route::get('users', [UserController::class, 'index'])
    ->name('users.index');
// Query parameter filters instead
// GET /users?filter[status]=active
```

## Exceptions
Action endpoints for non-CRUD operations (cancel, restore, send) use verbs as sub-resources: `POST /orders/{order}/cancel`. This is an accepted pragmatic convention. The verb names the action resource, not the operation.

## Consequences Of Violation
Violation of REST resource model; confusing API surface; redundant verb-naming conventions; poor integration with HTTP method semantics; clients cannot distinguish CRUD from actions.
---

## Standardize On One Identifier Type Across The API
---
## Category
Maintainability
---
## Rule
Always use a single identifier type (auto-increment, UUID, or slug) consistently across all resources — never mix different identifier types in the same API.
---
## Reason
Mixed identifier types force clients to track which identifier type each resource uses. Auto-increment IDs are integers, UUIDs are strings, slugs are human-readable strings. Client code that handles one type fails with another. Standardizing on one type simplifies client integration, caching, and documentation.
---
## Bad Example
```php
// Mixed identifier types
GET /users/42          // auto-increment integer
GET /orders/550e8400   // UUID
GET /posts/my-blog-post // slug
```

## Good Example
```php
// Consistent UUID identifiers
GET /users/550e8400-e29b-41d4-a716-446655440000
GET /orders/550e8400-e29b-41d4-a716-446655440001
GET /posts/550e8400-e29b-41d4-a716-446655440002
```

## Exceptions
When different resources genuinely need different identifier types (e.g., user-facing content uses slugs for SEO, internal resources use UUIDs). Document the mapping and provide clear client guidance.

## Consequences Of Violation
Complex client logic for handling multiple identifier types; cache key collisions between different identifier formats; integration errors when clients assume the wrong identifier type; increased documentation requirements.
---

## Use Route Model Binding With Custom Keys For Non-ID Resources
---
## Category
Framework Usage
---
## Rule
Always use explicit route model binding with custom keys for non-ID resource identifiers (slugs, UUIDs) — never manually query the database in controllers.
---
## Reason
Route model binding automatically resolves identifiers to models, handles 404 responses, and keeps controllers clean. Custom key binding (`{user:slug}`) tells Laravel to resolve using the `slug` column instead of `id`. The same benefits (auto-resolution, 404, injection) apply without duplicating lookup logic in every controller method.
---
## Bad Example
```php
// Manual lookup in controller
public function show(string $slug)
{
    $user = User::where('slug', $slug)->firstOrFail();
    return new UserResource($user);
}
```

## Good Example
```php
// Route model binding with custom key
Route::get('posts/{post:slug}', [PostController::class, 'show']);

// Clean controller — model injected directly
public function show(Post $post)
{
    return new PostResource($post);
}
```

## Exceptions
When the binding logic requires complex resolution (multiple fallback columns, external service lookup). In that case, implement a custom route binding in `App\Providers\RouteServiceProvider`.

## Consequences Of Violation
Duplicate lookup logic across controllers; inconsistent 404 handling; harder to maintain when identifier strategy changes; more code to test.
---

## Use Query Parameters For Filtering, Sorting, And Includes
---
## Category
Design
---
## Rule
Always express filtering, sorting, and relationship inclusion via query parameters (`?filter[status]=active&sort=-created_at&include=posts`) — never encode these in the URI path.
---
## Reason
Query parameters are the standard mechanism for modifying resource representation without changing resource identity. Encoding filters in the path (`/users/active`) creates infinite path variants that don't represent distinct resources but rather filtered views of the same collection.
---
## Bad Example
```php
// Filters in path — creates infinite non-resource paths
Route::get('users/active', [UserController::class, 'active']);
Route::get('users/inactive', [UserController::class, 'inactive']);
```

## Good Example
```php
// Filters as query parameters — clean, extensible
Route::get('users', [UserController::class, 'index']);
// GET /users?filter[status]=active
// GET /users?filter[status]=inactive&sort=-created_at
```

## Exceptions
Common, stable filters that are effectively different resource views (e.g., trashed vs active). Use named scopes or dedicated endpoints only when the filter fundamentally changes the resource representation.

## Consequences Of Violation
Route explosion from every filter combination; clients cannot discover available filters easily; difficult to add new filters without new routes; caching requires per-filter cache key logic.
---

## Handle Irregular Pluralization Explicitly
---
## Category
Framework Usage
---
## Rule
Always set explicit route parameter names for irregular plurals (series, species, order-items) using `parameters()` on the route resource registration.
---
## Reason
Laravel's `Str::singular()` automatically singularizes route parameter names. For irregular plurals, this produces incorrect results: `order-items` becomes `order_item` (correct) but `series` becomes `serie` (incorrect). Explicit parameter names ensure controller method signatures receive the correct parameter name and avoid confusing `$serie` variable names.
---
## Bad Example
```php
// Auto-singularization: "series" → "serie"
Route::apiResource('series', SeriesController::class);
// Controller receives $serie instead of $series
```

## Good Example
```php
// Explicit parameter naming
Route::apiResource('series', SeriesController::class)
    ->parameters(['series' => 'series']);
// Controller receives $series as expected
```

## Exceptions
When the resource name has correct auto-singularization (no need for explicit parameters). Always verify with `php artisan route:list` before relying on auto-singularization.

## Consequences Of Violation
Confusing parameter names in controllers ($serie, $specy); broken route model binding when parameter name doesn't match model class; maintenance overhead from incorrect naming.
---

## Avoid Inconsistent Pluralization Across Resources
---
## Category
Maintainability
---
## Rule
Always apply the same pluralization convention to every resource — never have some collections plural (`/users`) and others singular (`/order`) without justification.
---
## Reason
Consistency is the most important naming convention. Clients can adapt to any convention (plural or singular for collections) if applied uniformly. Inconsistency is the only universal anti-pattern — it forces clients to memorize which resources are plural and which are singular, increasing integration errors and support requests.
---
## Bad Example
```php
// Inconsistent — some plural, some singular
Route::apiResource('users', UserController::class);
Route::apiResource('order', OrderController::class); // should be 'orders'
```

## Good Example
```php
// Consistent — all plural for collections
Route::apiResource('users', UserController::class);
Route::apiResource('orders', OrderController::class);
Route::apiResource('order-items', OrderItemController::class);
```

## Exceptions
When established conventions within an organization use a specific pattern (e.g., some resources are always singularly named for historical reasons). Document the exceptions in the style guide.

## Consequences Of Violation
Increased client integration errors; poor developer experience; support requests about endpoint naming; inconsistent API surface that erodes trust in the design.
---
