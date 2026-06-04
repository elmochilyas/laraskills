# Decomposition: 4.25 Lazy loading detection & prevention in production

## Topic Overview
N+1 queries caused by lazy loading are the #1 performance issue in Laravel applications. In production, lazy loading can silently degrade response times. Detection requires query logging, middleware, or Laravel's built-in N+1 detection.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-25-lazy-loading-detection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.25 Lazy loading detection & prevention in production
- **Purpose:** N+1 queries caused by lazy loading are the #1 performance issue in Laravel applications. In production, lazy loading can silently degrade response times.
- **Difficulty:** Advanced
- **Dependencies:** 4.26 Query log analysis, 4.27 Profiling tools

## Dependency Graph
**Depends on:** "4.26 Query log analysis", "4.27 Profiling tools"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **N+1 symptom**: Request loads 50 posts, then executes 50+1 queries (1 for posts, 50 for comments). Each lazy load fires a separate query.; - **Laravel strict mode**: `Model::preventLazyLoading(true)` in `AppServiceProvider::boot()`. Throws exception when lazy loading occurs.; - **Query counter**: Log total query count per request. Any request exceeding N queries per item is suspicious..
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