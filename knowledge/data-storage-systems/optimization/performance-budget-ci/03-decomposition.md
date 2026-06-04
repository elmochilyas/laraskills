# Decomposition: 4.30 Performance budget enforcement in CI (query count, duration thresholds)

## Topic Overview
Performance budgets in CI prevent query count and duration regressions before deployment. Enforce N+1 detection, total query count per request, and slow query thresholds. Use PHPUnit assertions, custom test macros, or GitHub Actions with performance benchmarks.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-30-performance-budget-ci/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.30 Performance budget enforcement in CI (query count, duration thresholds)
- **Purpose:** Performance budgets in CI prevent query count and duration regressions before deployment. Enforce N+1 detection, total query count per request, and slow query thresholds.
- **Difficulty:** Advanced
- **Dependencies:** 4.25 Lazy loading detection, 4.26 Query log analysis

## Dependency Graph
**Depends on:** "4.25 Lazy loading detection", "4.26 Query log analysis"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Query count assertion**: `Http::fake()` + `DB::enableQueryLog()` in tests. Assert that an endpoint fires exactly N queries.; - **Duration threshold**: `$response->getDuration()` or `Clockwork::getQueries()->sum('duration')` — fail tests exceeding max duration.; - **N+1 detection**: `Model::preventLazyLoading()` in tests. Every lazy load throws an exception, failing the test..
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