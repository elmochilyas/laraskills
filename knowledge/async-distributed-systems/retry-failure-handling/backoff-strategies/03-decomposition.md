# Decomposition: Backoff Strategies: Fixed, Exponential, Exponential+Jitter

## Topic Overview

Backoff strategies determine how long the worker waits before retrying a failed job. Laravel supports three patterns: **fixed** (constant delay), **exponential** (delay doubles each attempt), and **exponential with jitter** (exponential plus random variance).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k018-backoff-strategies/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Backoff Strategies: Fixed, Exponential, Exponential+Jitter
- **Purpose:** Backoff strategies determine how long the worker waits before retrying a failed job. Laravel supports three patterns: **fixed** (constant delay), **exponential** (delay doubles each attempt), and **exponential with jitter** (exponential plus random variance).
- **Difficulty:** Intermediate
- **Dependencies:** - K017 `$tries`, `$maxExceptions`, `retryUntil()` (retry policy)

## Dependency Graph

This KU depends on: - K017 `$tries`, `$maxExceptions`, `retryUntil()` (retry policy)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Fixed backoff**: Single integer `$backoff = 30`. Every retry waits 30 seconds. Predictable but causes thundering herds. - **Exponential backoff**: Array `$backoff = [10, 30, 120]`. Each element co...
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