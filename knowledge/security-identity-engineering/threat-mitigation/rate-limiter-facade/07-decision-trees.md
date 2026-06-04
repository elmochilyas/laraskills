# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** Rate Limiter Facade and Throttle Middleware
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Named Limiter vs Inline Throttle | Rate limiter definition pattern | architectural, maintainability |
| 2 | Cache Driver for Rate Limiting | Distributed vs single-server rate limiting | performance, architectural |
| 3 | Rate Limiter Key Strategy | User ID vs IP vs composite keys | security, fairness |

---

# Architecture-Level Decision Trees

---

## Named Limiter vs Inline Throttle

---

## Decision Context

Whether to define rate limiters using `RateLimiter::for()` in a service provider (named) or use inline `throttle:60,1` syntax on route definitions.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the rate limit shared across multiple routes?
↓
YES → Named limiter (define once, apply to group)
NO → Inline throttle acceptable for single-route limit

Do you need dynamic limits (tiered, per-user, conditional)?
↓
YES → Named limiter required (closures support dynamic logic)
NO → Inline `throttle:60,1` works for static limits

Do you need burst control (per-second + per-minute limits)?
↓
YES → Named limiter returns array of `Limit` instances
NO → Inline throttle handles simple per-minute limits

Is centralized rate limit management important?
↓
YES → Named limiter in service provider (single source of truth)
NO → Inline throttle spreads limits across route files

How many distinct limiters does the app need?
↓
Few (2-3) → Named limiters manageable
Many (5+) → Named limiters essential for organization

---

## Rationale

Named limiters defined with `RateLimiter::for()` provide a centralized, auditable source of truth for rate limiting policy. They support dynamic logic, composite keys, per-user limits, and burst control. Inline `throttle:60,1` is simpler but limited to static limits and cannot implement tiered or conditional rate limiting.

---

## Recommended Default

**Default:** Named limiters (`RateLimiter::for()`) for all production applications; inline throttle only for quick prototypes or truly static single-route limits
**Reason:** Named limiters support all advanced features (tiered limits, per-user keys, burst control) and centralize rate limiting policy. Inline throttle is a legacy syntax that should be migrated to named limiters.

---

## Risks Of Wrong Choice

- Inline throttle for dynamic limits: not possible (inline is static only)
- Named limiters not registered in service provider: limits not applied
- No limiters defined: all routes unlimited, vulnerable to abuse
- Inline throttle with no user differentiation: NAT IP issues

---

## Related Rules

- Define All Named Limiters in AppServiceProvider (05-rules.md)
- Use `Limit::perSecond()` With `perMinute()` for Burst Control (05-rules.md)

---

## Related Skills

- Use RateLimiter Facade for Custom Rate Limiting Logic (06-skills.md)

---

## Cache Driver for Rate Limiting

---

## Decision Context

Choosing the cache driver for rate limit state storage — Redis, memcached, file, or database.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Redis or memcached required (shared cache)
NO → Single server: file cache acceptable (no coordination needed)

Is rate limit accuracy important at high concurrency?
↓
YES → Redis (atomic increment operations)
NO → File or database cache (adequate for low traffic)

What is the cache TTL for rate limit keys?
↓
Short (minutes) → Redis is ideal (fast reads/writes)
Long (hours) → Any cache works (file, database, redis)

Is there a Redis instance already provisioned?
↓
YES → Use Redis (best performance, atomic operations)
NO → memcached as alternative (less feature-rich but fast)
    NO → File cache for single-server, database for multi-server

What is the application's traffic volume?
↓
Low (< 100 req/s) → File cache acceptable (single server)
Medium (100-1000 req/s) → Redis recommended
High (> 1000 req/s) → Redis required (atomic, fast, scalable)

---

## Rationale

Rate limiting requires atomic increment operations and shared state across servers. Redis is the gold standard — it provides atomic INCR, EXPIRE, and Lua scripting for advanced rate limiting. File cache works for single-server deployments but is slow under high concurrency. Memcached is a faster alternative to Redis for simple rate limiting but lacks Lua scripting for advanced algorithms.

---

## Recommended Default

**Default:** Redis for multi-server production; file cache for single-server development; never use database for rate limiting (too slow)
**Reason:** Redis provides atomic operations, fast reads/writes, and shared state across servers — all essential for correct rate limiting. File cache is acceptable for development. Database cache is too slow for per-request rate limit checks.

---

## Risks Of Wrong Choice

- File cache on multi-server: inconsistent rate limits (each server has its own counter)
- Database cache: slow queries under load, connection pool exhaustion
- No shared cache: rate limits reset per server (user can exceed limits by hitting different servers)
- In-memory (array) cache in production: resets on each request (no persistence)

---

## Related Rules

- Define All Named Limiters in AppServiceProvider (05-rules.md)
- Test Rate Limiter Behavior in Feature Tests (05-rules.md)

---

## Related Skills

- Use RateLimiter Facade for Custom Rate Limiting Logic (06-skills.md)

---

## Rate Limiter Key Strategy

---

## Decision Context

How to construct the rate limiter key — by user ID, IP address, or a composite key.

---

## Decision Criteria

* security
* fairness

---

## Decision Tree

Is the user authenticated?
↓
YES → Key by user ID (`$job->user?->id`) + optional action prefix
NO → Key by IP address (`$job->ip`)

Is the rate limiter for authentication attempts (login)?
↓
YES → Composite key: `email|ip` (prevents brute force across accounts from same IP)
NO → User ID or IP as appropriate

Are there multiple actions on the same endpoint?
↓
YES → Prefix key with action: `search:userID`, `export:userID`
NO → Simple key is sufficient

Could users share an IP address (NAT, corporate network)?
↓
YES → Use user ID for authenticated users (not IP)
NO → IP is acceptable for guest users

Do you need to differentiate between API consumers?
↓
YES → Composite key: `plan:userID`, `apikey:clientID`
NO → Simple user ID or IP key

---

## Rationale

Keying authenticated users by their ID ensures fair per-account limits regardless of IP (solving the NAT problem). Keying guests by IP is the best available identifier. Authentication endpoints should use email+IP composite keys to prevent cross-account brute force. Action prefixing prevents one action from exhausting another's limit.

---

## Recommended Default

**Default:** Authenticated: `$job->user?->id`; Guests: `$job->ip`; Auth endpoints: `email|ip` composite; Prefix when multiple actions share a limiter
**Reason:** User ID provides fair per-account limiting. IP is the fallback for unauthenticated users. Auth endpoints need composite keys to prevent brute force. Prefixing prevents action interference.

---

## Risks Of Wrong Choice

- Keying authenticated users by IP: NAT users share the same limit
- Keying guests by user ID: impossible (no user ID for guests)
- Single key for all actions: search requests exhaust export limit
- No composite key for login: brute force across accounts from same IP

---

## Related Rules

- Key Limiters by User ID or IP Based on Auth State (05-rules.md)
- Name Limiters by Endpoint Purpose, Not by Route Name (05-rules.md)

---

## Related Skills

- Use RateLimiter Facade for Custom Rate Limiting Logic (06-skills.md)
