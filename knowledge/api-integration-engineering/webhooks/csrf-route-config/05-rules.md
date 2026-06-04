# CSRF Token Handling for Webhook Routes — Rules

---

## Always Add Webhook Routes to CSRF Exception List

## Category

Security

## Rule

Add every webhook endpoint URL to the `$except` array in `App\Http\Middleware\VerifyCsrfToken`; never skip this step.

## Reason

External webhook providers cannot obtain a Laravel CSRF token. Without the exception, every incoming webhook POST request receives a 419 HTTP error. The provider either silently drops the event or retries indefinitely, causing data loss.

## Bad Example

```php
// App\Http\Middleware\VerifyCsrfToken
protected $except = [];
// Webhook URL receives 419 on every delivery
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

Reliability: All webhook deliveries fail with 419. Debugging: Provider logs show 419 with no application error.

---

## Use Route Prefix to Group Webhook Endpoints for Targeted Exclusion

## Category

Code Organization

## Rule

Group all webhook routes under a common URL prefix (e.g., `/webhook/`) and use the prefix pattern for CSRF exclusion.

## Reason

A common prefix makes CSRF exclusion simple (one wildcard entry) and consistent across all webhook routes. Without a prefix, each webhook route must be individually added to the exception array, increasing configuration surface and the risk of forgetting one.

## Bad Example

```php
// Mixed routes — each needs individual CSRF exception
Route::post('stripe-webhook', ...);
Route::post('github-events', ...);
Route::post('slack-callback', ...);
// All three must be added to $except individually
```

## Good Example

```php
// Grouped under prefix — one CSRF exception covers all
Route::prefix('webhook')->group(function () {
    Route::post('stripe', ...);
    Route::post('github', ...);
    Route::post('slack', ...);
});

// VerifyCsrfToken::$except
protected $except = ['webhook/*'];
```

## Exceptions

Single webhook endpoints where an extra prefix adds unnecessary path complexity.

## Consequences Of Violation

Maintainability: Each new webhook route requires a CSRF exception update. Reliability: Forgetting a new route causes 419 errors.

---

## Never Disable CSRF Globally

## Category

Security

## Rule

Use targeted CSRF exceptions for webhook routes only; never remove or comment out the `VerifyCsrfToken` middleware from the `web` middleware group.

## Reason

Global CSRF removal disables forgery protection for all routes (login, profile, settings). Every form submission becomes vulnerable to cross-site request forgery. Targeted exceptions ensure only webhook endpoints bypass CSRF while all user-facing routes remain protected.

## Bad Example

```php
// App\Http\Kernel.php — CSRF middleware removed
protected $middlewareGroups = [
    'web' => [
        // \App\Http\Middleware\VerifyCsrfToken::class, // Disabled globally
    ],
];
```

## Good Example

```php
// Targeted exceptions only
protected $except = ['webhook/*'];
// All other web routes remain CSRF-protected
```

## Exceptions

No common exceptions. Global CSRF disable is never justified.

## Consequences Of Violation

Security: All routes vulnerable to CSRF. Compliance: OWASP Top 10 violation (A01: Broken Access Control).

---

## Use API Routes for Webhook Endpoints (Preferred)

## Category

Architecture

## Rule

Place webhook routes in `routes/api.php` to automatically exclude CSRF and session middleware; prefer this over adding CSRF exceptions for web routes.

## Reason

The `api` middleware group does not include CSRF or session middleware by default. Placing webhook routes in `routes/api.php` eliminates the need for CSRF exceptions entirely, reduces middleware overhead (no sessions), and follows Laravel conventions for stateless endpoints.

## Bad Example

```php
// routes/web.php — requires CSRF exception
Route::post('webhook/stripe', [StripeController::class, 'handle']);
```

## Good Example

```php
// routes/api.php — no CSRF, no sessions
Route::post('webhook/stripe', [StripeController::class, 'handle']);
// No CSRF exception needed
```

## Exceptions

Applications that rely on session data (e.g., authenticated user context) inside webhook processing. In practice, this is rare — webhooks should authenticate via signature verification.

## Consequences Of Violation

Maintainability: Extra CSRF configuration step. Performance: Unnecessary session middleware overhead.

---

## Implement Compensating Security (Signature Verification)

## Category

Security

## Rule

After bypassing CSRF protection, ensure every webhook route has signature verification as a compensating security control.

## Reason

CSRF bypass removes one authentication layer. Without signature verification, the endpoint accepts any POST request from any source. Signature verification ensures only authenticated providers can deliver webhooks, restoring the security posture that CSRF removal weakened.

## Bad Example

```php
// CSRF bypassed but no signature verification
Route::post('webhook/stripe', [StripeController::class, 'handle']);
// Anyone can POST to this endpoint
```

## Good Example

```php
// CSRF bypassed + signature middleware
Route::post('webhook/stripe', [StripeController::class, 'handle'])
    ->middleware(VerifyStripeSignature::class);
// Only requests with valid HMAC signature pass
```

## Exceptions

No common exceptions. CSRF bypass without compensating signature verification is a security vulnerability.

## Consequences Of Violation

Security: Unauthenticated endpoint accepts arbitrary POST requests. Data integrity: Forged webhooks processed as legitimate.

---

## Register Webhook Routes as Route::post() Only

## Category

Security

## Rule

Define all webhook endpoints as `Route::post()`; never use `Route::any()` or `Route::match()` for webhook routes.

## Reason

Webhook providers universally deliver events via HTTP POST. Allowing other HTTP methods (GET, PUT, DELETE) expands the attack surface. GET requests can be triggered via image tags or link clicks, enabling CSRF-style attacks without user interaction.

## Bad Example

```php
Route::any('webhook/stripe', [StripeController::class, 'handle']);
// GET, PUT, PATCH, DELETE all accepted
```

## Good Example

```php
Route::post('webhook/stripe', [StripeController::class, 'handle']);
// Only POST — others return 405 Method Not Allowed
```

## Exceptions

Provider verification flows requiring GET (e.g., Facebook/Meta webhook challenge). Define a separate GET route for that specific purpose.

## Consequences Of Violation

Security: Non-POST methods exploitable for forgery. Standards: Violates webhook delivery conventions.
