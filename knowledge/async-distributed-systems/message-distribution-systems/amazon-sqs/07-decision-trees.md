# Metadata

**Domain:** Async & Distributed Systems
**Subdomain:** Message Distribution Systems
**Knowledge Unit:** Amazon SQS
**Generated:** 2026-06-04

---

# Decision Inventory

* Standard vs FIFO SQS Queue Selection
* SQS vs Alternative Message Distribution Platforms
* Visibility Timeout Configuration
* DLQ MaxReceiveCount Tuning
* Queue Provisioning Strategy
* SQS Polling Mode Selection

---

# Architecture-Level Decision Trees

---

## Standard vs FIFO SQS Queue Selection

### Decision Context

Whether to use Standard (at-least-once) or FIFO (exactly-once, ordered) SQS queues for a given workload.

### Decision Criteria

- Strict ordering requirement
- Throughput requirement
- Duplicate tolerance
- Message group ID support

### Decision Tree

```
Strict message ordering required?
├── YES → Throughput ≤ 300 messages/second (base)?
│   ├── YES → Use FIFO queue — ordered, exactly-once
│   └── NO → Throughput ≤ 3000 messages/second (batched)?
│       ├── YES → Use FIFO queue with batching (SendMessageBatch)
│       └── NO → Use Standard queue (FIFO not feasible at this throughput)
├── NO → Duplicate messages acceptable?
│   ├── YES → Use Standard queue — high throughput, simple
│   └── NO → Message ordering also needed?
│       ├── YES → Use FIFO queue (exactly-once is a side benefit)
│       └── NO → Use Standard queue + idempotency keys at application level
```

### Rationale

Standard queues scale to virtually unlimited throughput but offer at-least-once delivery with no ordering. FIFO queues provide ordered, exactly-once processing limited to 300 TPS (3000 with batching). Choose FIFO only when ordering is strictly required and throughput fits within limits. For high-throughput ordered workloads, Kafka is a better choice.

### Recommended Default

**Default:** Standard queue for most workloads; FIFO only when strict ordering required and throughput ≤ 300 TPS
**Reason:** Standard queues have no throughput ceiling. FIFO's 300 TPS limit is a significant architectural constraint that impacts scaling.

### Risks Of Wrong Choice

- Standard when ordering needed: messages processed out of order, state corruption
- FIFO when throughput > 300 TPS: throttling errors, message rejections, processing stalls
- FIFO without `MessageGroupId`: messages silently rejected, no error feedback in Laravel

### Related Rules

- bump-visibility-timeout-for-job-duration (05-rules.md)
- use-same-message-group-id-for-dedup (05-rules.md)

### Related Skills

- Configure and Manage Amazon SQS Queues (06-skills.md)

---

## SQS vs Alternative Message Distribution Platforms

### Decision Context

Choosing between SQS, Kafka, Redis Streams, or RabbitMQ for a message distribution system.

### Decision Criteria

- Managed vs self-hosted preference
- Throughput requirements
- Ordering requirements
- Message retention needs
- Ecosystem integration (AWS, Laravel)
- Operational overhead tolerance
- Latency sensitivity

### Decision Tree

```
Fully managed service preferred?
├── YES → Within AWS ecosystem?
│   ├── YES → Use SQS — managed, serverless, pay-per-request
│   └── NO → Use SQS (still managed, accessible via API)
├── NO → Throughput > 100 MB/s or retention > 14 days?
│   ├── YES → Use Kafka — high throughput, long retention, replayable
│   └── NO → Existing Redis infrastructure?
│       ├── YES → Laravel Horizon monitoring needed?
│       │   ├── YES → Use Redis Streams via laravel-common
│       │   └── NO → Use Redis Streams or SQS (cost/latency tradeoff)
│       └── NO → Use RabbitMQ or SQS (RabbitMQ for complex routing, SQS for simplicity)
```

### Rationale

SQS excels when managed infrastructure is preferred and workloads fit within its constraints (256KB message size, 14-day retention). Kafka is superior for high-throughput, long-retention, replayable event stream use cases. Redis Streams are best when Horizon monitoring is needed and Redis infrastructure already exists.

### Recommended Default

**Default:** SQS for most new AWS-hosted Laravel applications; Redis Streams when Horizon is essential
**Reason:** SQS removes all queue infrastructure management. Redis Streams add server management overhead.

### Risks Of Wrong Choice

- Kafka for < 1 MB/s throughput: unnecessary operational complexity, over-provisioned cluster
- SQS for > 100 MB/s: API rate limits, cost at scale, no replay capability
- Redis Streams for long retention ( > 7 days): memory cost explosion, no native replay

### Related Rules

- never-create-queues-on-the-fly (05-rules.md)
- handle-sqs-long-poll-correctly (05-rules.md)

### Related Skills

- Configure and Manage Amazon SQS Queues (06-skills.md)

---

## Visibility Timeout Configuration

### Decision Context

Setting the SQS visibility timeout in relation to Laravel's `retry_after` to prevent double processing.

### Decision Criteria

- Maximum expected job execution time
- Job timeout setting
- Safety margin requirement
- Job idempotency characteristics

### Decision Tree

```
Maximum job execution time known?
├── YES → Set SQS visibility timeout = max_execution_time × 3
│   ├── Set retry_after = visibility_timeout - 10
│   └── Verify: retry_after < visibility timeout ✓
└── NO → Job execution time varies widely?
    ├── YES → Use SQS Extended Client with heartbeats
    │   └── Set base visibility timeout = 60s, extend via heartbeats
    └── NO → Set visibility timeout = 60s (default), retry_after = 50s
        └── Monitor for double processing in production logs
```

