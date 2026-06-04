# Decomposition: Component System

## Topic Overview
Class-based and anonymous Blade components — self-contained, reusable view units that combine a PHP class (for logic) with a Blade template (for rendering), accepting typed data via constructor parameters and rendering templates with the $attributes bag.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
component-system/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Component System
- **Purpose:** Class-based and anonymous Blade components
- **Difficulty:** Foundation
- **Dependencies:** Template Inheritance

## Dependency Graph
This KU depends on: Template Inheritance. It serves as prerequisite for Slots and Stacks, View Models/Presenters, Blade Fragments, and Blade Testing.

## Boundary Analysis
**In scope:** Class-based components, anonymous components, component resolution, $attributes bag, component namespacing, inline components, attribute handling, $slot variable.
**Out of scope:** Named slots and default slot patterns (covered in Slots and Stacks), view data preparation (covered in View Models/Presenters), component testing specifics (covered in Blade Testing).

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