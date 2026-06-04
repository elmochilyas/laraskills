# Topic Overview
Conditional relationship inclusion covers `whenLoaded()`, `whenCounted()`, and related methods for conditionally including relationship data only when the controller has eager-loaded it.

## Decomposition Strategy
This KU is a specialized sub-topic of conditional-field-inclusion, focused specifically on Eloquent relationships. It is independently teachable but builds on the conditional field inclusion foundation.

## Proposed Folder Structure
```
conditional-relationship-inclusion/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** conditional-relationship-inclusion  
**Purpose:** `whenLoaded()`, `whenCounted()` for relationship inclusion in resources  
**Difficulty:** Intermediate  
**Dependencies:** conditional-field-inclusion

## Dependency Graph
conditional-field-inclusion → conditional-relationship-inclusion

## Boundary Analysis
**Belongs:** `whenLoaded()`, `whenCounted()`, `whenRelationLoaded()`, nested relationship loading checks, pivot data conditionality  
**Does NOT belong:** Field-level conditionals (conditional-field-inclusion), aggregate conditionals (conditional-aggregate-inclusion)

## Future Expansion Opportunities
None — atomic within the relationship scope.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization