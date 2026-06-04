# SQS Pricing Model

## Metadata
- **ID**: KU-10-SQS-PRICING
- **Subdomain**: queue-worker-optimization
- **Domain**: cost-resource-optimization
- **Topic**: SQS Pricing Model
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
SQS charges per request ($0.40/M Standard, $0.50/M FIFO) with first 1M requests/month free. Each API call (SendMessage, ReceiveMessage, DeleteMessage, etc.) counts as one request. The critical distinction: SQS charges per request, not per message. Batch operations (up to 10 messages per request) can reduce costs by up to 90%. Hidden costs include empty receives, 64KB chunking, and DLQ message charges.

## Core Concepts
- **Standard queue**: $0.40 per million requests after free tier
- **FIFO queue**: $0.50 per million requests
- **Free tier**: 1 million requests/month (shared across all queues)
- **What counts**: Each API action = 1 request
- **Batch API**: SendMessageBatch, ReceiveMessageBatch, DeleteMessageBatch = 1 request for up to 10 messages
- **64KB chunking**: Messages >64KB count as multiple requests

## When To Use
- Any decoupling of microservices or distributed systems
- Laravel queue drivers for job processing
- Event-driven architectures with Lambda or EC2 consumers
- Buffer for spiky workloads to prevent database overload

## When NOT To Use
- Real-time messaging with sub-millisecond latency (use Redis)
- Very high throughput >100M messages/day without cost analysis (evaluate RabbitMQ/Kafka)
- Messages with large payloads >256KB (use S3 claim-check pattern)

## Best Practices
- **Batch all SQS operations**: Send, Receive, Delete in batches of 10 (WHY: batching reduces request count by 90%; cost drops from $0.40/M to $0.04/M for equivalent message volume; Laravel's queue worker supports batch receive natively)
- **Enable long polling**: Set ReceiveMessageWaitTimeSeconds to 20 (WHY: eliminates 95%+ of empty receive costs; no downside; Lambda ESM uses it by default)
- **Keep messages under 64KB**: Compress payloads, use identifiers not serialized models (WHY: 64KB chunking means a 65KB message costs 2x; most Laravel job serialization can be optimized to stay under 64KB)
- **Monitor free tier usage**: First 1M requests/month are free across all queues (WHY: small workloads may never exceed free tier; monitor SQS usage in Cost Explorer; don't over-optimize when costs are already $0)
- **Evaluate alternatives at scale**: SQS vs RabbitMQ breakeven at ~100M messages/day (WHY: at very high volume, per-request SQS pricing exceeds RabbitMQ's self-hosted cost; RabbitMQ on 3-node cluster ~$235/month vs SQS at scale can be $6K+/month)

## Related Topics
- SQS Batching Savings (ku-11)
- SQS Long Polling (ku-12)
- SQS Idle Lambda Polling (ku-13)
- SQS 64KB Chunking (ku-46)

## AI Agent Notes
- Default: batch + long polling for 90-95% cost reduction
- Default: keep messages under 64KB (compress or use identifiers)
- First 1M requests are free — monitor before over-optimizing
- Evaluate RabbitMQ at >100M messages/day
