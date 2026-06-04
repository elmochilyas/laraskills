# Decomposition: `ShouldBeUnique` and Unique Job Locking

## Topic Overview

The `ShouldBeUnique` interface prevents duplicate instances of the same job from being dispatched while another instance of that job (with the same unique key) is still in the queue. Unlike `WithoutOverlapping` (which prevents concurrent EXECUTION), `ShouldBeUnique` prevents concurrent DISPATCH — the second dispatch is silently dropped if a job with the same key is already queued or processing.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k055-should-be-unique-jobs/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `ShouldBeUnique` and Unique Job Locking
- **Purpose:** The `ShouldBeUnique` interface prevents duplicate instances of the same job from being dispatched while another instance of that job (with the same unique key) is still in the queue. Unlike `WithoutOverlapping` (which prevents concurrent EXECUTION), `ShouldBeUnique` prevents concurrent DISPATCH — the second dispatch is silently dropped if a job with the same key is already queued or processing.
- **Difficulty:** Advanced
- **Dependencies:** - K052 `WithoutOverlapping` Middleware (contrast)

## Dependency Graph

This KU depends on: - K052 `WithoutOverlapping` Middleware (contrast)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`ShouldBeUnique`**: Marker interface. Implement on the job class. Prevents duplicate queued instances. - **`uniqueId()`**: Returns the unique key for the job. Default is the job class name. Overri...
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