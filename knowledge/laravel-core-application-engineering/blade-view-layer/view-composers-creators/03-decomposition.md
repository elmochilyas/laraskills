# Decomposition: View Composers and Creators

## Topic Overview
Attaching data to views via View::composer() and View::creator() — classes or closures that inject shared data into designated views before rendering, eliminating redundant controller data passing.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
view-composers-creators/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### View Composers and Creators
- **Purpose:** Attaching data to views via composers/creators
- **Difficulty:** Intermediate
- **Dependencies:** Blade Basics, Service Container

## Dependency Graph
This KU depends on: Blade Basics, Service Container. It serves as prerequisite for View Models/Presenters.

## Boundary Analysis
**In scope:** View composer registration (class-based and closure), view creator registration, wildcard/namespace-specific composers, composer execution timing, class-based vs closure composers, composer vs @inject comparison, caching in composers, ViewServiceProvider pattern.
**Out of scope:** Service injection with @inject (covered in Service Injection), view models for single-view data preparation (covered in View Models/Presenters), component constructor injection (covered in Component System).

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