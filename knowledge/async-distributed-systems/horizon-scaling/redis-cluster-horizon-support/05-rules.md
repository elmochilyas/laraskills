# Rule Card: K081 — Redis Cluster Support in Horizon (v5.46+)

---

## Rule 1

**Rule Name:** prefer-single-redis-over-cluster

**Category:** Prefer

**Rule:** Prefer single Redis with replica for most deployments.

**Reason:** Redis Cluster introduces `BRPOP` limitations, cross-slot constraints, and complexity that most apps don't need.

**Bad Example:**
```php
// Deploying Redis Cluster unnecessarily — 95% of apps don't need it
```

**Good Example:**
```php
// Start with single Redis + replica
// Only migrate to Cluster when single Redis throughput is insufficient (>10K jobs/sec)
```

**Exceptions:** Applications exceeding ~10K jobs per second or requiring Redis HA with automatic failover.

**Consequences Of Violation:** The team spends weeks debugging `BRPOP` MOVED errors, cross-slot `MULTI` failures, and failover reconnection issues — all for a system processing 100 jobs/second that a single Redis instance handles easily.

---

## Rule 2

**Rule Name:** enable-queue-key-hash-tag

**Category:** Always

**Rule:** Always set `queue_key_hash_tag: true` when using Redis Cluster.

**Reason:** Without hash tags, queue keys land on different nodes — `BRPOP` connects to a single node and may not find the queue key.

**Bad Example:**
```php
// config/horizon.php — missing hash tag config
// BRPOP may connect to wrong node → MOVED errors
```

**Good Example:**
```php
// config/horizon.php
'queue_key_hash_tag' => true, // Wraps queue keys in {horizon}
```

**Exceptions:** Pre-cluster migration testing where consistent routing isn't needed.

**Consequences Of ViolATION:** `BRPOP` on `queues:default` connects to node A — but the queue key is on node B. Redis returns a `MOVED` redirection, but the phpredis/Predis driver may not handle it correctly for blocking operations, causing the worker to hang.

---

## Rule 3

**Rule Name:** test-failover-behavior

**Category:** Always

**Rule:** Always test Redis Cluster failover behavior before deploying to production.

**Reason:** Unhandled failover can cause workers to hang or lose connections.

**Bad Example:**
```php
// No failover testing — assuming transparent recovery
```

**Good Example:**
```php
// Staging test: restart a cluster node while jobs are processing
// Verify: workers reconnect, no jobs lost, no duplicate processing
```

**Exceptions:** None — failover testing is mandatory for Cluster deployments.

**Consequences Of ViolATION:** A Cluster node fails at 3 AM — workers connected to that node lose their `BRPOP` connection. The client library doesn't retry properly, workers hang, and queue processing stops until someone manually restarts Horizon.

---

## Rule 4

**Rule Name:** avoid-cross-slot-multi-key-ops

**Category:** Always

**Rule:** Always avoid multi-key Redis operations across slots.

**Reason:** Redis Cluster rejects `MULTI`/`EXEC`, `SDIFF`, `SUNIONSTORE`, etc. when keys are on different slots.

**Bad Example:**
```php
// Horizon operations that may cross slots
// (Horizon internal keys use {horizon} hash tag, but queue keys don't by default)
```

**Good Example:**
```php
// Ensure all related keys share the same hash tag
// Horizon uses {horizon}: prefix for internal keys
// queue_key_hash_tag wraps queue keys in {horizon} too
```

**Exceptions:** None — cross-slot operations fail in Cluster mode.

**Consequences Of ViolATION:** A Horizon internal operation reads `{horizon}:metrics:default` and `queues:default` in a single command — the first key has `{horizon}` hash tag (slot A), the second has no hash tag (slot B). Redis Cluster returns `CROSSSLOT` error.
