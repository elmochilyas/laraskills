# API Versioning

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Routing System
- **Knowledge Unit:** API Versioning
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-01

---

## Executive Summary

API versioning is the practice of maintaining multiple backward-compatible versions of an API simultaneously, allowing consumers to migrate gradually as the API evolves. Laravel does not provide a built-in versioning mechanism — versioning is implemented at the application level using route prefixes, controller namespaces, and resource classes.

The critical engineering decision in API versioning is WHEN to start. The overwhelming consensus across all expert sources is: version from day one, even if only v1 exists. Adding versioning after an API is in production is significantly more complex than building it in from the start. A "we'll add versioning later" approach creates a v0 API with no contract boundaries, making every change break existing consumers.

The second critical decision is WHICH strategy to use. URL path versioning (`/api/v1/`, `/api/v2/`) is the universally recommended approach — it is explicit, cache-friendly, simple to implement, and easy to debug. Header-based versioning (`Accept: application/vnd.api.v2+json`) provides cleaner URLs but adds complexity to testing, caching, and debugging. Query parameter versioning (`?version=2`) is considered an anti-pattern because it is not cacheable and easy for consumers to forget.

---

## Core Concepts

### Strategy: URL Path Versioning
The most common and recommended approach:
```php
Route::prefix('v1')->group(base_path('routes/api/v1.php'));
Route::prefix('v2')->group(base_path('routes/api/v2.php'));
```
Advantages: Explicit, cache-friendly, simple to debug, SEO-friendly.
Disadvantages: Version in the URL path ("messy" URLs).

### Strategy: Header Versioning
Using `Accept` headers to specify version:
```php
Route::get('/users', function (Request $request) {
    $version = $request->header('Accept');
    // Route to appropriate handler based on version
});
```
Advantages: Clean URLs, no path pollution.
Disadvantages: Hard to test, debug, and cache.

### Strategy: Media Type Versioning
Using `Content-Type` or `Accept` with a vendor-specific media type:
```php
Accept: application/vnd.myapp.v2+json
```
Advantages: RESTful purity.
Disadvantages: Most complex, poor developer experience.

### Controller Inheritance
V2 controllers extend V1 controllers, overriding only changed methods:
```php
namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Api\V1\UserController as V1UserController;

class UserController extends V1UserController
{
    public function show($id)
    {
        // Override only the changed behavior
        $user = parent::show($id);
        $user['extra_field'] = 'new data';
        return $user;
    }
}
```

### Resource Versioning
Each API version has its own Resource classes:
```
app/Http/Resources/
├── V1/
│   ├── UserResource.php
│   └── UserCollection.php
└── V2/
    ├── UserResource.php
    └── UserCollection.php
```

---

## Mental Models

### API Version as Contract Version
An API version represents a contract with consumers. V1 promises "this response shape, these validation rules, these error formats." V2 promises a different contract. The version number is not about the code — it's about the contract. Backend changes that don't affect the contract don't require a version bump.

### Versioning as Cost-Benefit Decision
Every API version has a maintenance cost: multiple controller sets, multiple resource classes, multiple test suites. The benefit is consumer freedom to migrate on their schedule. The decision to create a new version requires estimating whether the change is worth the maintenance cost for both the provider and consumers.

### Day-One vs Retrofit
Starting with `/api/v1/` from day one costs nothing — a two-character prefix. Retro-fitting versioning after the API is consumed requires:
- Renaming existing routes (breaking all current consumers)
- Maintaining compatibility shims for old behavior
- Negotiating migration timelines with consumers

---

## Internal Mechanics

### No Framework Built-In
Laravel intentionally provides no API versioning mechanism. Versioning is handled entirely at the application level using:
- Route prefixes for URI-based versioning
- Controller namespaces for separate controllers per version
- Separate route files per version
- Middleware for header-based version detection

### Separate Route Files
The production pattern:
```php
// routes/api/v1.php
Route::prefix('v1')->group(function () {
    Route::get('/users', [V1\UserController::class, 'index']);
    Route::apiResource('users', V1\UserController::class);
});

// routes/api/v2.php  
Route::prefix('v2')->group(function () {
    Route::get('/users', [V2\UserController::class, 'index']);
    Route::apiResource('users', V2\UserController::class);
});
```

### Controller Namespace Organization
```
app/Http/Controllers/Api/
├── V1/
│   ├── UserController.php    // show returns id, name, email
│   └── ProductController.php
└── V2/
    ├── UserController.php    // show returns id, name, email, avatar, preferences
    └── ProductController.php
```

### Domain Logic Sharing
Core business logic should be shared across versions, not duplicated:
```php
namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Api\V1\UserController as V1UserController;
use App\Services\UserService; // Shared service

class UserController extends V1UserController
{
    public function show($id)
    {
        $user = UserService::getById($id); // Shared service
        return new V2\UserResource($user); // Version-specific resource
    }
}
```

