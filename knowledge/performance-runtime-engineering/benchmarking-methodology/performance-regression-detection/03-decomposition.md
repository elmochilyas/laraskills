# Decomposition: Performance Regression Detection

## Topic Overview
Performance regression detection requires automated comparison of current metrics against a **statistically significant baseline**. Simple threshold checks (p95 > 500ms = fail) are insufficient — normal variance, environment differences, and gradual degradation require **statistical tests** (Mann-Whitney U test, change point detection) with configurable sensitivity.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
benchmarking-methodology/performance-regression-detection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Performance Regression Detection
- **Purpose:** Performance regression detection requires automated comparison of current metrics against a **statistically significant baseline**. Simple threshold checks (p95 > 500ms = fail) are insufficient — normal variance, environment differences, and gradual degradation require **statistical tests** (Mann-Whitney U test, change point detection) with configurable sensitivity.
- **Difficulty:** Foundation
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Multi-stage detection
  - Comparing against a single previous run
  - Thermometer model
  - Iterative benchmarking protocol

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