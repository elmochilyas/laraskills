# Decomposition: `WithoutOverlapping` Middleware

## Topic Overview

The `WithoutOverlapping` middleware prevents concurrent execution of the same job by using a cache-based lock. When a job acquires the lock, subsequent dispatches of the same job key will release themselves back to the queue (or be deleted) until the lock expires or the current execution finishes.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k052-without-overlapping-middleware/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `WithoutOverlapping` Middleware
- **Purpose:** The `WithoutOverlapping` middleware prevents concurrent execution of the same job by using a cache-based lock. When a job acquires the lock, subsequent dispatches of the same job key will release themselves back to the queue (or be deleted) until the lock expires or the current execution finishes.
- **Difficulty:** Intermediate
- **Dependencies:** - K055 `ShouldBeUnique` and Unique Job Locking (related uniqueness concept)

## Dependency Graph

This KU depends on: - K055 `ShouldBeUnique` and Unique Job Locking (related uniqueness concept)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Lock mechanism**: Atomic cache lock (Redis, Memcached, Database) with a unique key based on the job class and optional identifier. - **Key scoping**: `WithoutOverlapping::byKey('process-orders')` ...
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