# Decomposition: Callgraph Analysis Techniques

## Topic Overview
Callgraph analysis visualizes the **tree of function calls** with cost annotations. Primary views: **call tree** (top-down from entry point, showing parent?child relationships with inclusive time), **callee map** (bottom-up, showing which functions call a given function and how much they cost), and **hot path** (the most expensive code path from entry to leaf). Together they answer "what is slow?" and "why is it slow?"

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
profiling-observability/callgraph-analysis-techniques/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Callgraph Analysis Techniques
- **Purpose:** Callgraph analysis visualizes the **tree of function calls** with cost annotations. Primary views: **call tree** (top-down from entry point, showing parent?child relationships with inclusive time), **callee map** (bottom-up, showing which functions call a given function and how much they cost), and **hot path** (the most expensive code path from entry to leaf). Together they answer "what is slow?" and "why is it slow?"
- **Difficulty:** Intermediate
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Callgraph exploration
  - Ignoring call count in callgraph
  - Camera model
  - Tiered profiling workflow

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization