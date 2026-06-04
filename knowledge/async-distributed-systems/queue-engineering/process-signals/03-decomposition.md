# Decomposition: Process Signals (SIGTERM, SIGQUIT, SIGUSR2, SIGCONT)

## Topic Overview

The queue worker responds to POSIX process signals for lifecycle management. **SIGTERM**: graceful shutdown — finish current job, then exit.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k057-process-signals/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Process Signals (SIGTERM, SIGQUIT, SIGUSR2, SIGCONT)
- **Purpose:** The queue worker responds to POSIX process signals for lifecycle management. **SIGTERM**: graceful shutdown — finish current job, then exit.
- **Difficulty:** Expert
- **Dependencies:** - K056 Worker Daemon Architecture (daemon loop context)

## Dependency Graph

This KU depends on: - K056 Worker Daemon Architecture (daemon loop context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **SIGTERM (15)**: "Please stop." Worker finishes the current job, then exits. No new jobs are popped. - **SIGQUIT (3)**: "Stop now." Worker exits after current job finishes, but may abort if `--time...
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