# CSRF Bypass and Route Configuration for Webhook Endpoints — Rules

---

## Always Add Webhook Routes to CSRF Exception List

## Category

Security

## Rule

Add every webhook endpoint URL to the `$except` array in `App\Http\Middleware\VerifyCsrfToken`; never leave webhook routes unprotected by CSRF bypass.

## Reason

External webhook providers cannot obtain Laravel CSRF tokens. Without the exception, every incoming webhook yields a 419 HTTP error. Providers either silently drop the event or retry indefinitely, causing data loss and operational noise.

## Bad Example

```php
// App\Http\Middleware\VerifyCsrfToken
protected $except = [];
// Every webhook POST returns 419
```

## Good Example

```php
protected $except = [
    'webhook/stripe',
    'webhook/github',
    'webhook/*',
];
```

## Exceptions

Webhook routes defined in `routes/api.php` (the `api` middleware group excludes CSRF by default).

## Consequences Of Violation

Reliability: All webhooks fail with 419. Debugging: Provider logs show 419 with no application-level error.

---

## Prefer Exact URL Exemption Over Wildcards

## Category

Security

## Rule

Use exact route paths in the CSRF exception array when the number of webhook providers is small and known; avoid broad wildcards that inadvertently expose non-webhook routes.

## Reason

Wildcards (`webhook/*`) exempt any route matching the pattern from CSRF protection. An attacker who discovers the pattern can target unintended routes under the same prefix. Exact paths limit the CSRF bypass surface to only the intended endpoints.

## Bad Example

```php
// Broad wildcard — anything under /webhook/ is exempt
protected $except = ['webhook/*'];
// /webhook/admin/delete-config is also exempt
```

## Good Example

```php
// Exact paths — only actual webhook endpoints
protected $except = [
    'webhook/stripe',
    'webhook/github/push',
    'webhook/slack/events',
];
```

## Exceptions

Dynamically provisioned webhook routes (multi-tenant) where the full set is unknown at deploy time.

## Consequences Of Violation

Security: Unintended routes bypass CSRF. Compliance: Broader attack surface than necessary.

---

## Define Webhook Routes as Route::post() Only

## Category

Security

## Rule

Register all webhook endpoints using `Route::post()`; never use `Route::any()` or `Route::match()` for webhook routes.

## Reason

Webhook providers universally use HTTP POST to deliver events. Allowing GET, PUT, PATCH, or DELETE opens attack vectors: GET requests can be CSRF-forged via image tags, PUT may modify server state. Restricting to POST ensures only the intended HTTP method is accepted.

## Bad Example

```php
Route::any('webhook/stripe', [StripeController::class, 'handle']);
// GET, PUT, DELETE also accepted
```

## Good Example

```php
Route::post('webhook/stripe', [StripeController::class, 'handle']);
// Only POST accepted — others return 405
```

## Exceptions

Provider-specific verification flows that require GET for endpoint challenge verification (e.g., Facebook/Meta webhook verification). In that case, add a separate GET route for verification only.

## Consequences Of Violation

Security: Non-POST methods exploitable. Reliability: Unexpected methods may corrupt state. Standards: Violates webhook protocol convention.

---

## Never Disable CSRF Globally

## Category

Security

## Rule

Use targeted `$except` array entries for specific webhook routes; never remove the `VerifyCsrfToken` middleware from the `web` middleware group.

## Reason

Global CSRF removal protects no routes from forgery. All non-webhook routes (login, profile update, settings) lose CSRF protection, exposing every user action to cross-site request forgery. Targeted exceptions ensure only webhook endpoints bypass CSRF while all other routes remain protected.

## Bad Example

```php
// App\Http\Kernel.php — CSRF removed entirely
protected $middlewareGroups = [
    'web' => [
        // \App\Http\Middleware\VerifyCsrfToken::class, // Commented out
    ],
];
```

## Good Example

```php
// Targeted exceptions only
protected $except = [
    'webhook/stripe',
    'webhook/github',
];
```

## Exceptions

No common exceptions. Global CSRF disable is never justified for webhook handling.

## Consequences Of Violation

Security: All routes vulnerable to CSRF. Compliance: OWASP Top 10 violation. Audit: Cannot prove CSRF protection.

---

## Use API Routes for Webhook Endpoints When Possible

## Category

Architecture

## Rule

Place webhook routes in `routes/api.php` to automatically avoid CSRF protection, rather than adding CSRF exceptions for `routes/web.php` routes.

## Reason

The `api` middleware group does not include CSRF or session middleware. Webhook routes in `routes/api.php` require zero CSRF configuration and avoid session overhead. This is cleaner than managing CSRF exceptions and provides the same security through signature verification.

## Bad Example

```php
// routes/web.php — requires CSRF exception
Route::post('webhook/stripe', [StripeController::class, 'handle']);
// Must also add to VerifyCsrfToken::$except
```

## Good Example

```php
// routes/api.php — no CSRF by default
Route::post('webhook/stripe', [StripeController::class, 'handle']);
// No CSRF exception needed
```

## Exceptions

Applications that use session-based auth for webhook routes and need access to authenticated user session data.

## Consequences Of Violation

Maintainability: Extra configuration step (CSRF exception). Performance: Unnecessary session middleware overhead.

---

## Apply Rate Limiting Middleware to Webhook Routes

## Category

Security

## Rule

Add the `throttle` middleware to every webhook route definition to limit request rate per provider or per IP.

## Reason

Webhook endpoints are public URLs. Without rate limiting, a misconfigured provider or malicious actor can flood the endpoint with requests, overwhelming queue workers and degrading application performance. Provider-specific rate limits also absorb provider replay spikes.

## Bad Example

```php
Route::post('webhook/stripe', [StripeController::class, 'handle']);
// No rate limiting — any request rate accepted
```

## Good Example

```php
Route::post('webhook/stripe', [StripeController::class, 'handle'])
    ->middleware('throttle:60,1');
// 60 requests per minute per IP
```

## Exceptions

Internal webhook endpoints reachable only within the private network (not internet-facing).

## Consequences Of Violation

Security: Endpoint vulnerable to abuse. Reliability: Queue backpressure from request flood. Performance: Processing capacity exhausted.
