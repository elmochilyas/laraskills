# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Authentication & Authorization
**Knowledge Unit:** Rate Limiter Definition
**Generated:** 2026-06-03

---

# Decision Inventory

* Named limiters vs inline throttle configuration
* Cache backend selection (Redis vs file/database)
* Single-bucket vs multi-bucket rate limiting
* Consumer key strategy

---

# Architecture-Level Decision Trees

---

## Named Limiters vs Inline Throttle Configuration

---

## Decision Context

Should rate limits be defined as named limiters via `RateLimiter::for()` or inline via `throttle:60,1` on routes? Arises when setting up API rate limiting.

---

## Decision Criteria

* maintainability — centralizing limit definitions vs scattering across routes
* testability — ability to unit test named limiters independently
* reusability — applying the same limiter to multiple route groups
* clarity — meaningful names vs numeric parameters

---

## Decision Tree

Is the rate limit used on more than one route/group?
↓
YES → Named limiter (`RateLimiter::for()`)
NO → Will the limit value ever need to change?
    YES → Named limiter (single source of truth)
    NO → Inline `throttle:60,1` acceptable but named is still preferred

---

## Rationale

Named limiters centralize configuration, make limits testable, and provide meaningful names. Inline throttle values are scattered, duplicated inconsistently, and untestable. The overhead of defining a named limiter is negligible.

---

## Recommended Default

**Default:** Named limiters via `RateLimiter::for()` in a service provider
**Reason:** Centralized, testable, reusable, and the recommended Laravel pattern.

---

## Risks Of Wrong Choice

Inline throttle: inconsistent limits across routes, impossible to unit test, hard to audit. Named limiter incorrectly defined: confusing names, but still better than scattered inline values.

---

## Related Rules

- Use Named Limiters Instead of Inline throttle:60,1 (from 05-rules.md)
- Define Limiters in Service Provider Boot Method (from 05-rules.md)

---

## Related Skills

- Implement Rate Limiter Definitions (from 06-skills.md)

---

## Cache Backend Selection — Redis vs File/Database

---

## Decision Context

What cache backend should be used for rate limiting? Arises when configuring the caching driver for rate limiter counters.

---

## Decision Criteria

* atomicity — INCR + EXPIRE must be atomic to prevent race conditions
* performance — cache operation overhead per request
* distribution — rate limit state shared across multiple application servers
* reliability — cache failure behavior

---

## Decision Tree

Is the application deployed across multiple servers?
↓
YES → Redis (shared cache, atomic operations)
NO → Single server, low traffic?
    YES → Is atomicity important for rate limit accuracy?
        YES → Redis still recommended
        NO → File cache (not recommended — race conditions)
NO → Always use Redis

---

## Rationale

Redis provides atomic INCR + EXPIRE operations essential for accurate rate limiting. File-based caching has race conditions under concurrent requests (two requests reading the same value simultaneously). Database-based rate limiting adds unacceptable latency. Redis is the default choice regardless of deployment topology.

---

## Recommended Default

**Default:** Redis cache driver
**Reason:** Atomic operations, distributed support, sub-millisecond performance, and automatic key expiration.

---

## Risks Of Wrong Choice

File cache: race conditions under concurrent requests produce inaccurate limit counts. Database cache: high latency per rate check, connection pool exhaustion. No cache: rate limiting impossible.

---

## Related Rules

- Always Include a Consumer Key in Every Limiter (from 05-rules.md)

---

## Related Skills

- Implement Rate Limiter Definitions (from 06-skills.md)

---

## Single-Bucket vs Multi-Bucket Rate Limiting

---

## Decision Context

Should a single rate limit window be used, or multiple windows (e.g., per-minute AND per-hour)? Arises when defining rate limit configurations.

---

## Decision Criteria

* control granularity — preventing burst traffic while also limiting sustained usage
* complexity — implementing and testing multiple buckets
* performance — multiple cache calls per request
* client experience — multiple limits clients must track

---

## Decision Tree

Does the endpoint need protection against both bursts AND sustained abuse?
↓
YES → Multi-bucket: per-minute limit (burst) + per-hour limit (sustained)
NO → Is burst protection enough (e.g., login)?
    YES → Single bucket per-minute
    NO → Is sustained usage the only concern (e.g., exports)?
        YES → Single bucket per-hour or per-day
        NO → Single bucket (default)

---

## Rationale

A single per-minute window prevents immediate bursts but allows sustained high throughput. Adding a per-hour window catches sustained abuse that flies under the per-minute radar (e.g., 59 requests every minute all day). Sensitive endpoints like login only need per-minute burst protection.

---

## Recommended Default

**Default:** Multi-bucket (per-minute + per-hour) for API endpoints
**Reason:** Protects against both burst traffic and sustained abuse without blocking legitimate users.

---

## Risks Of Wrong Choice

Single bucket only: sustained abuse bypasses limits. Too many buckets: confusing for clients, multiple cache calls per request, harder to debug.

---

## Related Rules

- Use Named Limiters Instead of Inline throttle:60,1 (from 05-rules.md)

---

## Related Skills

- Implement Rate Limiter Definitions (from 06-skills.md)
- Rate Limiting by Auth Tier (from 06-skills.md)

---

## Consumer Key Strategy

---

## Decision Context

What identifier should be used as the consumer key for rate limiting? Arises when defining the `by()` parameter in rate limiter definitions.

---

## Decision Criteria

* fairness — each consumer should have their own rate limit counter
* granularity — guest vs authenticated vs service differentiation
* collision — different identifier types must not share the same key space
* availability — identifier must be available on every request

---

## Decision Tree

Is the consumer authenticated?
↓
YES → Use `user:{user_id}` with type prefix
NO → Is the consumer a service (API key)?
    YES → Use `service:{api_key_id}` with type prefix
    NO → Guest/unauthenticated → Use `ip:{client_ip}` with IPv6 normalization

Always prefix with type (`user:`, `ip:`, `service:`) to prevent key collisions.

---

## Rationale

Different consumer types need different identifiers. Authenticated users have stable user IDs. Services have API key IDs. Guests have IP addresses. Prefixing prevents collisions (e.g., user ID 123 vs API key ID 123 would share the same counter without prefixes).

---

## Recommended Default

**Default:** Compound key — user ID for authenticated, IP for guests, service ID for API keys
**Reason:** Each consumer type has an appropriate identifier, and prefixes prevent key collisions.

---

## Risks Of Wrong Choice

No consumer key (defaults to URL): all consumers share one limit. No type prefix: different identifier types collide. IP for authenticated users: NAT users unfairly limited.

---

## Related Rules

- Always Include a Consumer Key in Every Limiter (from 05-rules.md)

---

## Related Skills

- Implement Rate Limiter Definitions (from 06-skills.md)
- IP-based Rate Limiting (from 06-skills.md)
- Rate Limiting by Auth Tier (from 06-skills.md)
