# Decomposition: 6.15 Packages: allnetru/laravel-sharding (hash, range, db_range, redis strategies; Snowflake/sequence ID; coroutine fan-out)

## Topic Overview
allnetru/laravel-sharding is the primary Laravel sharding package. Supports hash, range, db_range, and Redis-based sharding strategies. Includes Snowflake ID generation, database sequence ID generation, coroutine fan-out for Swoole/Octane, and event-based connection resolution.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-15-sharding-packages/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.15 Packages: allnetru/laravel-sharding (hash, range, db_range, redis strategies; Snowflake/sequence ID; coroutine fan-out)
- **Purpose:** allnetru/laravel-sharding is the primary Laravel sharding package. Supports hash, range, db_range, and Redis-based sharding strategies.
- **Difficulty:** Advanced
- **Dependencies:** 6.14 Shard model traits, 6.16 Swoole/Octane dispatch

## Dependency Graph
**Depends on:** "6.14 Shard model traits", "6.16 Swoole/Octane dispatch"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Strategies**: Hash (modulo, consistent), range (key ranges), db_range (range with dynamic shard discovery), Redis (shard map via Redis).; - **ID generation**: Snowflake (64-bit, timestamp+shard+sequence), database sequences (sequence per shard).; - **Fan-out**: Coroutine-aware fan-out with Swoole/Octane. `Sharding::fanOut(fn($shard) => $query->on($shard)->get())`..
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