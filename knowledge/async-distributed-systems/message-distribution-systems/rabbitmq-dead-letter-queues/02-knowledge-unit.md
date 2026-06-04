# Metadata
Domain: Async & Distributed Systems
Subdomain: Message Distribution Systems
Knowledge Unit: RabbitMQ Dead-Letter Queues, Per-Message Ack
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary
RabbitMQ provides native dead-letter queue (DLQ) support through exchange-level configuration. When a message is negatively acknowledged (`basic.nack`), rejected (`basic.reject`), or expires (`TTL`), the broker can route it to a configured dead-letter exchange, which routes it to a dead-letter queue. This is more robust than application-level DLQ because it happens at the broker level — the message never reaches the consumer. Per-message acknowledgment (`basic.ack`/`basic.nack`) gives consumers fine-grained control over message success/failure at the protocol level.

# Core Concepts
- **Dead-letter exchange (DLX)**: An exchange configured on a queue. Messages that are rejected, nack'ed, or expired are routed here.
- **Dead-letter queue (DLQ)**: A queue bound to the DLX. Stores failed messages for later inspection or reprocessing.
- **`x-dead-letter-exchange`**: Queue argument specifying the DLX name.
- **`x-dead-letter-routing-key`**: Optional — overrides the original routing key when routing to DLX.
- **Per-message ack**: Consumer explicitly acknowledges (`basic.ack`) success or rejects (`basic.nack`/`basic.reject`) each message.
- **TTL to DLQ**: Messages with a Time-To-Live (`x-message-ttl`) that expire are routed to DLX automatically.

# Mental Models
- **Hospital triage**: The main queue is the emergency room. Messages that can't be handled (rejected) are sent to the hospital's morgue (DLQ). A coroner (DLQ consumer) inspects them. 
- **Airport baggage reclaim**: The conveyor belt (queue) delivers bags. Passengers (consumers) take bags (ack) or reject them (nack). Unclaimed bags after X minutes (TTL) go to lost luggage (DLQ).

# Internal Mechanics
- Queue is declared with `x-dead-letter-exchange` argument pointing to an exchange.
- When a consumer calls `basic.nack` with `requeue=false` or `basic.reject` with `requeue=false`, the broker moves the message to the DLX.
- Messages that exceed their TTL (`x-message-ttl`) are also moved to DLX.
- Queue length limit (`x-max-length`) exceeded: oldest messages are dead-lettered (or dropped, per config).
- The DLX routes to one or more DLQs based on binding rules.
- The original message headers may include `x-death` array tracking how many times it was dead-lettered and why.
- In Laravel integration (`laravel-queue-rabbitmq`), `basic.nack` with requeue=false is triggered when the job exhausts its retry attempts.

# Patterns
## TTL-Based Graceful Degradation
- **Purpose**: Automatically dead-letter messages that couldn't be processed in time.
- **Benefit**: Queue doesn't fill with stale messages.
- **Tradeoff**: TTL must be set appropriately — too short kills valid messages.

## DLQ with Retry Routing
- **Purpose**: Route dead-lettered messages to a retry exchange for reprocessing.
- **Benefit**: Automatic retry with backoff before permanent failure.
- **Tradeoff**: Loop detection required — messages may cycle between queue and DLQ indefinitely.

## Per-Message Ack for Long Processing
- **Purpose**: Acknowledge only after the message is fully processed.
- **Benefit**: No message loss on consumer crash — unacknowledged messages are re-delivered.
- **Tradeoff**: Unacked messages count toward queue depth; monitoring needed.

# Architectural Decisions
- **Use RabbitMQ native DLQ over application-level DLQ for**: Data safety, guaranteed routing, audit trail via `x-death` headers.
- **Use per-message ack for all production systems**: Auto-ack is only acceptable for loss-tolerant scenarios.
- **TTL + DLQ for scheduled retry**: Set TTL on the main queue, DLQ routes to a retry exchange after TTL expiry.
- **Always monitor DLQ depth**: A growing DLQ indicates systemic failure. Empty DLQ means either nothing fails or DLQ is misconfigured.

# Tradeoffs
Native DLQ | Broker-guaranteed routing, no app code for basic cases | Requires broker configuration; less flexible than app-level
Application-level DLQ | Full control, Laravel-idiomatic | Extra dispatch per failure; broker-agnostic but misses broker features
Per-message ack | No message loss, fine-grained control | More complex consumer code; unacked messages block queue

