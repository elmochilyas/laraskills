# Decomposition: Gc Collect Cycles Strategic

## Topic Overview
`gc_collect_cycles()` manually triggers cycle collection. Calling it strategically at **batch boundaries** (after processing a job, after a batch of imports, at the end of a request) is the correct pattern. Calling it per-iteration inside loops causes severe performance degradation due to the O(n) cost of the Bacon-Rajan algorithm. In long-running processes (Octane, queue workers), periodic gc_collect_cycles() at controlled intervals prevents unbounded root buffer growth.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/gc-collect-cycles-strategic/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Gc Collect Cycles Strategic
- **Purpose:** `gc_collect_cycles()` manually triggers cycle collection. Calling it strategically at **batch boundaries** (after processing a job, after a batch of imports, at the end of a request) is the correct pattern. Calling it per-iteration inside loops causes severe performance degradation due to the O(n) cost of the Bacon-Rajan algorithm. In long-running processes (Octane, queue workers), periodic gc_collect_cycles() at controlled intervals prevents unbounded root buffer growth.
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
  - Octane worker pattern
  - Calling gc_collect_cycles() before every database query
  - Lending library model
  - Leak detection patrol

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