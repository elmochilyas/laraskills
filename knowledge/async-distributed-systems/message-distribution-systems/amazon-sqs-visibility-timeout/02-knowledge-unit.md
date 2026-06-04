# Metadata
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: Amazon SQS Visibility Timeout, FIFO vs Standard
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Amazon SQS is a fully managed queue service with two queue types: **Standard** (at-least-once, high throughput, no ordering) and **FIFO** (exactly-once, ordered, limited throughput). The **visibility timeout** is the mechanism that prevents multiple consumers from processing the same message — when a worker polls a message, it becomes invisible to other workers for the timeout duration. If the worker doesn't delete the message within that window, the message becomes visible again for reprocessing. Misconfiguring the visibility timeout versus Laravel's `retry_after` is the primary source of SQS double-processing issues.

# Core Concepts
- **Standard queue**: At-least-once delivery. Messages may be delivered more than once (network issues, timeouts). No ordering guarantee. Unlimited throughput.
- **FIFO queue**: First-In-First-Out with exactly-once processing. Message ordering preserved. 300 TPS (with batching: 3000 TPS). Requires message group IDs and deduplication IDs.
- **Visibility timeout**: The period during which a polled message is hidden from other consumers. Default 30 seconds. Max 12 hours.
- **`retry_after`**: Laravel's config that determines when a job is considered failed and available for retry. Must be ≤ SQS visibility timeout.
- **Redrive policy**: If a message exceeds `maxReceiveCount`, it can be moved to a Dead-Letter Queue (SQS-native DLQ).
- **Message deduplication (FIFO)**: Based on message body (content-based dedup) or explicit `MessageDeduplicationId`. Prevents duplicate message insertion within the 5-minute dedup window.

# Mental Models
- **Library book checkout**: When you take a book (message) from the shelf (queue), it's checked out to you (visibility timeout). You must return it (delete) before the checkout period expires. If you don't, it's returned to the shelf and someone else can check it out.
- **Borrow-return system**: FIFO = numbered books that must be returned in order. Standard = any copy is fine.

# Internal Mechanics
- Worker polls SQS via `ReceiveMessage` API. Returns up to 10 messages.
- Each message gets a `ReceiptHandle` — required for `DeleteMessage` and `ChangeMessageVisibility` calls.
- The visibility timer starts when the message is received. Default 30 seconds.
- If `DeleteMessage` is called within the timeout: message is gone.
- If `ChangeMessageVisibility` is called (extend): the timer is reset.
- If neither is called before timeout: message becomes visible again (allows retry).
- Laravel's `SqsQueue::pop()` calls `ReceiveMessage`. `SqsQueue::delete()` calls `DeleteMessage`. `SqsQueue::release()` calls `ChangeMessageVisibility(0)` to make the message immediately visible.
- `retry_after` must be LESS than the SQS visibility timeout. If `retry_after = 90` and visibility timeout = 60, Laravel considers the job failed after 90s, but SQS made it visible at 60s — a second worker processes it (double processing).

# Patterns
## FIFO for Strict Ordering
- **Purpose**: Process jobs in exact order within a message group.
- **Benefit**: Guaranteed order per message group ID.
- **Tradeoff**: 300 TPS limit; throughput caps at per-group level.

## Separate Queues per Priority
- **Purpose**: Simulate priority without SQS ordering support.
- **Benefit**: Each priority level has own throughput and scaling.
- **Tradeoff**: More SQS queues; separate worker configuration.

## SQS + Lambda for Serverless Processing
- **Purpose**: Process SQS messages without persistent workers.
- **Benefit**: Zero server management; auto-scales to any volume.
- **Tradeoff**: Lambda cold starts; 15-minute max execution; no Horizon.

# Architectural Decisions
- **`retry_after` must be ≤ SQS visibility timeout**: Set `retry_after` to 5-10 seconds less than the visibility timeout. Never equal.
- **Use FIFO when**: Ordering is critical and throughput ≤ 300 TPS per group.
- **Use Standard when**: High throughput needed, or ordering doesn't matter.
- **SQS vs Redis for Laravel**: SQS trades Horizon compatibility, lower latency for zero operations overhead and unlimited scale.

# Tradeoffs
SQS Standard | Unlimited throughput, fully managed, no servers | At-least-once (duplicates), no ordering, no Horizon
SQS FIFO | Exactly-once, strict ordering | 300 TPS limit, per-group throughput caps
Redis + Horizon | High throughput, auto-balancing, dashboard | Requires Redis server; operational overhead

