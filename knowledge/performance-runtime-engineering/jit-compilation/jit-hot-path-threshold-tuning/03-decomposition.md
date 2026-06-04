# Decomposition: Jit Hot Path Threshold Tuning

## Topic Overview
JIT compilation triggers only after code crosses **hotness thresholds**. `jit_hot_loop` (default 64 iterations) controls loop compilation. `jit_hot_func` (default 100 calls) controls function compilation. Lower thresholds trigger JIT sooner (faster acceleration of hot code) but increase compilation overhead. Higher thresholds delay JIT but avoid wasting compilation effort on rarely-executed paths.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
jit-compilation/jit-hot-path-threshold-tuning/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Jit Hot Path Threshold Tuning
- **Purpose:** JIT compilation triggers only after code crosses **hotness thresholds**. `jit_hot_loop` (default 64 iterations) controls loop compilation. `jit_hot_func` (default 100 calls) controls function compilation. Lower thresholds trigger JIT sooner (faster acceleration of hot code) but increase compilation overhead. Higher thresholds delay JIT but avoid wasting compilation effort on rarely-executed paths.
- **Difficulty:** Intermediate
- **Dependencies:
  - Running Processes
  - --

## Dependency Graph
**Depends on:**
  - Running Processes
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Interpreter vs translator model
  - Profile-then-enable

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