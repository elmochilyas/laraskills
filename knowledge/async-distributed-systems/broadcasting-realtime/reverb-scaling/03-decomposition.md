# Decomposition: Reverb Scaling via Multiple Processes

## Topic Overview

Reverb scales horizontally by running multiple independent processes, typically one per CPU core, behind a load balancer. Each process handles a subset of WebSocket connections.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k035-reverb-scaling/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Reverb Scaling via Multiple Processes
- **Purpose:** Reverb scales horizontally by running multiple independent processes, typically one per CPU core, behind a load balancer. Each process handles a subset of WebSocket connections.
- **Difficulty:** Advanced
- **Dependencies:** - K031 Laravel Reverb (core architecture)

## Dependency Graph

This KU depends on: - K031 Laravel Reverb (core architecture)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Process-per-core**: Each Reverb process is a single-threaded event loop. Optimal scaling is one process per CPU core. - **Connection affinity**: A WebSocket client connects to one Reverb process a...
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