# Decomposition: 7.7 Lag-aware read splitting (route to primary when replica lag exceeds threshold)

## Topic Overview
Lag-aware read splitting monitors replica lag and routes reads to the primary if lag exceeds a threshold. If replica is > 5s behind, serve stale-sensitive queries from primary. Provides read scaling during normal operation and automatic fallback to primary during replication issues.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-7-lag-aware-read-splitting/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.7 Lag-aware read splitting (route to primary when replica lag exceeds threshold)
- **Purpose:** Lag-aware read splitting monitors replica lag and routes reads to the primary if lag exceeds a threshold. If replica is > 5s behind, serve stale-sensitive queries from primary.
- **Difficulty:** Advanced
- **Dependencies:** 7.5 Replica lag, 7.6 Lag monitoring, 7.10 Multi-region replication

## Dependency Graph
**Depends on:** "7.5 Replica lag", "7.6 Lag monitoring", "7.10 Multi-region replication"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Lag threshold**: Define max acceptable lag per query type. User-facing queries: 1-2s. Reporting queries: 30-60s. Analytics: no limit.; - **Lag check frequency**: Check lag every N seconds (not per-query). Cache lag value in memory/Redis for 1-5s. Avoids per-query lag check overhead.; - **Query classification**: Tag queries as "lag-sensitive" (user profile, order status) or "lag-tolerant" (reports, search results)..
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