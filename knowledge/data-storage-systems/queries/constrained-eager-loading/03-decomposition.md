# Decomposition: 2.5 Constrained eager loading (with + where constraints on relationship)

## Topic Overview
Constrained eager loading filters, limits, or orders the related models loaded via `with()` using closure-based constraints. This prevents loading all related records when only a subset is needed. Since Laravel 12, `limit()` is supported natively in constrained eager loads.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-5-constrained-eager-loading/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.5 Constrained eager loading (with + where constraints on relationship)
- **Purpose:** Constrained eager loading filters, limits, or orders the related models loaded via `with()` using closure-based constraints. This prevents loading all related records when only a subset is needed.
- **Difficulty:** Intermediate
- **Dependencies:** 2.3 Eager loading, 2.6 Relationship existence filtering, 2.7 Relationship counting

## Dependency Graph
**Depends on:** "2.3 Eager loading", "2.6 Relationship existence filtering", "2.7 Relationship counting"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Closure constraints**: `with(['comments' => fn($q) => $q->where('approved', true)->limit(5)])` loads only approved comments, max 5 per post.; - **Aggregate constraints**: `withCount(['comments' => fn($q) => $q->where('spam', false)])` counts only non-spam comments.; - **Native limit()**: Laravel 12+ supports `limit()` on eager loaded relationships without external packages..
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