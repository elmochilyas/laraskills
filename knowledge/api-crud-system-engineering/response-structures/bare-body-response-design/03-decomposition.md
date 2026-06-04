# Topic Overview
Bare-body response design is the alternative to envelope wrapping — returning resource data directly at the top level without wrapper keys. This KU covers when and why to forgo the envelope.

## Decomposition Strategy
This topic is the direct counterpart to envelope-response-design. It is atomic and independently teachable, serving as a contrast point for the response-format-decision-framework.

## Proposed Folder Structure
```
bare-body-response-design/
├── 02-knowledge-unit.md
└── 03-decomposition.md
```

## Knowledge Unit Inventory
**Name:** bare-body-response-design  
**Purpose:** Unwrapped responses, direct resource representation, tradeoffs vs envelope  
**Difficulty:** Intermediate  
**Dependencies:** envelope-response-design (as contrast)

## Dependency Graph
envelope-response-design ↔ bare-body-response-design (comparison)

## Boundary Analysis
**Belongs:** Direct resource representation, no-wrapper pattern, collection-as-array, header-based metadata  
**Does NOT belong:** Wrapping configuration (data-wrapping-configuration), envelope metadata (top-level-meta-and-links)

## Future Expansion Opportunities
None — topic is atomic.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization