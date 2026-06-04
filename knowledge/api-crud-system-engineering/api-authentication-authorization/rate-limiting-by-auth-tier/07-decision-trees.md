# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Rate Limiting by Auth Tier
**Generated:** 2026-06-03

---

# Decision Inventory

* Tier detection layer (middleware vs controller)
* Identifier strategy per tier (IP vs user ID)
* Single dynamic limiter vs separate named limiters per tier

---

# Architecture-Level Decision Trees

---

## Tier Detection Layer — Middleware vs Controller

---

## Decision Context

Where should auth tier be detected for rate limiting? Arises when designing the rate limiting architecture with multiple consumer tiers.

---

## Decision Criteria

* performance — rate limiting checked before or after business logic
* separation of concerns — cross-cutting concern vs controller responsibility
* reuse — tier detection shared across all rate-limited endpoints
* fallback behavior — handling auth failure at the correct layer

---

## Decision Tree

Is rate limiting a cross-cutting concern (applies to all endpoints)?
↓
YES → Detect tier in middleware layer (rate limiter definition)
NO → Does only specific endpoints need tiered limits?
    YES → Still prefer middleware — rate limiting should always run before controllers
    NO → Middleware (always the correct layer for rate limiting)

---

## Rationale

Rate limiting must be enforced before business logic runs. Middleware-layer tier detection ensures rejected requests never hit controllers. Controller-based detection means rate limits are checked after resource-intensive operations have already executed.

---

## Recommended Default

**Default:** Detect tier in the rate limiter definition (middleware layer)
**Reason:** Rate limiting is a cross-cutting concern that must gate access before business logic. Middleware is the correct architectural layer.

---

## Risks Of Wrong Choice

Controller-based detection: rate limits checked after expensive operations, duplicated logic across controllers, inconsistent application.

---

## Related Rules

- Detect Tier in Middleware, Not Controllers (from 05-rules.md)

---

## Related Skills

- Implement Rate Limiting by Authentication Tier (from 06-skills.md)

---

## Identifier Strategy per Tier — IP vs User ID

---

## Decision Context

What identifier should be used for each auth tier's rate limit key? Arises when defining per-tier rate limiter identifiers.

---

## Decision Criteria

* fairness — per-user limits vs per-IP limits
* availability — identifier present for all requests in the tier
* security — preventing identifier spoofing or manipulation
* consistency — same tier always uses the same identifier type

---

## Decision Tree

What is the consumer's auth tier?
↓
Guest (unauthenticated)?
YES → Use IP address as identifier (`ip:{address}`)
NO → Authenticated user?
    YES → Use user ID as identifier (`user:{id}`)
    NO → Premium/subscriber?
        YES → Use user ID as identifier (`premium:{id}`)
        NO → Internal service?
            YES → Use API key ID as identifier (`service:{key_id}`)

---

## Rationale

Guest requests have no user context, so IP is the only available identifier. Authenticated and premium users have stable user IDs, providing per-user fairness. Services have API key identifiers for service-level tracking. Each tier uses the most appropriate identifier.

---

## Recommended Default

**Default:** IP for guests, user ID for authenticated/premium, API key ID for services
**Reason:** Each tier has a natural, available identifier that provides fair rate limit scoping.

---

## Risks Of Wrong Choice

User ID for guests: all guest requests collapse to the same counter (null user ID). IP for authenticated users: NAT users unfairly penalized.

---

## Related Rules

- Use IP for Guests, User ID for Authenticated (from 05-rules.md)

---

## Related Skills

- Implement Rate Limiting by Authentication Tier (from 06-skills.md)
- Rate Limiter Definitions (from 06-skills.md)

---

## Single Dynamic Limiter vs Separate Named Limiters per Tier

---

## Decision Context

Should tiered rate limits be implemented as a single dynamic limiter or separate named limiters per tier? Arises when designing the rate limiter configuration structure.

---

## Decision Criteria

* maintainability — single source of truth vs separate configurations
* flexibility — different limits per tier vs unified structure
* testability — testing each tier's limit independently
* routing — different route groups may need different limiters

---

## Decision Tree

Are tier limits applied to the same route group (e.g., all `/api` routes)?
↓
YES → Single dynamic limiter with tier-based limit values (simpler)
NO → Do different route groups need different per-tier limits?
    YES → Separate named limiters per tier (more flexible)
    NO → Single dynamic limiter (simpler)

---

## Rationale

A single dynamic limiter with tier-based limit lookup is simpler and maintainable when all routes share the same tier structure. Separate named limiters are needed when different route groups have different limit configurations (e.g., `/api/v1/public` vs `/api/v1/admin`).

---

## Recommended Default

**Default:** Single dynamic limiter with tier-based limit resolution
**Reason:** Simpler configuration, single source of truth, easier to test, and sufficient for most APIs.

---

## Risks Of Wrong Choice

Separate limiters for same-tier routes: duplicated configuration, harder to maintain. Single limiter for different route groups: cannot apply different limits to different endpoint categories.

---

## Related Rules

- Detect Tier in Middleware, Not Controllers (from 05-rules.md)
- Always Include X-RateLimit-Tier in Response Headers (from 05-rules.md)

---

## Related Skills

- Implement Rate Limiting by Authentication Tier (from 06-skills.md)
- Rate Limiter Definitions (from 06-skills.md)
