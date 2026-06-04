# Skill: Implement Advanced Rate Limiting with Dynamic Limits

## Purpose
Configure Laravel's rate limiter with dynamic, context-aware limits (per-user, per-IP, per-route) using the `RateLimiter` facade for API protection and abuse prevention.

## When To Use
- API endpoints vulnerable to abuse (login, registration, search)
- Per-user rate limits based on subscription tier or plan
- Endpoints with different cost profiles (read vs write operations)
- Preventing brute force, scraping, and DOS attacks

## When NOT To Use
- Simple global rate limits (use basic middleware)
- Internal-only endpoints behind VPN or private network

## Prerequisites
- Laravel `RateLimiter` facade
- `config/app.php` rate limiter configuration

## Workflow
1. Define rate limiters in `AppServiceProvider::boot()` or `RouteServiceProvider`
2. Use `RateLimiter::for('api', fn => Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()))`
3. Implement tiered limits: premium users get higher limits
4. Use `Limit::perMinute()->response()` for custom 429 responses
5. Apply to routes: `Route::middleware('throttle:api')`
6. Use named limiters with `throttle:api` or `throttle:login`
7. Monitor rate limit hits in logs for abuse detection
8. Test rate limit enforcement in CI

## Validation Checklist
- [ ] Rate limiters defined for all external-facing API endpoints
- [ ] Limits vary by user tier where applicable
- [ ] Custom 429 response returned (JSON for API, view for web)
- [ ] Rate limit headers (X-RateLimit-*) visible in responses
- [ ] Rate limiting tested with automated tests
