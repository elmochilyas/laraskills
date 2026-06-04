# Phase 5: Rules — URL Path Versioning

## Use Major Version Only In URL Path
---
## Category
Design
---
## Rule
Always use only the MAJOR version number in the URL path (`/api/v1/`) — never include MINOR, PATCH, or pre-release identifiers.
---
## Reason
The URL should change only when the contract breaks (MAJOR). MINOR and PATCH are transparent to consumers and including them creates unnecessary URL churn.
---
## Bad Example
```
/api/v1.3.0/users
```
---
## Good Example
```
/api/v1/users
```
---
## Exceptions
Pre-release versions (`/api/v2-beta/`) that need to coexist with the stable version during testing.
---
## Consequences Of Violation
URL clutter; consumers hardcode unstable sub-version URLs.
---

## Add Version Constraint Regex On Routes
---
## Category
Security
---
## Rule
Always use `->where('version', 'v[0-9]+')` on version route parameters to prevent version string injection.
---
## Reason
Without a regex constraint, a request like `/api/v1_evil` might bypass route matching or inject unexpected version values.
---
## Bad Example
```php
Route::prefix('api/{version}')->group(...); // no constraint
```
---
## Good Example
```php
Route::prefix('api/{version}')-where(['version' => 'v[0-9]+'])->group(...);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Version injection attacks; unexpected route matches; potential security bypass.
---

## Provide Default Handling For Unversioned `/api/`
---
## Category
Design
---
## Rule
Always return a helpful response for `/api/` without a version — redirect to the latest version or return a list of available versions with 300 Multiple Choices.
---
## Reason
An unversioned `/api/` that returns 404 gives consumers no guidance on how to access the API.
---
## Bad Example
```php
Route::prefix('api')->group(base_path('routes/api.php')); /api/ returns 404
```
---
## Good Example
```php
Route::get('/api', function () {
    return response()->json(['message' => 'Please specify a version', 'versions' => ['v1', 'v2']]);
})->name('api.root');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer confusion; support tickets asking "what URL should I use?".
---

## Run Route Cache After Every Version Change
---
## Category
Performance
---
## Rule
Always run `php artisan route:cache` after adding, modifying, or removing any versioned route file.
---
## Reason
Without route caching, each additional version multiplies route registration overhead on every request.
---
## Bad Example
```bash
# Deploy with new v3 route file but no route:cache
```
---
## Good Example
```bash
php artisan route:cache && php artisan route:list > route-manifest.json
```
---
## Exceptions
Local development where route changes are frequent (disable cache during development).
---
## Consequences Of Violation
Production 404 errors for new version routes; route resolution overhead.
---

## Separate Controllers Into Versioned Directories
---
## Category
Code Organization
---
## Rule
Always organize controllers into versioned namespace directories mirroring the URL structure (`App\Http\Controllers\Api\V1\`, `App\Http\Controllers\Api\V2\`).
---
## Reason
Mirroring URL structure in controller namespaces makes it trivial to identify which controller serves which version.
---
## Bad Example
```
App/Http/Controllers/Api/PostController.php  // which version??
```
---
## Good Example
```
App/Http/Controllers/Api/V1/PostController.php
App/Http/Controllers/Api/V2/PostController.php
```
---
## Exceptions
Single-version APIs with no planned version.
---
## Consequences Of Violation
Controller-to-version mapping confusion; accidental import of wrong version's controller.
---

## Monitor 404 Rates On Deprecated Versions
---
## Category
Reliability
---
## Rule
Always monitor 404 response rates on deprecated version endpoints to measure consumer migration progress.
---
## Reason
Falling 404 rates on an old version means consumers have migrated — a signal that removal is safe.
---
## Bad Example
```php
// No 404 monitoring — team doesn't know if anyone still uses v1
```
---
## Good Example
```php
// Log/alert on deprecated version usage
if ($version === 'v1' && config("api.versions.v1.deprecated")) {
    Log::channel('deprecation')->info('Deprecated version accessed', ['path' => $request->path()]);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Removing a version while consumers still depend on it; production incidents during version retirement.
---

## Never Mix Multiple Versions In A Single Route File
---
## Category
Code Organization
---
## Rule
Never define routes for different API versions in the same route file — each version gets its own dedicated file.
---
## Reason
Mixed route files make version boundaries unclear, code diffs noisy, and version removal error-prone.
---
## Bad Example
```php
// routes/api-v1.php — contains v2 routes at the bottom
```
---
## Good Example
```php
// routes/api-v1.php — v1 only
// routes/api-v2.php — v2 only
// No cross-version pollution
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Accidentally removing v1 routes when editing v2 section; confusing pull request diffs.