# Performance Considerations
- DLQ routing happens in the broker — no application overhead for dead-letter decisions.
- Per-message ack requires one RabbitMQ round-trip per message. High-throughput consumers may batch acks.
- `basic.nack` with `requeue=false` is immediate — no delay. DLQ consumers may see failed messages rapidly.
- TTL checks happen on message expiry (lazy) — not on every broker tick. Minimal overhead.

# Production Considerations
- Always configure a DLX on production queues. Without one, rejected messages are silently dropped.
- Monitor DLQ depth and oldest message age. A growing DLQ with no consumer means failures are not being analyzed.
- Set max retries per message via `x-delivery-limit` (RabbitMQ 3.8+) — messages exceeding the limit are dead-lettered or dropped.
- The `x-death` header tracks dead-letter history — useful for debugging.
- DLQ consumers should have different alerting thresholds than main queue consumers.
- For Laravel integration, ensure `laravel-queue-rabbitmq` package version handles nack/ack correctly (known compatibility issues).

# Common Mistakes
- **Not configuring DLX on production queues**: Rejected or nack'ed messages are silently dropped. No trace.
- **Using `basic.reject` with `requeue=true`**: Causes infinite requeue loop for failing messages. Always use `requeue=false` for non-retryable failures.
- **No monitoring on DLQ**: Messages pile up in DLQ unnoticed. Only discovered when significant data loss has occurred.
- **Not setting `x-delivery-limit`**: A message can be continuously rejected, requeued, and rejected again indefinitely.
- **Consuming DLQ with auto-ack**: Auto-ack removes messages from DLQ without processing. Defeats the purpose.

# Failure Modes
- **DLQ message build-up > disk space**: RabbitMQ has disk space alarm thresholds. When exceeded, all publishing is blocked.
- **Message cycle between queue and DLQ**: A DLQ routes back to the original queue (misconfigured bindings), creating an infinite loop.
- **`x-delivery-limit` without DLX**: Message exceeds delivery limit and is dropped, not dead-lettered. Silent loss.
- **Consumer ack timeout**: RabbitMQ times out unacked messages (consumer timeout, default 30 minutes). Messages are requeued and re-consumed, potentially duplicating work.
- **DLQ routing key mismatch**: DLX routes messages to a queue that doesn't exist. Messages are unroutable and dropped.

# Ecosystem Usage
- **RabbitMQ server**: Core feature since RabbitMQ 2.0. Configured via queue arguments.
- **`vyuldashev/laravel-queue-rabbitmq`**: Provides Laravel integration. Maps Laravel's failed job handling to RabbitMQ's nack behavior.
- **Spatie packages**: Not directly RabbitMQ-related, but Spatie webhook-server can use RabbitMQ-backed DLQ for dead-lettering webhook jobs.

# Related Knowledge Units
- K036 RabbitMQ Exchange Types (routing basis for DLX) | K023 Dead-Letter Queue Pattern (conceptual comparison)

## Research Notes
- RabbitMQ exchange types (direct, topic, fanout, headers) enable different routing strategies — direct routes by routing key, topic supports wildcard patterns, fanout broadcasts to all queues, headers routes by message header attributes.
- RabbitMQ dead letter queues require configuring both the source queue's x-dead-letter-exchange argument and the dead letter queue's binding — messages are dead-lettered when they exceed TTL, are rejected, or exceed queue length limits.
- Kafka topics are partitioned for parallel consumption — the number of partitions determines the maximum consumer parallelism within a consumer group, and partition assignment is handled automatically by the consumer group coordinator.
- Amazon SQS visibility timeout is the period during which a consumed message is hidden from other consumers — if the message is not deleted within the timeout, it becomes visible again, potentially causing duplicate processing.
- Redis Streams as a queue backend (Laravel 12+) offer consumer groups, pending message lists, and message acknowledgment — this is more feature-rich than the default Redis list-based queue.
- The lucas/phpdotenv dependency is not required for SQS queue configuration — all SQS connection parameters (key, secret, region, bucket) are set in config/queue.php.
- Community packages like mateusjunges/laravel-kafka and ladimir-yuldashev/laravel-queue-rabbitmq provide Laravel-native queue drivers for Kafka and RabbitMQ.
- Message ordering guarantees vary by backend: Redis lists preserve FIFO within a single queue, SQS standard queues offer at-least-once delivery without strict ordering, Kafka preserves ordering within a partition.
