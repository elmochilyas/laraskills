# 6-6 Shard Aware Id Generation - Decision Trees

## ID Generation Strategy

---

## Decision Context

Choosing between Snowflake (shard-encoded, 64-bit), UUID v7 (globally unique, 128-bit, no shard encoding), and database sequences (auto-increment with offset) for generating globally unique IDs across shards.

---

## Decision Criteria

* performance: Snowflake/UUID v7 are local (sub-μs); database sequences require network call
* architectural: Snowflake encodes shard ID → no lookup needed for routing; UUID v7 requires lookup
* maintainability: Snowflake needs clock sync; UUID v7 needs no coordination

---

## Decision Tree

Must route queries using only the ID (no separate shard key)?

YES → Need shard-encoded ID

    ↓
    Use Snowflake (or similar)
    64-bit: timestamp(41) + shard_id(10) + sequence(12)
    
    ↓
    Extract shard from ID: ($id >> 12) & 0x3FF
    Route directly: DB::connection('shard_'.$shardId)
    
    ↓
    Pro: No lookup needed — zero extra latency
    Pro: Monotonically increasing (range scans within shard)
    Pro: 64-bit — fits in BIGINT
    
    ↓
    Con: Clock skew can break ordering
    Con: Limited to 1024 shards (10 bits)
    Con: 4096 IDs/ms/shard maximum

NO → Routing is handled by other means (shard map, hash key)?

    ↓
    Need globally unique IDs without coordination?
    
    YES → Use UUID v7
        
        ↓
        128-bit, time-ordered, monotonically increasing
        Fully unique across all shards — zero coordination
        No shard encoding — use with directory-based routing
        
        ↓
        Pro: No clock or coordination requirements
        Pro: Unlimited shards
        Pro: Trillions of IDs per second

NO → Single-shard per table (no routing needed)?

    → Use database sequence (auto-increment with offset)
    shard 1: 1, 1+N, 1+2N...  shard 2: 2, 2+N, 2+2N...
    Simple, but limited to fixed shard count

---

## Recommended Default

**Default:** Snowflake for shard-embedded routing; UUID v7 when 128-bit space or zero coordination is needed
**Reason:** Snowflake eliminates the routing lookup. UUID v7 is the simplest globally-unique option when routing is handled separately.

---

## Sequence Overflow and Clock Skew Handling

---

## Decision Context

Handling edge cases in shard-aware ID generation: Snowflake sequence overflow (> 4096 IDs/ms) and clock drift (system clock goes backward).

---

## Decision Criteria

* performance: overflow handling blocks for 1ms; clock drift handling may block or skip
* architectural: sequence bits determine maximum throughput; clock sync precision determines drift likelihood
* maintainability: overflow is rare; clock drift requires NTP configuration

---

## Decision Tree

Sequence overflow (all 4096 IDs used in same millisecond)?

YES → More than 4096 IDs/ms needed

    ↓
    Option A: Wait for next millisecond (blocking)
    Pro: Preserves monotonic ordering
    Con: Blocks ID generation for up to 1ms
    
    ↓
    Option B: Increase sequence bits (12 → 14+)
    Reduces timestamp range
    14 bits = 16,384 IDs/ms
    Tradeoff: shorter ID lifespan

NO → Normal throughput (< 4096 IDs/ms)

    → Standard Snowflake operation
    Sequence resets to 0 each millisecond
    No blocking needed

Clock goes backward (NTP sync, manual adjustment)?

YES → Clock drift detected

    ↓
    Is drift < 1 second?
    
    YES → Use last known timestamp + 1
        Generate ID with previous timestamp
        Continue until real clock catches up
        Risk: non-monotonic if drift > 1 second
        
    NO → Drift > 1 second
        
        → Option A: Block until clock catches up
        Pro: Safe, preserves monotonicity
        Con: Blocks all ID generation
        
        → Option B: Use hybrid clock (logical + system)
        Track logical clock separately
        Always increments, never goes backward
        Preferred for production systems

NO → Clock is stable (NTP synchronized)

    → Proceed normally
    Ensure NTP is configured on all servers
    Monitor for clock drift

---

## Recommended Default

**Default:** Wait for next millisecond on overflow; use logical clock fallback for drift < 1s, block for > 1s drift
**Reason:** Overflow is extremely rare at 4096 IDs/ms. Clock drift handling should never produce duplicate IDs.

---

## Related Rules

* Rule 6-6-1: Always Generate Globally Unique IDs
* Rule 6-6-2: Never Use Single-Server Auto-Increment For Sharded IDs

---

## Related Skills

* Implement Shard-Aware ID Generation
* Generate Snowflake IDs for Shard Routing
