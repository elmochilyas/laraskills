# Decomposition: Transactional Actions

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Transactional Actions
- **Difficulty Level:** Advanced

## Topic Overview
Wrapping action class logic in database transactions — DB::transaction, savepoints, nested transactions, deadlock handling, and side-effect ordering.

## Decomposition Strategy
This KU is focused on the intersection of action classes and database transactions. General transaction knowledge is assumed.

## Proposed Folder Structure
```
transactional-actions/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Transactional Actions
- **Purpose:** Define patterns for database transactions in action classes
- **Difficulty:** Advanced
- **Dependencies:** Action Class Design, Database Fundamentals

## Atomic Chunks

### Chunk 1: Transaction Boundaries in Actions
- **Topics:** DB::transaction wrapping action logic, what goes inside vs outside
- **Key Content:** Action as the natural transaction boundary
- **Learning Objectives:** Wrap write actions in transactions

### Chunk 2: Side-Effect Ordering
- **Topics:** API calls, email, file I/O outside transaction; after-commit hooks
- **Key Content:** Keeping transactions short
- **Learning Objectives:** Order side effects after transaction commit

### Chunk 3: Nested Transactions and Savepoints
- **Topics:** Inner DB::transaction behavior, savepoints for partial rollback
- **Key Content:** Safe nesting patterns
- **Learning Objectives:** Use savepoints for granular rollback within actions

### Chunk 4: Deadlock Prevention and Retry
- **Topics:** Consistent lock ordering, lockForUpdate, retry attempts
- **Key Content:** Avoiding and recovering from deadlocks
- **Learning Objectives:** Implement deadlock-safe transactional actions

## Dependency Graph
Depends on: Action Class Design. Related to: Action Composition. Prerequisite for: Queued Actions.

## Boundary Analysis
**In scope:** Transaction placement, side-effect ordering, nested transactions, savepoints, deadlock handling.
**Out of scope:** General database transaction theory (covered in Database KUs), saga/compensating transactions (advanced follow-up), queued transaction execution (covered in Queued Actions).

## Future Expansion Opportunities
Saga pattern and distributed transactions could be added if the codebase grows to microservices.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization