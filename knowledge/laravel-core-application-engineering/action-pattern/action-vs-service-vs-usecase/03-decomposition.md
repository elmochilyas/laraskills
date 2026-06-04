# Decomposition: Action vs Service vs Use Case

## Topic Overview
Decision framework for choosing between Action, Service, and Use Case patterns — the three-way spectrum of granularity, coupling, and framework awareness for organizing business logic.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
action-vs-service-vs-usecase/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Action vs Service vs Use Case
- **Purpose:** Decision framework for choosing between Action, Service, and Use Case patterns — the three-way spectrum of granularity, coupling, and framework awareness.
- **Difficulty:** Expert
- **Dependencies:** Action Class Design, Service Class Design, Use Case Variant

## Dependency Graph
This KU depends on: Action Class Design, Service Class Design, Use Case Variant. It is the capstone KU for the action-pattern subdomain.

## Boundary Analysis
**In scope:** Three-way spectrum (coupled to decoupled), distinguishing dimensions (methods per class, DTO boundary, framework imports, reuse), three-tier decision framework (cohesion, granularity, portability), cost curve, service-action complement (dominant production pattern), service-action-usecase hybrid, evolution path, three-way tradeoff matrix, pattern consistency across teams.

**Out of scope:** Detailed mechanics of each pattern (individual KUs cover those), service layer design (service-layer-pattern domain), Hexagonal Architecture (application-architecture domain).

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