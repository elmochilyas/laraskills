# Topic Overview
Data wrapping configuration in Laravel covers how the `$wrap` property, `withoutWrapping()`, and `withoutWrappingCollection()` control the resource wrapper key. This KU bridges the envelope/bare-body decision into Laravel-specific implementation.

## Decomposition Strategy
This topic is Laravel-specific and is the implementation counterpart to envelope-response-design and bare-body-response-design. It is atomic but depends on understanding both envelope and bare-body concepts.

## Proposed Folder Structure
```
data-wrapping-configuration/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** data-wrapping-configuration  
**Purpose:** Laravel's `$wrap`, `withoutWrapping()`, resource wrapper key decisions  
**Difficulty:** Intermediate  
**Dependencies:** envelope-response-design, bare-body-response-design

## Dependency Graph
envelope-response-design → data-wrapping-configuration  
bare-body-response-design → data-wrapping-configuration

## Boundary Analysis
**Belongs:** `$wrap` property, `withoutWrapping()`, `withoutWrappingCollection()`, inheritance behavior, global defaults  
**Does NOT belong:** Response format selection (decision-framework), general envelope/body tradeoffs

## Future Expansion Opportunities
None — topic is specific and atomic.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization