# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Rate limiter facade and throttle middleware
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Rate Limiting Not Monitored**: No logging when rate limits are hit
- [ ] Prevent anti-pattern: No Per-Endpoint Differentiation**: Same 60/min limit for login and search
- [ ] Prevent anti-pattern: No Custom 429 Response**: Generic, unhelpful rate limit error
- [ ] Rate limit attempts registered on failure
- [ ] Rate limit cleared on success (login, password reset)
- [ ] `Retry-After` header included in 429 responses
- [ ] Rate limit key scoped appropriately (user + IP, not just IP)
- [ ] Decay seconds appropriate for the action (60s for login, 300s for password reset)
- [ ] Avoid: Mistake
- [ ] Avoid: Not using named limiters
- [ ] Avoid: Same limit for all user types

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Define limiters in `AppServiceProvider::boot()` or `RouteServiceProvider`
- API root limiter: `RateLimiter::for('api', fn (Request $req) => Limit::perMinute(60)->by($req->user()?->id ?: $req->ip()))`
- Login limiter: Fortify defines a `login` limiter by default â€” customize in FortifyServiceProvider
- Guest vs authenticated: use `->by()` to differentiate keys
- Throttle middleware on route groups, not individual routes

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Rate limit attempts registered on failure
- [ ] - [ ] Rate limit cleared on success (login, password reset)
- [ ] - [ ] `Retry-After` header included in 429 responses
- [ ] - [ ] Rate limit key scoped appropriately (user + IP, not just IP)

# Performance Checklist
- Rate limiter uses Laravel cache â€” Redis is fastest for distributed setups
- File cache is slow under high concurrency â€” use Redis/memcached in production
- In-memory (array) cache for testing: `Cache::driver('array')`
- Rate limit check adds ~0.5-2ms per request (cache read + increment)

# Security Checklist
- **Distributed Rate Limiting**: In multi-server setups, use a shared cache (Redis) for rate limit state. File cache is per-server.
- **IP Spoofing**: `$request->ip()` can be spoofed behind proxies. Use `$request->header('X-Forwarded-For')` with trusted proxies.
- **Key Collision**: Ensure rate limit keys are unique per user/per IP. Avoid generic keys that multiple users share.
- **Brute Force Protection**: Login rate limiting is essential â€” Fortify includes it. Do not disable.

# Reliability Checklist
- [ ] Ensure: Laravel's `RateLimiter` facade and `throttle` middleware provide rate limiting f...

# Testing Checklist
- [ ] Rate limit attempts registered on failure
- [ ] Rate limit cleared on success (login, password reset)
- [ ] `Retry-After` header included in 429 responses
- [ ] Rate limit key scoped appropriately (user + IP, not just IP)
- [ ] Decay seconds appropriate for the action (60s for login, 300s for password reset)
- [ ] Tests verify limits are enforced and reset correctly
- [ ] Avoid: Mistake
- [ ] Avoid: Not using named limiters
- [ ] Avoid: Same limit for all user types

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Rate Limiting Not Monitored**: No logging when rate limits are hit
- [ ] Prevent: No Per-Endpoint Differentiation**: Same 60/min limit for login and search
- [ ] Prevent: No Custom 429 Response**: Generic, unhelpful rate limit error
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Not using named limiters
- [ ] Avoid mistake: Same limit for all user types
- [ ] Avoid mistake: File cache for rate limiting
- [ ] Avoid mistake: Not handling rate-limit errors gracefully

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- Rate Limiting Not Monitored**: No logging when rate limits are hit
- No Per-Endpoint Differentiation**: Same 60/min limit for login and search
- No Custom 429 Response**: Generic, unhelpful rate limit error
## Skills
- Use RateLimiter Facade for Custom Rate Limiting Logic


