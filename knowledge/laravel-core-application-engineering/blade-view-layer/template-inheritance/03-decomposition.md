# Decomposition: Template Inheritance

## Topic Overview
Blade template inheritance using @extends, @section, @yield, and @parent to establish a view hierarchy where child templates extend a parent layout and override specific sections while inheriting the surrounding structure.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
template-inheritance/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Template Inheritance
- **Purpose:** @extends, @section, @yield layout pattern
- **Difficulty:** Foundation
- **Dependencies:** Controllers

## Dependency Graph
This KU depends on: Controllers. It serves as prerequisite for Component System, Layout Strategies, and all downstream Blade KUs.

## Boundary Analysis
**In scope:** Layout definition, child template inheritance, section overrides, @parent directive, @yield resolution, compilation mechanics, three-level inheritance patterns.
**Out of scope:** Component-based composition (covered in Component System), asset injection via stacks (covered in Slots and Stacks), layout organization strategies (covered in Layout Strategies).

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