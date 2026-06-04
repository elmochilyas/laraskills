# Decomposition: Inheritance Cache Deep Dive

## Topic Overview
PHP 8.1 introduced the **inheritance cache**, an OpCache feature that pre-resolves class hierarchy relationships (parent classes, interfaces, traits) at compile time rather than at class-load time. This eliminates the runtime cost of resolving inheritance chains during autoloading — saving 2-5ms per request in framework-heavy applications by caching method tables and constant inheritance lookups.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opcache-configuration/inheritance-cache-deep-dive/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Inheritance Cache Deep Dive
- **Purpose:** PHP 8.1 introduced the **inheritance cache**, an OpCache feature that pre-resolves class hierarchy relationships (parent classes, interfaces, traits) at compile time rather than at class-load time. This eliminates the runtime cost of resolving inheritance chains during autoloading — saving 2-5ms per request in framework-heavy applications by caching method tables and constant inheritance lookups.
- **Difficulty:** Advanced
- **Dependencies:
  - --

## Dependency Graph
**Depends on:**
  - --

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
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