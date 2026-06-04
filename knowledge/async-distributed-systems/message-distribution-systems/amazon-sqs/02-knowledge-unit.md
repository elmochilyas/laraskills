# Amazon SQS

## Metadata
- **Domain:** Async & Distributed Systems
- **Subdomain:** Message Distribution Systems
- **Knowledge Unit:** Amazon SQS
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
Amazon SQS (Simple Queue Service) is a fully managed message queuing service that decouples application components in distributed systems. In Laravel, SQS serves as a queue driver offering infinite scalability, automatic cross-AZ replication, and configurable message retention up to 14 days. It offers Standard (at-least-once, high throughput, no ordering) and FIFO (ordered, exactly-once, 300 TPS) queue types. The primary tradeoff versus Redis queues is latency (20-100ms per API call) and inability to use Horizon for monitoring.

---

## Core Concepts
- **Standard Queue**: At-least-once delivery, no ordering guarantees, virtually unlimited throughput — use for stateless, idempotent workloads
- **FIFO Queue**: First-In-First-Out with exactly-once processing, requires `MessageGroupId`, base 300 TPS — use for ordered processing
- **Visibility Timeout**: Period a polled message remains hidden from other consumers — must align with Laravel's `retry_after` configuration
- **Dead-Letter Queue (DLQ)**: Secondary queue where messages route after exceeding `maxReceiveCount` — prevents poison messages from cycling infinitely
- **Long Polling**: `WaitTimeSeconds` (0-20) that makes `ReceiveMessage` wait for messages — reduces empty responses and API costs by ~95%
- **Receipt Handle**: Returned by `ReceiveMessage` — required to delete or change visibility of a specific message receipt

---

## Mental Models
1. **SQS as Buffer Between Producers and Consumers**: Think of SQS as a shock absorber between traffic spikes and processing capacity. Producers (web servers) dispatch jobs instantly regardless of consumer availability. Consumers (workers) process at their own pace. The queue absorbs bursts and smooths out the processing load — without it, traffic spikes either overwhelm consumers or require over-provisioned capacity.
2. **Visibility Timeout as Safety Lock**: When a worker polls a message, the visibility timeout makes it invisible to others — like a "claimed" sign on a package. If the worker finishes in time, it deletes the message (the package is delivered). If it crashes or times out, the visibility expires, and the message reappears for another worker (the sign is removed). The timeout must be long enough for processing but short enough to detect failures promptly.

---

## Internal Mechanics
Worker calls `ReceiveMessage` API — SQS returns up to 10 messages, each with a `ReceiptHandle`. The worker processes each message. On success, calls `DeleteMessage` with the `ReceiptHandle`. On failure, does nothing — the visibility timeout eventually expires, and the message reappears. If the visibility timeout expires without a delete, SQS makes the message visible to consumers again. The `ApproximateReceiveCount` attribute tracks how many times a message has been received, enabling `maxReceiveCount`-based DLQ redrive. Long polling (`WaitTimeSeconds=20`) holds the API connection open, returning messages as they arrive or after 20 seconds.

---

## Patterns
### Standard Queue for Idempotent Workloads
- **Purpose**: High-throughput, unordered job processing
- **Mechanism**: Standard queue, no ordering guarantees, at-least-once delivery
- **Benefits**: Virtually unlimited throughput, no provisioning, automatic scaling
- **Tradeoffs**: Duplicate delivery possible — job must be idempotent

### FIFO Queue with Scoped MessageGroupId
- **Purpose**: Ordered processing per entity within throughput limits
- **Mechanism**: Entity-scoped `MessageGroupId` enables parallel processing across entities while maintaining per-entity ordering
- **Benefits**: Per-entity ordering without serializing all messages
- **Tradeoffs**: 300 TPS base throughput per queue

---

## Architectural Decisions
- **Choose SQS when**: Zero-infrastructure queue management needed, AWS ecosystem integration, compliance-required durability, bursty workloads, or FIFO ordering requirements within throughput limits
- **Choose Redis when**: Sub-millisecond latency required, Horizon monitoring needed, or existing Redis infrastructure is available
- **Choose Kafka when**: Throughput exceeds 100 MB/s, long-term message retention needed (months/years), or event sourcing with replayability is required
- **Key decision**: Always set `retry_after` 5-10 seconds less than visibility timeout to prevent double processing

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fully managed — no server management | 20-100ms API latency per operation | 40-200ms minimum overhead per job cycle |
| Infinite scalability | No Horizon monitoring support | Requires CloudWatch or custom monitoring |
| 14-day message retention | 256KB max message size | Use Extended Client Library (S3-backed) for larger payloads |
| Cross-AZ replication | FIFO throughput capped at 300 TPS | Multiple FIFO queues with sharding for higher throughput |

