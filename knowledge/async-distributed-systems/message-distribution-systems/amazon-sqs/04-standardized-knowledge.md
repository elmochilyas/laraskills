# Metadata

- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** Amazon SQS
- **Knowledge ID:** K039
- **Difficulty Level:** Advanced
- **Last Standardized:** 2026-06-04
- **Source References:**
  - AWS SQS Documentation
  - Laravel Source — `Illuminate\Queue\SqsQueue`
  - Laravel Queue Configuration Guide

---

# Overview

Amazon SQS (Simple Queue Service) is a fully managed message queuing service that decouples application components in distributed systems. In the Laravel ecosystem, SQS serves as a queue driver alternative to Redis and database backends, offering infinite scalability, managed infrastructure, and integration with the broader AWS ecosystem. Unlike Redis queues, SQS requires no server management, automatically replicates messages across Availability Zones, and provides configurable message retention up to 14 days.

SQS offers two queue types: **Standard** (at-least-once delivery, high throughput, no ordering) and **FIFO** (First-In-First-Out, exactly-once processing, ordered, 300 TPS base). The **visibility timeout** mechanism prevents multiple consumers from simultaneously processing the same message — when a worker polls a message, it becomes invisible to other consumers for the configured duration. If the worker fails to delete the message within that window, it reappears for reprocessing.

Engineers choose SQS when they need reliable, managed queue infrastructure without operational overhead. The primary tradeoff versus Redis queues is latency (20-100ms per API call) and the inability to use Horizon for monitoring.

---

# Core Concepts

- **Standard Queue:** At-least-once delivery. Messages may be delivered more than once. No ordering guarantees. Virtually unlimited throughput. Use for stateless, idempotent workloads.
- **FIFO Queue:** First-In-First-Out with exactly-once processing support. Requires `MessageGroupId`. Base throughput of 300 messages/second (3000 with batching). Name must end in `.fifo`.
- **Visibility Timeout:** Period a polled message remains hidden from other consumers. Default 30 seconds. Maximum 12 hours. Must align with Laravel's `retry_after` configuration.
- **Dead-Letter Queue (DLQ):** Secondary queue where messages are routed after exceeding `maxReceiveCount`. Prevents poison messages from cycling indefinitely.
- **Long Polling:** `WaitTimeSeconds` parameter (0-20) that makes `ReceiveMessage` wait for messages to become available, reducing empty responses and API costs.
- **Message Group ID:** Required for FIFO queues. Messages within the same group are delivered in order. Different groups can process in parallel.
- **Message Deduplication ID:** Used by FIFO queues to prevent duplicate message entry within the 5-minute deduplication window.
- **Receipt Handle:** Returned by `ReceiveMessage` — required to delete or change visibility of a specific message receipt.
- **Redrive Policy:** Queue attribute defining `maxReceiveCount` and DLQ target ARN. Controls how many times a message is attempted before moving to DLQ.
- **Extended Client Library:** SDK feature for handling messages up to 2GB by storing payload in S3 and referencing via SQS message.

---

# When To Use

- **Stateless job processing:** Backup, email sending, report generation, webhook delivery where ordering doesn't matter.
- **High-throughput workloads:** Standard queues scale to virtually unlimited throughput without provisioning.
- **Zero-infrastructure queues:** No Redis or database server to manage. AWS handles replication, failover, and scaling.
- **Cross-account or cross-region decoupling:** SQS integrates with SNS, Lambda, and Step Functions for multi-service orchestration.
- **Compliance-required durability:** Messages are replicated across 3 AZs. 14-day max retention.
- **FIFO ordering requirements:** Financial transactions, event sourcing where strict ordering is required and throughput fits within limits.
- **Bursty workloads:** Queues buffer traffic spikes, allowing workers to process at their own pace.
- **Integration with AWS ecosystem:** Trigger Lambda functions, fan-out via SNS, or feed into Kinesis streams.

---

# When NOT To Use