### Rationale

The SQS visibility timeout is a hard limit — once it expires, the message becomes visible to other workers regardless of Laravel's internal state. `retry_after` must be shorter than the visibility timeout to ensure Laravel marks the job as failed before SQS releases it for reprocessing.

### Recommended Default

**Default:** Visibility timeout = 60s, `retry_after` = 50s (10s safety margin)
**Reason:** 60s covers most job types with margin. 10s gap prevents race conditions.

### Risks Of Wrong Choice

- `retry_after` > visibility timeout: guaranteed double processing
- `retry_after` == visibility timeout: race condition, intermittent double processing
- Visibility timeout too long (> 12 hours): delayed recovery from worker failure
- Visibility timeout too short (< 30s): frequent redelivery for legitimate processing

### Related Rules

- bump-visibility-timeout-for-job-duration (05-rules.md)
- handle-sqs-long-poll-correctly (05-rules.md)

### Related Skills

- Configure and Manage Amazon SQS Queues (06-skills.md)

---

## DLQ MaxReceiveCount Tuning

### Decision Context

Setting the number of times a message is retried before routing to the dead-letter queue.

### Decision Criteria

- Job idempotency (can retry safely)
- External dependency flakiness
- Processing failure characteristics
- Recovery time expectations

### Decision Tree

```
Job is idempotent?
├── YES → External API dependency?
│   ├── YES → maxReceiveCount = 5 (accommodate transient API failures)
│   └── NO → maxReceiveCount = 3 (catch genuine processing failures quickly)
└── NO → Rapid failover required?
    ├── YES → maxReceiveCount = 2 (minimize duplicate impact)
    └── NO → maxReceiveCount = 3 (standard safety margin)
```

### Rationale

Higher `maxReceiveCount` values keep messages in the main queue longer, increasing worker waste on unprocessable messages. Lower values move messages to DLQ faster but may discard messages that would succeed on retry. Tune based on failure pattern analysis.

### Recommended Default

**Default:** `maxReceiveCount = 3`
**Reason:** Allows 2 retries after initial failure, catching most transient issues before moving to DLQ.

### Risks Of Wrong Choice

- Too low (1-2): messages moved to DLQ on first transient failure, requiring manual reprocessing
- Too high (> 10): poison messages consume worker time for extended period, valid messages backlog

### Related Rules

- handle-sqs-long-poll-correctly (05-rules.md)

### Related Skills

- Configure and Manage Amazon SQS Queues (06-skills.md)
- Implement Dead-Letter Queue Pattern

---

## Queue Provisioning Strategy

### Decision Context

Whether to pre-provision queues via Infrastructure as Code or create them dynamically.

### Decision Criteria

- Security requirements
- Infrastructure change management
- Team workflow
- Multi-tenancy needs

### Decision Tree

```
Application is multi-tenant with isolated queues per tenant?
├── YES → Tenant count predictable (< 100)?
│   ├── YES → Pre-provision all tenant queues via Terraform
│   └── NO → Use IaC with module + dynamic provisioning via controlled API
│       └── Implement rate limiting, audit logging, approval workflow
└── NO → Always pre-provision via IaC (Terraform, CloudFormation, CDK)
```

### Rationale

Dynamic queue creation bypasses change management, opens security vectors (rate-limit exhaustion, cost explosion), and creates orphaned queues. Even large multi-tenant systems should control queue creation through infrastructure pipelines.

### Recommended Default

**Default:** Pre-provision all queues via Infrastructure as Code
**Reason:** Audit trail, change control, security boundary enforcement, cost tracking.

### Risks Of Wrong Choice

- Dynamic creation: IAM permissions must be overly permissive, rate limits can be exhausted, costs explode from orphaned queues
- Over-provisioning: queues listed in IaC but unused still incur minimal costs ($0.50/queue/month)

### Related Rules

- never-create-queues-on-the-fly (05-rules.md)

### Related Skills

- Configure and Manage Amazon SQS Queues (06-skills.md)

---

## SQS Polling Mode Selection

### Decision Context

Choosing between short polling (default, `WaitTimeSeconds=0`) and long polling (`WaitTimeSeconds=1-20`).

### Decision Criteria

- Worker count
- Message arrival rate
- Latency requirements
- Cost sensitivity

### Decision Tree

```
Messages arrive continuously (> 1/second)?
├── YES → Latency-sensitive (< 100ms pickup)?
│   ├── YES → Use short polling + scale workers for throughput
│   │   └── Accept higher API costs for lower latency
│   └── NO → Use long polling (WaitTimeSeconds=20)
└── NO → Messages arrive in bursts?
    ├── YES → Use long polling (WaitTimeSeconds=20)
    └── NO → Queue mostly empty?
        ├── YES → Use long polling (WaitTimeSeconds=20) — saves costs
        └── NO → Default to long polling
```

### Rationale

Short polling returns empty responses frequently because it samples only a subset of SQS servers. Long polling queries all servers and waits up to the configured duration, returning only when messages are available or the wait expires. Long polling reduces API calls by approximately 95% for low-volume queues.

### Recommended Default

**Default:** Long polling with `WaitTimeSeconds=20`
**Reason:** Reduces API costs by ~95% with minimal latency impact. Messages are still picked up within 20 seconds.

### Risks Of Wrong Choice

- Short polling: 10x more API calls for same throughput, $35+/month/worker in unnecessary costs
- Long polling with WaitTimeSeconds < 10: still frequent empty responses, reduced cost savings

### Related Rules

- handle-sqs-long-poll-correctly (05-rules.md)

### Related Skills

- Configure and Manage Amazon SQS Queues (06-skills.md)