---

## Performance Considerations
Standard queue throughput is virtually unlimited — AWS auto-scales backend resources. FIFO throughput: 300 messages/second base (3000 with batching 10 messages/call). API latency: 20-100ms per operation. Long polling reduces API calls by ~95% versus short polling. Worker count is limited by SQS API rate (3000 ReceiveMessage requests/second per account, adjustable). Batch operations (`SendMessageBatch`, `DeleteMessageBatch`) reduce API calls by 10x. Message size: 256KB max per message.

---

## Production Considerations
Set `retry_after` 5-10 seconds less than visibility timeout to prevent double processing. Enable long polling (`WaitTimeSeconds=20`) to reduce API costs. Configure a Dead-Letter Queue with `maxReceiveCount=3`. Pre-provision all queues via Infrastructure as Code (Terraform, CloudFormation) — never create queues dynamically. IAM least-privilege for queue operations. Separate queue connections for different latency/service-level requirements. Monitor DLQ depth and investigate messages promptly.

---

## Common Mistakes
1. **`retry_after` > visibility timeout**: Default values used without analysis — SQS releases message before Laravel fails the job, causing double processing. Set `retry_after = visibility_timeout - 10`.
2. **Short polling (default `WaitTimeSeconds=0`)**: 10x more API calls, unnecessary costs — set `WaitTimeSeconds=20` for long polling.
3. **No Dead-Letter Queue configured**: Poison messages cycle forever — configure DLQ with `maxReceiveCount=3`.
4. **Dynamic queue creation at runtime**: IAM permissions explode, rate limits hit, cost spikes — pre-provision all queues via IaC.
5. **Static `MessageGroupId` for all FIFO messages**: Throughput capped at 300 TPS — use entity-scoped group IDs.

---

## Failure Modes
- **Double processing**: `retry_after` > visibility timeout causes message redelivery while Laravel still considers job active
- **Poison message loop**: Malformed message fails every time, cycling forever without DLQ — configure DLQ with maxReceiveCount
- **Visibility timeout starvation**: Worker holds message for longer than visibility timeout, then fails — message is reprocessed, but original worker still running creates duplicate processing risk
- **Queue growth unnoticed**: Without monitoring, backlog grows until processing delay violates SLOs — set CloudWatch alarms on `ApproximateNumberOfMessagesVisible`

---

## Ecosystem Usage
Laravel's SQS driver provides built-in queue connection support via `config/queue.php`. The driver supports Standard and FIFO queues with configurable prefixes, suffixes, and attributes. Laravel's `dispatch()->afterCommit()` ensures jobs are dispatched after database commits. The Extended Client Library integrates with S3 for large payloads. IAM roles and policies control SQS access.

---

## Related Knowledge Units
### Prerequisites
- Queue Driver Architecture — Understanding Laravel queue driver interface
- Queue vs Sync Processing — When to use queues
- Job Design Fundamentals — Writing queueable jobs

### Related Topics
- Visibility Timeout — Detailed visibility timeout mechanics
- Laravel Horizon Architecture — Horizon compatibility considerations
- Retry and Failure Strategies — SQS retry behavior
- Redis Streams Queue Backend — Alternative queue driver

### Advanced Follow-up Topics
- SQS FIFO Deep Dive — FIFO queue patterns and limitations
- SQS Extended Client — Large message handling via S3
- Event-Driven Architectures with SQS + SNS — Fan-out patterns
- SQS + Lambda Integration — Serverless processing

---

## Research Notes
The most common production incident is `retry_after` exceeding SQS visibility timeout, causing double processing. SQS does NOT support Horizon monitoring — suggest CloudWatch dashboards or custom SQS metrics monitoring. FIFO queue names MUST end with `.fifo` or SQS rejects creation. Laravel's SQS driver does NOT support delayed dispatching with FIFO queues. When using multiple Laravel applications sharing an SQS queue, ensure all apps have the same `retry_after` and job class mappings.
