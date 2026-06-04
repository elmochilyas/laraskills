# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Rate Limiting
**Generated:** 2026-06-03

---

# Decision Inventory

* Named Limiters vs Inline Limits
* Cache Store Choice for Rate Limiting (File vs Redis vs Database)
* Segmented Rate Limit Keys vs Single Key
* Rate Limiting at Route Level vs Application Level

---

# Architecture-Level Decision Trees

---

## Decision 1: Named Limiters vs Inline Limits

---

## Decision Context

Whether to define reusable named limiters via `RateLimiter::for()` or apply inline limits via `throttle:60,1` middleware.

---

## Decision Criteria

* Whether the limit applies to multiple routes
* Whether the limit needs custom key segmentation
* Whether the limit configuration may change centrally

---

## Decision Tree

Is the limit shared across multiple routes?
↓
YES → Named limiter — define once, reuse everywhere; central configuration
NO → Is the limit applied to a single route only?
    ↓
    YES → Is custom key segmentation needed?
        ↓
        YES → Named limiter — inline limits cannot customize `by()` behavior
        NO → Inline limit — `throttle:60,1` is simple and sufficient for single-route fixed limits
    NO → Named limiter — any complexity beyond basic attempts+minutes needs named limiter
NO → Does the limit need to change without modifying route definitions?
    ↓
    YES → Named limiter — change the limiter definition; all routes automatically use the new config
    NO → Inline limit — fixed config is fine if it never changes

---

## Rationale

Named limiters support `by()` for key segmentation and are centrally defined in `AppServiceProvider`. Inline limits (`throttle:60,1`) only support basic attempt/decay configuration with no customization. Named limiters also provide testability — you can inspect the limiter definition in tests.

---

## Recommended Default

**Default:** Named limiters for ALL rate limits, even single-route limits.
**Reason:** Named limiters support segmentation, are centrally configurable, and provide consistency. The cost is one extra service provider registration per limiter.

---

## Risks Of Wrong Choice

* Inline limit everywhere: No segmentation; authenticated and guest users share the same limit
* Named limiter not registered: `RuntimeException` at route dispatch — unregistered limiter name
* Inline limit on auth routes: Brute force protection is too restrictive or permissive
* Named limiter too generic: Single limiter name reused across endpoints with different traffic profiles

---

## Related Rules

* Enforce Named Limiters Over Inline Limits for All Production Routes
* Enforce Segmentation by Authentication Status in Limiter Keys

---

## Related Skills

* Define Named Limiters via RateLimiter::for() in AppServiceProvider
* Apply Named Limiters to Route Groups via throttle Middleware

---

---

## Decision 2: Cache Store Choice for Rate Limiting

---

## Decision Context

Which cache driver to use for rate limiting state storage.

---

## Decision Criteria

* Whether the application runs on a single server or multiple servers
* Whether atomic operations are required for accurate counting
* Whether rate limiting state must survive cache clears

---

## Decision Tree

Is the application deployed on multiple servers?
↓
YES → Network-based cache required — file cache is per-server; limits are not shared
    ↓
    YES → Use Redis — atomic operations, TTL support, distributed atomic increment
    NO → Use database cache — atomic but slower; acceptable for low-traffic APIs
NO → Is the application on a single server?
    ↓
    YES → Is atomicity critical for accurate counting?
        ↓
        YES → Redis — file cache is not atomic under concurrent PHP-FPM requests
        NO → File cache — acceptable for very low traffic with minimal concurrency
    NO → Redis — recommended for production regardless of server count
NO → Does the rate limit need to survive cache clears (`php artisan cache:clear`)?
    ↓
    YES → Separate cache store — use `database` or dedicated Redis database to isolate rate limit state
    NO → Default cache store is fine

---

## Rationale

Rate limiting accuracy depends on atomic increment operations. File cache (`file` driver) is not atomic under concurrent PHP-FPM processes — two simultaneous requests may both read the same count and both pass. Redis provides atomic `INCR` and `EXPIRE` operations. Database cache uses row-level locks for atomicity but is slower.

---

## Recommended Default

**Default:** Redis cache store for rate limiting in production.
**Reason:** Atomic operations, distributed support, and sub-millisecond performance. File cache is not suitable for concurrent rate limiting.

---

## Risks Of Wrong Choice

* File cache for rate limiting: Counter reads and writes race; limits may be exceeded by 2-5x under concurrent load
* Default cache shared with rate limiting: `cache:clear` resets all rate limit counters; attackers can re-attempt after cache clear
* Database cache with high traffic: Table row locks cause contention; rate limiting becomes a bottleneck
* Redis without persistence: Rate limit counters lost on Redis restart; all limits reset

---

## Related Rules

* Enforce Named Limiters Over Inline Limits for All Production Routes
* Enforce Segmentation by Authentication Status in Limiter Keys

