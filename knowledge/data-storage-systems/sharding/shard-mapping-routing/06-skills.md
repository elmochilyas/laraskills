# Skill: Implement Shard Routing

## Purpose

Route database queries to the correct shard using service-side (application-level) or proxy-level (middleware) routing.

## When To Use

- Sharded database architecture
- Need to determine which shard to query for each request
- Both application-level and proxy-level routing options

## When NOT To Use

- Non-sharded database (single connection)
- Shard routing is handled by infrastructure (Vitess, Spanner)

## Prerequisites

- Shard key selection and sharding strategy (hash, range, directory)
- Multiple database connections configured per shard
- Connection management infrastructure

## Inputs

- Shard key value from request/query
- Routing strategy configuration
- Shard connection map

## Workflow (numbered steps)

1. Implement `ShardRouter` class with methods:
   - `getShard($shardKey): int` — return shard ID for a given key
   - `getConnection($shardKey): string` — return connection name for a shard
   - `getAllShards(): array` — return all shard IDs (for fan-out)
2. For service-side routing:
   - `$connection = DB::connection(ShardRouter::getConnection($shardKey))`
   - Explicit connection selection in all queries
3. For proxy-level routing (ProxySQL, Vitess):
   - Configure proxy rules to parse queries and route by shard key
   - Application connects to proxy as single database
4. Handle fan-out queries: Query all shards in parallel, aggregate results

## Validation Checklist

- [ ] ShardRouter maps same key to same shard consistently
- [ ] Queries with shard key route to single shard
- [ ] Fan-out queries execute correctly across all shards
- [ ] Proxy-level routing (if used) parses and routes correctly

## Common Failures

- ShardRouter not deterministic — same key routes to different shards
- Fan-out misses some shards (new shard not in getAllShards)
- Proxy routing misconfigured — queries wrong shard

## Decision Points

- Service-side vs proxy-level routing
- Single ShardRouter vs per-model routers

## Performance Considerations

- Service-side routing: < 1ms per call (in-memory computation)
- Proxy-level routing: no application change, proxy overhead
- Fan-out latency = max(shard_latency)

## Security Considerations

- ShardRouter should not expose internal shard topology externally
- Proxy-level routing must authenticate connections

## Related Rules

- 6-5-1: Always Route By Shard Key When Available
- 6-5-2: Never Allow Direct Shard Access From Client Code

## Related Skills

- Implement Shard Mapping Routing
- Implement Hash-Based Sharding
- Implement Fan-Out Queries

## Success Criteria

- All queries route to correct shard
- ShardRouter is deterministic and fast
- Fan-out queries execute correctly

---

# Skill: Implement Service-Side Shard Routing

## Purpose

Route queries to the correct shard at the application level using a ShardRouter, giving full control over routing logic.

## When To Use

- Application needs explicit control over shard routing
- Shard routing logic is complex (composite keys, custom logic)
- Proxy-level routing not available or not desired
- Need per-query shard routing decisions

## When NOT To Use

- Simpler proxy-level routing (ProxySQL, Vitess) meets requirements
- Multiple applications need consistent routing (better at proxy level)
- Application code complexity is a concern

## Prerequisites

- ShardRouter class implemented
- Database connections configured per shard
- Model or query builder aware of shard assignment

## Inputs

- Shard key value
- Shard-to-connection mapping
- Query to execute

## Workflow (numbered steps)

1. Implement `ShardRouter::getConnectionName($shardKey): string`
2. In repositories or models, route queries:
   ```php
   $connection = DB::connection(ShardRouter::getConnection($userId));
   $user = $connection->table('users')->where('id', $userId)->first();
   ```
3. For Eloquent models, override `getConnectionName()` to return shard-specific connection
4. For relationships across shards, handle in application code (no DB joins)
5. For fan-out queries, dispatch to all shards and aggregate

## Validation Checklist

- [ ] All queries use ShardRouter for connection selection
- [ ] Models correctly use shard-specific connections
- [ ] Cross-shard relationships handled in application code
- [ ] Fan-out aggregation works correctly

## Common Failures

- Eloquent model uses default connection instead of shard-specific one
- Relationship loading queries across shards without awareness
- Cached model instances reference wrong connection

## Decision Points

- Repository pattern vs Eloquent model override vs query builder helper

## Performance Considerations

- Router computation: < 1ms
- Connection resolution per query: negligible
- N+1 across shards: each query may hit different shard (connection overhead)

## Security Considerations

- Shard router must not be overridable by user input
- Connection credentials in config must be protected

## Related Rules

- 6-5-1: Always Route By Shard Key When Available

## Related Skills

- Implement Shard Mapping Routing
- Implement Shard-Aware Model Traits
- Implement Fan-Out Queries

## Success Criteria

- All queries route to correct single shard when shard key is present
- Fan-out queries return complete, correct results
- Zero cross-shard join attempts
