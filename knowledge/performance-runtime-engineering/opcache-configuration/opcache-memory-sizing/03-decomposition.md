# Decomposition: Opcache Memory Sizing

## Topic Overview
`opcache.memory_consumption` controls the total shared memory for cached opcodes. `opcache.interned_strings_buffer` controls memory for deduplicated strings shared across all requests. Undersizing causes cache eviction and recompilation (OpCache thrashing). Sizing guidelines: 128MB for small apps, 256MB for medium (Laravel/Symfony), 512MB+ for large applications. Interned strings: 16MB-64MB depending on application string diversity.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/opcache-memory-sizing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Opcache Memory Sizing
- **Purpose:** `opcache.memory_consumption` controls the total shared memory for cached opcodes. `opcache.interned_strings_buffer` controls memory for deduplicated strings shared across all requests. Undersizing causes cache eviction and recompilation (OpCache thrashing). Sizing guidelines: 128MB for small apps, 256MB for medium (Laravel/Symfony), 512MB+ for large applications. Interned strings: 16MB-64MB depending on application string diversity.
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
  - Setting memory_consumption too low (128MB for large apps)
  - Library model
  - Tiered cache warming

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