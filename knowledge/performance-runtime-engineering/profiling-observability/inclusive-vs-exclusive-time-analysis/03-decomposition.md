# Decomposition: Inclusive Vs Exclusive Time Analysis

## Topic Overview
**Inclusive time** = time a function takes including all functions it calls. **Exclusive time** = time spent only inside the function itself (not in callees). Inclusive identifies bottlenecks; exclusive identifies optimization targets. A function with high inclusive but low exclusive time is a caller that delegates — optimize the callees. A function with high exclusive time is doing the work directly — optimize that function.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
profiling-observability/inclusive-vs-exclusive-time-analysis/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Inclusive Vs Exclusive Time Analysis
- **Purpose:** **Inclusive time** = time a function takes including all functions it calls. **Exclusive time** = time spent only inside the function itself (not in callees). Inclusive identifies bottlenecks; exclusive identifies optimization targets. A function with high inclusive but low exclusive time is a caller that delegates — optimize the callees. A function with high exclusive time is doing the work directly — optimize that function.
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
  - Inclusive time
  - Optimization heuristic
  - Optimizing functions with high inclusive time but low exclusive
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