# Skill: Implement Shard-Aware ID Generation

## Purpose

Generate globally unique, ordered IDs that encode the shard or enable shard-predictable routing without an extra lookup.

## When To Use

- Sharded database where global uniqueness is required
- Need to determine shard from ID without a lookup table
- Ordered IDs needed for range scans within a shard

## When NOT To Use

- UUID v4 is sufficient for uniqueness (no ordering, no shard routing)
- Database-native auto-increment is adequate (single writer per shard)
- Directory-based sharding with lookup table already handles routing

## Prerequisites

- Shard count and shard ID assignment
- ID generation strategy selected

## Inputs

- Shard ID (0 to N-1)
- Timestamp (for Snowflake-like IDs)
- Sequence number (for per-shard ordering)

## Workflow (numbered steps)

1. Choose ID strategy:
   - Snowflake (64-bit): timestamp (41 bits) + shard ID (10 bits) + sequence (12 bits)
   - UUID v7: time-ordered UUID (no shard encoding — requires lookup)
   - Database sequence per shard: auto-increment with offset
2. Implement Snowflake generator: given shard ID and timestamp, produce unique 64-bit ID
3. Extract shard ID from Snowflake ID: `$shardId = ($id >> 12) & 0x3FF`
4. Use extracted shard ID for routing: `ShardRouter::getConnection($shardId)`
5. For UUID v7: store shard map entry on first write, cache for subsequent reads

## Validation Checklist

- [ ] IDs are globally unique across all shards
- [ ] Shard ID can be extracted from Snowflake IDs
- [ ] IDs are monotonically increasing (Snowflake, UUID v7)
- [ ] ID generation handles clock skew and high concurrency

## Common Failures

- Clock skew: Snowflake IDs go backward (use clock drift tolerance)
- Sequence overflow: too many IDs per millisecond (increase sequence bits)
- Shard ID collision: two shards with same ID (duplicate IDs)

## Decision Points

- Snowflake vs UUID v7 vs database sequence
- Embedded shard ID vs lookup-based routing

## Performance Considerations

- Snowflake generation: < 1 microsecond
- UUID v7 generation: < 1 microsecond
- Sequence per shard: database call per ID (use batch allocation)

## Security Considerations

- IDs may leak information (timestamp → creation time, shard ID → data distribution)
- Sequential IDs can be enumerated (use Snowflake or UUID v7)

## Related Rules

- 6-6-1: Always Generate Globally Unique IDs
- 6-6-2: Never Use Single-Server Auto-Increment For Sharded IDs

## Related Skills

- Implement Hash-Based Sharding
- Implement Shard Routing
- Implement Directory-Based Sharding

## Success Criteria

- IDs are globally unique across all shards
- Shard can be determined from ID without a lookup
- ID generation handles peak throughput without collisions

---

# Skill: Generate Snowflake IDs for Shard Routing

## Purpose

Create a Snowflake-style ID generator that encodes shard ID and timestamp, enabling shard extraction and monotonic ordering.

## When To Use

- Need globally unique, ordered IDs across shards
- Shard routing from ID alone (no lookup)
- IDs must be sortable by creation time

## When NOT To Use

- UUID v7 is acceptable and shard lookup is acceptable
- 64-bit ID space is insufficient (use 128-bit UUID)
- Clock synchronization is unreliable

## Prerequisites

- Shard ID available at generation time
- Monotonically increasing sequence mechanism
- Clock drift tolerance

## Inputs

- Shard ID (0-1023 for 10-bit shard space)
- Current timestamp (milliseconds)
- Sequence counter per (shard, millisecond)

## Workflow (numbered steps)

1. Define bit layout: | timestamp (41 bits) | shard ID (10 bits) | sequence (12 bits) |
2. Custom epoch: choose a recent date to extend usable lifespan (e.g., 2024-01-01)
3. Implement generator: `(elapsed_ms << 22) | (shard_id << 12) | sequence`
4. Handle sequence overflow: wait for next millisecond
5. Handle clock drift: if clock goes backward, wait or use last timestamp + 1
6. Extract shard: `$shardId = ($snowflake >> 12) & 0x3FF`
7. Use extracted shard for routing: `DB::connection('shard_'.$shardId)`

## Validation Checklist

- [ ] IDs are unique across all shards and time
- [ ] Shard ID extraction works correctly
- [ ] IDs are monotonically increasing (for same shard)
- [ ] Clock drift tolerance works (test with clock jump)

## Common Failures

- Sequence overflow under high concurrency (> 4096 IDs per ms per shard)
- Clock drift backward causes ID collision
- Custom epoch incorrect — IDs wrap sooner than expected

## Decision Points

- Bit allocation: 41/10/12 vs other splits based on needs
- Epoch: recent date for longer lifespan vs fixed (UNIX epoch)

## Performance Considerations

- Generation: nanoseconds (integer operations only)
- No external calls needed (local computation)
- Sequence per shard: memory-only counter

## Security Considerations

- Timestamp in IDs reveals approximate creation time
- Shard ID reveals which shard stores the data

## Related Rules

- 6-6-1: Always Generate Globally Unique IDs

## Related Skills

- Implement Shard-Aware ID Generation
- Implement Shard Routing
- Implement Directory-Based Sharding

## Success Criteria

- IDs are globally unique across all shards
- Shard extraction works for direct routing
- No collisions under peak load (test with 2× expected throughput)
