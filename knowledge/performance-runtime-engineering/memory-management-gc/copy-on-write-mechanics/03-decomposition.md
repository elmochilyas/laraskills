# Decomposition: Copy On Write Mechanics

## Topic Overview
PHP uses **copy-on-write (CoW)** to share memory between variables until one is modified. When `$b = $a`, both point to the same zval (refcount=2). When `$b` is modified, the zval is separated (duplicated) and refcount decremented. This avoids copying large arrays and strings unless necessary � saving significant memory and CPU for read-heavy code paths.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/copy-on-write-mechanics/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Copy On Write Mechanics
- **Purpose:** PHP uses **copy-on-write (CoW)** to share memory between variables until one is modified. When `$b = $a`, both point to the same zval (refcount=2). When `$b` is modified, the zval is separated (duplicated) and refcount decremented. This avoids copying large arrays and strings unless necessary � saving significant memory and CPU for read-heavy code paths.
- **Difficulty:** Intermediate
- **Dependencies:
  - Reference Implications | Zval Structure and Reference Counting | Zval Type/Value Representation
  - --

## Dependency Graph
**Depends on:**
  - Reference Implications | Zval Structure and Reference Counting | Zval Type/Value Representation
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Read-only sharing
  - Premature optimization with references
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