- **Sub-millisecond latency requirements:** SQS API calls add 20-100ms per operation. Use Redis streams for low-latency queuing.
- **Horizon monitoring is required:** Horizon only supports Redis and database queue drivers. SQS queues are invisible to Horizon.
- **FIFO throughput exceeds 300 TPS per group:** Use Kafka or multiple FIFO queues with sharding instead.
- **Simple single-server applications:** The database queue or synchronous processing is simpler for low-volume apps.
- **Messages > 256KB (unextended):** Without the Extended Client Library, 256KB is the hard limit. Use the extended client (S3-backed) or chunk large payloads.
- **Exactly-once guarantees needed across failures:** SQS Standard delivers at-least-once. FIFO provides exactly-once within limits. For transactional exactly-once, use Kafka with idempotent producers.
- **Temporary/testing queues:** Creating queues dynamically is an anti-pattern. Use database queue for ephemeral needs.

---

# Best Practices

- **Set `retry_after` 5-10 seconds less than visibility timeout.** If `retry_after` > visibility timeout, SQS releases the message before Laravel considers the job failed, causing double processing. *Why: SQS's visibility timeout is a hard broker-level limit — once expired, the message is visible to any consumer regardless of Laravel's internal state. `retry_after` must be shorter so Laravel declares failure before SQS releases the message.*
- **Enable long polling (`WaitTimeSeconds=20`).** Reduces empty ReceiveMessage responses by 95%, cutting API costs and worker CPU overhead. *Why: Short polling samples a subset of servers — if no messages are found, it returns immediately. Long polling waits across all servers for up to 20 seconds, returning only when messages arrive or the wait expires.*
- **Configure a Dead-Letter Queue with `maxReceiveCount=3`.** Prevents poison messages from cycling forever. *Why: A malformed message that always causes processing failures will be re-delivered up to `maxReceiveCount` times, then moved to DLQ where it can be inspected and reprocessed after the root cause is fixed.*
- **Pre-provision all queues via Infrastructure as Code (Terraform, CloudFormation).** Never create queues dynamically at runtime. *Why: Queue creation is an infrastructure operation requiring IAM permissions. Dynamic creation opens security vectors (rate-limit exhaustion, cost explosion) and bypasses change management.*
- **Use tenant/entity-scoped `MessageGroupId` for FIFO queues.** All messages with the same group ID are ordered; different groups process in parallel. *Why: A single static group ID serializes all messages, capping throughput at 300 TPS regardless of worker count. Scoped group IDs enable parallel processing per entity while maintaining per-entity ordering.*
- **Use content-based deduplication for FIFO queues when possible.** Avoids sending explicit `MessageDeduplicationId` while still preventing duplicate entries. *Why: Content-based deduplication uses SHA-256 of the message body — identical messages within the 5-minute window are automatically deduplicated without client-side logic.*
- **Set appropriate message retention (default 4 days, max 14).** Match retention to your maximum acceptable consumer lag. *Why: Longer retention increases storage costs and means stale messages may be processed after a long consumer outage. Shorter retention risks losing messages before consumers process them.*

---

# Architecture Guidelines

- **SQS is a boundary decoupling mechanism, not a data store.** Queues should not hold data longer than necessary for processing. Process messages promptly and delete them.
- **One queue per message type or processing group.** Avoid routing multiple unrelated job types through a single queue — it makes monitoring, scaling, and DLQ management harder.
- **DLQ per source queue (or shared per service).** A shared DLQ for similar queues simplifies monitoring; per-queue DLQs give finer control over reprocessing.
- **Use SQS as the integration point between bounded contexts in a microservice architecture.** Each service owns its input queue and processes messages at its own pace.
- **IAM least-privilege for queue operations.** Application roles should have only `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:ChangeMessageVisibility`, `sqs:SendMessage`. Queue management operations (`sqs:CreateQueue`, `sqs:DeleteQueue`) should be restricted to infrastructure roles.
- **Separate queue connections for different latency/service-level requirements.** A low-latency order processing queue and a high-latency email queue should be separate connections to avoid head-of-line blocking.
- **Use SQS as a buffer between sync and async boundaries.** For example, an HTTP controller dispatches to SQS, and a worker processes the job asynchronously. This keeps API response times fast and predictable.
- **Consider FIFO for event sourcing and CQRS event stores** where event order matters and throughput fits within limits.

---

# Performance Considerations

- **Standard queue throughput:** Virtually unlimited. AWS auto-scales backend resources.
- **FIFO throughput:** 300 messages/second base (3000 with batching 10 messages/call). Per-message-group throughput is also capped — multiple groups increase aggregate throughput.
- **API latency:** 20-100ms per `ReceiveMessage`, `DeleteMessage`, `SendMessage`. A single job cycle (receive + process + delete) takes at least 40-200ms of API overhead.
- **Long polling reduces API calls by ~95%** versus short polling but increases per-call latency (up to 20 seconds).
- **Worker count vs throughput:** Workers are limited by SQS API rate (3000 ReceiveMessage requests/second per account, adjustable). Each worker typically polls once per long-poll interval.
- **Batch operations:** `SendMessageBatch` (up to 10 messages, 256KB total) reduces API calls by 10x. `DeleteMessageBatch` similarly reduces per-message delete costs.
- **Message size:** 256KB max per message. Larger payloads require Extended Client Library (S3) or custom chunking.
- **Cost model:** Pay per request ($0.40/million for Standard, $0.50/million for FIFO). Data transfer out to internet is extra. Long polling reduces request count significantly.
- **Laravel worker memory:** Each worker process holds one SQS connection. Workers must be sized to handle peak job memory, not SQS connection overhead (negligible).

---

# Security Considerations

- **IAM least-privilege is critical.** Application roles should only have `sqs:ReceiveMessage`, `sqs:DeleteMessage`, `sqs:ChangeMessageVisibility`, `sqs:SendMessage`. Never grant `sqs:CreateQueue`, `sqs:DeleteQueue`, `sqs:SetQueueAttributes` to application roles.
- **Queue policy-based access control.** For cross-account access, use queue policies with `Principal` and `Condition` blocks to restrict which accounts and source IPs can send/receive.
- **Encryption at rest:** SQS supports SSE (Server-Side Encryption) with KMS. Enable for queues handling sensitive data. KMS keys add ~$0.03/10000 API calls overhead.
- **Encryption in transit:** SQS API endpoints support HTTPS. Always use HTTPS endpoints (the Laravel SQS driver uses HTTPS by default).
- **Message payload sensitivity:** SQS messages are visible to anyone with `sqs:ReceiveMessage` permission on the queue. Do not include PII, secrets, or sensitive data in plaintext. Encrypt sensitive payloads at the application level before dispatch.
- **FIFO queue deduplication bypass:** Without `ContentBasedDeduplication`, an attacker can send duplicate messages with different `MessageDeduplicationId` — implement application-level idempotency.
- **DLQ monitoring:** Unmonitored DLQs can silently accumulate sensitive data. Monitor DLQ depth and investigate messages promptly. DLQ messages may contain sensitive data that should be handled securely.
- **Visibility timeout manipulation:** An attacker with `sqs:ChangeMessageVisibility` can perpetually extend visibility to prevent legitimate processing. Restrict this permission to controlled roles only.

---

# Common Mistakes

| Description | Why Developers Make It | Consequences | Better Approach |
|---|---|---|---|
| `retry_after` > visibility timeout | Default values used without analysis of job runtime | Double processing — SQS releases message before Laravel fails it | Set `retry_after = visibility_timeout - 10` |
| Short polling (default `WaitTimeSeconds=0`) | Configuration not overridden, unaware of cost difference | 10x more API calls, $35+/month/worker in unnecessary costs | Set `WaitTimeSeconds=20` for long polling |
| No Dead-Letter Queue configured | Default queue has no DLQ, teams don't plan for failures | Poison messages cycle forever, consuming worker time, never processed | Configure DLQ with `maxReceiveCount=3` |
| Dynamic queue creation at runtime | Seems simpler than adding to Terraform | IAM permissions explode, rate limits hit, cost spikes | Pre-provision all queues via IaC |
| Static `MessageGroupId` for all FIFO messages | Team doesn't understand per-group ordering scope | Throughput capped at 300 TPS, no benefit from parallel workers | Use entity-scoped group IDs |
| Same visibility timeout for all queue connections | Copy-paste configuration across environments | Overly long timeout wastes potential redelivery speed, too short causes duplicates | Tune per queue based on job characteristics |
| No monitoring on SQS queue metrics | SQS doesn't come with built-in dashboard like Horizon | Backlog grows undetected, SLOs silently violated | Set up CloudWatch alarms on ApproximateNumberOfMessagesVisible and DLQ depth |

---

# Examples

