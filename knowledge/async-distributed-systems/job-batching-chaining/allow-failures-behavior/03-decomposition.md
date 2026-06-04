# Decomposition: `allowFailures()` Behavior and `then` vs `catch` Semantics

## Topic Overview

`allowFailures()` is the opt-in mechanism that tells a batch to continue processing remaining jobs even after individual jobs fail. Without it, the first job failure marks the batch as cancelled, and subsequent jobs that check `cancelled()` will abort.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k012-allow-failures-behavior/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `allowFailures()` Behavior and `then` vs `catch` Semantics
- **Purpose:** `allowFailures()` is the opt-in mechanism that tells a batch to continue processing remaining jobs even after individual jobs fail. Without it, the first job failure marks the batch as cancelled, and subsequent jobs that check `cancelled()` will abort.
- **Difficulty:** Advanced
- **Dependencies:** - K008 Bus::batch Architecture (batch lifecycle)

## Dependency Graph

This KU depends on: - K008 Bus::batch Architecture (batch lifecycle)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **without `allowFailures()`**: First job failure calls `$batch->cancel()`. Jobs already dispatched run to completion but new jobs check `cancelled()`. - **with `allowFailures()`**: Job failures incr...
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