---

## Patterns

### Controller Inheritance Pattern
V2 extends V1, overrides only changed methods:
```php
class V1\LeadController {
    public function index() { /* returns id, name */ }
    public function show($id) { /* returns id, name */ }
}

class V2\LeadController extends V1\LeadController {
    public function show($id) { 
        return array_merge(parent::show($id), ['extra' => 'data']);
    }
}
```
Minimizes duplication. Each version only defines its delta from the previous version.

### Route Name Prefixing
Named routes include the version:
```php
Route::prefix('v1')->name('v1.')->group(...);
Route::prefix('v2')->name('v2.')->group(...);
```
Named routes: `v1.leads.index`, `v2.leads.index`. Enables per-version URL generation.

### Deprecation Header Middleware
```php
class SunsetHeader
{
    public function handle($request, $next, $date)
    {
        $response = $next($request);
        $response->header('Sunset', $date);
        $response->header('Deprecation', 'true');
        return $response;
    }
}

Route::prefix('v1')->middleware('sunset:2027-01-01')->group(...);
```
Signals deprecation to consumers programmatically. The `Sunset` header (RFC 8594) and `Deprecation` header indicate retirement timing.

### Version Discovery
Provide an endpoint that lists available versions and their status:
```json
GET /api/versions
{
    "versions": {
        "v1": {"status": "deprecated", "sunset": "2027-01-01"},
        "v2": {"status": "stable"},
        "v3": {"status": "beta"}
    }
}
```

---

## Architectural Decisions

### Why No Built-In Versioning
Laravel intentionally omits versioning from the framework because:
1. Versioning strategies vary widely between projects (URI, header, media type)
2. Adding a built-in mechanism would be opinionated and constraining
3. API versioning is an application-level concern, not a framework concern
4. Route prefixes + controller inheritance provide sufficient tools

### Why URL Path Versioning Is Recommended
URL path versioning is universally recommended because:
1. Explicit — the version is visible in every request
2. Cache-friendly — versioned URLs have distinct cache keys
3. Simple — standard Laravel route groups with no custom middleware
4. Debuggable — curl requests can specify the version in the path
5. SEO-friendly — search engines index different versions separately

### Why Controllers Are Versioned, Not Services
Only the transport layer (controllers, resources, requests) should change between versions. Core business logic (services, actions, domain models) should remain version-agnostic. Versioning services would require duplicating domain logic, defeating the purpose of a service layer.

---

## Tradeoffs

### URL Path vs Header Versioning

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Path: Explicit, cache-friendly, debuggable | "Messy" URLs with version prefix | Version is part of the resource identifier |
| Header: Clean URLs | Hard to test, debug, cache | Version is invisible; consumers may forget to set it |
| Path: Simple route groups, standard Laravel | Version proliferation in URLs | Multiple cache entries for the same resource |
| Header: RESTful purity | Complex client logic | Must parse and forward version headers |

### Controller Inheritance vs Separate Controllers

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Inheritance: Reuse, fewer files, less duplication | Tight coupling between versions | V2 depends on V1's implementation |
| Separate: Complete isolation, independent evolution | More files, more duplication | Each version must reimplement unchanged methods |

### Day-One Versioning vs Retrofit

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Day-one: Zero migration cost, clean contract boundaries | Slightly more verbose routes initially | `/api/v1/users` instead of `/api/users` |
| Retrofit: Simple initial API (no version prefix) | Breaking changes affect all consumers | Migration requires backward compatibility shims |

---

## Performance Considerations

### Route Registration Overhead
Each API version adds a set of routes. Two versions = 2x routes. With route caching, the extra routes are compiled into the prefix-tree regex and add negligible matching overhead. Without caching, 2x routes = 2x registration time + 2x matching time.

### Resource Class Overhead
Version-specific Resource classes add memory per request. Each version loads its own Resource classes. With 3 versions, 3 resource classes for `User` are loaded into memory. This is negligible for typical resource class sizes.

### Shared Domain Logic
Unversioned domain logic (services, actions, models) ensures that business logic changes don't need to be duplicated across versions. The shared code path also benefits from OpCache optimization.

---

## Production Considerations

### Deprecation Policy
Before shipping any version, answer:
- How will consumers know an endpoint is deprecated? (Sunset header, email notification, API changelog)
- How long will deprecated versions remain supported? (6 months, 1 year, N-2 versions)
- Where does migration guidance live? (Documentation, migration guides, changelog)
- What telemetry exists on old version usage? (Request logging per version, consumer identification)

