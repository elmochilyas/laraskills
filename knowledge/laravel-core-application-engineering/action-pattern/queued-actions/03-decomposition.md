# Decomposition: Queued Actions

## Topic Overview
Dispatching actions to the queue for async execution — the serialization boundary inversion, Spatie QueueableAction mechanics, sync-or-async transparency, and the ActionJob wrapper.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
queued-actions/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Queued Actions
- **Purpose:** Dispatching actions to the queue for async execution — preserving constructor DI while becoming dispatchable to any queue.
- **Difficulty:** Expert
- **Dependencies:** Action Class Design, Queue System

## Dependency Graph
This KU depends on: Action Class Design, Queue System. It serves as prerequisite for action-testing (queued action fakes), action-vs-service-vs-usecase.

## Boundary Analysis
**In scope:** Action vs job constructor divide, serialization boundary (method params serialized, not constructor), Spatie QueueableAction trait, ActionJob mechanics, queueMethod auto-detection, fluent onQueue API, batchable actions, Lorisleiva dispatch, conditional dispatch, worker rehydration, retry and failure semantics.

**Out of scope:** General queue system architecture (Queue System KU), action composition sync/async patterns (action-composition KU), testing queued actions with fakes (action-testing KU), service orchestration of queued workflows.

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