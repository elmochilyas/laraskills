# Decomposition: Service Testing

## Topic Overview
Unit and integration testing for services — verifying business logic, orchestration, transaction behavior, and side effects using mocks, spies, fakes, and real database interactions.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
service-testing/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Service Testing
- **Purpose:** Unit and integration testing for services
- **Difficulty:** Intermediate
- **Dependencies:** Service Class Design

## Dependency Graph
This KU depends on: Service Class Design. It also references Transaction Management and Service Orchestration for testing patterns.

## Boundary Analysis
**In scope:** Unit vs integration test strategies, mock vs spy vs fake, transaction rollback testing, orchestration verification with spies, afterCommit callback testing, DatabaseTransactions vs RefreshDatabase, testing error paths, testing at system boundaries, over-mocking prevention.
**Out of scope:** Controller testing (covered in Controllers), action class testing (covered in Action Pattern), feature/HTTP testing (covered in Feature Testing).

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