---

## Related Skills

* Define Named Limiters via RateLimiter::for() in AppServiceProvider
* Apply Named Limiters to Route Groups via throttle Middleware

---

---

## Decision 3: Segmented Rate Limit Keys vs Single Key

---

## Decision Context

Whether to segment rate limit keys by user/IP or use a single global limit.

---

## Decision Criteria

* Whether the application has both authenticated and guest users
* Whether authenticated users should have higher limits
* Whether users share an IP (NAT, office networks)

---

## Decision Tree

Does the application serve both authenticated and guest users?
↓
YES → Segment by authentication status
    ↓
    YES → Authenticated: `$job->user?->id ?: $job->ip` — user ID for auth, IP for guest
    NO → Segment by role tier — admin vs regular user; different limits per role
NO → Are all requests from authenticated users?
    ↓
    YES → Use user ID as key — consistent limit per user across IPs
    NO → Are all requests from guest users?
        ↓
        YES → Use IP as key — all requests share IP-based limits
        NO → Segment by both
NO → Do users share a public IP (office VPN, school NAT)?
    ↓
    YES → ALWAYS segment by user ID for authenticated; IP-only for guests will block entire office
    NO → IP-based keys are viable but user-based is still preferred

---

## Rationale

A single global limit cannot distinguish between a single aggressive user and legitimate traffic from many users. Segmentation by authentication status ensures authenticated users (who have a session) get higher limits than anonymous visitors. User ID-based keys prevent one user's traffic from affecting another user behind the same IP.

---

## Recommended Default

**Default:** `$job->user?->id ?: $job->ip` — user ID for authenticated, IP for guest.
**Reason:** Authenticated users are identified and accountable; guests are only identifiable by IP. This pattern handles both cases.

---

## Risks Of Wrong Choice

* IP-only key with authenticated users: Office network blocks all users if one user hits the limit
* User-only key without guest fallback: `$job->user->id` throws error on unauthenticated requests
* No segmentation: Authenticated users get same low limit as guests; guests get same high limit as authenticated
* Per-endpoint segmentation without global limit: Aggressive user can exhaust limits per endpoint without total cap

---

## Related Rules

* Enforce Named Limiters Over Inline Limits for All Production Routes
* Enforce Segmentation by Authentication Status in Limiter Keys

---

## Related Skills

* Define Named Limiters via RateLimiter::for() in AppServiceProvider
* Apply Named Limiters to Route Groups via throttle Middleware

---

---

## Decision 4: Rate Limiting at Route Level vs Application Level

---

## Decision Context

Whether to implement rate limiting via the throttle middleware (route level) or inside controllers/services (application level).

---

## Decision Criteria

* Whether rate limiting should apply before any business logic executes
* Whether rate limiting rules differ by route context
* Whether the application already has middleware-based rate limiting

---

## Decision Tree

Should rate-limited requests be rejected before reaching any business logic?
↓
YES → Route level (throttle middleware) — 429 response before controller is invoked
NO → Application level — business logic determines whether to reject
    ↓
    NO → Route level — always prefer route level for defense in depth
YES → Are rate limiting rules complex and context-dependent?
    ↓
    YES → Can the throttle middleware handle the complexity?
        ↓
        YES → Route level with named limiters — middleware handles complex segmentation
        NO → Hybrid — route level for basic limits + controller level for fine-grained checks
    NO → Route level — throttle middleware is sufficient
NO → Is there existing middleware-based rate limiting?
    ↓
    YES → Route level — add new limiters to the existing middleware chain
    NO → Route level — add throttle middleware to the route group

---

## Rationale

Rate limiting at the application level (controllers/services) means the request is already processed by middleware, validated, and enters business logic before being rejected. This wastes resources and opens attack surface. Route-level rate limiting via throttle middleware rejects requests at the HTTP boundary before any application code runs.

---

## Recommended Default

**Default:** Route-level rate limiting via throttle middleware for ALL external-facing routes.
**Reason:** Rate limiting is a cross-cutting concern that belongs at the HTTP boundary. Application-level limiting wastes resources and must be duplicated across every controller.

---

## Risks Of Wrong Choice

* Application-level rate limiting: Business logic executes before rejection; wasted CPU, DB queries, external API calls
* Route-level rate limiting with missing limiter: RuntimeException at dispatch; entire route group fails
* Application-level without route-level: No defense in depth; a code error in the limiter bypasses all protection
* Route-level only without application-level fallback: Fine for most cases; very complex limits may need controller context

---

## Related Rules

* Enforce Named Limiters Over Inline Limits for All Production Routes
* Enforce Segmentation by Authentication Status in Limiter Keys

---

## Related Skills

* Define Named Limiters via RateLimiter::for() in AppServiceProvider
* Apply Named Limiters to Route Groups via throttle Middleware
