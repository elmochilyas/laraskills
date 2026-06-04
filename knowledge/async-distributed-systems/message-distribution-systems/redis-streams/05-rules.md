# Rule Card: K040 — Redis Streams via `laravel-common`

---

## Rule 1

**Rule Name:** set-read-timeout-for-streams

**Category:** Always

**Rule:** Always configure `read_timeout` when consuming Redis streams with blocking reads.

**Reason:** The default timeout blocks the worker indefinitely — a missed Redis response or process crash causes the worker to hang forever.

**Bad Example:**
```php
// config/queue.php
'redis-stream' => [
    'driver' => 'redis',
],
// No read_timeout set
```

**Good Example:**
```php
'redis-stream' => [
    'driver' => 'redis',
    'read_timeout' => 2, // Reconnect if no response in 2 seconds
],
```

**Exceptions:** Development environments where indefinite blocking is acceptable.

**Consequences Of ViolATION:** A network hiccup causes the blocking read to hang — the worker is effectively dead but appears alive in monitoring, failing to process any jobs.

---

## Rule 2

**Rule Name:** monitor-consumer-group-lag

**Category:** Always

**Rule:** Always monitor consumer group PEL (Pending Entry List) length and lag.

**Reason:** Growing PEL indicates a dead consumer or failed processing — without monitoring, messages accumulate invisibly.

**Bad Example:**
```php
// No monitoring — undelivered messages accumulate silently
```

**Good Example:**
```php
$pending = Redis::xpending('stream:orders', 'group:orders');
if ($pending['pending'] > 100) { alert('Consumer group lag growing'); }
```

**Exceptions:** Development and low-volume systems where manual checks suffice.

**Consequences Of Violation:** A consumer crashes mid-processing — its pending messages stay in the PEL forever. Other consumers don't pick them up (they're assigned to the dead consumer), so those messages are lost.

---

## Rule 3

**Rule Name:** claim-pending-on-failure

**Category:** Always

**Rule:** Always implement pending message claiming when consumers are known to fail.

**Reason:** Pending messages assigned to a dead consumer are never reprocessed unless explicitly claimed.

**Bad Example:**
```php
// No claiming logic — pending messages stay unprocessed forever
```

**Good Example:**
```php
$redis->xclaim('stream:orders', 'group:orders', 'consumer:2', 3600000);
// Claims messages pending > 1 hour from other consumers
```

**Exceptions:** Idempotent job processing where at-most-once delivery is acceptable.

**Consequences Of ViolATION:** A consumer crashes mid-process — its 500 pending messages stay in other consumers' limbo. Messages are effectively lost with no automatic recovery.

---

## Rule 4

**Rule Name:** acknowledge-after-processing

**Category:** Always

**Rule:** Always call `XACK` after successful message processing.

**Reason:** Without acknowledgment, messages remain pending and are reprocessed after idle timeout, causing duplicates.

**Bad Example:**
```php
$message = $redis->xreadgroup(...);
processOrder($message); // Processed but never acknowledged
```

**Good Example:**
```php
$message = $redis->xreadgroup(...);
processOrder($message);
$redis->xack('stream:orders', 'group:orders', [$messageId]); // Acknowledge
```

**Exceptions:** Dead-letter scenarios where messages should remain pending for manual inspection.

**Consequences Of ViolATION:** Every hour (or after idle timeout), all 10,000 processed-but-unacknowledged messages flood back into the queue — workers reprocess them, causing order duplication and double charges.
