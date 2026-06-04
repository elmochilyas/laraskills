# Skill: Use RateLimiter Facade for Custom Rate Limiting Logic

## Purpose
Apply the `RateLimiter` facade for fine-grained rate limiting beyond route middleware — limiting login attempts, password resets, API calls, or custom business operations.

## When To Use
- Custom rate limiting logic not tied to routes (login attempts, OTP requests)
- Rate limiting inside controller/service logic
- Complex rate limiting with multiple keys per action
- Testing rate limit state without making requests

## When NOT To Use
- Simple route-level rate limiting (use `throttle` middleware)
- Global API rate limits (use middleware)

## Prerequisites
- `Illuminate\Cache\RateLimiter` facade
- Cache driver configured (Redis recommended)

## Workflow
1. Import `Illuminate\Support\Facades\RateLimiter`
2. Define rate limit key (e.g., `'login:' . $request->ip()`)
3. Call `RateLimiter::tooManyAttempts($key, $maxAttempts)` to check limit
4. Call `RateLimiter::hit($key, $decaySeconds)` on failed attempt
5. Call `RateLimiter::clear($key)` on successful attempt
6. Call `RateLimiter::availableIn($key)` for retry-after timing
7. Use `RateLimiter::remaining($key, $maxAttempts)` for remaining count
8. Combine with custom retry-after header in responses

## Validation Checklist
- [ ] Rate limit attempts registered on failure
- [ ] Rate limit cleared on success (login, password reset)
- [ ] `Retry-After` header included in 429 responses
- [ ] Rate limit key scoped appropriately (user + IP, not just IP)
- [ ] Decay seconds appropriate for the action (60s for login, 300s for password reset)
- [ ] Tests verify limits are enforced and reset correctly
