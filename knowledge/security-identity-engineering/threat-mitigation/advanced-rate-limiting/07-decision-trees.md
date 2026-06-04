# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Advanced Rate Limiting (Sliding Window, Token Bucket)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Algorithm Selection | Simple vs sliding window vs token bucket | precision, performance |
| 2 | Per-Endpoint vs Global Limits | Rate limit scope | security, architectural |
| 3 | Plan-Aware vs Fixed Limiting | Per-subscription rate limiting | architectural |

---

# Architecture-Level Decision Trees

---

## Algorithm Selection

---

## Decision Context

Choosing the rate limiting algorithm — Laravel's built-in sliding window, advanced sliding window counter, or token bucket.

---

## Decision Criteria

* precision
* performance

---

## Decision Tree

What traffic control requirements exist?
↓
Basic burst protection + sustained limit → Laravel's built-in sliding window (start here)
Need precise per-second burst control → Token bucket (allows bursts up to capacity, then refills)
Need exact request counting in time window → Sliding window log (memory-intensive, most accurate)
Need memory-efficient approximate counting → Sliding window counter (O(1) storage per key)

Does the application use Redis?
↓
YES → Token bucket possible (Lua scripts for atomicity)
NO → Built-in sliding window only (file/database cache insufficient for token bucket)

What is the traffic volume?
↓
Low (< 100 req/s) → Built-in sliding window sufficient
Medium (100-1000 req/s) → Sliding window counter or token bucket
High (> 1000 req/s) → Token bucket with Redis Lua (best performance)

Is atomicity critical (no race conditions on rate limit state)?
↓
YES → Token bucket with Redis Lua (atomic token consumption)
NO → Built-in sliding window (acceptable imprecision)

---

## Rationale

Laravel's built-in sliding window rate limiter handles 90% of use cases. Token bucket is needed when burst tolerance and precise per-second control are required. Sliding window counter is a good middle ground for precision without the memory overhead of sliding window log. Start with the simplest algorithm and upgrade only when measurements show it's insufficient.

---

## Recommended Default

**Default:** Start with Laravel's built-in sliding window rate limiter; upgrade to token bucket (Redis Lua) only when burst control or plan-based tiering demands it
**Reason:** The built-in limiter is simple, well-tested, and sufficient for most applications. Advanced algorithms add Redis dependency, Lua scripting complexity, and maintenance overhead without benefit for typical traffic patterns.

---

## Risks Of Wrong Choice

- Token bucket without Redis: not possible (requires atomic Redis ops)
- Built-in sliding window for high-precision APIs: burst traffic may overwhelm brief window
- Sliding window log without TTL: memory exhaustion from accumulated timestamps
- No rate limiting at all: vulnerable to brute force, DoS, API abuse

---

## Related Rules

- Define Rate Limits per Endpoint, Not Globally (05-rules.md)
- Use Segmented Rate Limiting for Fine-Grained Control (05-rules.md)

---

## Related Skills

- Implement Advanced Rate Limiting with Dynamic Limits (06-skills.md)

---

## Per-Endpoint vs Global Limits

---

## Decision Context

Whether to apply the same rate limit globally across all routes or define specific limits per endpoint group.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Are there endpoints with different sensitivity levels (login vs read-only API)?
↓
YES → Per-endpoint limits required (login at 5/min, API at 100/min)
NO → Global limit may be acceptable (all endpoints have similar needs)

Are authentication endpoints included (login, register, password reset)?
↓
YES → These need strict per-endpoint limits (3-5/min) regardless of global config
NO → Global limit still needs per-endpoint differentiation for write vs read endpoints

Is there a public API consumed by third parties?
↓
YES → Per-endpoint limits + per-key limits (each API key has its own limit)
NO → Per-endpoint limits per authenticated user

How many distinct endpoint groups exist?
↓
Few (2-3) → Simple per-group limits manageable
Many (5+) → Consider plan-aware limiting with grouped tiers

---

## Rationale

Different endpoints have different rate limit requirements. Login endpoints need strict limits (prevent brute force), while public API endpoints need higher limits (accommodate legitimate traffic). A single limit is either too strict (blocks API users) or too loose (allows brute force). Per-endpoint limits optimize for each endpoint's specific threat profile.

---

## Recommended Default

**Default:** Per-endpoint limits — strict for auth endpoints (login, registration, password reset at 3-5/min), moderate for write API (30-100/min), generous for read API (100-300/min)
**Reason:** Authentication endpoints are primary brute-force targets and need the strictest limits. Read APIs handle legitimate traffic and need higher limits. Write APIs sit in the middle — moderate limits prevent abuse without blocking legitimate creation operations.

---

## Risks Of Wrong Choice

- Global strict limit: blocks legitimate API users
- Global generous limit: allows brute-force on login
- Per-endpoint without auth limit: brute-force unprotected
- No per-endpoint for public API: scraping and abuse undetected

---

## Related Rules

- Define Rate Limits per Endpoint, Not Globally (05-rules.md)
- Throttle Authentication Attempts (Login, Password Reset, MFA) (05-rules.md)
- Add Throttle Middleware to Route Groups, Not Individual Routes (05-rules.md)

---

## Related Skills

- Implement Advanced Rate Limiting with Dynamic Limits (06-skills.md)

---

## Plan-Aware vs Fixed Limiting

---

## Decision Context

Whether to use the same rate limit for all users or vary limits based on subscription plan.

---

## Decision Criteria

* architectural

---

## Decision Tree

Does the application have subscription tiers with different service levels?
↓
YES → Plan-aware limiting (free: 100/hr, pro: 1000/hr, enterprise: 10000/hr)
NO → Fixed limiting (same limit for all authenticated users)

Are plan limits documented in API contracts?
↓
YES → Plan-aware limiting required (contractual obligation)
NO → Fixed limiting or simple per-user limits

Is there a need to upsell higher limits as a feature?
↓
YES → Plan-aware limiting (rate limit tiers are a monetization lever)
NO → Fixed limiting may suffice

What is the complexity cost of plan-aware limiting?
↓
Low (plan info available on user model, cached) → Implement plan-aware
High (plan info requires external API call) → Fixed limiting with per-user exceptions

---

## Rationale

Plan-aware rate limiting is a common SaaS pattern where API limits are part of the subscription value proposition. Free-tier users get lower limits, paid users get higher limits. This requires resolving the user's plan on each request and applying appropriate limits. The plan-to-limits mapping should be cached to avoid per-request database queries.

---

## Recommended Default

**Default:** Fixed rate limiting for non-SaaS apps; plan-aware limiting for SaaS/API monetization tiers
**Reason:** Plan-aware limiting adds complexity (plan resolution, caching, limit lookup). Only justified when rate limits are part of the product's value proposition or API contracts. For simple apps, fixed limits with per-user overrides handle exceptions adequately.

---

## Risks Of Wrong Choice

- Plan-aware without caching: per-request database query for plan info
- Fixed limits for SaaS: enterprise users hit same limits as free users (unfair)
- Plan-aware exposed to users: users can calculate exact limits (OK for contracts, not for internal)
- No fallback for unauthenticated: anonymous users need IP-based plan resolution (free tier by default)

---

## Related Rules

- Key Rate Limits by User ID for Authenticated, IP for Guests (05-rules.md)
- Monitor Rate Limit Hits in Production (05-rules.md)

---

## Related Skills

- Implement Advanced Rate Limiting with Dynamic Limits (06-skills.md)
