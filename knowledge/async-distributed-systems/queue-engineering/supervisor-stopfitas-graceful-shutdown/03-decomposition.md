# Decomposition: Supervisor `stopwaitsecs` and Graceful Shutdown

## Topic Overview

`stopwaitsecs` in Supervisor config determines how long Supervisor waits for a process to stop after sending SIGTERM before sending SIGKILL. If `stopwaitsecs` is shorter than the worker's remaining job execution time, the worker is force-killed mid-job — the job is lost (until `retry_after` expires) and may be double-processed.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k083-supervisor-stopfitas-graceful-shutdown/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Supervisor `stopwaitsecs` and Graceful Shutdown
- **Purpose:** `stopwaitsecs` in Supervisor config determines how long Supervisor waits for a process to stop after sending SIGTERM before sending SIGKILL. If `stopwaitsecs` is shorter than the worker's remaining job execution time, the worker is force-killed mid-job — the job is lost (until `retry_after` expires) and may be double-processed.
- **Difficulty:** Intermediate
- **Dependencies:** - K057 Process Signals (SIGTERM/SIGKILL interaction)

## Dependency Graph

This KU depends on: - K057 Process Signals (SIGTERM/SIGKILL interaction)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`stopwaitsecs`**: Time (seconds) Supervisor waits for SIGTERM to stop the process. Default: 10 seconds. - **SIGTERM → SIGKILL sequence**: Graceful stop → wait `stopwaitsecs` → force kill. - ...
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