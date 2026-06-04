# Decomposition: Persistent Vs Per Request Allocators

## Topic Overview
PHP uses two memory allocation systems: the **per-request allocator** (freed entirely at request end — fast, no fragmentation tracking) and the **persistent allocator** (allocates from shared memory / process heap — survives across requests). Interned strings, OpCache opcodes, and persistent extensions use the persistent allocator. Regular PHP variables use the per-request allocator.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
memory-management-garbage-collection/persistent-vs-per-request-allocators/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Persistent Vs Per Request Allocators
- **Purpose:** PHP uses two memory allocation systems: the **per-request allocator** (freed entirely at request end — fast, no fragmentation tracking) and the **persistent allocator** (allocates from shared memory / process heap — survives across requests). Interned strings, OpCache opcodes, and persistent extensions use the persistent allocator. Regular PHP variables use the per-request allocator.
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