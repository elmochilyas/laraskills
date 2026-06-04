# Phase 5: Rules — CORS Policy Governance

## Rule 1: Never Use Wildcard Origin with Credentials
---
## Category
Security
---
## Rule
Never set `Access-Control-Allow-Origin: *` with `Access-Control-Allow-Credentials: true`. Always specify explicit origins when credentials are required.
---
## Reason
Browsers reject this combination — it makes CORS responses invalid. Additionally, even if it worked, it would allow any origin to send credentialed requests.
---
## Bad Example
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true'); // browsers reject this
```
---
## Good Example
```php
$origin = $request->header('Origin');
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
}
```
---
## Exceptions
Public read-only endpoints with no authentication may use wildcard without credentials.
---
## Consequences Of Violation
Browser rejects CORS responses; authenticated browser clients cannot call the API; SPA integrations broken.
---

## Rule 2: Use Environment-Specific Origin Lists
---
## Category
Security
---
## Rule
Always maintain separate CORS origin allowlists for development, staging, and production. Never allow `http://localhost:*` in production.
---
## Reason
Development environments need permissive origins for local tooling; production requires strict control. Localhost in production exposes the API to local browser extensions and malicious sites on the same network.
---
## Bad Example
```php
// Same allowlist for all environments — includes localhost in production
'allowed_origins' => ['http://localhost:3000', 'https://app.example.com'];
```
---
## Good Example
```php
'allowed_origins' => match (app()->environment()) {
    'local' => ['http://localhost:*', 'http://127.0.0.1:*'],
    'staging' => ['https://staging.example.com', 'https://internal-tools.example.com'],
    'production' => ['https://app.example.com', 'https://admin.example.com'],
};
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Localhost allowed in production; CSRF-like attacks via local browser extensions; security audit failures.
---

## Rule 3: Explicitly Expose All Custom Headers
---
## Category
Design
---
## Rule
Always list every custom response header in `Access-Control-Expose-Headers`. Never assume browsers expose custom headers to JavaScript by default.
---
## Reason
Browsers only expose six simple response headers by default. Custom headers (X-Request-Id, Deprecation, Link, X-RateLimit-Remaining) are invisible to JavaScript without explicit exposure.
---
## Bad Example
```php
header('Access-Control-Expose-Headers: '); // empty — X-Request-Id hidden from JS
```
---
## Good Example
```php
header('Access-Control-Expose-Headers: X-Request-Id, Deprecation, Sunset, Link, X-RateLimit-Limit, X-RateLimit-Remaining');
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Browser JavaScript cannot access custom headers; rate limit headers invisible; consumer tooling broken.
---

## Rule 4: Cache Preflight Responses for 24 Hours
---
## Category
Performance
---
## Rule
Always set `Access-Control-Max-Age: 86400` on preflight (OPTIONS) responses. Never use a shorter Max-Age without justification.
---
## Reason
Each cross-origin request triggers a preflight round-trip. A 24-hour cache eliminates preflight overhead for the vast majority of subsequent requests.
---
## Bad Example
```php
// Short preflight cache — many round-trips
header('Access-Control-Max-Age: 600'); // 10 minutes — 144 preflights/day
```
---
## Good Example
```php
header('Access-Control-Max-Age: 86400'); // 24 hours — 1 preflight/day
```
---
## Exceptions
Frequently changing CORS policies may use shorter Max-Age during transition periods.
---
## Consequences Of Violation
Unnecessary OPTIONS requests for every cross-origin call; increased latency and server load.
---

## Rule 5: Implement Formal Origin Change Process
---
## Category
Governance
---
## Rule
Always require a formal change request with security review and business justification before adding an origin to the production allowlist. Never add origins without review.
---
## Reason
Each allowed origin expands the attack surface. Unreviewed additions may allow malicious or compromised consumer sites to access the API.
---
## Bad Example
```php
// Origin added ad-hoc without review
config(['cors.allowed_origins' => array_merge(config('cors.allowed_origins'), [$newOrigin])]);
```
---
## Good Example
```php
// Origin change requires PR with security review
// PR template requires: business justification, security assessment, ownership info
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Malicious origin added; data exfiltration via compromised consumer; compliance violation.
---

## Rule 6: Include CORS Headers on Error Responses
---
## Category
Reliability
---
## Rule
Always include CORS headers on error responses (4xx, 5xx), not just on successful responses. Never let error responses omit CORS headers.
---
## Reason
Without CORS headers on error responses, the browser blocks the JavaScript from reading the error body, making all errors opaque to browser-based consumers.
---
## Bad Example
```php
// Error response without CORS headers — browser hides error from JS
return response()->json(['error' => '...'], 422);
```
---
## Good Example
```php
public function handle(Request $request, Closure $next) {
    $response = $next($request);
    return $this->addCorsHeaders($response, $request); // applied to all responses
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Browser consumers receive opaque errors; debugging impossible; support escalations increase.
---

## Rule 7: Audit Origin Allowlist Quarterly
---
## Category
Security
---
## Rule
Always audit the CORS origin allowlist at least once per quarter, removing unused or expired origins. Never let the allowlist grow without periodic cleanup.
---
## Reason
Stale origins accumulate over time (acquired companies, deprecated apps, abandoned projects). Each unused origin is unnecessary attack surface.
---
## Bad Example
```php
// Allowlist never audited — 47 origins, most unused
// "origin-14" was for a startup that was acquired 3 years ago
```
---
## Good Example
```php
$schedule->call(function () {
    $unused = OriginRegistry::findUnusedSince(now()->subMonths(6));
    foreach ($unused as $origin) {
        Notification::route('slack', config('services.slack.security'))
            ->notify(new StaleCorsOriginAlert($origin));
    }
})->quarterly();
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Expanded attack surface; unused origins exploited; security audit findings.
