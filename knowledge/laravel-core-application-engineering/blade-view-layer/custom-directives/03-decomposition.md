# Decomposition: Custom Directives

## Topic Overview
Custom @directive syntax for extending Blade's compiler with application-specific functionality — compile-time PHP code generation via Blade::directive() and Blade::if().

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
custom-directives/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Custom Directives
- **Purpose:** @directive syntax for custom Blade logic
- **Difficulty:** Intermediate
- **Dependencies:** Template Inheritance

## Dependency Graph
This KU depends on: Template Inheritance. It serves as prerequisite for Rendering Performance (compilation understanding).

## Boundary Analysis
**In scope:** Blade::directive() registration, expression handling, Blade::if() for conditional directives, directive vs helper function comparison, directive vs component comparison, compilation process, if/else directive pairs.
**Out of scope:** Service injection via @inject (covered in Service Injection), component-based approaches (covered in Component System), view data sharing (covered in View Composers/Creators).

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