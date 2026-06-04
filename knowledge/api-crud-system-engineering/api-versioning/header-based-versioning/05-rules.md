# Phase 5: Rules — Header-Based Versioning

## Use Middleware For Version Resolution
---
## Category
Code Organization
---
## Rule
Always resolve the API version from headers in dedicated middleware — never parse headers inside controllers.
---
## Reason
Header parsing logic scattered across controllers is untestable in isolation and easy to forget on new endpoints.
---
## Bad Example
```php
class PostController { public function index(Request $request) { $version = $request->header('X-API-Version'); /* ... */ } }
```
---
## Good Example
```php
class VersionMiddleware { public function handle(Request $request, Closure $next) { /* resolve once */ } }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent version resolution across endpoints; untestable header parsing logic.
---

## Set `Vary: Accept` On All Versioned Responses
---
## Category
Performance
---
## Rule
Always set the `Vary: Accept` response header on all versioned endpoints to prevent CDN cache poisoning.
---
## Reason
Without `Vary: Accept`, a CDN caches one version's response and serves it to all version requests, returning wrong data.
---
## Bad Example
```php
return response()->json($data); // no Vary header
```
---
## Good Example
```php
return response()->json($data)->header('Vary', 'Accept');
```
---
## Exceptions
APIs not behind a CDN or cache layer (e.g., internal microservices with direct calls).
---
## Consequences Of Violation
CDN serves V1 response to V2 consumers; data corruption visible across version boundaries.
---

## Include Resolved Version In Response Headers
---
## Category
Maintainability
---
## Rule
Always include the resolved API version in a response header (e.g., `X-API-Version: v1`) for debuggability.
---
## Reason
Header-based versioning hides the version from the URL, making it invisible in logs, curl output, and support screenshots.
---
## Bad Example
```php
return response()->json($data); // no version in response
```
---
## Good Example
```php
return response()->json($data)->header('X-API-Version', 'v1');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Support teams cannot determine which version a consumer is using; debugging blind.
---

## Validate Unsupported Versions With 406
---
## Category
Reliability
---
## Rule
Always return HTTP 406 Not Acceptable for unsupported or unknown API versions — never silently default to the latest version.
---
## Reason
Silently defaulting to the latest version gives the consumer wrong data without any error signal.
---
## Bad Example
```php
$version = $request->header('X-API-Version', 'v1'); // default instead of error
```
---
## Good Example
```php
if (!in_array($version, config('api.supported_versions'))) {
    abort(406, "API version '{$version}' is not supported.");
}
```
---
## Exceptions
The root `/api` endpoint which may redirect to the latest stable version for discovery.
---
## Consequences Of Violation
Consumer silently gets wrong version data; bugs attributed to "API behavior changes" when really it's the wrong version.
---

## Log Both Raw And Resolved Version
---
## Category
Maintainability
---
## Rule
Always log both the raw Accept header value and the resolved version string for debugging header parsing issues.
---
## Reason
Custom header typos, proxy modifications, and charset qualifiers can make the raw header look different from what was parsed.
---
## Bad Example
```php
Log::info('API version used', ['version' => $version]); // header value not logged
```
---
## Good Example
```php
Log::info('API version used', ['raw_header' => $request->header('Accept'), 'resolved_version' => $version]);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Hours debugging "version X doesn't work" when the real issue is a mangled Accept header from a proxy.
---

## Test Header Parsing With Invalid Inputs
---
## Category
Testing
---
## Rule
Always write tests for header version parsing with malformed, missing, and case-varied header values.
---
## Reason
Accept header values vary widely (charset, quality, extensions) and header names are case-insensitive — parsing must handle all variants.
---
## Bad Example
```php
// Only tests "X-API-Version: v1"
```
---
## Good Example
```php
public function test_accepts_lowercase_header(): void { $this->withHeader('x-api-version', 'v1')->get('/api/users'); }
public function test_rejects_unknown_version(): void { $this->withHeader('X-API-Version', 'v99')->get('/api/users')->assertStatus(406); }
public function test_handles_charset_in_accept(): void { $this->withHeader('Accept', 'application/vnd.app.v1+json; charset=utf-8')->get('/api/users'); }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Production crashes on unexpected header format; version resolution fails silently.
---

## Verify Proxy/Gateway Does Not Strip Custom Headers
---
## Category
Reliability
---
## Rule
Always verify in staging that your reverse proxy, API gateway, and load balancers do not strip or modify the version header before it reaches the application.
---
## Reason
Corporate proxies and cloud load balancers commonly strip `X-` prefixed custom headers, causing all consumers to default to the same version.
---
## Bad Example
```php
// Assumes X-API-Version always reaches the application — no proxy test
```
---
## Good Example
```php
// Staging test: curl with X-API-Version header; verify response X-API-Version matches
curl -H 'X-API-Version: v2' https://staging.example.com/api/users | jq '.headers."X-API-Version"'
```
---
## Exceptions
APIs that use the standard `Accept` header for versioning (no custom headers to strip).
---
## Consequences Of Violation
All consumers silently default to the same version; versioning is effectively broken in production.
---

## Provide A `/version` Endpoint For Client Debugging
---
## Category
Maintainability
---
## Rule
Always implement a `/api/version` endpoint that echoes back the resolved version, supported versions, and deprecation status for client-side debugging.
---
## Reason
Consumers cannot see the version in the URL — they need a programmatic way to verify which version they are hitting.
---
## Bad Example
```php
// No version endpoint
```
---
## Good Example
```php
Route::get('/api/version', function (Request $request) {
    return response()->json([
        'resolved_version' => $request->attributes->get('api_version'),
        'supported_versions' => config('api.supported_versions'),
        'deprecated_versions' => config('api.deprecated_versions'),
    ]);
});
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients cannot programmatically verify their version; support teams struggle to identify version mismatches.
