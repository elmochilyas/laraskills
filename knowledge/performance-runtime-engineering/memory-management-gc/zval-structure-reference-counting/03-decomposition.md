# Decomposition: Zval Structure Reference Counting

## Topic Overview
Every PHP variable is stored as a **zval** (Zend Value) — a 16-byte structure containing type, value, reference count, and flags. Reference counting tracks how many variables point to the same zval. When refcount reaches zero, the memory is freed immediately. This is PHP's primary memory management mechanism — the garbage collector only handles the special case of circular references.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/zval-structure-reference-counting/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Zval Structure Reference Counting
- **Purpose:** Every PHP variable is stored as a **zval** (Zend Value) — a 16-byte structure containing type, value, reference count, and flags. Reference counting tracks how many variables point to the same zval. When refcount reaches zero, the memory is freed immediately. This is PHP's primary memory management mechanism — the garbage collector only handles the special case of circular references.
- **Difficulty:** Intermediate
- **Dependencies:
  - on-Write Mechanics | Zval Type/Value Representation | Cyclic GC Algorithm
  - --

## Dependency Graph
**Depends on:**
  - on-Write Mechanics | Zval Type/Value Representation | Cyclic GC Algorithm
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Book lending
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