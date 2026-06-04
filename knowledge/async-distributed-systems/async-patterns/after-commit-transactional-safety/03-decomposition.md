# Decomposition: afterCommit Transactional Safety

## Topic Overview

The `afterCommit` dispatch option prevents a class of race conditions where a queued job executes before the database transaction that created its data has committed. When a job is dispatched inside a database transaction, the worker may read stale or missing data.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k064-after-commit-transactional-safety/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### afterCommit Transactional Safety
- **Purpose:** The `afterCommit` dispatch option prevents a class of race conditions where a queued job executes before the database transaction that created its data has committed. When a job is dispatched inside a database transaction, the worker may read stale or missing data.
- **Difficulty:** Intermediate
- **Dependencies:** - K062 dispatchAfterResponse (HTTP-response timing)

## Dependency Graph

This KU depends on: - K062 dispatchAfterResponse (HTTP-response timing)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Transaction-visibility race**: A job dispatched inside a `DB::transaction()` is pushed to the queue immediately. The worker can pick it up before the transaction commits, querying data not yet vis...
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