# Decomposition: 6.19 Shard proxy considerations (ProxySQL, Vitess)

## Topic Overview
Shard proxies (ProxySQL, Vitess, pgcat) sit between application and sharded databases. They handle query routing, connection pooling, read/write splitting, and some cross-shard query support. Vitess provides full SQL parsing and distributed query execution.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-19-shard-proxy-considerations/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.19 Shard proxy considerations (ProxySQL, Vitess)
- **Purpose:** Shard proxies (ProxySQL, Vitess, pgcat) sit between application and sharded databases. They handle query routing, connection pooling, read/write splitting, and some cross-shard query support.
- **Difficulty:** Advanced
- **Dependencies:** 6.5 Shard routing, 6.7 Fan-out queries, 10.4 Connection pooling

## Dependency Graph
**Depends on:** "6.5 Shard routing", "6.7 Fan-out queries", "10.4 Connection pooling"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **ProxySQL**: MySQL proxy. Rule-based query routing, connection pooling, query caching, query rewriting. Can route queries by regex match on query text.; - **Vitess**: Full distributed database system. Horizontal sharding, automatic shard management, resharding, distributed queries (scatter/gather). VTGate + VTTablet architecture.; - **pgcat**: PostgreSQL proxy. Connection pooling, read/write splitting, sharding (PASS THROUGH). Lighter than Vitess..
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