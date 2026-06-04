# Decomposition: View Models and Presenters

## Topic Overview
Dedicated classes for view data preparation — encapsulating formatting, computed properties, permission checks, and null handling that would otherwise clutter templates or controllers.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
view-models-presenters/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### View Models and Presenters
- **Purpose:** Dedicated classes for view data preparation
- **Difficulty:** Advanced
- **Dependencies:** View Composers

## Dependency Graph
This KU depends on: View Composers. It serves as prerequisite for advanced view architecture patterns.

## Boundary Analysis
**In scope:** View model definition and usage, method vs property access, collection view models, lazy properties, view model vs view composer comparison, view model vs presenter pattern, testing view models, domain-based view model organization.
**Out of scope:** View composers for shared data (covered in View Composers/Creators), DTOs for API output (covered in DTOs subdomain), inline template logic alternatives.

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