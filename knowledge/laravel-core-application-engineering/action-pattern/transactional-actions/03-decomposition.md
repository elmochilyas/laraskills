# Decomposition: Transactional Actions

## Topic Overview
Database transactions wrapping action execution — transaction ownership inversion, savepoint semantics, afterCommit side effects, and the rule that actions should not own their transactions.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
transactional-actions/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Transactional Actions
- **Purpose:** Database transactions wrapping action execution — delegating transaction control to orchestrators, afterCommit side effects, and savepoint semantics.
- **Difficulty:** Advanced
- **Dependencies:** Action Class Design, Transaction Management

## Dependency Graph
This KU depends on: Action Class Design, Transaction Management. It serves as prerequisite for queued-actions, service orchestration.

## Boundary Analysis
**In scope:** Transaction ownership inversion (service owns transaction, action does not), savepoint vs nested transaction, afterCommit registration and execution, standalone action transaction exception, SQLite savepoint differences, phantom side effects on rollback, transaction retry caveats.

**Out of scope:** General transaction management internals (Transaction Management KU), action composition mechanics (action-composition KU), queued action dispatch timing (queued-actions KU).

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