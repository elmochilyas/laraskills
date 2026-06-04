# Decomposition: State Management Leak Prevention

## Topic Overview
In Octane's persistent-worker model, **static properties and singletons survive across requests**. A static property set in request #1 persists for request #2, #3, etc. This causes state leaks — data from one request appearing in another. Prevention requires: never use static properties for request-scoped data, use `scoped()` bindings for per-request services, and implement `resetState()` / `resetOnStart` patterns for services that must be fresh per request.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-octane-performance/state-management-leak-prevention/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### State Management Leak Prevention
- **Purpose:** In Octane's persistent-worker model, **static properties and singletons survive across requests**. A static property set in request #1 persists for request #2, #3, etc. This causes state leaks — data from one request appearing in another. Prevention requires: never use static properties for request-scoped data, use `scoped()` bindings for per-request services, and implement `resetState()` / `resetOnStart` patterns for services that must be fresh per request.
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
  - Static property audit
  - Octane + third-party packages without testing
  - Power plant model
  - Safe migration pattern

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