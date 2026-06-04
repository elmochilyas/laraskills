## Prefer URI Versioning as Default Strategy
---
## Category
Architecture
---
## Rule
Use URI path versioning (`/api/v1/`) as the default strategy; only use header/query versioning when URI paths must remain clean.
---
## Reason
URI versioning is most visible, simplest to route, easiest to test with curl and browser tools, and has zero runtime overhead.
---
## Bad Example
```php
// Header-based versioning — harder to test and debug
Route::middleware(VersionMiddleware::class)->group(base_path('routes/api.php'));
```
---
## Good Example
```php
// URI-based versioning — clear, testable, zero overhead
Route::prefix('v1')->group(base_path('routes/api/v1.php'));
Route::prefix('v2')->group(base_path('routes/api/v2.php'));
```
---
## Exceptions
APIs where URL cleanliness is a hard requirement (mobile SDK constraints).
---
## Consequences Of Violation
Difficult to test with basic tools, routing complexity, consumer confusion about version identification.
## Use Versioned Route Files and Controller Namespaces
---
## Category
Code Organization
---
## Rule
Separate route files and controller namespaces per version (`routes/api/v1.php`, `App\Http\Controllers\Api\V1\`).
---
## Reason
Physical separation prevents accidental cross-version coupling and makes version lifecycle management clear.
---
## Bad Example
```php
// All routes in routes/api.php — version logic in middleware
```
---
## Good Example
```php
// routes/api/v1.php — uses V1 controllers
// routes/api/v2.php — uses V2 controllers
```
---
## Exceptions
Minimal version differences where a single controller handles both.
---
## Consequences Of Violation
Accidental cross-version coupling, harder to deprecate, confusion about which code implements which version.
## Share Service Layer Between Versions
---
## Category
Architecture
---
## Rule
Keep business logic in shared service classes; only the HTTP layer (controllers, requests, formatters) differs between versions.
---
## Reason
Duplicating business logic across versions creates synchronization burden and risk of inconsistent behavior.
---
## Bad Example
```php
class V1\UserController { public function index() { return DB::table('users')->get(); } }
class V2\UserController { public function index() { return DB::table('users')->get(); } }
// Duplicated logic
```
---
## Good Example
```php
class V1\UserController { public function index() { return UserService::list(); } }
class V2\UserController { public function index() { return UserService::list(); } }
```
---
## Exceptions
Versions with fundamentally different business requirements.
---
## Consequences Of Violation
Inconsistent behavior between versions, higher maintenance cost, bugs fixed in one version but not the other.
## Maintain Versions in Parallel During Migration
---
## Category
Reliability
---
## Rule
Deploy new versions alongside old versions; never cut over immediately.
---
## Reason
Simultaneous deployment allows consumers to migrate at their own pace without service disruption.
---
## Bad Example
```php
// Remove v1 when v2 deploys — all consumers must migrate instantly
```
---
## Good Example
```php
// Both v1 and v2 active — consumers migrate gradually
Route::prefix('v1')->group(...);
Route::prefix('v2')->group(...);
```
---
## Exceptions
Security vulnerabilities requiring immediate version removal.
---
## Consequences Of Violation
Forced consumer migration, production integration breakage, revenue impact from non-migrated consumers.
## Apply Deprecation Headers via Middleware
---
## Category
Code Organization
---
## Rule
Use route middleware on deprecated version groups to inject Deprecation, Sunset, and Link headers consistently.
---
## Reason
Middleware ensures all deprecated endpoints get headers without duplicating logic in each controller.
---
## Bad Example
```php
class V1\UserController {
    public function index() {
        return response($data)->header('Deprecation', 'true'); // per-controller
    }
}
```
---
## Good Example
```php
// Middleware applied to the entire deprecated route group
Route::prefix('v1')
    ->middleware(DeprecationHeaderMiddleware::class)
    ->group(base_path('routes/api/v1.php'));
```
---
## Exceptions
None — always use middleware for deprecation headers.
---
## Consequences Of Violation
Inconsistent header application, some deprecated endpoints missing headers, duplicated header logic.
## Return 410 Gone for Removed Versions
---
## Category
Reliability
---
## Rule
Return HTTP 410 Gone with migration information for removed API versions; never return 404.
---
## Reason
404 implies the resource doesn't exist; 410 explicitly states the version was intentionally removed and provides migration guidance.
---
## Bad Example
```php
// Removed version returns 404 — consumer can't distinguish from bad path
```
---
## Good Example
```php
Route::fallback(function () {
    if (request()->is('api/v1/*')) {
        return response()->json([
            'error' => 'version_removed',
            'message' => 'API v1 was removed. Please migrate to v2.',
            'migration_url' => '/docs/v2-migration',
        ], 410);
    }
});
```
---
## Exceptions
None — always return 410 for removed versions.
---
## Consequences Of Violation
Consumer confusion between "not found" and "removed," delayed migration, broken integrations.
