# Decomposition: 2.3 Eager loading (with, load, loadMissing, nested dot notation)

## Topic Overview
Eager loading solves the N+1 query problem by loading related models in a single query. Laravel provides `with()` (query-time), `load()` (collection-time), and `loadMissing()` (conditional) with dot notation for nested relationships. Eager loading is the most impactful optimization for Eloquent performance.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-3-eager-loading/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.3 Eager loading (with, load, loadMissing, nested dot notation)
- **Purpose:** Eager loading solves the N+1 query problem by loading related models in a single query. Laravel provides `with()` (query-time), `load()` (collection-time), and `loadMissing()` (conditional) with dot notation for nested relationships.
- **Difficulty:** Foundation
- **Dependencies:** 2.4 Lazy loading prevention, 2.5 Constrained eager loading, 2.14 N+1 detection

## Dependency Graph
**Depends on:** "2.4 Lazy loading prevention", "2.5 Constrained eager loading", "2.14 N+1 detection"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **`with('relation')`**: Eager loads the relationship as part of the parent query. Single query for the relationship, not N queries.; - **`load('relation')`**: Eager loads on an already-hydrated collection. Useful when you need to conditionally load after the initial query.; - **`loadMissing('relation')`**: Load only if not already loaded. Prevents redundant relationship loading in deep call stacks.; - **Dot notation**: `with('author.profile')` eager loads `author` and then `author.profile` through nested relationships..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization