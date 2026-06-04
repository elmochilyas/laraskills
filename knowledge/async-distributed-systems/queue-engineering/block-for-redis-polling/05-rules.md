# Rule Card: K080 — `block_for` Redis Option for Worker Polling

---

## Rule 1

**Rule Name:** set-block-for-low-volume

**Category:** Prefer

**Rule:** Prefer `block_for=5-10` for low-volume queues.

**Reason:** Eliminates polling traffic when the queue is idle, reducing Redis CPU and network usage.

**Bad Example:**
```php
// config/queue.php
'redis' => [
    'driver' => 'redis',
    'block_for' => null, // Workers poll Redis in tight loop when queue is empty
],
```

**Good Example:**
```php
'redis' => [
    'driver' => 'redis',
    'block_for' => 5, // BRPOP blocks for 5 seconds when queue is empty
],
```

**Exceptions:** High-throughput queues (jobs always available) get no benefit from blocking and should use null.

**Consequences Of Violation:** Idle workers execute ~20 Redis round-trips/minute each at `--sleep=3` — 50 workers = 1000 wasted round-trips/minute.

---

## Rule 2

**Rule Name:** no-block-for-redis-cluster

**Category:** Always

**Rule:** Always set `block_for` to null when using Redis Cluster.

**Reason:** BRPOP blocking across cluster nodes is unreliable — it only blocks on the connection's node.

**Bad Example:**
```php
'redis' => [
    'driver' => 'redis',
    'block_for' => 5, // BRPOP not supported reliably across cluster nodes
],
```

**Good Example:**
```php
'redis' => [
    'driver' => 'redis',
    'block_for' => null, // Polling-safe for Redis Cluster
],
```

**Exceptions:** None — Redis Cluster does not support cross-node blocking BRPOP reliably.

**Consequences Of Violation:** Jobs dispatched to a different cluster node than the blocked connection may not trigger the block release — workers miss jobs until the block timeout expires.

---

## Rule 3

**Rule Name:** avoid-long-block-with-predis

**Category:** Never

**Rule:** Never set `block_for > 10` when using the Predis driver.

**Reason:** Predis uses blocking PHP I/O — a long block makes the worker unresponsive to signals for the entire block duration.

**Bad Example:**
```php
'redis' => [
    'driver' => 'predis',
    'block_for' => 30, // Worker unresponsive to SIGTERM for 30 seconds
],
```

**Good Example:**
```php
'redis' => [
    'driver' => 'predis',
    'block_for' => 5, // Max 5-second signal unresponsiveness
],
```

**Exceptions:** When using phpredis (which supports non-blocking I/O), longer block_for values are acceptable.

**Consequences Of Violation:** A SIGTERM to the worker delays shutdown by `block_for` seconds — graceful deployment restarts take too long, causing request queuing.

---

## Rule 4

**Rule Name:** account-for-blocking-connections

**Category:** Always

**Rule:** Always account for blocking connections in Redis connection pool sizing.

**Reason:** Each worker with `block_for` occupies one Redis connection during the entire block period.

**Bad Example:**
```php
// 10 workers with block_for=5, phpredis pool of 5
// Workers #6-10 block waiting for connections — cache operations queue up
```

**Good Example:**
```php
// Set phpredis pool >= max number of workers
'redis' => [
    'options' => [
        'parameters' => ['password' => env('REDIS_PASSWORD')],
        'prefix' => env('REDIS_PREFIX', ''),
    ],
    'pool' => ['min' => 10, 'max' => 20], // >= max workers
],
```

**Exceptions:** When Redis is used only for queues (no cache/session sharing), connection pool exhaustion is less critical.

**Consequences Of Violation:** Other Redis operations (cache reads, session lookups) queue up behind blocked connections — application latency increases under worker load.

---

## Rule 5

**Rule Name:** remove-sleep-with-block-for

**Category:** Prefer

**Rule:** Prefer removing `--sleep` when `block_for` is set.

**Reason:** With blocking BRPOP active, the worker already waits at the Redis level — `--sleep` adds redundant delay.

**Bad Example:**
```bash
php artisan queue:work redis --sleep=3
# block_for=5 in config — worker blocks 5s then sleeps 3s = 8s worst-case
```

**Good Example:**
```bash
php artisan queue:work redis --sleep=0
# block_for=5 in config — worker blocks 5s, no extra sleep
```

**Exceptions:** When both blocking and non-blocking queues share the same worker, `--sleep` may still be useful as a fallback.

**Consequences Of Violation:** Worker idle time effectively becomes `block_for + sleep`, doubling the delay before a newly dispatched job is picked up.
