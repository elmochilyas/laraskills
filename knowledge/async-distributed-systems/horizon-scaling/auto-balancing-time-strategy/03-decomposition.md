# Decomposition: Auto Balancing with `time` Strategy

## Topic Overview

Horizon's `auto` balancing strategy with the `time` scaling algorithm dynamically allocates worker processes to queues based on queue wait time (estimated time to clear all current jobs), not queue depth. This prevents starvation of fast queues by ensuring workers are shifted to queues with the highest processing urgency.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k042-auto-balancing-time-strategy/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Auto Balancing with `time` Strategy
- **Purpose:** Horizon's `auto` balancing strategy with the `time` scaling algorithm dynamically allocates worker processes to queues based on queue wait time (estimated time to clear all current jobs), not queue depth. This prevents starvation of fast queues by ensuring workers are shifted to queues with the highest processing urgency.
- **Difficulty:** Expert
- **Dependencies:** - K041 Horizon Supervisor Configuration (context)

## Dependency Graph

This KU depends on: - K041 Horizon Supervisor Configuration (context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`auto` balancing**: Horizon adjusts worker process counts per queue within `minProcesses`/`maxProcesses` bounds. - **`autoScalingStrategy`**: `time` (default) — scales by estimated time to clear...
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