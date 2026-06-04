## Add Deprecation Header Immediately on Deprecation Decision
---
## Category
Observability
---
## Rule
Add the `Deprecation: true` header to deprecated endpoints the moment the deprecation decision is made, not when removal is imminent.
---
## Reason
Delaying headers delays consumer awareness; early header addition maximizes migration time and reduces last-minute migration pressure.
---
## Bad Example
```php
// Deprecated for months — but no header until 1 week before removal
```
---
## Good Example
```php
// Deprecation decided — headers added immediately
class DeprecationMiddleware {
    public function handle($request, $next) {
        $response = $next($request);
        return $response->header('Deprecation', 'true');
    }
}
```
---
## Exceptions
None — add headers immediately on deprecation decision.
---
## Consequences Of Violation
Consumers unaware of deprecation until removal is imminent, rushed migrations, integration breakage.
## Set Realistic Sunset Dates Based on Usage Analytics
---
## Category
Reliability
---
## Rule
Set `Sunset` headers based on actual version usage analytics showing minimal remaining usage, not arbitrary dates.
---
## Reason
Without analytics, Sunset dates are guesses — too short breaks consumers, too long delays cleanup unnecessarily.
---
## Bad Example
```php
// Sunset date set to 3 months — no data on whether consumers still use v1
```
---
## Good Example
```php
// Analytics show v1 usage dropped below 5%; set sunset based on trajectory
$sunset = $v1Usage < 5 ? now()->addMonths(6) : now()->addMonths(12);
$response->header('Sunset', $sunset->format('D, d M Y H:i:s \G\M\T'));
```
---
## Exceptions
Compliance- or security-driven deprecation with fixed deadlines.
---
## Consequences Of Violation
Consumers forced to migrate too fast (short Sunset) or versions kept alive too long (long Sunset), both eroding trust.
## Include Link Header with Successor Version URL
---
## Category
Maintainability
---
## Rule
Always include a `Link` header with `rel="successor-version"` on deprecated endpoints, pointing to the replacement.
---
## Reason
Consumers need to know where to migrate; a Link header provides the exact URL without requiring documentation lookup.
---
## Bad Example
```php
// Deprecation: true, Sunset: ... — but no migration target
```
---
## Good Example
```php
$response->header('Link', '</api/v2/users>; rel="successor-version"');
```
---
## Exceptions
No direct successor exists (complete feature removal).
---
## Consequences Of Violation
Consumers know a version is deprecated but don't know where to migrate, increasing support burden.
## Sample Version Analytics for Performance
---
## Category
Performance
---
## Rule
Log version usage analytics with sampling (1/100 requests) for high-traffic endpoints to reduce overhead.
---
## Reason
Logging every request for analytics adds I/O overhead; sampling provides trend data with minimal performance impact.
---
## Bad Example
```php
// Logs every request — 100% sample rate wastes resources
Log::info('API version call', ['version' => $version]);
```
---
## Good Example
```php
// 1% sample — sufficient for trend analysis
if (mt_rand(1, 100) === 1) {
    Log::info('API version call', ['version' => $version]);
}
```
---
## Exceptions
Low-traffic APIs where full logging overhead is negligible.
---
## Consequences Of Violation
Unnecessary I/O overhead on high-traffic endpoints, performance degradation from analytics logging.
## Use Middleware for Consistent Header Application
---
## Category
Code Organization
---
## Rule
Apply deprecation headers via middleware on version route groups, not in individual controllers.
---
## Reason
Per-controller header logic is inconsistent and hard to maintain; middleware ensures every deprecated endpoint gets headers automatically.
---
## Bad Example
```php
class V1\UserController {
    public function index() {
        return response($data)->header('Deprecation', 'true'); // only this endpoint
    }
}
```
---
## Good Example
```php
// Single middleware applied to all v1 routes
Route::prefix('v1')
    ->middleware(DeprecationHeaderMiddleware::class)
    ->group(base_path('routes/api/v1.php'));
```
---
## Exceptions
None — always use middleware.
---
## Consequences Of Violation
Missing headers on some deprecated endpoints, inconsistent consumer experience, maintenance burden.
## Return 410 Gone for Removed Versions
---
## Category
Reliability
---
## Rule
Return HTTP 410 Gone with migration info for removed versions; never return 404.
---
## Reason
410 explicitly communicates intentional removal with migration guidance; 404 suggests the resource path is wrong.
---
## Bad Example
```php
// Removed API returns 404 — consumer thinks path is wrong
```
---
## Good Example
```php
return response()->json([
    'error' => 'gone',
    'message' => 'This version has been removed.',
    'migration_url' => 'https://docs.example.com/api/v2-migration',
], 410);
```
---
## Exceptions
None — always return 410.
---
## Consequences Of Violation
Consumer confusion, delayed migration, inability to distinguish "not found" from "removed."
