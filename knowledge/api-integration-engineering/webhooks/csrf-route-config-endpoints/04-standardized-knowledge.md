# ECC Standardized Knowledge — CSRF Bypass and Route Configuration for Webhook Endpoints

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | webhook-systems-incoming |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | CSRF Bypass and Route Configuration for Webhook Endpoints |
| Difficulty | Foundation |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K020, K011 |

## Overview (Engineering Value)
Webhook endpoints require CSRF bypass because external providers cannot obtain Laravel CSRF tokens. This is achieved by adding webhook URLs to the `VerifyCsrfToken` middleware's `$except` array. Route configuration must handle provider-specific signing, POST-only method restriction, and proper response formatting. The API route group naturally avoids CSRF issues by excluding the `web` middleware group.

## Core Concepts
- **CSRF Exception**: Add webhook URL to `$except` array in `VerifyCsrfToken` middleware
- **Wildcard Matching**: `Str::is()` pattern matching supports `/webhook/*` wildcards
- **API Route Group**: `routes/api.php` uses `api` middleware group (no CSRF, no sessions)
- **Method Restriction**: Webhook providers always POST; non-POST requests should return 405
- **Route Caching**: Route changes require `php artisan route:cache` to take effect

## When To Use
- All incoming webhook endpoints in Laravel applications
- Multi-provider webhook reception (Stripe, GitHub, Slack, etc.)
- When using Spatie's laravel-webhook-client package

## When NOT To Use
- Internal endpoints called by your own application
- Endpoints that already handle CSRF tokens via SPA or API token auth
- Routes in `routes/api.php` (api middleware group excludes CSRF by default)

## Best Practices
- Prefer exact URL exemption over wildcards for security (`/webhook/stripe` not `/webhook/*`)
- Use `routes/api.php` with `api` middleware group to avoid CSRF entirely
- Never disable CSRF globally; use targeted `$except` array entries
- Add throttling middleware to all webhook endpoints
- Implement compensating security (signature verification) at a different layer

## Architecture Guidelines
- Register webhook endpoints as `Route::post()` only
- Place webhook routes in separate file (`routes/webhooks.php`) for organization
- Use provider-specific paths (`/webhook/stripe`, `/webhook/github`)
- Apply rate limiting middleware per webhook endpoint
- Monitor 419 (CSRF mismatch) rates to detect misconfigured endpoints

## Performance Considerations
- CSRF bypass overhead is negligible
- Route matching is O(n); keep webhook route count manageable
- Request body reading for verification reads PHP input stream once; cache it
- Rate limiting middleware should use Redis-backed stores for distributed throttling

## Security Considerations
- CSRF bypass removes one security layer; signature verification must replace it
- Wildcard exceptions broaden bypass surface; use exact paths
- API routes still pass through auth, throttle, and other middleware
- Implement IP whitelisting where providers publish source IP ranges
- Log all webhook requests for audit trail

## Common Mistakes
- Adding route to CSRF except without defining it first (produces 404)
- Using `Route::any()` instead of `Route::post()` allowing non-POST hits
- Wildcard too broad: `/webhook*` matching unintended routes
- Disabling CSRF globally instead of using targeted exceptions
- Forgetting to clear route cache after adding webhook routes

## Anti-Patterns
- Global CSRF disable for convenience
- Using web routes for webhooks (sessions, CSRF overhead)
- GET-accessible webhook endpoints vulnerable to CSRF
- Hardcoded URLs in config without wildcard support

## Examples
```php
// App\Http\Middleware\VerifyCsrfToken
protected $except = [
    'webhook/stripe',
    'webhook/github',
    'webhook/*',  // wildcard for multiple providers
];
```

```php
// routes/api.php
Route::post('webhook/stripe', [StripeWebhookController::class, 'handle']);
Route::post('webhook/github', [GitHubWebhookController::class, 'handle']);
```

## Related Topics
- **Prerequisites**: Laravel middleware fundamentals, route configuration
- **Closely Related**: Spatie webhook-client, signature verification, webhook processing
- **Advanced**: Subdomain routing for webhooks, IP whitelisting
- **Cross-Domain**: Laravel security, API route design

## AI Agent Notes
- Always add webhook routes to CSRF except when generating webhook receiver code
- Prefer API routes over web routes for webhook endpoints
- Include rate limiting middleware on generated webhook routes

## Verification
- [ ] Webhook URLs added to `VerifyCsrfToken::$except` array
- [ ] Routes defined as `Route::post()` only
- [ ] Rate limiting middleware applied to webhook endpoints
- [ ] Signature verification implemented as compensating control
- [ ] Route cache cleared after adding new webhook routes
- [ ] 419 response rate monitored for misconfigured endpoints
