# Decomposition: Rate Limiting

## Topic Overview
Defining and applying rate limiters via named limiters (RateLimiter::for) and inline throttle middleware to control request frequency per client.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
rate-limiting/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Rate Limiting
- **Purpose:** Defining and applying rate limiters
- **Difficulty:** Advanced
- **Dependencies:** Route Groups

## Dependency Graph
This KU depends on: Route Groups. It serves as prerequisite for API Versioning (plan-based limits across versions).

## Boundary Analysis
**In scope:** RateLimiter::for() named limiters, Limit objects (perMinute, perSecond, perHour, etc.), stacked limits, Unlimited, inline throttle middleware syntax, per-user vs per-IP keying, ThrottleRequests middleware internals, cache key generation, Redis vs file cache behavior, response headers (X-RateLimit-*), plan-based limiters, per-tenant rate limiting.
**Out of scope:** Cache driver configuration (Cache domain), middleware system basics (Middleware domain), API versioning strategies (api-versioning KU), DDoS protection at infrastructure level (Infrastructure domain).

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization