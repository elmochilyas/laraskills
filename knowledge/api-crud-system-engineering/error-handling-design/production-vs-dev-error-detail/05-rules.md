# Phase 5: Rules — Production vs Dev Error Detail

## Rule: Always Use a Separate debug Key for Dev Detail
---
## Category
Architecture | Design
---
## Rule
Always append development-time diagnostic data under a top-level `debug` key in the response object; never modify the `error` envelope structure in any environment.
---
## Reason
The `error` envelope is the API contract. Adding fields to it or changing its shape in dev mode means client tests running in dev see a different structure than production, causing false test failures.
---
## Bad Example
```php
// Dev mode includes trace in the envelope — different shape
'error' => [
    'code' => 'VALIDATION_ERROR',
    'message' => '...',
    'status' => 422,
    'trace' => $e->getTrace(), // Breaks envelope contract
]
```
---
## Good Example
```php
// Dev mode adds a separate debug key — envelope unchanged
'error' => ['code' => 'VALIDATION_ERROR', 'message' => '...', 'status' => 422],
'debug' => ['exception' => $e::class, 'file' => $e->getFile(), 'line' => $e->getLine()],
```
---
## Exceptions
No common exceptions — the envelope must be identical in all environments.
---
## Consequences Of Violation
Client test suites pass in dev, fail in production; envelope contract is undefined; clients cannot rely on field presence.

---

## Rule: Gate Dev Detail on Both APP_DEBUG and app()->isLocal()
---
## Category
Security | Reliability
---
## Rule
Always gate development-only error detail with a check of both `config('app.debug')` and `app()->isLocal()`; never check only `APP_DEBUG` or rely on a single environment variable.
---
## Reason
`APP_DEBUG=true` can be accidentally set in staging or production via `.env` misconfiguration. Adding `app()->isLocal()` as a second gate ensures that even with a misconfigured `.env`, debug detail is not leaked.
---
## Bad Example
```php
// Single gate — staging with APP_DEBUG=true leaks detail
if (config('app.debug')) {
    $response->setData(/* debug data */);
}
```
---
## Good Example
```php
// Double gate — local check prevents staging leaks
if (config('app.debug') && app()->isLocal()) {
    $response->setData(/* debug data */);
}
```
---
## Exceptions
CI/test environment where `app()->isLocal()` returns false but debug detail is desired; configure `APP_ENV=testing` explicitly.
---
## Consequences Of Violation
Staging misconfiguration exposes stack traces, file paths, and SQL queries to non-local users; security incident.

---

## Rule: Never Set APP_DEBUG=true in Production — Enforce in CI
---
## Category
Security | Reliability
---
## Rule
Always fail CI/deploy pipelines if `APP_DEBUG=true` is detected in the production `.env` or environment; never deploy with debug mode enabled.
---
## Reason
`APP_DEBUG=true` in production exposes full stack traces, `$_ENV` values (including DB credentials), SQL queries, and file paths to any API consumer — an instant security incident.
---
## Bad Example
```php
// .env.production — set by accident, deployed to production
APP_DEBUG=true
// No CI check catches it
```
---
## Good Example
```php
// deploy.sh — checks before deploy
if grep -q "APP_DEBUG=true" .env.production; then
    echo "ERROR: APP_DEBUG must be false in production"
    exit 1
fi

// CI pipeline step:
- name: Check APP_DEBUG
  run: |
    if [ "$APP_DEBUG" = "true" ]; then
      echo "APP_DEBUG must be false for production deployment"
      exit 1
    fi
```
---
## Exceptions
Staging or testing environments where debug is intentionally enabled for troubleshooting.
---
## Consequences Of Violation
Full information disclosure: stack traces, file paths, SQL, environment variables, and credentials exposed to the internet.

---

## Rule: Always Return JSON for API Routes in Dev Mode — Never Whoops HTML
---
## Category
Framework Usage | Reliability
---
## Rule
Always return JSON error responses for API routes even in development mode; never return the Whoops HTML error page to API requests.
---
## Reason
Whoops HTML pages are designed for browser-based debugging and contain `$_ENV`, file contents, and interactive stack traces. Returning them for API requests breaks client integration testing in dev.
---
## Bad Example
```php
// Whoops HTML returned for API requests in dev
// Client gets HTML instead of JSON — integration tests fail
```
---
## Good Example
```php
$this->renderable(function (Throwable $e, Request $request) {
    // Always JSON for API requests, even in dev
    return $request->expectsJson()
        ? response()->json($this->buildErrorResponse($e))
        : null; // null → Whoops for web routes
});
```
---
## Exceptions
No common exceptions — API routes must always return JSON in all environments.
---
## Consequences Of Violation
Frontend developers see HTML errors instead of JSON; integration tests fail in dev; `$_ENV` values exposed via Whoops page for API requests.

---

