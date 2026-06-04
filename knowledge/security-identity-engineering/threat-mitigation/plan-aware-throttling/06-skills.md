# Skill: Implement Plan-Aware Throttling for Tiered API Access

## Purpose
Configure rate limits dynamically based on user subscription plans, allowing higher-tier customers higher API request quotas while protecting infrastructure.

## When To Use
- SaaS applications with tiered subscription plans
- API products with usage-based pricing
- Freemium applications where free users have lower limits
- Preventing free-tier abuse while serving paid customers

## When NOT To Use
- Single-plan applications (use flat rate limits)
- Enterprise-only products without tier differentiation

## Prerequisites
- `RateLimiter` facade
- User model with subscription plan or tier information
- Billing/subscription management (e.g., Laravel Cashier)

## Workflow
1. Define tier-to-limit mapping in config (e.g., `'free' => 60`, `'pro' => 600`, `'enterprise' => 6000`)
2. Create rate limiter that reads user's tier from subscription data
3. Use `Limit::perMinute($tierLimits[$user->tier] ?? 60)->by($user->id)`
4. Return informative `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers
5. Return custom 429 response suggesting plan upgrade
6. Test each tier's limit enforcement in CI
7. Log rate limit hits per tier for capacity planning

## Validation Checklist
- [ ] Tier-to-limit mapping defined for all subscription plans
- [ ] Rate limiter reads user tier and applies correct limit
- [ ] Rate limit headers returned in API responses
- [ ] 429 response includes upgrade suggestion for free-tier users
- [ ] Each tier tested for correct limit enforcement
