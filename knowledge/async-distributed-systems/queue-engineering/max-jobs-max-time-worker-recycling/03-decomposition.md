# Decomposition: `--max-jobs`, `--max-time` for Worker Recycling

## Topic Overview

`--max-jobs` and `--max-time` are critical safety valves for daemon workers. They force the worker to exit after processing N jobs or running for N seconds, preventing unbounded memory growth and stale state accumulation.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k058-max-jobs-max-time-worker-recycling/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `--max-jobs`, `--max-time` for Worker Recycling
- **Purpose:** `--max-jobs` and `--max-time` are critical safety valves for daemon workers. They force the worker to exit after processing N jobs or running for N seconds, preventing unbounded memory growth and stale state accumulation.
- **Difficulty:** Intermediate
- **Dependencies:** - K056 Worker Daemon Architecture (daemon loop context)

## Dependency Graph

This KU depends on: - K056 Worker Daemon Architecture (daemon loop context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`--max-jobs`**: Maximum number of jobs to process before the worker exits. Default: 0 (no limit). - **`--max-time`**: Maximum seconds the worker runs before exiting. Default: 0 (no limit). - **Gra...
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