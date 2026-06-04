# Decomposition: Resource Naming Conventions

## Topic Overview
Rules and conventions for naming REST API resources in URIs, covering pluralization, casing, nesting depth, singular resources, and parameter naming.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers naming conventions with well-defined rules and consistency guidance. No further decomposition is needed.

## Proposed Folder Structure
```
resource-naming-conventions/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Resource Naming Conventions
- **Purpose:** Define consistent rules for URI resource naming
- **Difficulty:** Foundation
- **Dependencies:** URL Structure Design, Resource vs Action Orientation

## Dependency Graph
This KU depends on: URL Structure Design, Resource vs Action Orientation. It serves as prerequisite for Resourceful Routing, API Documentation Generation.

## Boundary Analysis
**In scope:** Plural vs singular, casing conventions (kebab, snake, camel), nested resource naming, controller/singular resources, naming depth limits, Laravel parameter naming behavior, pluralization edge cases.
**Out of scope:** HTTP method selection (http-method-semantics KU), query parameter conventions (url-structure-design KU), resource vs action decision (resource-vs-action-orientation KU).

## Future Expansion Opportunities
None identified — naming conventions are well-bounded and stable.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization