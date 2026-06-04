# Decomposition: Flame Graph Generation Interpretation

## Topic Overview
**Flame graphs** visualize stack traces as a flame-like SVG: the X-axis spans stack frequency (width = time proportion), Y-axis spans stack depth (height = call chain depth). **Wide frames** at the top indicate time sinks (functions consuming CPU). **Tall stacks** indicate deep call chains (potential indirection overhead). Compare p50 vs p95 flame graphs to identify what changes under load.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
profiling-observability/flame-graph-generation-interpretation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Flame Graph Generation Interpretation
- **Purpose:** **Flame graphs** visualize stack traces as a flame-like SVG: the X-axis spans stack frequency (width = time proportion), Y-axis spans stack depth (height = call chain depth). **Wide frames** at the top indicate time sinks (functions consuming CPU). **Tall stacks** indicate deep call chains (potential indirection overhead). Compare p50 vs p95 flame graphs to identify what changes under load.
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
  - Flame graphs
  - Flame graph triage
  - Focusing only on wide frames at the top
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