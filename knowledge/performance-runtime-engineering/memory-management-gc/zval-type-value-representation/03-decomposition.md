# Decomposition: Zval Type Value Representation

## Topic Overview
PHP 8.x zvals represent scalar types (null, bool, int, float) **inline** within the 16-byte zval structure — no additional memory allocation needed. Compound types (string, array, object, resource) store a pointer to an external heap-allocated structure. Understanding this distinction explains why scalar operations are faster and why compound types have CoW semantics.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/zval-type-value-representation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Zval Type Value Representation
- **Purpose:** PHP 8.x zvals represent scalar types (null, bool, int, float) **inline** within the 16-byte zval structure — no additional memory allocation needed. Compound types (string, array, object, resource) store a pointer to an external heap-allocated structure. Understanding this distinction explains why scalar operations are faster and why compound types have CoW semantics.
- **Difficulty:** Intermediate
- **Dependencies:
  - on-Write Mechanics | Persistent vs Per-Request Allocators
  - --

## Dependency Graph
**Depends on:**
  - on-Write Mechanics | Persistent vs Per-Request Allocators
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