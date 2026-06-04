# Skill: Implement Shard-Aware Model Traits

## Purpose

Create reusable traits for Eloquent models that automatically handle shard routing, connection selection, and cross-shard relationship loading.

## When To Use

- Sharded database with Eloquent models
- Multiple models need shard-aware behavior
- Centralizing shard routing logic
- Preventing cross-shard relationship loading

## When NOT To Use

- Single-shard application
- Shard routing handled at proxy level (not in application)
- Repository pattern used instead of Eloquent

## Prerequisites

- ShardRouter implementation
- Understanding of Eloquent model lifecycle
- Connection configuration per shard

## Inputs

- ShardRouter instance
- Model shard key column
- Relationship definitions

## Workflow (numbered steps)

1. Create `ShardAware` trait:
   - Override `getConnectionName()` to return shard-specific connection based on model's shard key
   - Override `newQuery()` to use correct connection
   - Add `scopeForShard($query, $shardKey)` for manual shard filtering
2. Implement `resolveRouteKey()`: extract shard key from model attributes
3. Override relationship loading to verify related models are on same shard (or use application-level join)
4. Add `getShardId()` method that returns the shard ID for this model instance
5. Apply trait to all sharded models

## Validation Checklist

- [ ] Models use correct shard connection automatically
- [ ] Queries include shard key for routing
- [ ] Cross-shard relationships detected and handled
- [ ] `getShardId()` returns correct shard

## Common Failures

- Model saved to wrong shard (connection not set before write)
- Relationship loads data from wrong shard
- Cached model instance returns stale connection name

## Decision Points

- Trait vs abstract base model class
- Explicit connection setting vs automatic via trait

## Performance Considerations

- Connection resolution per query: minimal overhead
- Cross-shard relationship detection: may add queries
- Cache resolved connection per model instance

## Security Considerations

- Shard routing must not be overridable by user input
- Shard key must come from trusted source (not user input)

## Related Rules

- 6-14-1: Always Route Model Queries By Shard Key
- 6-14-2: Never Load Cross-Shard Relationships Automatically

## Related Skills

- Implement Shard Routing
- Implement Fan-Out Queries
- Implement Shard-Aware ID Generation

## Success Criteria

- Models automatically use correct shard connection
- Cross-shard relationship loading is handled correctly
- Zero model queries routed to wrong shard

---

# Skill: Implement `getShardId()` on Models

## Purpose

Provide a consistent method on sharded models that returns the model's shard ID, enabling routing and debugging.

## When To Use

- Sharded models need to report their shard assignment
- Debugging and logging need shard information
- Cross-model operations need to verify same-shard status

## When NOT To Use

- Shard routing is handled externally (proxy-level)
- Application doesn't need to know shard assignments

## Prerequisites

- ShardRouter implementation
- Model shard key defined
- Connection-to-shard mapping

## Inputs

- Model instance with shard key value
- ShardRouter instance

## Workflow (numbered steps)

1. Add `getShardId(): int` method to `ShardAware` trait:
   `return ShardRouter::getShardId($this->{$this->shardKeyColumn});`
2. Use for logging: `Log::info('User loaded', ['shard_id' => $user->getShardId()])`
3. Use for cross-model verification:
   ```
   if ($user->getShardId() !== $order->getShardId()) {
       // Cross-shard operation — handle carefully
   }
   ```
4. Use for debugging: identify which shard a model is stored on
5. Add to model serialization for API responses if needed

## Validation Checklist

- [ ] `getShardId()` returns correct shard for all models
- [ ] Returns integer within valid shard range
- [ ] Consistent between model instances with same shard key
- [ ] Used in logging and debugging

## Common Failures

- Shard key not set when `getShardId()` called — error
- `getShardId()` called before model saved — no shard key yet
- Shard key changes after initial save — returns wrong shard

## Decision Points

- Include in serialization vs use only internally

## Performance Considerations

- `getShardId()` is O(1) computation — negligible
- Used in logging: no performance impact

## Security Considerations

- Shard ID may reveal data distribution — avoid exposing to users if sensitive
- Use for internal debugging only if shard information is sensitive

## Related Rules

- 6-14-1: Always Route Model Queries By Shard Key

## Related Skills

- Implement Shard-Aware Model Traits
- Implement Shard Routing
- Implement Shard Monitoring

## Success Criteria

- `getShardId()` returns correct shard for every model
- Used consistently in debugging and cross-shard detection
- Zero errors from accessing shard key before it's set
