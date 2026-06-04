# Rule Card: K037 — RabbitMQ Dead-Letter Queues and Retry

---

## Rule 1

**Rule Name:** configure-dlx-for-failed-messages

**Category:** Always

**Rule:** Always configure a Dead Letter Exchange (DLX) for production queues.

**Reason:** Without DLX, rejected messages are dropped or re-queued indefinitely, causing infinite retry loops.

**Bad Example:**
```php
$this->fail($order); // Message dropped — no dead letter queue
```

**Good Example:**
```php
// Queue declares a DLX:
'x-dead-letter-exchange' => 'orders.dlx',
'x-dead-letter-routing-key' => 'orders.failed',
```

**Exceptions:** Development queues where message loss is acceptable.

**Consequences Of Violation:** A corrupted message is rejected and re-queued — the worker retries endlessly, consuming 100% CPU on a message that will never succeed, while blocking valid messages behind it.

---

## Rule 2

**Rule Name:** set-max-length-before-dlx

**Category:** Always

**Rule:** Always set `x-max-length` and `x-overflow: reject-publish` on queues.

**Reason:** Backpressure prevents a consumer failure from filling disk space and crashing the broker.

**Bad Example:**
```php
// No max length — unbounded queue growth
```

**Good Example:**
```php
'x-max-length' => 100000,
'x-overflow' => 'reject-publish',
'x-dead-letter-exchange' => 'overflow.dlx',
```

**Exceptions:** Audit log queues where no message can be dropped.

**Consequences Of ViolATION:** A worker dies — 10 million messages pile up in the queue. RabbitMQ hits `disk_free_limit` and blocks all publishers, taking down the entire application.

---

## Rule 3

**Rule Name:** route-dead-lettered-to-named-queue

**Category:** Always

**Rule:** Always bind a consumer to the dead-letter queue for alerting and manual replay.

**Reason:** Dead-lettered messages accumulate silently — without a consumer, you never know messages are failing.

**Bad Example:**
```php
// Dead letters go to DLX but no queue is bound — messages vanish
```

**Good Example:**
```php
$channel->queue_declare('orders.failed', false, true, false, false);
$channel->queue_bind('orders.failed', 'orders.dlx', 'orders.failed');
$channel->basic_consume('orders.failed', 'dlx_consumer', false, false, false, false, $callback);
```

**Exceptions:** None — dead-letter queues should always have monitoring.

**Consequences Of ViolATION:** Messages fail at scale due to a schema change — the dead-letter exchange receives them but no queue is bound. Nobody notices for days until a user reports missing data.

---

## Rule 4

**Rule Name:** separate-dlx-retry-from-fatal

**Category:** Prefer

**Rule:** Prefer separate DLX routing keys for retryable vs. fatal errors.

**Reason:** Retryable failures (network timeout) and fatal failures (validation error) need different handling.

**Bad Example:**
```php
// All failures go to the same DLX — retry and fatal mixed together
```

**Good Example:**
```php
// Retryable — goes to retry queue with TTL
$channel->basic_publish($msg, 'orders.dlx', 'orders.retry.5s');

// Fatal — goes to human-inspection queue
$channel->basic_publish($msg, 'orders.dlx', 'orders.fatal');
```

**Exceptions:** Small applications where manual inspection of all failures is feasible.

**Consequences Of ViolATION:** A transient network error sends a message to the same place as a validation error — operators can't distinguish between "retry me" and "fix me first," so all messages wait for manual triage.
