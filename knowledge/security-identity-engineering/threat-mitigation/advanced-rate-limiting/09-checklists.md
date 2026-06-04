# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Advanced rate limiting (sliding window, token bucket)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No Monitoring on Rate Limit Hits**: Attacks and misconfigurations go undetected
- [ ] Prevent anti-pattern: Same Burst for All Plans**: All user tiers have identical burst allowances
- [ ] Prevent anti-pattern: Rate Limiting by IP for Authenticated Users**: NAT users unfairly throttled
- [ ] Rate limiters defined for all external-facing API endpoints
- [ ] Limits vary by user tier where applicable
- [ ] Custom 429 response returned (JSON for API, view for web)
- [ ] Rate limit headers (X-RateLimit-*) visible in responses
- [ ] Rate limiting tested with automated tests
- [ ] Avoid: Mistake
- [ ] Avoid: Token bucket without atomicity
- [ ] Avoid: Sliding window log without cleanup

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Token bucket: implement as Redis Lua script with `capacity` and `refill_rate` parameters
- Sliding window counter: use atomic increment on the current sub-interval minute
- Plan-aware: middleware resolves user's plan â†’ passes max attempts to rate limiter
- Burst-friendly: token bucket allows short bursts while maintaining average rate
- Fallback: if Redis is unavailable, fail closed or fall back to simple limiting

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Rate limiters defined for all external-facing API endpoints
- [ ] - [ ] Limits vary by user tier where applicable
- [ ] - [ ] Custom 429 response returned (JSON for API, view for web)
- [ ] - [ ] Rate limit headers (X-RateLimit-*) visible in responses

# Performance Checklist
- Token Bucket: atomic Lua script in Redis â€” ~1-3ms per check
- Sliding Window Counter: 1 Redis INCR + EXPIRE per request â€” ~0.5ms
- Sliding Window Log: O(n) per check (count timestamps in window) â€” slower for high-traffic keys
- Plan-aware: one cache lookup per request (plan â†’ limits) â€” ~0.5ms

# Security Checklist
- **Algorithm Choice Impacts Fairness**: Token bucket can starve some users if capacity is too low. Monitor throttling patterns.
- **Burst Protection**: Token bucket allows bursts â€” ensure bursts don't overwhelm downstream services (database, email API).
- **Plan Boundary**: A user on free plan hitting limits should not affect paid users. Ensure rate limit keys include plan or user ID.
- **Distributed Atomicity**: Redis Lua ensures atomic operations across multiple application servers â€” essential for accuracy.

# Reliability Checklist
- [ ] Ensure: Beyond Laravel's built-in sliding window rate limiter, advanced algorithms provi...

# Testing Checklist
- [ ] Rate limiters defined for all external-facing API endpoints
- [ ] Limits vary by user tier where applicable
- [ ] Custom 429 response returned (JSON for API, view for web)
- [ ] Rate limit headers (X-RateLimit-*) visible in responses
- [ ] Rate limiting tested with automated tests
- [ ] Avoid: Mistake
- [ ] Avoid: Token bucket without atomicity
- [ ] Avoid: Sliding window log without cleanup

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Monitoring on Rate Limit Hits**: Attacks and misconfigurations go undetected
- [ ] Prevent: Same Burst for All Plans**: All user tiers have identical burst allowances
- [ ] Prevent: Rate Limiting by IP for Authenticated Users**: NAT users unfairly throttled
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Token bucket without atomicity
- [ ] Avoid mistake: Sliding window log without cleanup
- [ ] Avoid mistake: Plan limits without caching
- [ ] Avoid mistake: Not handling Redis failure

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
- No Monitoring on Rate Limit Hits**: Attacks and misconfigurations go undetected
- Same Burst for All Plans**: All user tiers have identical burst allowances
- Rate Limiting by IP for Authenticated Users**: NAT users unfairly throttled
## Skills
- Implement Advanced Rate Limiting with Dynamic Limits


