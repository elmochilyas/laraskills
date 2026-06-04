# Decomposition: Service vs Action Decision

## Topic Overview
Framework for choosing between service and action patterns — determining whether business logic belongs in multi-method service classes or single-method action classes based on cohesion, reuse, and team context.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
service-vs-action-decision/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Service vs Action Decision
- **Purpose:** Framework for choosing between service and action patterns
- **Difficulty:** Expert
- **Dependencies:** Service Class Design, Action Class Design

## Dependency Graph
This KU depends on: Service Class Design, Action Class Design. It is a capstone decision framework for the Service Layer Pattern subdomain.

## Boundary Analysis
**In scope:** Service vs action vs use case comparison, three-question decision framework, decision matrix, when to merge actions into a service, when to split a service into actions, Service-Action complement pattern, fat service signals, action explosion signals, team consistency, evolution path from service to actions.
**Out of scope:** Action class implementation (covered in Action Pattern), service class design (covered in Service Class Design), domain vs application services distinction (covered in Domain vs Application Services).

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