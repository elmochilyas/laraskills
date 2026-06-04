# Decomposition: `RateLimiter` Facade for Job Rate Limiting

## Topic Overview

The `RateLimiter` facade provides the low-level API for rate limiting in Laravel, used by both the `RateLimited` and `ThrottlesExceptions` middleware internally. It orchestrates atomic cache operations (`hit`, `attempt`, `tooManyAttempts`, `availableIn`, `clear`) to implement sliding window or fixed window rate counters.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k076-rate-limiter-facade-job-rate-limiting/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `RateLimiter` Facade for Job Rate Limiting
- **Purpose:** The `RateLimiter` facade provides the low-level API for rate limiting in Laravel, used by both the `RateLimited` and `ThrottlesExceptions` middleware internally. It orchestrates atomic cache operations (`hit`, `attempt`, `tooManyAttempts`, `availableIn`, `clear`) to implement sliding window or fixed window rate counters.
- **Difficulty:** Intermediate
- **Dependencies:** - K050 `RateLimited` Job Middleware (uses RateLimiter)

## Dependency Graph

This KU depends on: - K050 `RateLimited` Job Middleware (uses RateLimiter)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`RateLimiter::for()`**: Define a named rate limiter with `$name`, `$maxAttempts`, `$decaySeconds`. - **`RateLimiter::attempt()`**: Atomically check and increment. Calls a callback if under limit. ...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization