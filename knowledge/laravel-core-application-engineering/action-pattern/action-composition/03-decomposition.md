# Decomposition: Action Composition

## Topic Overview
Composing actions by delegating between them — constructor injection composition, composition vs orchestration threshold, dependency tree resolution, and sync/async dispatch patterns.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
action-composition/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Action Composition
- **Purpose:** Composing actions by delegating between them — constructor injection composition, composition vs orchestration threshold, and nested action chains.
- **Difficulty:** Advanced
- **Dependencies:** Action Class Design, Service Container Basics

## Dependency Graph
This KU depends on: Action Class Design, Service Container Basics. It serves as prerequisite for transactional-actions, queued-actions.

## Boundary Analysis
**In scope:** Constructor injection composition, composition vs orchestration (3-4 action threshold), dependency tree resolution, action-calls-action pattern, service-orchestrates-actions pattern, afterCommit chain, queueable composition, circular composition detection.

**Out of scope:** Transaction boundaries within composed actions (transactional-actions KU), async dispatch mechanics (queued-actions KU), service layer orchestration (service-layer-pattern domain).

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization