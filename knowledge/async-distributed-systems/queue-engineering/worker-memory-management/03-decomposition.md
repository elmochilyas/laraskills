# Decomposition: Queue Worker Memory Management

## Topic Overview

PHP daemon workers accumulate memory over their lifetime due to the persistent container, cached data, and memory fragmentation. Laravel provides `--memory` limit (worker exits if RSS exceeds this threshold) and recycling via `--max-jobs`/`--max-time` as the primary defenses.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k074-worker-memory-management/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Queue Worker Memory Management
- **Purpose:** PHP daemon workers accumulate memory over their lifetime due to the persistent container, cached data, and memory fragmentation. Laravel provides `--memory` limit (worker exits if RSS exceeds this threshold) and recycling via `--max-jobs`/`--max-time` as the primary defenses.
- **Difficulty:** Advanced
- **Dependencies:** - K056 Worker Daemon Architecture (the loop that runs jobs)

## Dependency Graph

This KU depends on: - K056 Worker Daemon Architecture (the loop that runs jobs)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **RSS (Resident Set Size)**: Actual physical memory used by the process. What `--memory` measures via `memory_get_usage(true)`. - **PHP memory allocator (zend_mm)**: PHP manages memory internally, n...
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