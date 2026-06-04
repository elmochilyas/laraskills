# Decomposition: Service Orchestration

## Topic Overview
Services coordinating multiple actions/sub-services — managing workflow sequences, transaction boundaries, precondition validation, partial failure handling, and post-completion event dispatch.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
service-orchestration/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Service Orchestration
- **Purpose:** Services coordinating multiple actions/sub-services
- **Difficulty:** Advanced
- **Dependencies:** Service Class Design

## Dependency Graph
This KU depends on: Service Class Design. It also relates to Transaction Management and Action Pattern.

## Boundary Analysis
**In scope:** Orchestration vs execution distinction, action composition within a service, multi-service orchestration, conditional orchestration, event-driven post-completion, Application Coordinator pattern, cache invalidation in orchestration, workflow stage structure, afterCommit registration, orchestration depth levels.
**Out of scope:** Transaction savepoint mechanics (covered in Transaction Management), action class design (covered in Action Pattern), service class fundamentals (covered in Service Class Design).

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