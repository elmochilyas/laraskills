# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Plan-aware throttling for SaaS APIs
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No Cache for Plan Limits**: Per-request database lookup for plan configuration
- [ ] Prevent anti-pattern: Generic 429 Without Upgrade Info**: Users don't know how to increase limits
- [ ] Prevent anti-pattern: Same Burst Capacity for All Plans**: Free and enterprise have identical burst allowances
- [ ] Tier-to-limit mapping defined for all subscription plans
- [ ] Rate limiter reads user tier and applies correct limit
- [ ] Rate limit headers returned in API responses
- [ ] 429 response includes upgrade suggestion for free-tier users
- [ ] Each tier tested for correct limit enforcement
- [ ] Avoid: Mistake
- [ ] Avoid: Trusting client-provided plan
- [ ] Avoid: Not caching plan limits

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Plan resolution: from authenticated user's subscription, API key metadata, or JWT claim
- Plan limits stored in config or database (cached): `['free' => ['rpm' => 100], 'pro' => ['rpm' => 1000]]`
- Rate limit key: `rate_limit:{plan}:{user_id}:{endpoint_group}` for isolation
- Burst vs sustained: token bucket with capacity = burst allowance, refill = sustained rate
- Concurrent limits: use a counter that increments on request start, decrements on response

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] Tier-to-limit mapping defined for all subscription plans
- [ ] - [ ] Rate limiter reads user tier and applies correct limit
- [ ] - [ ] Rate limit headers returned in API responses
- [ ] - [ ] 429 response includes upgrade suggestion for free-tier users

# Performance Checklist
- Plan resolution: one cache lookup per request (~0.5ms)
- Rate limit check: same as regular rate limiting â€” negligible with Redis
- Plan-to-limit caching: reduce database load by caching plan configuration

# Security Checklist
- **Plan Spoofing**: Never trust plan information from the client. Resolve plan server-side from authentication context.
- **API Key Scoping**: Each API key should be tied to a plan. When a plan changes, existing API keys should enforce new limits.
- **Concurrent Limit Deadlock**: If a consumer exceeds concurrent limits, they must wait for requests to complete. Set appropriate timeouts.
- **Abuse Detection**: Sudden spikes in plan usage may indicate compromised credentials â€” monitor and alert.

# Reliability Checklist
- [ ] Ensure: Plan-aware throttling applies different rate limits to API consumers based on th...

# Testing Checklist
- [ ] Tier-to-limit mapping defined for all subscription plans
- [ ] Rate limiter reads user tier and applies correct limit
- [ ] Rate limit headers returned in API responses
- [ ] 429 response includes upgrade suggestion for free-tier users
- [ ] Each tier tested for correct limit enforcement
- [ ] Avoid: Mistake
- [ ] Avoid: Trusting client-provided plan
- [ ] Avoid: Not caching plan limits

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Cache for Plan Limits**: Per-request database lookup for plan configuration
- [ ] Prevent: Generic 429 Without Upgrade Info**: Users don't know how to increase limits
- [ ] Prevent: Same Burst Capacity for All Plans**: Free and enterprise have identical burst allowances
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Trusting client-provided plan
- [ ] Avoid mistake: Not caching plan limits
- [ ] Avoid mistake: Same burst for all plans
- [ ] Avoid mistake: No plan information in error responses

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
- No Cache for Plan Limits**: Per-request database lookup for plan configuration
- Generic 429 Without Upgrade Info**: Users don't know how to increase limits
- Same Burst Capacity for All Plans**: Free and enterprise have identical burst allowances
## Skills
- Implement Plan-Aware Throttling for Tiered API Access