## Rule: Limit Dev Trace to 10 Frames Maximum
---
## Category
Performance | Maintainability
---
## Rule
Always limit the stack trace in dev debug mode to the first 10 frames; never include the full stack trace.
---
## Reason
Full stack traces can be 50+ frames with vendor calls and internal Laravel calls. 10 frames is sufficient for identifying the source of the error without overwhelming the developer or causing response bloat.
---
## Bad Example
```php
'debug' => [
    'trace' => $e->getTraceAsString(), // Full trace — 50+ frames
]
```
---
## Good Example
```php
'debug' => [
    'trace' => array_slice($e->getTrace(), 0, 10), // 10 frames — sufficient
]
```
---
## Exceptions
No common exceptions — 10 frames is always sufficient for development debugging.
---
## Consequences Of Violation
Large error responses in dev; slow rendering of error pages; unnecessary log volume when dev errors are logged.

---

## Rule: Never Cache Error Responses — Dev Detail Must Never Leak via Cache
---
## Category
Security | Performance
---
## Rule
Always ensure error responses are never cached (set `Cache-Control: no-cache, no-store, must-revalidate`); never let dev-mode responses be stored in a cache that could serve production clients.
---
## Reason
A dev-mode error response with stack traces cached by a reverse proxy (Varnish, Nginx) could be served to production users, leaking sensitive internal details.
---
## Bad Example
```php
// No cache headers on error responses
return response()->json($errorEnvelope, 500);
// Could be cached by intermediary
```
---
## Good Example
```php
return response()->json($errorEnvelope, 500)
    ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
    ->header('Pragma', 'no-cache')
    ->header('Expires', '0');
```
---
## Exceptions
No common exceptions — error responses must never be cached at any layer.
---
## Consequences Of Violation
Dev-mode stack traces served to production users; data leak via shared cache; attackers access cached debug information.

---

## Rule: Test Production Mode Error Responses in CI with APP_DEBUG=false
---
## Category
Testing | Security
---
## Rule
Always run a dedicated test suite that sets `APP_DEBUG=false` and `app.debug=false` and asserts that no sensitive data (stack traces, file paths, SQL) appears in any error response.
---
## Reason
The default `phpunit.xml` sets `APP_DEBUG=true`, so standard tests never validate production-safe error responses. Without a dedicated production-mode suite, sensitive data leaks go undetected.
---
## Bad Example
```php
// phpunit.xml always has APP_DEBUG=true
// All tests pass — but production error responses may leak data
```
---
## Good Example
```php
// phpunit.production.xml
<env name="APP_DEBUG" value="false"/>

// In test:
public function test_error_no_sensitive_data_in_production(): void
{
    app()->detectEnvironment(fn () => 'production');
    config(['app.debug' => false]);

    $response = $this->getJson('/api/users/999');
    $response->assertStatus(404);
    $response->assertJsonMissingPath('debug');
    $response->assertJsonMissingPath('error.trace');
    $response->assertJsonMissingPath('error.file');
}
```
---
## Exceptions
No common exceptions — production-mode error testing is mandatory for any deployable API.
---
## Consequences Of Violation
Sensitive data leaks undetected until production; compliance violations discovered post-incident; emergency fixes during business hours.

---

## Rule: Dev Detail Must Still Sanitize Sensitive Data
---
## Category
Security
---
## Rule
Always apply the same sensitive data redaction to dev-mode debug output as to production responses; never assume dev mode is safe from PII leakage.
---
## Reason
Dev mode responses may be shared in screenshots, pasted to Slack, or committed to bug reports. If dev mode includes `password` fields in debug context, that data is still leaked.
---
## Bad Example
```php
if (config('app.debug') && app()->isLocal()) {
    'debug' => [
        'context' => $e->context, // May contain passwords if exception added them
    ]
}
```
---
## Good Example
```php
if (config('app.debug') && app()->isLocal()) {
    'debug' => [
        'context' => (new SanitiseExceptionContext())->sanitise($e->context), // Redacted
    ]
}
```
---
## Exceptions
No common exceptions — all output paths must sanitize sensitive data.
---
## Consequences Of Violation
Passwords or tokens exposed in dev screenshots; PII committed to bug tracker attachments; developer workstations become data leak sources.

---

## Rule: Never Enable Debug Mode Based on Request Parameters or IP
---
## Category
Security
---
## Rule
Always control debug mode exclusively through `APP_DEBUG` and `app()->isLocal()`; never enable debug detail based on `?debug=1` query parameters, `X-Debug` headers, or IP allowlists.
---
## Reason
Query-parameter and IP-based debug access is security through obscurity — attackers can guess the parameter or spoof IPs. Once bypassed, all internal details are exposed.
---
## Bad Example
```php
// Debug mode enabled via query parameter — trivially bypassed
if ($request->has('debug')) {
    $response->setData(/* debug data */);
}
```
---
## Good Example
```php
// Debug mode controlled solely by environment configuration
if (config('app.debug') && app()->isLocal()) {
    $response->setData(/* debug data */);
}
```
---
## Exceptions
Internal debugging tools with separate authentication and audit logging (not the same as error responses).
---
## Consequences Of Violation
Predictable debug parameter allows attackers to enable debug mode remotely; full information disclosure via query string.
