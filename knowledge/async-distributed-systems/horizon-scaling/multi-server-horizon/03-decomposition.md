# Decomposition: Multi-Server Horizon Deployment

## Topic Overview

Horizon supports deployment across multiple servers without additional configuration — each server runs its own Horizon master process, all sharing the same Redis backend. Horizon uses Redis to coordinate: job locking ensures no job is processed twice, supervisor states are tracked independently per server, and metrics/statistics aggregate across all servers in the shared Redis.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k049-multi-server-horizon/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Multi-Server Horizon Deployment
- **Purpose:** Horizon supports deployment across multiple servers without additional configuration — each server runs its own Horizon master process, all sharing the same Redis backend. Horizon uses Redis to coordinate: job locking ensures no job is processed twice, supervisor states are tracked independently per server, and metrics/statistics aggregate across all servers in the shared Redis.
- **Difficulty:** Expert
- **Dependencies:** - K041 Horizon Supervisor Configuration

## Dependency Graph

This KU depends on: - K041 Horizon Supervisor Configuration
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **No coordination protocol**: Horizon doesn't use a leader-election protocol. Each server is independent. Redis provides the shared state. - **Job locks**: Redis atomic operations (e.g., `SETNX` for...
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