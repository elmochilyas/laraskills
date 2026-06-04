# Phase 5: Rules — Deprecation Header Implementation

## Always Use Middleware For Header Injection
---
## Category
Code Organization
---
## Rule
Always inject the `Deprecation` header via middleware applied to route groups — never add it manually in individual controllers.
---
## Reason
Middleware ensures consistent, automatic header injection across all deprecated endpoints without developer oversight.
---
## Bad Example
```php
class V1PostController { public function index() { return response()->header('Deprecation', 'true'); } } // per-controller
```
---
## Good Example
```php
Route::prefix('api/v1')->middleware(DeprecationMiddleware::class)->group(base_path('routes/api-v1.php'));
```
---
## Exceptions
Per-endpoint deprecation (not whole version) requires route-specific middleware or attribute-based injection.
---
## Consequences Of Violation
Inconsistent deprecation headers; missed endpoints that should show deprecation.
---

## Use RFC 9745 Standard Header Names
---
## Category
Design
---
## Rule
Always use the standard `Deprecation` header name (RFC 9745) instead of custom names like `X-Deprecated` or `X-API-Deprecated`.
---
## Reason
Non-standard header names require consumers to implement custom parsing instead of using standard HTTP libraries that already understand `Deprecation`.
---
## Bad Example
```php
$response->header('X-Deprecated', 'true');
```
---
## Good Example
```php
$response->header('Deprecation', 'true');
```
---
## Exceptions
Legacy APIs where consumers already depend on the custom header name — send both during a migration window.
---
## Consequences Of Violation
Consumer tooling cannot automatically detect deprecation; reduced signal value.
---

## Pair Deprecation With Sunset Header Always
---
## Category
Maintainability
---
## Rule
Never send a `Deprecation` header without also sending a `Sunset` header with the removal date.
---
## Reason
A deprecation warning without a deadline is not actionable — consumers don't know when they must migrate by.
---
## Bad Example
```php
$response->header('Deprecation', 'true'); // no Sunset
```
---
## Good Example
```php
$response->header('Deprecation', 'true');
$response->header('Sunset', Carbon::create(2026, 12, 31)->toRfc7231String());
```
---
## Exceptions
When the deprecation date is genuinely not yet determined — delay the deprecation header instead.
---
## Consequences Of Violation
Consumers ignore deprecation; removal date arrives and consumers are unprepared.
---

## Include `since` Parameter With ISO 8601 Date
---
## Category
Maintainability
---
## Rule
Always include the `since` parameter with an ISO 8601 date in the `Deprecation` header to indicate when deprecation was announced.
---
## Reason
The `since` date helps consumers understand how long they have been warned and prioritize migration.
---
## Bad Example
```php
$response->header('Deprecation', 'true'); // no context
```
---
## Good Example
```php
$response->header('Deprecation', 'since="2026-01-01"');
```
---
## Exceptions
Internal APIs with a single consumer that is directly notified of the deprecation timeline.
---
## Consequences Of Violation
Consumers cannot assess urgency; support tickets asking "when was this deprecated?".
---

## Keep Deprecated Endpoints Fully Functional
---
## Category
Reliability
---
## Rule
Never break deprecated endpoints — deprecation signals intent to remove, not permission to degrade.
---
## Reason
Consumers need the deprecated endpoint to continue working while they migrate — breaking it defeats the purpose of the deprecation window.
---
## Bad Example
```php
if ($this->isDeprecated) { return response('', 503); } // broken despite deprecation header
```
---
## Good Example
```php
// Deprecation header added, endpoint continues working identically
return response()->json($data)->header('Deprecation', 'true');
```
---
## Exceptions
The Enforce phase of the deprecation timeline where intentional degradation has been communicated.
---
## Consequences Of Violation
Emergency rollback; consumer trust loss; SLA breach.
---

## Test Deprecated Endpoints In CI
---
## Category
Testing
---
## Rule
Always run a test suite against deprecated endpoints that verifies both functionality and correct deprecation headers.
---
## Reason
Deprecated endpoints are often neglected and silently break, but consumers still depend on them.
---
## Bad Example
```php
// No tests for deprecated endpoints
```
---
## Good Example
```php
public function test_deprecated_v1_endpoint_returns_deprecation_header(): void
{
    $response = $this->getJson('/api/v1/users');
    $response->assertHeader('Deprecation');
    $response->assertOk();
}
```
---
## Exceptions
Endpoints in the final month before removal where the 410 response is the intended behavior.
---
## Consequences Of Violation
Consumers hit broken deprecated endpoints; emergency debugging while supporting active versions.
---

## Monitor Deprecation Header Frequency
---
## Category
Reliability
---
## Rule
Always track how frequently deprecation headers are served to estimate consumer migration progress.
---
## Reason
Rising deprecated version traffic signals that consumers are not migrating — a leading indicator for timeline extension.
---
## Bad Example
```php
// No monitoring of deprecated traffic
```
---
## Good Example
```php
// Log deprecation header deliveries
Log::channel('deprecation')->info('Deprecation header served', [
    'version' => $version,
    'consumer' => $request->user()?->id,
]);
```
---
## Exceptions
Internal APIs with known consumers that communicate migration directly.
---
## Consequences Of Violation
Removal date arrives with consumers still on the deprecated version; production incidents during removal.
