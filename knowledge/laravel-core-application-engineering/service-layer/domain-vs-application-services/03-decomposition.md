# Decomposition: Domain vs Application Services

## Topic Overview
Boundary between domain and application service layers — domain services contain pure business logic (framework-agnostic), application services orchestrate infrastructure (repositories, transactions, events).

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
domain-vs-application-services/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Domain vs Application Services
- **Purpose:** Boundary between domain and application service layers
- **Difficulty:** Expert
- **Dependencies:** Service Class Design

## Dependency Graph
This KU depends on: Service Class Design. It also references Service Orchestration and Service vs Action Decision for advanced architectural context.

## Boundary Analysis
**In scope:** Domain service (DDD) characteristics, application service characteristics, separation litmus test, infrastructure coupling spectrum, import-based layer detection, repository interface placement, pure domain service pattern, application service pattern, pragmatic Laravel approach, interface at external boundaries only, strict separation vs pragmatic approach tradeoffs.
**Out of scope:** DDD fundamentals beyond service distinction (covered in Domain-Driven Design), action class design (covered in Action Pattern), hexagonal architecture full implementation.

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