**Standard Queue Configuration (High Throughput):**
```php
// config/queue.php
'connections' => [
    'sqs-orders' => [
        'driver' => 'sqs',
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'prefix' => 'https://sqs.us-east-1.amazonaws.com/123456789012/',
        'queue' => 'orders-production',
        'suffix' => null,
        'region' => 'us-east-1',
        'retry_after' => 50,
        'after_commit' => true,
        'attributes' => [
            'WaitTimeSeconds' => 20,
            'MessageRetentionPeriod' => 345600, // 4 days
        ],
    ],
];
```

**FIFO Queue Dispatch with Scoped Group ID:**
```php
ProcessOrder::dispatch($order)
    ->onConnection('sqs-orders-fifo')
    ->onQueue('orders.fifo')
    ->withMessageGroupId('tenant:' . $order->tenant_id)
    ->withMessageDeduplicationId('order:' . $order->id . ':' . $order->updated_at->timestamp);
```

**Long Polling Worker with DLQ Handling:**
```php
// In a custom SQS worker or queue listener
$messages = $sqsClient->receiveMessage([
    'QueueUrl' => $queueUrl,
    'MaxNumberOfMessages' => 10,
    'WaitTimeSeconds' => 20,
    'AttributeNames' => ['ApproximateReceiveCount'],
]);

foreach ($messages['Messages'] ?? [] as $message) {
    try {
        processMessage($message['Body']);
        $sqsClient->deleteMessage([
            'QueueUrl' => $queueUrl,
            'ReceiptHandle' => $message['ReceiptHandle'],
        ]);
    } catch (UnprocessableException $e) {
        // After maxReceiveCount, SQS auto-routes to DLQ
        $sqsClient->changeMessageVisibility([
            'QueueUrl' => $queueUrl,
            'ReceiptHandle' => $message['ReceiptHandle'],
            'VisibilityTimeout' => 0, // Make immediately available for retry
        ]);
    }
}
```

**IAM Policy for SQS Worker Role (Least Privilege):**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sqs:ReceiveMessage",
                "sqs:DeleteMessage",
                "sqs:ChangeMessageVisibility",
                "sqs:GetQueueAttributes",
                "sqs:GetQueueUrl"
            ],
            "Resource": "arn:aws:sqs:us-east-1:123456789012:orders-production"
        }
    ]
}
```

---

# Related Topics

**Prerequisites:**
- K002 Queue Driver Architecture — Understanding Laravel queue driver interface
- K003 Queue vs Sync Processing — When to use queues
- K010 Job Design Fundamentals — Writing queueable jobs

**Closely Related Topics:**
- K039 Visibility Timeout — Detailed visibility timeout mechanics
- K020 Laravel Horizon Architecture — Horizon compatibility considerations
- K024 Retry and Failure Strategies — SQS retry behavior
- K040 Redis Streams Queue Backend — Alternative queue driver

**Advanced Follow-Up Topics:**
- K041 SQS FIFO Deep Dive — FIFO queue patterns and limitations
- K042 SQS Extended Client — Large message handling via S3
- K043 Event-Driven Architectures with SQS + SNS — Fan-out patterns
- K044 SQS + Lambda Integration — Serverless processing

**Cross-Domain Connections:**
- AWS Infrastructure as Code (Terraform/CloudFormation) — Queue provisioning
- CloudWatch Monitoring — Queue metrics and alerting
- IAM Security Engineering — Queue access control

---

# AI Agent Notes

- The most common production incident is `retry_after` exceeding SQS visibility timeout, causing double processing. Always validate this configuration when setting up SQS.
- SQS does NOT support Horizon monitoring. When a team requests "Horizon for SQS," suggest CloudWatch dashboards or custom monitoring with SQS metrics API.
- FIFO queue names MUST end with `.fifo` or SQS rejects the creation.
- SQS `approximateReceiveCount` attribute is returned in `ReceiveMessage` response — use it to track how many times a message has been received for custom retry logic.
- The Extended Client Library transparently handles messages > 256KB by storing payload in S3 — but this adds S3 costs and latency. Consider chunking or reducing payload size first.
- Laravel's SQS driver does NOT support delayed dispatching (`dispatch()->delay(60)`) with FIFO queues — the delay parameter is ignored. Use a scheduled job or separate delayed queue.
- When using multiple Laravel applications sharing an SQS queue, ensure all apps have the same `retry_after` and job class mappings, or serialization errors will occur.
