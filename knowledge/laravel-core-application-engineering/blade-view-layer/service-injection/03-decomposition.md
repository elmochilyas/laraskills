# Decomposition: Service Injection

## Topic Overview
@inject directive for resolving services from the service container directly in Blade views — a pragmatic shortcut for accessing non-entity services without controller data passing.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
service-injection/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Service Injection
- **Purpose:** @inject directive for service access in views
- **Difficulty:** Intermediate
- **Dependencies:** Template Inheritance, Service Container

## Dependency Graph
This KU depends on: Template Inheritance, Service Container. It serves as prerequisite for View Composers/Creators (as an alternative pattern).

## Boundary Analysis
**In scope:** @inject syntax and compilation, singleton registration for injected services, use cases (settings, navigation, analytics), @inject vs view composer comparison, @inject vs controller data comparison, hidden dependency documentation.
**Out of scope:** Service container resolution mechanics (covered in Service Container), view composers for shared data (covered in View Composers/Creators), constructor injection in components (covered in Component System).

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