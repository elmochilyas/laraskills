# Decomposition: `ThrottlesExceptions` Middleware

## Topic Overview

The `ThrottlesExceptions` middleware releases the job back to the queue when the number of exceptions thrown by a job exceeds a threshold within a time window. Unlike `RateLimited` (which prevents execution based on attempt count), `ThrottlesExceptions` reacts to failures — if the job throws too many exceptions in a short period, it backs off.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k051-throttles-exceptions-middleware/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `ThrottlesExceptions` Middleware
- **Purpose:** The `ThrottlesExceptions` middleware releases the job back to the queue when the number of exceptions thrown by a job exceeds a threshold within a time window. Unlike `RateLimited` (which prevents execution based on attempt count), `ThrottlesExceptions` reacts to failures — if the job throws too many exceptions in a short period, it backs off.
- **Difficulty:** Intermediate
- **Dependencies:** - K050 `RateLimited` Job Middleware (complementary)

## Dependency Graph

This KU depends on: - K050 `RateLimited` Job Middleware (complementary)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Threshold and window**: Configured with `maxExceptions` per `decayMinutes`. - **Exception counting**: Counts all uncaught exceptions from the job's `handle()` within the time window. - **Release b...
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