# Decomposition: 6.5 Shard mapping and routing (service-side routing, proxy-level routing)

## Topic Overview
Shard routing determines which shard to query. Service-side routing: the application computes the shard (via hash/range/directory) and connects directly. Proxy-level routing: a middleware (ProxySQL, Vitess, pgcat) routes queries transparently.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-5-shard-mapping-routing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.5 Shard mapping and routing (service-side routing, proxy-level routing)
- **Purpose:** Shard routing determines which shard to query. Service-side routing: the application computes the shard (via hash/range/directory) and connects directly.
- **Difficulty:** Advanced
- **Dependencies:** 6.2 Hash-based sharding, 6.4 Directory-based sharding, 6.14 Shard model traits

## Dependency Graph
**Depends on:** "6.2 Hash-based sharding", "6.4 Directory-based sharding", "6.14 Shard model traits"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Service-side routing**: Application calls `shard = ShardRouter::getShard($userId)`, then `DB::connection('shard_'.$shard)->query(...)`. Explicit, testable.; - **Proxy-level routing**: Application connects to proxy as if it's a single database. Proxy parses queries, routes to correct shard. Vitess, ProxySQL, Spanner.; - **Connection management**: Service-side: N connections per request (fan-out). Proxy-level: one connection, proxy handles backend routing..
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