### Sunset Header
RFC 8594 `Sunset` header indicates when a version will be removed:
```php
$response->header('Sunset', 'Sun, 01 Jan 2027 00:00:00 GMT');
$response->header('Deprecation', 'true');
```
Consumers can programmatically detect deprecation and schedule migration.

### Version Removal
When removing a deprecated version:
1. Disable route registration: remove the version's route file from `bootstrap/app.php`
2. Verify no traffic to the removed version (check request logs)
3. Remove controller/resource classes
4. Update the versions discovery endpoint

### Consumer Migration
Provide clear migration guides between versions. Document what changed and how to update consumer code. Consider offering tools (Rector rules, codemods) for automated migration.

---

## Common Mistakes

### Not Versioning from Day One
Why it happens: "The API is simple now, we'll add versioning later." Why it's harmful: Every consumer integrates against a non-versioned API. Any breaking change breaks every consumer. Adding versioning later means either breaking all consumers or maintaining backward compatibility indefinitely. Better approach: Start with `/api/v1/` from the first route.

### Returning Raw Eloquent Models
Why it happens: Convenience — `$user` returned as JSON from controller. Why it's harmful: The database schema IS the API contract. Changing a column name or type changes the API response shape. Better approach: Use API Resources to explicitly define the response contract per version.

### Inconsistent Response Shapes Across Versions
Why it happens: Different developers implement different versions with different conventions. Why it's harmful: Consumers must handle multiple response formats, increasing client complexity. Better approach: Define response conventions (envelope, error format, pagination structure) and enforce them across all versions.

### if Version Branches Inside Controllers
Why it happens: Developer wants to share controller code while handling version differences. Why it's harmful: `if ($version === 'v1')` inside a controller creates an unmaintainable mess as more versions are added. Better approach: Use separate controllers per version, share domain logic via services.

### Treating Validation Changes as Non-Breaking
Why it happens: Changing a field from optional to required seems like a minor change. Why it's harmful: Consumer requests that were valid yesterday are rejected today. This IS a breaking change and requires a new version. Better approach: Document validation rules as part of the API contract.

---

## Failure Modes

### Version Drift Without Consumer Migration
A version is kept indefinitely because consumers never migrate. The codebase accumulates N versions, each with its own controllers and resources. Maintenance cost grows linearly with version count. Mitigation: Sunset policy with hard removal dates.

### Incomplete Version Coverage
V2 adds a new endpoint but the developer forgets to update the versions discovery endpoint. Consumers don't know the new endpoint exists. Mitigation: Automated version coverage checks in CI.

### Secret Version Features
A feature is added to V2 but accidentally also added to V1's shared service. V1 consumers suddenly have access to the new feature, creating an undocumented contract. Mitigation: Ensure version-specific logic is in version-specific controllers/resources, not in shared services.

---

## Ecosystem Usage

### Laravel Framework
Laravel's first-party APIs (Forge, Envoyer, Vapor) use URI path versioning with version prefixes. They provide changelogs, deprecation notices, and migration guides per version.

### Stripe API (Industry Reference)
Stripe uses URL path versioning and is considered an industry standard for API design. Routes: `GET /v1/customers`, `POST /v1/charges`. They also support an API version header for granular request-level versioning.

### GitHub API
GitHub uses URL path versioning (`GET /api/v1/user`, `GET /api/v2/user`). They provide deprecation timelines and migration guides.

### Spatie Packages
Spatie packages that expose APIs (like Mailcoach) use URL path versioning. Their internal package APIs follow the same convention.

---

## Related Knowledge Units

### Prerequisites
- Route Definition — Route registration basics
- Route Groups — Prefix groups for versioned routes
- Resourceful Routing — API Resource routes per version

### Related Topics
- Route Name Generation — Versioned route name prefixes
- Controllers Architecture — Controller inheritance pattern for versions
- API Resources — Versioned resource classes
- Form Requests & Validation — Version-specific validation rules

### Advanced Follow-up Topics
- Exception Handling — Version-specific error response formats
- Rate Limiting — Plan-based rate limiting across API versions

---

## Research Notes

### Source Analysis
- No framework built-in — versioning is entirely application-level
- `Illuminate\Routing\Router.php` — Prefix groups used for version separation
- `Illuminate\Routing\RouteGroup.php` — Name prefix concatenation for versioned route names
- Controller inheritance pattern — Application-level architectural decision

### Key Insight
The most frequently broken rule in production Laravel APIs is "version from day one." Every expert source independently identifies this as the #1 API regret. The cost of starting without versioning is dramatically higher than starting with it — the two-character prefix `/api/v1/` costs nothing at the start and saves everything when the first breaking change arrives.

### Version-Specific Notes
- Laravel provides no versioning mechanism in any version (10-13)
- Route prefix groups are the standard implementation approach
- `Sunset` header middleware is application-level, not framework-provided
- Controller inheritance pattern applies to all Laravel versions
