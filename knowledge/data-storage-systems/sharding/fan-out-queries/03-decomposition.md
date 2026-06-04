# Decomposition: 6.7 Fan-out queries (broadcast to all shards, aggregate results)

## Topic Overview
Fan-out queries send the same query to all shards in parallel, then aggregate results. Required when the query doesn't include the shard key. Examples: admin reports, global search, cross-shard aggregations.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-7-fan-out-queries/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.7 Fan-out queries (broadcast to all shards, aggregate results)
- **Purpose:** Fan-out queries send the same query to all shards in parallel, then aggregate results. Required when the query doesn't include the shard key.
- **Difficulty:** Advanced
- **Dependencies:** 6.5 Shard routing, 6.16 Swoole/Octane coroutine dispatch

## Dependency Graph
**Depends on:** "6.5 Shard routing", "6.16 Swoole/Octane coroutine dispatch"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Parallel execution**: Query all shards concurrently (not sequentially). Use `Promise` combinators, `Swoole` coroutines, or `parallel` PHP extension.; - **Result aggregation**: Merge sorted lists, sum counts, combine sets. Error handling: tolerate partial shard failures.; - **Latency = max(shard_latency)**: One slow shard delays the entire fan-out. Implement timeout per shard..
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