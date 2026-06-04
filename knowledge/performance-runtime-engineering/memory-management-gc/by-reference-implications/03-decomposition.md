# Decomposition: By Reference Implications

## Topic Overview
By-reference assignment (`$b = &$a`) creates a `zend_reference` container that aliases two variables to the same memory location. This bypasses CoW entirely — any write through `$a` or `$b` modifies the same underlying value. While useful for certain patterns, references introduce complexity: unexpected copies when arrays containing references are copied, and increased mental overhead for tracking aliases.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/by-reference-implications/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### By Reference Implications
- **Purpose:** By-reference assignment (`$b = &$a`) creates a `zend_reference` container that aliases two variables to the same memory location. This bypasses CoW entirely — any write through `$a` or `$b` modifies the same underlying value. While useful for certain patterns, references introduce complexity: unexpected copies when arrays containing references are copied, and increased mental overhead for tracking aliases.
- **Difficulty:** Intermediate
- **Dependencies:
  - on-Write Mechanics | Zval Structure and Reference Counting | Memory Leak Pattern Catalog
  - --

## Dependency Graph
**Depends on:**
  - on-Write Mechanics | Zval Structure and Reference Counting | Memory Leak Pattern Catalog
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Using references for function arguments to "save memory"
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