# Decomposition: `retry_after` vs `--timeout` Semantics

## Topic Overview

`retry_after` and `--timeout` serve different purposes but their interaction is commonly misunderstood, leading to double-processing or job loss. **`retry_after`** (queue connection config) is the backend's reservation timeout — how long the queue backend waits before making a reserved job available to another worker.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k079-retry-after-vs-timeout/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `retry_after` vs `--timeout` Semantics
- **Purpose:** `retry_after` and `--timeout` serve different purposes but their interaction is commonly misunderstood, leading to double-processing or job loss. **`retry_after`** (queue connection config) is the backend's reservation timeout — how long the queue backend waits before making a reserved job available to another worker.
- **Difficulty:** Expert
- **Dependencies:** - K056 Worker Daemon Architecture (timeout in daemon loop)

## Dependency Graph

This KU depends on: - K056 Worker Daemon Architecture (timeout in daemon loop)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`retry_after`**: Config option per queue connection. Defines how long the job is reserved for a single worker. Default: 90 seconds. Set in `config/queue.php`. - **`--timeout`**: Worker CLI flag. M...
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