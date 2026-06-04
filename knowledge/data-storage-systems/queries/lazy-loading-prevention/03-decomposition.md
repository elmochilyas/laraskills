# Decomposition: 2.4 Lazy loading prevention (Model::preventLazyLoading)

## Topic Overview
Laravel can throw an exception when lazy loading is detected via `Model::preventLazyLoading()`. This forces developers to explicitly eager load every accessed relationship, preventing N+1 queries from reaching production. The standard pattern is to enable prevention in non-production environments and log violations in production.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-4-lazy-loading-prevention/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.4 Lazy loading prevention (Model::preventLazyLoading)
- **Purpose:** Laravel can throw an exception when lazy loading is detected via `Model::preventLazyLoading()`. This forces developers to explicitly eager load every accessed relationship, preventing N+1 queries from reaching production.
- **Difficulty:** Intermediate
- **Dependencies:** 2.3 Eager loading, 4.13 N+1 detection and elimination, 2.28 N+1 detection via Telescope

## Dependency Graph
**Depends on:** "2.3 Eager loading", "4.13 N+1 detection and elimination", "2.28 N+1 detection via Telescope"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **preventLazyLoading()**: When enabled, accessing a relationship that wasn't eager loaded throws a `LazyLoadingViolationException`.; - **Environment-specific**: Typically enabled for local/staging, disabled (with logging) for production.; - **handleLazyLoadingViolationUsing**: Custom handler that logs violations instead of throwing exceptions in production.; - **Per-model override**: `protected $preventLazyLoading = false` on specific models where lazy loading is acceptable (e.g., small lookup tables)..
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