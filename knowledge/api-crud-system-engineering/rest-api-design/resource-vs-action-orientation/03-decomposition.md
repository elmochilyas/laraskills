# Decomposition: Resource vs Action Orientation

## Topic Overview
The fundamental API design paradigm choice between resource-oriented (noun-based, CRUD, RESTful) and action-oriented (verb-based, RPC, procedural) endpoint design, including hybrid approaches.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a well-bounded design tension with clear decision criteria and practical guidance for each paradigm. No further decomposition is needed.

## Proposed Folder Structure
```
resource-vs-action-orientation/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Resource vs Action Orientation
- **Purpose:** Guide the paradigm choice for defining API endpoints
- **Difficulty:** Foundation
- **Dependencies:** REST Architectural Constraints, URL Structure Design

## Dependency Graph
This KU depends on: REST Architectural Constraints, URL Structure Design. It serves as prerequisite for Resource Naming Conventions, REST Purity vs Pragmatic.

## Boundary Analysis
**In scope:** Resource orientation principles, action orientation principles, hybrid approaches, decision framework, Laravel controller patterns for each paradigm, batch operations.
**Out of scope:** Detailed HTTP method selection (http-method-semantics KU), URL hierarchy design (url-structure-design KU), resource naming rules (resource-naming-conventions KU).

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