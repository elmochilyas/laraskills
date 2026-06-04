# Decomposition: Custom Job Middleware Creation

## Topic Overview

Job middleware allows wrapping custom logic around job execution without modifying the job's `handle()` method. Custom middleware is created by implementing the `MiddlewareInterface` contract with a `handle($job, $next)` method.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k054-custom-job-middleware/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Custom Job Middleware Creation
- **Purpose:** Job middleware allows wrapping custom logic around job execution without modifying the job's `handle()` method. Custom middleware is created by implementing the `MiddlewareInterface` contract with a `handle($job, $next)` method.
- **Difficulty:** Advanced
- **Dependencies:** - K050 `RateLimited` (built-in example)

## Dependency Graph

This KU depends on: - K050 `RateLimited` (built-in example)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`MiddlewareInterface`**: Contract with `handle(object $job, callable $next): void`. - **Pipeline execution**: Middleware runs before `$job->handle()` in the order returned by `middleware()`. - **B...
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