# Decomposition: Transaction Management

## Topic Overview
Transaction boundaries in service methods — using DB::transaction(), savepoint emulation for nested transactions, afterCommit callbacks, ShouldDispatchAfterCommit events, and deadlock retry logic.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
transaction-management/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Transaction Management
- **Purpose:** Transaction boundaries in service methods
- **Difficulty:** Advanced
- **Dependencies:** Service Class Design

## Dependency Graph
This KU depends on: Service Class Design. It is essential for Service Orchestration.

## Boundary Analysis
**In scope:** Transaction boundary definition, savepoint emulation for nested transactions, ManagesTransactions state machine, deadlock retry logic, afterCommit callbacks, ShouldDispatchAfterCommit, service-level vs action-level transaction ownership, manual transaction control, transaction + cache invalidation patterns, nested transaction gotchas.
**Out of scope:** Orchestration workflow patterns (covered in Service Orchestration), database-level transaction isolation, distributed transactions/sagas.

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