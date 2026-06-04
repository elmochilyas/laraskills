## Version from Day One
---
## Category
Architecture
---
## Rule
Always start API versioning from the first release with `/v1/` URI prefix; never launch without versioning.
---
## Reason
Adding versioning after consumers exist requires breaking all existing integrations; versioning from day one is frictionless and future-proof.
---
## Bad Example
```php
Route::get('/users', [UserController::class, 'index']); // no version — future breaking change breaks all consumers
```
---
## Good Example
```php
Route::prefix('v1')->group(base_path('routes/api/v1.php')); // versioned from day one
```
---
## Exceptions
Internal APIs with a single consumer deployable in lockstep.
---
## Consequences Of Violation
Future breaking changes require coordinating across all consumers; adding versioning later is expensive and disruptive.
## Prefer URI Path Versioning as Default
---
## Category
Architecture
---
## Rule
Use URI path versioning (`/api/v1/resource`) as the primary strategy; avoid mixing strategies in the same API.
---
## Reason
URI versioning is most visible, simplest to route, easiest to test with curl/tools, and has zero runtime overhead.
---
## Bad Example
```php
// Mixed strategies: URI + header
/api/v1/users + Accept: application/vnd.app.v2+json?api-version=2026
```
---
## Good Example
```php
Route::prefix('v1')->group(...);
Route::prefix('v2')->group(...); // consistent URI versioning
```
---
## Exceptions
APIs where URL cleanliness is paramount (mobile SDKs with hardcoded URLs).
---
## Consequences Of Violation
Consumer confusion over which strategy to use, inconsistent tooling, routing complexity.
## Use Versioned Namespaces and Route Files
---
## Category
Code Organization
---
## Rule
Organize controllers by version namespace (`V1\UserController`, `V2\UserController`) and route files by version (`routes/api/v1.php`).
---
## Reason
Separate namespaces prevent accidental cross-version coupling and make it clear which controllers belong to which version.
---
## Bad Example
```php
// All controllers in App\Http\Controllers\Api — no version separation
```
---
## Good Example
```php
// App\Http\Controllers\Api\V1\UserController
// App\Http\Controllers\Api\V2\UserController
// routes/api/v1.php
// routes/api/v2.php
```
---
## Exceptions
Single-version APIs with no plans for future versions.
---
## Consequences Of Violation
Accidental cross-version code sharing, confusion about which version a controller implements, harder to deprecate.
## Share Domain Services Between Versions
---
## Category
Architecture
---
## Rule
Keep business logic in shared service classes; only the HTTP layer (controllers, requests, responses) differs between versions.
---
## Reason
Duplicating business logic across versions creates maintenance burden and increases risk of inconsistencies.
---
## Bad Example
```php
class V1\UserController { public function index() { return UserService::list(); } }
class V2\UserController { public function index() { return UserService::list(); } }
// Duplicated business logic
```
---
## Good Example
```php
class V1\UserController { public function index() { return UserService::list(); } }
class V2\UserController { public function index() { return UserService::list(); } }
// Business logic in UserService, shared across versions
```
---
## Exceptions
Versions with fundamentally different business logic.
---
## Consequences Of Violation
Duplicate code, inconsistent behavior between versions, higher maintenance burden.
## Support Minimum 6-Month Migration Window
---
## Category
Reliability
---
## Rule
Maintain deprecated versions for at least 6 months before sunsetting; provide clear migration documentation.
---
## Reason
Consumers need time to update their integrations; aggressive deprecation erodes trust and may break business-critical integrations.
---
## Bad Example
```php
// v1 deprecated and removed within 2 months — consumers can't migrate in time
```
---
## Good Example
```php
// v1 deprecated Jan 2026, Sunset: Dec 31 2026 — 12 month migration window
```
---
## Exceptions
Security vulnerabilities requiring immediate version removal.
---
## Consequences Of Violation
Consumer integrations break, trust erodes, support tickets surge from forced migrations.
## Use Parallel Version Deployment
---
## Category
Reliability
---
## Rule
Run multiple API versions simultaneously during the migration window; never cut over immediately.
---
## Reason
Simultaneous deployment allows consumers to migrate at their own pace without service disruption.
---
## Bad Example
```php
// Deploy v2, immediately remove v1 — all consumers must upgrade instantly
```
---
## Good Example
```php
// Both v1 and v2 deployed — consumers migrate gradually
Route::prefix('v1')->group(base_path('routes/api/v1.php'));
Route::prefix('v2')->group(base_path('routes/api/v2.php'));
```
---
## Exceptions
Internal APIs where all consumers can deploy simultaneously.
---
## Consequences Of Violation
Production integrations break during cutover, downtime for consumers that haven't migrated.
