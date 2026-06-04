# Decomposition: Preloading Script Design Patterns

## Topic Overview
OpCache preloading loads PHP files into shared memory **before** any request is served, eliminating lazy compilation on first access. The preloading script can use `opcache_compile_file()` (compiles without executing) or `require_once` (compiles and executes � making classes/functions available). Preloading provides the greatest benefit for fast APIs (<100ms) where autoloading time (10-16ms) is a significant percentage.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/preloading-script-design-patterns/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Preloading Script Design Patterns
- **Purpose:** OpCache preloading loads PHP files into shared memory **before** any request is served, eliminating lazy compilation on first access. The preloading script can use `opcache_compile_file()` (compiles without executing) or `require_once` (compiles and executes � making classes/functions available). Preloading provides the greatest benefit for fast APIs (<100ms) where autoloading time (10-16ms) is a significant percentage.
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
  - Laravel preloading
  - Preloading everything
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