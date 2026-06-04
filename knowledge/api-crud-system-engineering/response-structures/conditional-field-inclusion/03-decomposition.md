# Topic Overview
Conditional field inclusion covers `when()`, `whenHas()`, `whenNotNull()`, and related methods for conditionally including or omitting resource attributes based on runtime conditions.

## Decomposition Strategy
This KU is the parent for conditional inclusion concepts. It covers field-level conditionals, while conditional-relationship-inclusion covers relationship-level conditionals and conditional-aggregate-inclusion covers computed-value conditionals. All three share the same `ConditionallyLoadsAttributes` trait mechanism.

## Proposed Folder Structure
```
conditional-field-inclusion/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** conditional-field-inclusion  
**Purpose:** `when()`, `whenHas()`, `whenNotNull()`, `mergeWhen()` for response field inclusion  
**Difficulty:** Intermediate  
**Dependencies:** envelope-response-design

## Dependency Graph
envelope-response-design → conditional-field-inclusion  
conditional-field-inclusion → conditional-relationship-inclusion  
conditional-field-inclusion → conditional-aggregate-inclusion

## Boundary Analysis
**Belongs:** `when()`, `whenHas()`, `whenNotNull()`, `mergeWhen()`, `unless()`, `whenExistsInRequest()`, `ConditionallyLoadsAttributes` trait  
**Does NOT belong:** Relationship-specific inclusion (whenLoaded), aggregate-specific inclusion (whenAggregated)

## Future Expansion Opportunities
None — well-bounded with clear sub-topics already decomposed.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization