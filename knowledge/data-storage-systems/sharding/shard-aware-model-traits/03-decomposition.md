# Decomposition: 6.14 Shard-aware model traits (getConnectionName, Shardable)

## Topic Overview
Shard-aware Eloquent models automatically route queries to the correct shard based on the model's shard key. Override `getConnectionName()` to return the correct shard connection. A `Shardable` trait encapsulates routing logic, shard key extraction, and connection resolution.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
6-14-shard-aware-model-traits/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 6.14 Shard-aware model traits (getConnectionName, Shardable)
- **Purpose:** Shard-aware Eloquent models automatically route queries to the correct shard based on the model's shard key. Override `getConnectionName()` to return the correct shard connection.
- **Difficulty:** Advanced
- **Dependencies:** 6.5 Shard routing, 6.13 Shard groups, 6.15 Sharding packages

## Dependency Graph
**Depends on:** "6.5 Shard routing", "6.13 Shard groups", "6.15 Sharding packages"

**Depended on by:** More advanced KUs in Database Sharding & Horizontal Scaling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **getConnectionName()**: Eloquent method that returns the connection name. Override: `public function getConnectionName() { return 'shard_'.$this->shard(); }`. Called on every query.; - **Shardable trait**: Provides `shard()`, `connection()`, `scopeOnShard()`. Models using the trait automatically route.; - **Shard key attribute**: The model attribute used for routing: `$this->user_id`, `$this->tenant_id`. Trait reads it..
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