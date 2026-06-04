# Decomposition: 2.29 Query logging (DB::listen, enableQueryLog)

## Topic Overview
`DB::listen` captures every query executed, providing SQL, bindings, execution time, and connection name. `enableQueryLog` stores queries in memory for later retrieval. These are the foundational tools for Laravel query debugging and performance analysis.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-29-query-logging/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.29 Query logging (DB::listen, enableQueryLog)
- **Purpose:** `DB::listen` captures every query executed, providing SQL, bindings, execution time, and connection name. `enableQueryLog` stores queries in memory for later retrieval.
- **Difficulty:** Foundation
- **Dependencies:** 4.27 Profiling tools, 2.28 N+1 detection via Telescope

## Dependency Graph
**Depends on:** "4.27 Profiling tools", "2.28 N+1 detection via Telescope"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **DB::listen(closure)**: Event listener that fires for every query. Access SQL, bindings, time, connection name.; - **enableQueryLog() / getQueryLog()**: Stores queries in memory. Use `getQueryLog()` to retrieve array of all queries executed.; - **disableQueryLog()**: Turn off logging. Prevents memory growth in long-running processes..
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