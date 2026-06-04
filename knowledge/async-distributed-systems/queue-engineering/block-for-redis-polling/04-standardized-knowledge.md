# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Queue Engineering
- **Knowledge Unit:** K080 — `block_for` Redis Option for Worker Polling
- **Knowledge ID:** K080
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - Laravel Docs — Queues: Redis Configuration
  - Laravel Source — `Illuminate\Queue\RedisQueue`

---

# Overview

The `block_for` configuration option in the Redis queue connection controls how long the worker's `BRPOP` call blocks waiting for a job. Without it (or set to null), the worker polls in a tight loop — `BRPOP` with 0-second timeout returns immediately if no job is available, then the worker sleeps for `--sleep` seconds. With `block_for` set to a positive value (e.g., 5), `BRPOP` blocks on the Redis server for up to that many seconds — eliminating all polling traffic when the queue is idle. This dramatically reduces Redis CPU and network round-trips for idle queues.

---

# Core Concepts

- **`BRPOP`:** Redis blocking list pop command. Returns element immediately if available; blocks until element arrives or timeout expires.
- **Polling behavior:** Without `block_for`, `BRPOP` with timeout 0 returns immediately. Worker sleeps (`--sleep`). Each cycle = a Redis round-trip even when queue is empty.
- **Blocking behavior:** With `block_for=5`, `BRPOP` holds the Redis connection for up to 5 seconds waiting. Job arrives within 5s → returns immediately. No polling traffic.
- **Connection utilization:** Blocking `BRPOP` keeps a Redis connection occupied per worker process.

---

# When To Use

- **High `block_for` (5-10):** Low-volume queues — reduces Redis CPU by 95%+ during idle.
- **Zero/null `block_for`:** High-throughput queues (jobs always available) — no benefit from blocking.
- **Redis Cluster:** Set to null — `BRPOP` across cluster nodes is unreliable.

---

# When NOT To Use

- `block_for` > 10 with Predis — Predis is blocking I/O in PHP; long blocks make the process unresponsive to signals.
- Setting `block_for` without adjusting `--sleep` — with `block_for` active, `--sleep` is redundant.

---

# Best Practices

- **Set `block_for` to 5-10 for low-volume queues.** Reduces Redis CPU and network traffic during idle periods. *Why: Idle workers with no `block_for` execute ~20 Redis round-trips/minute at `--sleep=3` — 50 workers = 1000 round-trips/minute of wasted traffic. With `block_for=5`, that drops to 12 round-trips/minute.*
- **Set `block_for` to null for Redis Cluster.** `BRPOP` blocking across cluster nodes can behave unpredictably. *Why: In Redis Cluster, `BRPOP` only blocks on the connection's node — jobs on other nodes may not trigger the block release.*
- **Account for blocking connections in connection pool sizing.** Each worker with `block_for` occupies one Redis connection during the block period. *Why: If `phpredis` has a connection pool of 10 and 10 workers all block, the pool is fully consumed — other Redis operations (cache, sessions) queue up waiting for connections.*
- **Avoid `block_for > 10` with Predis.** Predis uses blocking PHP I/O — a 30-second block makes the worker unresponsive to SIGTERM for 30 seconds. *Why: Predis doesn't use non-blocking I/O — the PHP process blocks at the I/O level, unable to process signals until the I/O operation completes.*

---

# Performance Considerations

- Without `block_for`: ~1 BRPOP + sleep cycle per iteration. At `--sleep=3`, 20 round-trips/min/worker.
- With `block_for=5`: ~1 BRPOP every 5 seconds. 12 round-trips/min/worker. Each holds a connection for 5s.
- Blocking `BRPOP` doesn't consume Redis CPU — it's event-driven wait in Redis's event loop.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `block_for` with `--sleep` both set | Misunderstanding | Redundant — worker blocks instead of sleeping | Set `block_for`; no need for `--sleep` |
| `block_for=30` with Predis | Long block time | Worker unresponsive to SIGTERM for 30s | Keep `block_for <= 10` |
| Redis Cluster with blocking | `BRPOP` not cross-node | Job arrives on other node — block not released | Set `block_for=null` |

---

# Examples

```php
// config/queue.php — Redis connection
'redis' => [
    'driver' => 'redis',
    'connection' => 'default',
    'queue' => env('REDIS_QUEUE', 'default'),
    'retry_after' => 90,
    'block_for' => 5, // block for up to 5 seconds when queue is empty
],
```

---

# Related Topics

- **K002 Queue Driver Architecture (K002)** — Redis driver context
- **K058 Worker Recycling (K058)** — Worker lifecycle
