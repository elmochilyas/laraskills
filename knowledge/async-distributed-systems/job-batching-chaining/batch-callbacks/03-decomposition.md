# Decomposition: Batch Callbacks (before/progress/then/catch/finally)

## Topic Overview

Laravel batches expose five lifecycle callbacks: `before()` (runs after batch creation but before job dispatch), `progress()` (runs after each successful job), `then()` (all jobs succeeded), `catch()` (any job failed after exhausting retries), and `finally()` (batch finished regardless of outcome). Callbacks are serialized closures stored in the `options` column of `job_batches`, executed by a worker when the triggering condition is met.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k011-batch-callbacks/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Batch Callbacks (before/progress/then/catch/finally)
- **Purpose:** Laravel batches expose five lifecycle callbacks: `before()` (runs after batch creation but before job dispatch), `progress()` (runs after each successful job), `then()` (all jobs succeeded), `catch()` (any job failed after exhausting retries), and `finally()` (batch finished regardless of outcome). Callbacks are serialized closures stored in the `options` column of `job_batches`, executed by a worker when the triggering condition is met.
- **Difficulty:** Advanced
- **Dependencies:** - K008 Bus::batch Architecture (lifecycle context)

## Dependency Graph

This KU depends on: - K008 Bus::batch Architecture (lifecycle context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`before()`**: Runs after batch DB row is created but before any job dispatches. Useful for pre-flight checks, resource allocation. - **`progress()`**: Runs after each successful individual job. Re...
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