# Decomposition: `RateLimited` Job Middleware

## Topic Overview

The `RateLimited` middleware prevents a job from executing more than N times per time window, using Laravel's `RateLimiter` facade backed by the cache (typically Redis). It's applied via the job's `middleware()` method.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k050-rate-limited-job-middleware/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `RateLimited` Job Middleware
- **Purpose:** The `RateLimited` middleware prevents a job from executing more than N times per time window, using Laravel's `RateLimiter` facade backed by the cache (typically Redis). It's applied via the job's `middleware()` method.
- **Difficulty:** Advanced
- **Dependencies:** - K051 `ThrottlesExceptions` Middleware (complementary)

## Dependency Graph

This KU depends on: - K051 `ThrottlesExceptions` Middleware (complementary)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`RateLimiter` facade**: Laravel's rate limiting API. Defines named limiters with `maxAttempts` and `decayMinutes`. Uses cache for counter storage. - **Middleware application**: Return `new RateLim...
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