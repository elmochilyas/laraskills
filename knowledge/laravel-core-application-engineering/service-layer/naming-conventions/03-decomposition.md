# Decomposition: Service Naming Conventions

## Topic Overview
Service class naming (UserService, OrderService) — conventions for class names, method names, and namespace organization that maximize navigability and minimize ambiguity across the codebase.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
naming-conventions/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Service Naming Conventions
- **Purpose:** Service class naming (UserService, OrderService)
- **Difficulty:** Foundation
- **Dependencies:** Service Class Design

## Dependency Graph
This KU depends on: Service Class Design. It is a companion to all Service Layer Pattern KUs.

## Boundary Analysis
**In scope:** EntityName+Service convention, Capability+Service convention, compound naming ([Domain][Purpose]Service), method naming with business verbs, subdirectory namespace organization, flat vs namespace organization, interface + implementation naming, action-style method naming in services, name collision handling.
**Out of scope:** Service class design internals (covered in Service Class Design), action naming conventions (covered in Action Pattern), controller naming (covered in Controllers).

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