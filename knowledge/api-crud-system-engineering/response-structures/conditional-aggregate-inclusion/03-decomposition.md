# Topic Overview
Conditional aggregate inclusion covers `whenAggregated()` and related methods for conditionally including computed values (counts, sums, averages) based on whether `withCount()`/`withSum()` was called.

## Decomposition Strategy
This KU is a specialized sub-topic of conditional-field-inclusion, focused specifically on Eloquent aggregate methods. It is independently teachable but builds on the conditional field inclusion foundation.

## Proposed Folder Structure
```
conditional-aggregate-inclusion/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** conditional-aggregate-inclusion  
**Purpose:** `whenAggregated()` for computed values, `withCount()`, `withSum()` integration  
**Difficulty:** Intermediate  
**Dependencies:** conditional-field-inclusion

## Dependency Graph
conditional-field-inclusion → conditional-aggregate-inclusion

## Boundary Analysis
**Belongs:** `whenAggregated()`, aggregate attribute naming, `withCount`/`withSum`/`withAvg`/`withMin`/`withMax`, custom aliases  
**Does NOT belong:** Relationship loading (conditional-relationship-inclusion), field-level conditionals (conditional-field-inclusion)

## Future Expansion Opportunities
None — atomic within aggregate scope.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization