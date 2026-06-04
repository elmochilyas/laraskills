# URL Structure Design

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: url-structure-design
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Design URLs For Permanence
---
## Category
Architecture
---
## Rule
Always design URLs to be permanent — choose identifier types and nesting patterns that will not need restructuring — never release URLs that are likely to change.
---
## Reason
A URL is a contract with the client. Every URL change breaks existing clients that have hardcoded the URL. A slightly ugly but permanent URL is better than a clean URL that breaks every six months. URL stability is more important than URL aesthetics.
---
## Bad Example
```php
// URL based on email — mutable identifier
Route::get('users/{user:email}', [UserController::class, 'show']);
// Breaks when user changes email
```

## Good Example
```php
// URL based on UUID — permanent identifier
Route::get('users/{user:uuid}', [UserController::class, 'show']);
// Stable — uuid never changes
```

## Exceptions
Content-addressable resources where the URL is the identifier and changing the content produces a new URL (e.g., immutable blog posts by slug with redirect on slug change).

## Consequences Of Violation
Broken client integrations with every URL change; forced API version bumps for URL restructuring; client maintenance burden from updating hardcoded URLs; poor developer experience.
---

## Use UUIDs For Public API Identifiers
---
## Category
Security
---
## Rule
Always use UUIDs for resource identifiers in public API URLs — never use auto-increment IDs that expose record count and enable sequential enumeration.
---
## Reason
Auto-increment IDs in URLs reveal the total number of resources (competitor intelligence) and enable sequential enumeration (scrape all resources by incrementing IDs). UUIDs are globally unique, non-predictable, and reveal no information about resource count or growth rate. The storage and index performance trade-off is acceptable for public APIs.
---
## Bad Example
```php
// Auto-increment ID in URL — exposes record count
GET /api/users/42
// Competitor knows there are at least 42 users
// Attacker can enumerate: /api/users/1, /api/users/2, ...
```

## Good Example
```php
// UUID in URL — non-predictable, no information leakage
GET /api/users/550e8400-e29b-41d4-a716-446655440000
// No record count exposure
// No sequential enumeration possible
```

## Exceptions
Internal APIs accessed only by first-party services on private networks. Auto-increment IDs are acceptable where enumeration is not a security concern.

## Consequences Of Violation
Competitors can estimate user base and growth rate; attackers can enumerate all resources; privacy violation from exposed sequential IDs; automated scraping tools work trivially.
---

## Limit Nesting To 2-3 Levels
---
## Category
Architecture
---
## Rule
Always limit URL path nesting to a maximum of 3 levels (`/users/{user}/orders/{order}/items`) — never create paths with 4+ levels of nesting.
---
## Reason
Each nesting level adds fragility: a missing parent causes a 404 for the entire path. Deep nesting encodes database foreign key hierarchies rather than meaningful API relationships. URLs over 2,048 characters may be truncated by proxies/CDNs. Shallow nesting with global identifiers is more robust and easier for clients to construct.
---
## Bad Example
```php
// 5 levels of nesting — fragile and unnecessary
Route::apiResource('schools.departments.courses.enrollments.students', StudentController::class);
```

## Good Example
```php
// 2 levels for parent-child, shallow reference beyond
Route::apiResource('schools.departments', DepartmentController::class);
Route::get('courses/{course}', [CourseController::class, 'show']); // global ID
Route::get('enrollments/{enrollment}', [EnrollmentController::class, 'show']); // global ID
```

## Exceptions
When the resource hierarchy is required for authorization context (each level provides scope for permission checks). Even then, limit to 3 levels and document the authorization dependency.

## Consequences Of Violation
Fragile URLs that 404 when any parent is missing; long URLs that exceed proxy limit; difficulty maintaining deep route definitions; poor client UX from complex URL construction.
---

## Use Path Prefix For Major API Versions
---
## Category
Maintainability
---
## Rule
Always use URL path prefix (`/v1/`, `/v2/`) for major API versions — never use Accept header versioning or query parameter versioning as the primary versioning mechanism.
---
## Reason
Path prefix versioning is the most explicit, testable, and discoverable approach. Clients can see the version in every request/response. curl and browser testing works without custom headers. CDN and reverse proxy routing can distinguish versions by path. Accept header versioning hides the version in headers, making debugging and testing more difficult.
---
## Bad Example
```php
// Accept header versioning — hidden, hard to test
Route::get('users', [UserController::class, 'index']);
// Client must set Accept: application/vnd.myapp.v2+json
// curl testing requires -H flag
```

## Good Example
```php
// Path prefix versioning — explicit, testable
Route::prefix('v1')->group(function () {
    Route::apiResource('users', V1\UserController::class);
});
Route::prefix('v2')->group(function () {
    Route::apiResource('users', V2\UserController::class);
});
// curl testing works directly: GET /v2/users
```

## Exceptions
Internal microservices where all consumers use SDKs that handle header versioning. Even then, path prefix is recommended for operational simplicity.

## Consequences Of Violation
Poor testability and debuggability; CDN routing cannot distinguish versions by path; API documentation must include Accept header examples; harder for new developers to understand the versioning scheme.
---

## Standardize Query Parameter Conventions
---
## Category
Maintainability
---
## Rule
Always use consistent query parameter conventions across all endpoints: `filter[field]=value`, `sort=-field`, `include=relation`, `page[size]&page[number]` — never mix different conventions for filtering, sorting, and pagination.
---
## Reason
Consistent query parameter conventions let clients write reusable request-building logic. If one endpoint uses `?filter[status]=active` and another uses `?status=active`, client code must branch by endpoint. Standardizing on a convention (JSON:API style is recommended) reduces client integration complexity and makes the API predictable.
---
## Bad Example
```php
// Inconsistent conventions
// Users: ?status=active&sort_by=name&order=asc
// Orders: ?filter[status]=pending&sort=-created_at&page=2
// Products: ?filter.status=active&direction=desc
```

## Good Example
```php
// Consistent JSON:API-style conventions
// GET /users?filter[status]=active&sort=name&include=posts&page[size]=25&page[number]=1
// GET /orders?filter[status]=pending&sort=-created_at&page[size]=25&page[number]=1
// Same structure for all endpoints
```

## Exceptions
When integrating with existing systems that have established parameter conventions. Document the exceptions and provide a translation layer.

## Consequences Of Violation
Complex client request-building logic with endpoint-specific branches; increased documentation requirements; higher bug rates from using wrong parameter format for an endpoint.
---

## Normalize URLs To Lowercase
---
## Category
Maintainability
---
## Rule
Always normalize API URLs to lowercase via middleware or web server configuration — never serve the same resource at both `/Users/42` and `/users/42`.
---
## Reason
URLs are case-insensitive by RFC spec but servers are case-sensitive by default. Serving the same resource at different cases creates duplicate cache entries, SEO penalties (for web content), and confusion. Normalizing to lowercase ensures a single canonical URL for each resource and prevents cache splits.
---
## Bad Example
```php
// Both URLs work — creates duplicate cache entries
GET /users/42
GET /Users/42
// Cache stores two copies of the same resource
```

## Good Example
```php
// Middleware normalizes to lowercase
public function handle(Request $request, Closure $next)
{
    $path = strtolower($request->path());
    if ($path !== $request->path()) {
        return redirect($path, 301);
    }
    return $next($request);
}
```

## Exceptions
When resource identifiers are case-sensitive (e.g., case-sensitive slugs). Normalize the path but preserve identifier case.

## Consequences Of Violation
Cache splits doubling cache storage; 404 errors when clients use different casing than expected; inconsistent behavior between development (case-insensitive filesystem) and production (case-sensitive).
---

## Enforce A Trailing Slash Policy
---
## Category
Maintainability
---
## Rule
Always choose and enforce a consistent trailing slash policy — either always include or always omit — never serve `/users` and `/users/` as the same resource.
---
## Reason
Trailing slash inconsistency creates duplicate cache entries and splits client URL construction. Some clients add trailing slashes by habit, others omit them. Without enforcement, the same resource is available at two URLs, confusing caching, analytics, and client integration.
---
## Bad Example
```php
// Both URLs serve the same resource with no redirect
GET /users    → User list
GET /users/   → Same user list
// Two URLs, one resource — cache chaos
```

