# Decomposition: `failed()` Method on Jobs and Cleanup

## Topic Overview

The `failed()` method is called on a job class when the job permanently fails (exhausts all retries). It receives the original exception as a parameter and is the designated location for cleanup, compensation, and notification logic.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k021-failed-method-cleanup/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `failed()` Method on Jobs and Cleanup
- **Purpose:** The `failed()` method is called on a job class when the job permanently fails (exhausts all retries). It receives the original exception as a parameter and is the designated location for cleanup, compensation, and notification logic.
- **Difficulty:** Foundation
- **Dependencies:** - K016 Failure Taxonomy (where `failed()` fits)

## Dependency Graph

This KU depends on: - K016 Failure Taxonomy (where `failed()` fits)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Trigger**: `failed(Throwable $e)` is called when `$tries` is exhausted, `retryUntil()` has passed, or `$this->fail()` was called. - **Idempotency requirement**: `failed()` may be called multiple t...
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