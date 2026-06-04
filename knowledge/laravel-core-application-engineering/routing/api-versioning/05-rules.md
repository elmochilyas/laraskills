## Enforce URI Versioning

Always use URI versioning (`/api/v1/`, `/api/v2/`) as the exclusive versioning strategy.

---

## Category

Architecture

---

## Rule

Always prefix versioned API routes with `/v1/`, `/v2/`, etc. using `Route::prefix('v1')`. Do not use header-based or query-parameter versioning.

---

## Reason

URI versioning is explicit in logs, cacheable by HTTP caches, testable with standard HTTP assertions, and visible in API documentation. Header versioning is invisible in URLs and harder to debug. Query-parameter versioning pollutes cache keys and complicates route matching.

---

## Bad Example

```php
// Header versioning — invisible in URLs, hard to debug
Route::get('/api/users', [UserController::class, 'index'])
    ->middleware(VersionMiddleware::class);

// Query parameter versioning — cache pollution
Route::get('/api/users', [UserController::class, 'index']);
```

---

## Good Example

```php
Route::prefix('api/v1')->group(function () {
    Route::apiResource('users', Api\V1\UserController::class);
});
Route::prefix('api/v2')->group(function () {
    Route::apiResource('users', Api\V2\UserController::class);
});
```

---

## Exceptions

Internal-only APIs where all consumers are deployed simultaneously may omit versioning entirely. Never mix versioning strategies.

---

## Consequences Of Violation

Maintenance risks from multiple versioning strategies; cache invalidation bugs with query-parameter versioning; poor debuggability with header versioning.

---

## Use Controller Inheritance Across Versions

V2+ controllers should extend V1 controllers, overriding only changed methods.

---

## Category

Code Organization

---

## Rule

When creating V2+ controllers, extend the previous version's controller class and override only the methods that changed. Do not copy entire controllers per version.

---

## Reason

Inheritance eliminates code duplication across versions. Bug fixes applied to V1 methods propagate to V2+ automatically unless overridden. Without inheritance, every bug fix must be applied to N copies, which inevitably diverge.

---

## Bad Example

```php
namespace App\Http\Controllers\Api\V2;

class UserController
{
    // Entire V1 code duplicated, plus V2 changes
    public function index() { /* identical to V1 */ }
    public function store() { /* identical to V1 */ }
    public function show($id) { /* V2-specific */ }
}
```

---

## Good Example

```php
namespace App\Http\Controllers\Api\V2;

use App\Http\Controllers\Api\V1\UserController as V1UserController;

class UserController extends V1UserController
{
    // Only override methods that changed in V2
    public function show($id)
    {
        // V2-specific implementation
    }
}
```

---

## Exceptions

If a controller's interface or method signatures change incompatibly between versions, inheritance may not be possible. In those cases, extract shared logic into traits or services instead.

---

## Consequences Of Violation

Maintenance risks from duplicated code; bug-fix divergence across versions; increased testing surface.

---

## Limit Active Versions to Two

Support a maximum of two active major versions simultaneously.

---

## Category

Maintainability

---

## Rule

Never maintain more than two active major API versions at any time. Enforce a sunset policy that retires the oldest version when a new version is released.

---

## Reason

Each additional version multiplies the maintenance burden: every feature change must be implemented and tested against all active versions. A "last two major versions" policy caps this complexity.

---

## Bad Example

```php
// V1, V2, V3, V4 all active simultaneously
Route::prefix('v1')->group(/* ... */);
Route::prefix('v2')->group(/* ... */);
Route::prefix('v3')->group(/* ... */);
Route::prefix('v4')->group(/* ... */);
```

---

## Good Example

```php
// Only V2 and V3 active; V2 sunset announced, V1 retired
Route::prefix('v2')->name('v2.')->group(/* ... */);
Route::prefix('v3')->name('v3.')->group(/* ... */);
```

---

## Exceptions

No common exceptions. If a consumer cannot migrate within the two-version window, negotiate a custom extension agreement rather than carrying the version in perpetuity.

---

## Consequences Of Violation

Exponential maintenance burden; increased testing matrix; slower feature delivery across all versions.

---

## Version Resources Separately

Maintain separate API Resource classes per version in version-specific directories.

---

## Category

Code Organization

---

## Rule

Place API Resource classes in version-specific directories (e.g., `app/Http/Resources/V1/`, `app/Http/Resources/V2/`). V2 resources may extend V1 resources for unchanged fields.

---

## Reason

Response contracts change between versions. Separate resource classes prevent accidentally exposing new fields in old versions. Extension avoids duplicating unchanged serialization logic.

---

## Bad Example

```php
// Shared UserResource — V2 fields leak into V1 responses
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone, // V2 field exposed in V1
        ];
    }
}
```

---

## Good Example

```php
// V1/UserResource.php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return ['id' => $this->id, 'name' => $this->name];
    }
}

// V2/UserResource.php — extends V1, adds fields
class UserResource extends \App\Http\Resources\V1\UserResource
{
    public function toArray($request): array
    {
        return array_merge(parent::toArray($request), [
            'phone' => $this->phone,
        ]);
    }
}
```

---

## Exceptions

If the response structure changes fundamentally between versions (e.g., V1 returns flat, V2 returns nested), extension may not be appropriate. In that case, write independent resource classes.

---

## Consequences Of Violation

Data leakage of new fields into old API versions; breaking changes for consumers on old versions.

---

## Enforce Consistent Authentication Across Versions

All API versions must use the same authentication mechanism.

---

## Category

Security

---

## Rule

Do not introduce different authentication schemes per API version. All versions must share the same auth middleware, guard, and token/credential format.

---

## Reason

Different auth schemes per version create security confusion, increase maintenance burden, and risk version-specific auth bypasses. Consumers need a single authentication strategy regardless of which version they use.

---

## Bad Example

```php
Route::prefix('v1')->middleware('auth:api')->group(/* ... */);
Route::prefix('v2')->middleware('auth:sanctum')->group(/* ... */);
```

---

## Good Example

```php
Route::prefix('v1')->middleware('auth:sanctum')->group(/* ... */);
Route::prefix('v2')->middleware('auth:sanctum')->group(/* ... */);
```

---

## Exceptions

If a version is explicitly designed for a different client type (e.g., V1 for third-party with API tokens, V2 for first-party with session auth), they should use different auth — but this strongly suggests these should be separate APIs, not versions of the same API.

---

## Consequences Of Violation

Security risks from inconsistent auth coverage; maintenance overhead of multiple auth implementations; consumer confusion.

---

## Add Deprecation Headers

Include standard deprecation headers on old API versions and document sunset timelines.

---

## Category

Reliability

---

## Rule

Apply `Deprecation` and `Sunset` HTTP headers to all responses for deprecated API versions. Document sunset dates in API documentation.

---

## Reason

Consumers need programmatic notification that a version is deprecated. The `Deprecation` header indicates deprecation; the `Sunset` header specifies when the version will be removed. Without these headers, consumers have no automated way to know their integration is at risk.

---

## Bad Example

```php
// V1 controller — no deprecation awareness
class UserController
{
    public function index() { /* ... */ }
}
```

---

## Good Example

```php
class UserController
{
    public function index()
    {
        return response()
            ->json(/* ... */)
            ->header('Deprecation', 'true')
            ->header('Sunset', '2026-12-31');
    }
}
```

---

## Exceptions

Internal APIs where all consumers are owned and can be updated on a known timeline may skip deprecation headers, provided the sunset date is communicated through team channels.

---

## Consequences Of Violation

Reliability risks from consumers being surprised by removal; broken integrations when versions are retired without warning.