## Good Example
```php
// Redirect non-canonical form to canonical
// Choose no trailing slash
Route::redirect('/users/', '/users', 301);

// Or choose trailing slash
Route::get('users/', [UserController::class, 'index']);
```

## Exceptions
Frameworks that enforce a specific trailing slash convention. Match the framework convention rather than fighting it (Laravel works without trailing slashes by default).

## Consequences Of Violation
Cache splits with trailing slash variants; analytics count the same page view as two different URLs; client developer confusion about which format to use.
---

## Keep Deprecated URLs Working With Deprecation Header
---
## Category
Maintainability
---
## Rule
Always keep deprecated API URLs working during migration — never remove an endpoint without a migration period — include a `Deprecation` header and `Sunset` header on deprecated URLs.
---
## Reason
Clients cannot update their integrations instantly. Removing a URL that clients depend on causes production failures. A migration period with `Deprecation` header (warning) and `Sunset` header (deadline) gives clients time to migrate. The `Sunset` header specifies when the URL will be removed, enabling proactive client updates.
---
## Bad Example
```php
// URL removed without warning — existing clients break
// Old: GET /v1/users — removed
// Replaced by: GET /v2/users
```

## Good Example
```php
// Deprecated URL with migration headers — still works
Route::get('v1/users', function () {
    return redirect('v2/users', 301)
        ->header('Deprecation', 'true')
        ->header('Sunset', 'Sat, 01 Dec 2026 00:00:00 GMT');
});
```

## Exceptions
Security-critical endpoints that must be removed immediately (vulnerable endpoints, exposed internal endpoints). Even then, communicate the removal aggressively.

## Consequences Of Violation
Production client failures from removed URLs; emergency client deployments under time pressure; support incidents from broken integrations; trust erosion with API consumers.
---

## Never Use Mutable Identifiers In URLs
---
## Category
Architecture
---
## Rule
Always use immutable identifiers (UUIDs, auto-increment IDs) in URLs — never use mutable values (email, username, slug that can change) as the primary resource identifier.
---
## Reason
When a mutable identifier changes, all existing URLs containing the old value break. Email changes, username changes, and slug updates become breaking API changes. An immutable identifier that never changes ensures URL stability regardless of resource attribute updates.
---
## Bad Example
```php
// Email as identifier — mutable
Route::get('users/{user:email}', [UserController::class, 'show']);
// Breaks when user changes email
```

## Good Example
```php
// UUID as identifier — immutable
Route::get('users/{user:uuid}', [UserController::class, 'show']);
// Works regardless of email or name changes
```

## Exceptions
Content-addressable resources where the identifier IS the content (slug-based blog posts). In these cases, the old URL should redirect to the new URL when the slug changes.

## Consequences Of Violation
Broken bookmarks and client URLs when identifier changes; forced API version bumps to support new identifiers; complex redirect logic required to maintain backward compatibility.
---

## Remove Unnecessary Path Segments
---
## Category
Design
---
## Rule
Always remove unnecessary path segments from API URLs — never include `/api`, `/rest`, or redundant prefixes when the subdomain already indicates the purpose.
---
## Reason
Each path segment adds URL length and cognitive overhead. When using `api.example.com`, the `/api` prefix is redundant. When all endpoints are RESTful, `/rest` adds noise. Clean URLs without unnecessary segments are shorter, more readable, and easier for clients to construct.
---
## Bad Example
```php
// Unnecessary segments — api.example.com/api/rest/v1/users
// "api" in subdomain, "rest" is obvious, "v1" is version
Route::prefix('api/rest/v1')->group(function () {
    Route::apiResource('users', UserController::class);
});
```

## Good Example
```php
// Clean URL — api.example.com/v1/users
Route::prefix('v1')->group(function () {
    Route::apiResource('users', UserController::class);
});
```

## Exceptions
When infrastructure routing requires specific path prefixes (API gateway routing, multi-tenant path detection). Keep the minimum prefix required by infrastructure — document why it's needed.

## Consequences Of Violation
Longer URLs exceeding 2,048-character limits sooner; unnecessary visual noise; client confusion about which prefix to use; cache key inflation from unnecessary path segments.
---
