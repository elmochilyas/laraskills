# Rule Card: K038 — Apache Kafka Topics and Partitions

---

## Rule 1

**Rule Name:** align-partition-count-to-throughput

**Category:** Always

**Rule:** Always align partition count to your expected throughput and consumer count.

**Reason:** Too few partitions limit parallelism — too many add overhead and rebalance latency.

**Bad Example:**
```php
// Single partition — serial processing regardless of consumers
'partitions' => 1
```

**Good Example:**
```php
// Aim for throughput_required / single_partition_throughput
// A partition handles ~5-10 MB/s. For 50 MB/s: 10 partitions
'partitions' => 10,
```

**Exceptions:** Ordered processing requirements may force single partitions.

**Consequences Of ViolATION:** A topic with 3 partitions and 10 consumers — only 3 consumers are active, 7 sit idle. Throughput is capped at 3× partition throughput.

---

## Rule 2

**Rule Name:** size-consumer-groups-by-partitions

**Category:** Always

**Rule:** Always keep consumer count ≤ partition count per group.

**Reason:** Extra consumers in a group are idle — one partition is consumed by at most one consumer.

**Bad Example:**
```php
// 3 partitions, 6 consumers — 3 consumers always idle
```

**Good Example:**
```php
// 6 partitions, 6 consumers — full parallelism
// Or: 3 partitions, 3 consumers — no idle
```

**Exceptions:** Standby consumers for failover may exceed partition count intentionally.

**Consequences Of ViolATION:** 60 consumers for 20 partitions — 40 consumers consume zero data. Cluster resources and consumer licenses are 3× over-provisioned for zero throughput gain.

---

## Rule 3

**Rule Name:** choose-key-for-ordering

**Category:** Always

**Rule:** Always choose a partition key that guarantees ordering for messages that need it.

**Reason:** Messages with the same key go to the same partition — only within-partition order is guaranteed.

**Bad Example:**
```php
// No key — round-robin across partitions, no ordering guarantee
$this->producer->send('orders', $orderData); // No key
```

**Good Example:**
```php
// Same key = same partition = ordered processing
$this->producer->send('orders', $orderData, $order->tenant_id);
```

**Exceptions:** Messages that don't need ordering (analytics, logs) can omit the key for better load distribution.

**Consequences Of ViolATION:** Order `created`, `updated`, and `cancelled` events go to different partitions — consumer processes them out of order. The `cancelled` event arrives before `created`, causing a "not found" error.

---

## Rule 4

**Rule Name:** set-message-retention-no-infinite

**Category:** Never

**Rule:** Never set `retention.ms` to `-1` (infinite) on topics with high throughput.

**Reason:** Infinite retention grows disk usage unbounded — a consumer lagging behind eventually fills the disk.

**Bad Example:**
```php
// config/kafka.php
'orders' => [
    'retention.ms' => -1, // Infinite retention
]
```

**Good Example:**
```php
'orders' => [
    'retention.ms' => 604800000, // 7 days
    'cleanup.policy' => 'delete',
]
```

**Exceptions:** Audit logs with compliance requirements may need long but finite retention (1 year).

**Consequences Of ViolATION:** A consumer is down for 2 weeks — messages accumulate beyond disk capacity. Kafka's `log.retention.bytes` hits the broker limit, partitions go offline, and ALL topic producers get `NotLeaderForPartitionException`.
