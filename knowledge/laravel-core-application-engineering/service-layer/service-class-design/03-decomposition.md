# Decomposition: Service Class Design

## Topic Overview
Designing multi-method service classes — entity-oriented and capability-oriented approaches, constructor injection strategy, statelessness requirements, and evolution from thin CRUD aggregator to multi-service orchestrator.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
service-class-design/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Service Class Design
- **Purpose:** Designing multi-method service classes
- **Difficulty:** Intermediate
- **Dependencies:** Controllers, Service Container

## Dependency Graph
This KU depends on: Controllers, Service Container. It serves as prerequisite for all other Service Layer Pattern KUs.

## Boundary Analysis
**In scope:** Entity-oriented vs capability-oriented design, constructor injection strategy, statelessness requirement, service evolution stages (CRUD → business logic → orchestrator → event-driven), container resolution, bind lifetime decisions, repository injection vs direct Eloquent, fat service signals.
**Out of scope:** Action class design (covered in Action Pattern), service naming conventions (covered in Naming Conventions), transaction management specifics (covered in Transaction Management), service vs action decision (covered in Service vs Action Decision).

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