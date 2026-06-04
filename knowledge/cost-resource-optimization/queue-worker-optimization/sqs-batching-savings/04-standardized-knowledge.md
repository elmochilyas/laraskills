# SQS Batching Savings

## Metadata
- **ID**: KU-11-SQS-BATCHING
- **Subdomain**: queue-worker-optimization
- **Domain**: cost-resource-optimization
- **Topic**: SQS Batching Savings
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
SQS batch operations (SendMessageBatch, ReceiveMessageBatch, DeleteMessageBatch) reduce request costs by up to 93% by packing up to 10 messages into a single API request. This is the single highest-ROI optimization for SQS cost reduction. Combined with long polling, batching can reduce total SQS costs by 90%+ for most workloads.

## Core Concepts
- **Batch limit**: Up to 10 messages per batch request
- **Cost reduction**: 1 batch request = 1 request vs 10 individual requests
- **Maximum savings**: 90% reduction in request count (10:1 ratio)
- **Apply to**: Send, Receive, and Delete operations
- **Idempotency**: Batch operations return per-message success/failure

## When To Use
- Any application sending or receiving SQS messages in bulk
- High-throughput queue workloads (>100K messages/day)
- Laravel queues with batchable jobs
- Data pipelines with message aggregation patterns

## When NOT To Use
- FIFO queues with strict ordering where batch size is limited
- Real-time single-message processing (latency of batching delay unacceptable)
- Very low volume (<100 messages/day) where savings are negligible

## Best Practices
- **Batch all three operations**: Send, Receive, AND Delete (WHY: many teams batch sends but process receives individually; DeleteMessageBatch provides same 10:1 savings as Send)
- **Use Laravel's built-in batch support**: Configure queue.batch.size in config/queue.php (WHY: Laravel supports batch processing for SQS; no custom code needed for basic batching)
- **Monitor batch utilization**: Track average batch size in CloudWatch (WHY: if batches consistently have <10 messages, increase aggregation delay or message volume; partial batches still save but not optimally)
- **Size messages to fit batch constraints**: Each message in batch counts toward 64KB independently (WHY: a batch of 10 65KB messages costs 20 chunks — double the expected; compress individual messages to stay under 64KB before batching)

## Related Topics
- SQS Pricing Model (ku-10)
- SQS Long Polling (ku-12)
- SQS 64KB Chunking (ku-46)

## AI Agent Notes
- Default: enable batching for all SQS send/receive/delete operations
- Default: target batch size of 10 messages
- Laravel's queue worker supports batch receive natively
- Combine with long polling for maximum cost reduction (>90%)