# Performance Considerations
- Standard queue: virtually unlimited throughput (AWS scales automatically).
- FIFO: 300 messages/second (3000 with batching of 10). Per message group ID.
- Visibility timer management: workers that process longer than the visibility timeout must extend it via `ChangeMessageVisibility`.
- SQS API latency: 20-100ms per operation (ReceiveMessage, DeleteMessage). Loop overhead for busy workers.
- Long polling (`WaitTimeSeconds=20`): reduces empty responses and costs. Set `WaitTimeSeconds` in SQS config.

# Production Considerations
- Monitor `ApproximateAgeOfOldestMessage` and `ApproximateNumberOfMessagesVisible` as primary health metrics.
- Set SQS queue policy to grant required permissions (sqs:ReceiveMessage, sqs:DeleteMessage, sqs:ChangeMessageVisibility).
- For FIFO, ensure consumers process messages within the 5-minute dedup window to avoid dedup ID reuse.
- SQS message size limit: 256KB. Use Laravel's SQS overflow storage for larger payloads (Laravel 11+).
- Cost: $0.40 per million requests. A busy worker polling every second = $1.04/month per worker.

# Common Mistakes
- **`retry_after` > visibility timeout**: SQS makes the message visible before Laravel considers it failed. A second worker grabs it — double processing.
- **Using FIFO without message group ID**: FIFO requires `MessageGroupId`. Without it, the message is rejected.
- **Not using long polling**: Short polling (default) returns empty responses when no messages. Costs more requests for the same throughput.
- **Assuming FIFO exactly-once across worker restarts**: If a worker receives a message, starts processing, and crashes before deleting, SQS redelivers after visibility timeout. FIFO prevents DUPLICATE INSERTION but not duplicate delivery.
- **Not setting maxReceiveCount (Redrive policy)**: A poison message is re-delivered indefinitely. Set `maxReceiveCount` to move to DLQ.

# Failure Modes
- **Visibility timeout too short**: Worker crashes after visibility timeout. Message re-appears for another worker (duplicate processing before the original worker would have finished).
- **SQS throttling (FIFO)**: 300 TPS exceeded. `RequestThrottled` error. Messages stay unwritten.
- **DLQ fills up**: Messages exceeding maxReceiveCount move to DLQ. If DLQ has no consumer or alert, failures pile up unnoticed.
- **SQS outage**: AWS SQS is highly available but regional outages can occur. Messages queued during outage are lost (if not retried by producer).
- **Signature validation failure**: AWS credentials rotated but not updated in Laravel config. SQS API calls fail with 403.

# Ecosystem Usage
- **Laravel framework**: Built-in `sqs` queue driver. `SqsQueue`, `SqsConnector` classes in `Illuminate\Queue`.
- **Laravel Horizon**: Does NOT support SQS. Horizon only works with Redis driver.
- **Laravel Pulse**: Works with SQS — tracks job throughput and failures regardless of driver.
- **Spatie packages**: Can use SQS-backed queues. Webhook delivery to SQS scales to very high volume.

# Related Knowledge Units
- K002 Queue Driver Architecture (SQS as a driver) | K023 Dead-Letter Queue Pattern (DLQ via Redrive Policy)

## Research Notes
- RabbitMQ exchange types (direct, topic, fanout, headers) enable different routing strategies — direct routes by routing key, topic supports wildcard patterns, fanout broadcasts to all queues, headers routes by message header attributes.
- RabbitMQ dead letter queues require configuring both the source queue's x-dead-letter-exchange argument and the dead letter queue's binding — messages are dead-lettered when they exceed TTL, are rejected, or exceed queue length limits.
- Kafka topics are partitioned for parallel consumption — the number of partitions determines the maximum consumer parallelism within a consumer group, and partition assignment is handled automatically by the consumer group coordinator.
- Amazon SQS visibility timeout is the period during which a consumed message is hidden from other consumers — if the message is not deleted within the timeout, it becomes visible again, potentially causing duplicate processing.
- Redis Streams as a queue backend (Laravel 12+) offer consumer groups, pending message lists, and message acknowledgment — this is more feature-rich than the default Redis list-based queue.
- The lucas/phpdotenv dependency is not required for SQS queue configuration — all SQS connection parameters (key, secret, region, bucket) are set in config/queue.php.
- Community packages like mateusjunges/laravel-kafka and ladimir-yuldashev/laravel-queue-rabbitmq provide Laravel-native queue drivers for Kafka and RabbitMQ.
- Message ordering guarantees vary by backend: Redis lists preserve FIFO within a single queue, SQS standard queues offer at-least-once delivery without strict ordering, Kafka preserves ordering within a partition.
