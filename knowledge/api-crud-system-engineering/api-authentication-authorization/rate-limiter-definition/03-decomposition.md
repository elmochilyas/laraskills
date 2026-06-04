# Decomposition: Rate Limiter Definition

## Topic Overview
Laravel's `RateLimiter` facade provides a fluent API for defining and enforcing rate limits using the cache backend (Redis, Memcached, or database). Rate limiter definitions are registered in `App\Providers\AppServiceProvider::boot()` via `RateLimiter::for()`. Each definition specifies the maximum number of attempts, the time window, and the consumer identifier key. These named limiters are then applied to routes or route groups via the `throttle` middleware. Proper rate limiter definition is the foundation of API protection, ensuring fair usage and preventing abuse.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
rate-limiter-definition/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Rate Limiter Definition
- **Purpose:** Laravel's `RateLimiter` facade provides a fluent API for defining and enforcing rate limits using the cache backend (Redis, Memcached, or database). Rate limiter definitions are registered in `App\Providers\AppServiceProvider::boot()` via `RateLimiter::for()`. Each definition specifies the maximum number of attempts, the time window, and the consumer identifier key. These named limiters are then applied to routes or route groups via the `throttle` middleware. Proper rate limiter definition is the foundation of API protection, ensuring fair usage and preventing abuse.
- **Difficulty:** Intermediate
- **Dependencies:** rate-limiting-by-auth-tier, rate-limit-headers, ip-based-rate-limiting

## Dependency Graph
**Depends on:**
- rate-limiting-by-auth-tier
- rate-limit-headers
- ip-based-rate-limiting

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- Named limiter
- Limit instance
- Consumer key
- Decay window
- Multiple buckets
- Atomic operations

**Out of scope:**
- rate-limiting-by-auth-tier topics covered in their respective KUs
- rate-limit-headers topics covered in their respective KUs
- ip-based-rate-limiting topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization