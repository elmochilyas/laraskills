# Decomposition: Circular Reference Formation

## Topic Overview
A circular reference (cycle) forms when two or more objects reference each other — either directly (parent?child?parent) or through a chain (A?B?C?A). Reference counting alone cannot detect these cycles because every object has a non-zero refcount even when no external references exist. The cyclic garbage collector (GC) is required to identify and free these structures.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/circular-reference-formation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Circular Reference Formation
- **Purpose:** A circular reference (cycle) forms when two or more objects reference each other — either directly (parent?child?parent) or through a chain (A?B?C?A). Reference counting alone cannot detect these cycles because every object has a non-zero refcount even when no external references exist. The cyclic garbage collector (GC) is required to identify and free these structures.
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
  - Cycle detection
  - Assuming unset() frees all memory
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