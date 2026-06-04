# Decomposition: 10.4 Laravel Octane connection pool configuration (min/max connections)

## Topic Overview
Octane maintains a pool of database connections per worker. Configured via `'pool' => ['min' => 2, 'max' => 10]` in the database config. `min` = connections created at worker boot.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-4-laravel-octane-connections/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.4 Laravel Octane connection pool configuration (min/max connections)
- **Purpose:** Octane maintains a pool of database connections per worker. Configured via `'pool' => ['min' => 2, 'max' => 10]` in the database config.
- **Difficulty:** Advanced
- **Dependencies:** 10.2 Pool architecture, 10.7 Connection count management

## Dependency Graph
**Depends on:** "10.2 Pool architecture", "10.7 Connection count management"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Min connections**: Pre-warmed connections. Created when worker starts. Available immediately for first request. Set to expected concurrent requests per worker (e.g., 4).; - **Max connections**: Upper limit. Prevents worker from opening too many connections. Set to peak concurrent requests per worker (e.g., 10).; - **Connection reclamation**: Idle connections above `min` are closed after `pool.ttl` (default 60s). Keeps pool lean during low traffic..
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