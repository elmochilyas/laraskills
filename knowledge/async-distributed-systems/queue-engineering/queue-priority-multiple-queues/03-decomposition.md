# Decomposition: Queue Priority via Multiple Queues

## Topic Overview

Laravel implements queue priority through worker queue subscriptions, not through backend priority features. Workers specify `--queue=high,default,low` and process jobs from `high` first, then `default` when `high` is empty, then `low` when both are empty.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k077-queue-priority-multiple-queues/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Queue Priority via Multiple Queues
- **Purpose:** Laravel implements queue priority through worker queue subscriptions, not through backend priority features. Workers specify `--queue=high,default,low` and process jobs from `high` first, then `default` when `high` is empty, then `low` when both are empty.
- **Difficulty:** Intermediate
- **Dependencies:** - K001 Queue Connections vs. Queues (foundational topology)

## Dependency Graph

This KU depends on: - K001 Queue Connections vs. Queues (foundational topology)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Worker priority ordering**: `--queue=critical,default,reports` configures the worker to empty `critical` before looking at `default`, and `default` before `reports`. - **Not real-time priority**: ...
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