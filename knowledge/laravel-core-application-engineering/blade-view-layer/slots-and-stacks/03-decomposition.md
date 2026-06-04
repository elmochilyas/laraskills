# Decomposition: Slots and Stacks

## Topic Overview
Named slots, default slots, and push stacks — Blade's content injection mechanisms for component composition and asset injection from any depth of the template hierarchy.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
slots-and-stacks/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Slots and Stacks
- **Purpose:** Named slots, default slots, push stacks
- **Difficulty:** Intermediate
- **Dependencies:** Component System

## Dependency Graph
This KU depends on: Component System. It serves as prerequisite for Layout Strategies and Blade with Alpine.js.

## Boundary Analysis
**In scope:** Default $slot, named slots, slot attributes, @push/@prepend/@stack directives, @once directive, slot defaults, stack naming conventions, slot vs @yield comparison.
**Out of scope:** Component class design (covered in Component System), layout inheritance (covered in Template Inheritance), custom stack directives (covered in Custom Directives).

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