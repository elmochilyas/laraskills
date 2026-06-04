# Rule Card: K039 — Amazon SQS

---

## Rule 1

**Rule Name:** bump-visibility-timeout-for-job-duration

**Category:** Always

**Rule:** Always set SQS visibility timeout equal to your longest job's `timeout at 3×`.

**Reason:** Shorter visibility timeout causes message redelivery mid-processing — duplicate processing.

**Bad Example:**
```php
// config/queue.php
'sqs' => [
    'driver' => 'sqs',
    'visibility_timeout' => 30, // 30 seconds — too short for a 2-minute job
],
```

**Good Example:**
```php
'sqs' => [
    'driver' => 'sqs',
    'visibility_timeout' => 120, // Matches longest job
],
```

**Exceptions:** Jobs with explicit heartbeats (SQS extended client) can use shorter timeouts.

**Consequences Of ViolATION:** A 60-second job has a 30-second visibility timeout — after 30 seconds, another worker receives the same message. Both workers process it, causing duplicate side effects.

---

## Rule 2

**Rule Name:** never-create-queues-on-the-fly

**Category:** Never

**Rule:** Never create SQS queues dynamically at runtime.

**Reason:** SQS queue creation is an infrastructure operation that requires IAM permissions and can hit API rate limits.

**Bad Example:**
```php
$queueUrl = Bus::dispatch(new ProcessOrder(...))->onQueue('order-' . rand(1,1000));
// Dynamically creates queue names
```

**Good Example:**
```php
// Pre-provision queues via Terraform or CloudFormation
// Use in code:
ProcessOrder::dispatch()->onQueue('orders');
```

**Exceptions:** Multi-tenant systems with auto-provisioned infrastructure can create queues if backed by proper permissions and rate limiting.

**Consequences Of ViolATION:** An attacker sends requests with randomized queue names — SQS API rate limit (3000 req/s per account) is hit, legitimate queue operations fail, and AWS bills spike.

---

## Rule 3

**Rule Name:** use-same-message-group-id-for-dedup

**Category:** Always

**Rule:** Always use the same `MessageGroupId` for messages that must be ordered within a FIFO queue.

**Reason:** Without `MessageGroupId`, FIFO queues deliver max 300 messages/s — with per-group ordering, messages in different groups process in parallel.

**Bad Example:**
```php
// All messages use same group — serial processing bottleneck
```

**Good Example:**
```php
return [
    'message_group_id' => 'order:' . $this->order->tenant_id,
    'message_deduplication_id' => 'order:ship:' . $this->order->id,
];
```

**Exceptions:** FIFO queues with global ordering (single group) are acceptable for very low throughput (< 300 msg/s).

**Consequences Of ViolATION:** A busy tenant's batch of 1000 orders processes serially at 300 msg/s — the tenant's last order waits 3+ seconds before processing, while other tenants sit idle.

---

## Rule 4

**Rule Name:** handle-sqs-long-poll-correctly

**Category:** Always

**Rule:** Always enable SQS long polling (`WaitTimeSeconds = 20`).

**Reason:** Short polling returns empty responses frequently, wasting CPU and API calls.

**Bad Example:**
```php
'sqs' => [
    'driver' => 'sqs',
    // WaitTimeSeconds defaults to 0 — short polling
],
```

**Good Example:**
```php
'sqs' => [
    'driver' => 'sqs',
    'queue' => env('SQS_QUEUE_URL'),
    'region' => env('AWS_DEFAULT_REGION'),
    'prefix' => env('SQS_PREFIX'),
    'attributes' => ['WaitTimeSeconds' => 20],
],
```

**Exceptions:** Development environments or cost-sensitive workloads where immediate pickup isn't required.

**Consequences Of ViolATION:** Workers poll SQS every second with empty responses — 86,400 API calls per day per worker at $0.40/million = $35/month/worker for nothing. Worker CPU is 80% empty-poll overhead.
