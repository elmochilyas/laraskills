# 6-16 Swoole Octane Coroutine Dispatch - Decision Trees

## Sequential vs Coroutine Fan-Out

---

## Decision Context

Choosing between sequential fan-out and Swoole/Octane coroutine-based parallel execution for querying multiple shards in Laravel Octane.

---

## Decision Criteria

* performance: coroutine latency = max(shard_latency); sequential = sum(shard_latency)
* architectural: coroutines require Octane/Swoole runtime and connection pool sizing
* maintainability: coroutine code is more complex (go(), channels, aggregation)

---

## Decision Tree

Running Laravel Octane with Swoole driver?

NO → Using PHP-FPM

    YES → Sequential fan-out (no coroutine support)
        Query shards one at a time
        Latency = N × avg(shard_latency)
        
        ↓
        As PHP-FPM, this is the only option
        Mitigate: keep shard count low (2-4)
        Or: use parallel PHP extension (limited)

YES → Swoole driver available

    ↓
    Number of shards > 1?
    
    YES → Use coroutine fan-out
        
        ↓
        go(function() use ($shard) { ... })
        Each shard query runs in a separate coroutine
        
        ↓
        Latency = max(shard_latency)
        4 shards × 100ms = 100ms (not 400ms)
        
        ↓
        Implementation:
        $chan = new Chan(count($shards));
        foreach ($shards as $s) {
            go(fn() => $chan->push([$s => DB::connection('shard_'.$s)->select($query)]));
        }
        // Collect results from channel

NO → Single shard query

    → No fan-out needed
    Route directly to single shard
    No coroutine overhead

Connection pool consideration:

↓

Pool max ≥ concurrent coroutines?

    YES → Ready for coroutine fan-out
    NO → Increase pool.max to match peak concurrent coroutines

---

## Recommended Default

**Default:** Coroutine fan-out with Swoole driver; sequential fan-out for PHP-FPM (with low shard count)
**Reason:** Coroutines eliminate the fan-out multiplier. Sequential is the only option for PHP-FPM.

---

## Connection Pool Sizing for Coroutines

---

## Decision Context

Sizing Octane's connection pool to support concurrent coroutine queries across multiple shards without connection exhaustion or serialization.

---

## Decision Criteria

* performance: too-small pool causes coroutines to wait (serial = slow); too-large pool exceeds database limits
* architectural: each coroutine needs its own connection; shared connections block
* maintainability: pool sizing is per-worker; total connections = workers × pool_max

---

## Decision Tree

Calculate peak concurrent connections per worker:

↓

Peak concurrent coroutines per worker

    ↓
    Each fan-out uses N coroutines (one per shard)
    Multiple concurrent requests: M requests × N shards
    
    ↓
    Example: 4 concurrent requests × 4 shards = 16 connections peak
    
    ↓
    Set pool.max ≥ peak connections
    pool.max = 16 (or higher for headroom)

Calculate total connections:

↓

Total = workers × pool.max + queue workers + admin connections

    ↓
    Example: 4 workers × 16 pool.max + 2 queue workers × 2 + 5 admin = 73
    
    ↓
    Verify: 73 ≤ database max_connections - 20% headroom
    If 73 > max_connections × 0.8:
    → Reduce pool.max or workers
    → Or increase database max_connections

Pool configuration:

↓

'max' = calculated peak (or higher)

'min' = average concurrent connections

'ttl' = 60 seconds (standard)

---

## Recommended Default

**Default:** pool.max = peak concurrent coroutines × shards; verify total ≤ database max_connections - 20% headroom
**Reason:** Coroutine fan-out multiplies connection usage by shard count. Pool must be sized for worst-case concurrency.

---

## Related Rules

* Rule 6-16-1: Always Use Coroutines For Parallel Shard Queries
* Rule 6-16-2: Never Share Mutable State Between Coroutines

---

## Related Skills

* Implement Coroutine-Based Shard Queries in Octane/Swoole
* Configure Connection Pool for Coroutine Shard Queries
