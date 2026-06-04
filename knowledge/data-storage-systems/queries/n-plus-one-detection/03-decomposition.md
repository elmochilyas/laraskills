# Decomposition: 2.28 N+1 detection via Laravel Telescope, Debugbar, or manual logging

## Topic Overview
N+1 detection tools identify repeated queries with identical structure but different parameter values. Laravel Telescope groups queries by request and highlights repeated patterns. Debugbar shows query count per request.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-28-n-plus-one-detection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.28 N+1 detection via Laravel Telescope, Debugbar, or manual logging
- **Purpose:** N+1 detection tools identify repeated queries with identical structure but different parameter values. Laravel Telescope groups queries by request and highlights repeated patterns.
- **Difficulty:** Foundation
- **Dependencies:** 2.4 Lazy loading prevention, 4.13 N+1 detection and elimination, 4.27 Profiling tools

## Dependency Graph
**Depends on:** "2.4 Lazy loading prevention", "4.13 N+1 detection and elimination", "4.27 Profiling tools"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Telescope**: Per-request query log with timing, duplicates detection, and relationship loading analysis.; - **Debugbar**: In-browser debug toolbar showing query count, time, and duplicates.; - **DB::listen**: Low-level query event listener. Can log, count, or alert on query patterns.; - **Pattern signature**: N+1 appears as N identical queries with different WHERE values: `SELECT * FROM comments WHERE post_id = 1`, `... WHERE post_id = 2`, etc..
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