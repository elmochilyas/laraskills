# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** K039 — Amazon SQS Visibility Timeout and Queue Types
- **Knowledge ID:** K039
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-02
- **Source References:**
  - AWS SQS Docs
  - Laravel Source — `Illuminate\Queue\SqsQueue`

---

# Overview

Amazon SQS offers two queue types: **Standard** (at-least-once delivery, high throughput, no ordering) and **FIFO** (exactly-once, ordered, 300 TPS). The **visibility timeout** prevents multiple consumers from processing the same message — when a worker polls a message, it becomes invisible for the timeout duration. If the worker doesn't delete the message within that window, it reappears for reprocessing. Misconfiguring visibility timeout versus Laravel's `retry_after` is the primary source of SQS double-processing issues.

---

# Core Concepts

- **Standard queue:** At-least-once delivery. Messages may be delivered more than once. No ordering. Unlimited throughput.
- **FIFO queue:** First-In-First-Out with exactly-once processing. Requires `MessageGroupId`. 300 TPS (3000 with batching).
- **Visibility timeout:** Period a polled message is hidden from other consumers. Default 30s. Max 12 hours.
- **`retry_after`:** Laravel config that determines when a job is considered failed. Must be ≤ SQS visibility timeout.
- **Redrive policy:** Messages exceeding `maxReceiveCount` move to SQS Dead-Letter Queue.
- **Receipt handle:** Returned by `ReceiveMessage` — required for `DeleteMessage` and `ChangeMessageVisibility`.

---

# When To Use

- **Standard:** High throughput workloads where ordering doesn't matter. Stateless job processing.
- **FIFO:** Strict ordering required and throughput ≤ 300 TPS per message group.
- **SQS over Redis:** When you want zero server management and unlimited queue scale, even without Horizon compatibility.

---

# When NOT To Use

- FIFO when throughput exceeds 300 TPS — use Standard or Kafka instead
- When Horizon monitoring is essential — Horizon only supports Redis
- Sub-millisecond latency requirements — SQS API adds 20-100ms per operation

---

# Best Practices

- **Set `retry_after` 5-10 seconds LESS than the SQS visibility timeout.** If `retry_after = 90` and visibility timeout = 60, SQS makes the message visible at 60s but Laravel considers the job still running until 90s — a second worker processes it (double processing). *Why: The visibility timeout is a hard SQS limit — once it expires, the message is automatically visible to other workers regardless of Laravel's internal state. `retry_after` must be shorter to ensure Laravel declares the job failed before SQS releases it.*
- **Use long polling (`WaitTimeSeconds=20`).** Reduces empty responses and API costs. *Why: Short polling returns immediately with no messages (empty response costs the same as one with messages). Long polling waits up to 20 seconds, returning only when messages are available or the wait expires — far fewer API calls.*
- **Set Redrive policy (`maxReceiveCount`) for all queues.** Without it, poison messages are re-delivered indefinitely. *Why: A corrupt message that always causes the worker to release it cycles forever, consuming worker time and never being removed. Redrive moves it to DLQ after N attempts.*
- **Use message group IDs for FIFO ordering per entity.** All messages with the same `MessageGroupId` are processed in order, within the FIFO queue's throughput limit. *Why: FIFO queues guarantee ordering within a group, but different groups can be processed in parallel — this is how you scale FIFO processing.*

---

# Performance Considerations

- Standard queue: virtually unlimited throughput (AWS auto-scales).
- FIFO: 300 msg/s (3000 with batches of 10). Per-message-group throughput capped.
- SQS API latency: 20-100ms per operation (ReceiveMessage, DeleteMessage).
- Message size limit: 256KB. Laravel 11+ uses SQS overflow storage for larger payloads.

---

# Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| `retry_after` > visibility timeout | Misconfigured timing | Double processing — SQS releases before Laravel fails | Set `retry_after` < visibility timeout |
| FIFO without `MessageGroupId` | Missing required param | Message rejected by SQS | Always include MessageGroupId |
| Short polling (default) | Not configuring long polling | 10x more API requests for same throughput | Set `WaitTimeSeconds=20` |
| No maxReceiveCount | Redrive policy not set | Poison message cycles forever | Set maxReceiveCount + DLQ |

---

# Examples

```php
// config/queue.php
'sqs' => [
    'driver' => 'sqs',
    'key' => env('AWS_ACCESS_KEY_ID'),
    'secret' => env('AWS_SECRET_ACCESS_KEY'),
    'prefix' => 'https://sqs.us-east-1.amazonaws.com/account',
    'queue' => 'default',
    'suffix' => null,
    'region' => 'us-east-1',
    'retry_after' => 50, // Must be < SQS visibility timeout (default 60)
    'after_commit' => true,
],
```

---

# Related Topics

- **K002 Queue Driver Architecture (K002)** — SQS as a Laravel driver
- **K023 Dead-Letter Queue Pattern (K023)** — Redrive and DLQ pattern
