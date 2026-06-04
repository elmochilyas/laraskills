# Rule Card: K001 — Queue Connections vs. Queues Distinction

---

## Rule 1

**Rule Name:** define-topology-before-deploying

**Category:** Prefer

**Rule:** Prefer defining queue topology before deploying the first job.

**Reason:** Retroactive splitting of queue names or connections requires draining, migrating, and careful monitoring — all avoidable with upfront planning.

**Bad Example:**
```php
// Started with default queue — now need to reorganize
ProcessOrder::dispatch($order); // Default queue — hard to change later
```

**Good Example:**
```php
// Planned topology from day one
ProcessOrder::dispatch($order)->onQueue('critical');
ReportGenerator::dispatch($companyId)->onQueue('bulk');
```

**Exceptions:** Greenfield projects with uncertain workload patterns may start simple and add topology later — accept the migration cost.

**Consequences Of Violation:** Draining a queue to rename it or split it requires stopping workers, processing remaining jobs, and reconfiguring — during which jobs may queue up with no workers.

---

## Rule 2

**Rule Name:** name-queues-by-workload-characteristic

**Category:** Always

**Rule:** Always name queues by workload characteristic, not job class.

**Reason:** Queue names describe processing requirements (latency, resource intensity) — multiple job classes share the same queue.

**Bad Example:**
```php
ProcessOrder::dispatch()->onQueue('ProcessOrderQueue');
SendEmail::dispatch()->onQueue('SendEmailQueue');
```

**Good Example:**
```php
ProcessOrder::dispatch()->onQueue('critical'); // User-facing, fast
SendEmail::dispatch()->onQueue('default');     // Acceptable delay
```

**Exceptions:** Monolithic applications with very few job types may find job-class naming acceptable.

**Consequences Of Violation:** Proliferation of single-job-type queues — each with its own worker configuration, monitoring, and operational overhead, while many share identical processing requirements.

---

## Rule 3

**Rule Name:** no-separate-connections-per-queue

**Category:** Never

**Rule:** Never create separate connections per queue name.

**Reason:** Queues are logical partitions within a connection — separate connections create unnecessary infrastructure overhead.

**Bad Example:**
```php
// config/queue.php — one connection per queue
'critical' => ['driver' => 'redis', 'queue' => 'critical'],
'default'  => ['driver' => 'redis', 'queue' => 'default'],
```

**Good Example:**
```php
// One connection serves all queues
'redis' => ['driver' => 'redis', 'queue' => 'default'],
```

**Exceptions:** Separate connections are justified for different driver types (Redis + SQS) or fully isolated Redis instances per queue tier.

**Consequences Of Violation:** Unnecessary Redis connection pools, doubled infrastructure costs, and increased configuration complexity — all for logical partitions that one connection handles natively.

---

## Rule 4

**Rule Name:** set-after-commit-at-connection-level

**Category:** Always

**Rule:** Always set `after_commit` to `true` at the connection level.

**Reason:** Jobs dispatched within database transactions may process before the transaction commits — the worker sees stale or missing data.

**Bad Example:**
```php
// config/queue.php
'redis' => [
    'after_commit' => false, // Default — risk of processing uncommitted data
],
```

**Good Example:**
```php
'redis' => [
    'after_commit' => true, // Safe — defers dispatch until transaction commits
],
```

**Exceptions:** Jobs that must dispatch immediately (logging, analytics) should override per-dispatch.

**Consequences Of Violation:** A worker processes an order email before the order transaction commits — the email contains stale data or the database record doesn't exist yet.

---

## Rule 5

**Rule Name:** one-connection-many-queues

**Category:** Prefer

**Rule:** Prefer one connection serving many queues.

**Reason:** Adding a queue name to an existing connection requires zero infrastructure changes — it's just a different list key in Redis or a `WHERE queue = ?` condition.

**Bad Example:**
```php
// Adding a new queue created a new connection
'new_queue' => ['driver' => 'redis', 'queue' => 'new'],
```

**Good Example:**
```php
// Adding a queue name — no config changes needed
ProcessOrder::dispatch($order)->onQueue('new'); // Just use different queue name
```

**Exceptions:** When using different driver types per workload (e.g., Redis for latency-sensitive, SQS for durable bulk), separate connections are correct.

**Consequences Of Violation:** Infrastructure costs scale with number of connections instead of number of queues — each new feature flow adds a connection when it only needed a queue name.
