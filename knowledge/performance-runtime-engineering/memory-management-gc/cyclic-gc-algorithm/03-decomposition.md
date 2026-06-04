# Decomposition: Cyclic Gc Algorithm

## Topic Overview
PHP's cyclic garbage collector implements the **Bacon-Rajan algorithm** — a concurrent tri-color marking scheme. It operates in three phases: **Mark-Grey** (decrement refcounts of all children), **Scan** (evaluate which nodes can be reached from roots), and **Sweep** (free unreachable cycles). The collector is triggered when the root buffer (default 10,000 entries) fills.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/cyclic-gc-algorithm/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Cyclic Gc Algorithm
- **Purpose:** PHP's cyclic garbage collector implements the **Bacon-Rajan algorithm** — a concurrent tri-color marking scheme. It operates in three phases: **Mark-Grey** (decrement refcounts of all children), **Scan** (evaluate which nodes can be reached from roots), and **Sweep** (free unreachable cycles). The collector is triggered when the root buffer (default 10,000 entries) fills.
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