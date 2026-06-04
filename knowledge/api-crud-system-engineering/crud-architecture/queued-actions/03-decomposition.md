# Decomposition: Queued Actions

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Queued Actions
- **Difficulty Level:** Advanced

## Topic Overview
Dispatching action classes to Laravel queues — ShouldQueue, serialization, sync vs async dispatch, failure handling.

## Decomposition Strategy
This KU covers the intersection of action class patterns and queue dispatch. General queue knowledge is assumed.

## Proposed Folder Structure
```
queued-actions/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Queued Actions
- **Purpose:** Define patterns for async execution of action classes
- **Difficulty:** Advanced
- **Dependencies:** Action Class Design, Laravel Queues Fundamentals

## Atomic Chunks

### Chunk 1: Action as Queue Job
- **Topics:** ShouldQueue interface, Queueable trait, dispatch mechanism
- **Key Content:** Action class doubles as job class
- **Learning Objectives:** Dispatch an action to the queue

### Chunk 2: Serialization Strategy
- **Topics:** What gets serialized (DTOs, IDs), what gets re-resolved (services)
- **Key Content:** Proper serialization for queue workers
- **Learning Objectives:** Design actions that serialize correctly for queue dispatch

### Chunk 3: Sync vs Async Decision
- **Topics:** When to queue, when to execute synchronously, eventual consistency
- **Key Content:** Threshold-based decision framework
- **Learning Objectives:** Decide which actions to queue

### Chunk 4: Failure and Retry
- **Topics:** Retry limits, backoff, failed jobs, failed() method
- **Key Content:** Graceful failure handling for queued actions
- **Learning Objectives:** Implement retry and failure handling for queued actions

## Dependency Graph
Depends on: Action Class Design, Laravel Queues. Related to: Transactional Actions, Action Composition.

## Boundary Analysis
**In scope:** Action-to-job mapping, serialization, dispatch, retry, failure handling.
**Out of scope:** General queue configuration (covered in Queues KUs), Horizon/queue monitoring (separate topic), batch processing (advanced follow-up).

## Future Expansion Opportunities
Job batching and chain patterns could be added if batch operations become a common pattern in the codebase.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization