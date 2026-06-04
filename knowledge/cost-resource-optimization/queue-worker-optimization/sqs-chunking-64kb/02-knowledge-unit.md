# K46: SQS 64KB Chunking

## Metadata
- **ID**: K46
- **Subdomain**: Queue & Worker Cost Efficiency
- **Topic**: SQS 64KB Chunking
- **Source**: CloudBurn (2026), AWS Documentation
- **Reliability**: High

## Executive Summary
SQS messages are billed in 64KB chunks. A 65KB message counts as 2 requests (one for each 64KB chunk). This effectively doubles the cost of messages that exceed 64KB. The maximum message size is 256KB (4 chunks = 4 requests). Compressing message payloads to stay under 64KB is a critical cost optimization. For payloads over 256KB, use S3 Extended Client Library (claim-check pattern).

## Core Concepts
- **64KB chunk**: Every SQS request is billed per 64KB
- **65KB message**: Counts as 2 requests (double cost)
- **256KB maximum**: 4 chunks = 4 requests per message
- **Batching + chunks**: Each message in a batch is independently chunked
- **Solution**: Compress payloads, minimize metadata, use references instead of full payloads

## Mental Models
- **Postage vs weight**: SQS bills per "letter" (request) but a "heavy letter" (over 64KB) counts as multiple letters
- **Chunking as tax**: Exceeding 64KB arbitrarily doubles your per-message cost

## Ecosystem Usage

- **Laravel Queue**: Built-in SQS driver; use queue:work sqs for long-polling consumer\n- **Laravel Horizon**: Redis-based queue monitoring (not SQS); use for Redis queues\n- **Laravel Vapor**: SQS is default queue driver; Vapor manages IAM permissions\n- **Laravel Forge**: Forge configures queue workers via Supervisor; supports SQS, Redis, and database drivers

## Performance Considerations

- Batch sending: 10 messages per batch reduces API calls by 90%; throughput limited to 3000 messages/second per batch\n- Long polling: 20-second wait adds latency but reduces empty receives\n- Lambda polling: 5 concurrent batches per Lambda function\n- SQS throughput: Standard queues offer nearly unlimited throughput; FIFO limited to 3000 messages/second with batching

## Production Considerations

- Always use long polling (ReceiveMessageWaitTimeSeconds=20) to minimize empty receive costs\n- Batch messages aggressively: use SendMessageBatch, ReceiveMessageBatch, DeleteMessageBatch\n- Set queue-level retention (default 4 days) and delivery delay as needed\n- Configure DLQ for failed messages after 3-5 receive attempts; monitor DLQ depth\n- Use KEDA with Kubernetes for scale-to-zero; Lambda is inherently scale-to-zero

## Failure Modes

- SQS throttling: excessive API calls throttled (HTTP 503); implement exponential backoff\n- Lambda polling concurrency explosion: high queue depth triggers Lambda scaling beyond account limits\n- Message visibility timeout: worker crashes without deleting message; message reappears and reprocesses\n- SQS queue policy misconfiguration: overly restrictive policy blocks workers from polling

## Architectural Decisions

- Standard vs FIFO: Standard for throughput; FIFO when exactly-once ordering required (higher cost)\n- SQS vs RabbitMQ (on EC2): SQS is managed but costs per-request; RabbitMQ has EC2 cost but no per-message fee\n- Lambda vs EC2/Fargate consumers: Lambda scales to zero but costs per invocation\n- KEDA vs fixed worker count: KEDA scale-to-zero optimizes cost; fixed count simpler

## Tradeoffs

- **Batch vs individual**: 90% cost reduction vs 10ms batching delay\n- **Long vs short polling**: 95% fewer empty receive costs vs 20-second wait time\n- **SQS vs RabbitMQ**: Managed (no ops) vs lower cost at scale (EC2 + software cost)\n- **Lambda vs EC2 consumers**: Scale-to-zero vs always-on

## Patterns

- Batch messages: SendMessageBatch (10 messages = 1 request) reduces costs by 90% vs individual sends\n- Long polling: set ReceiveMessageWaitTimeSeconds to 20 seconds; reduces empty receive costs by 95%+\n- SQS chunking: store payloads >64KB in S3, put S3 reference in SQS message\n- KEDA scale-to-zero: scale queue consumers to zero when queue is empty\n- RabbitMQ migration: evaluate SQS vs RabbitMQ at >100M messages/day

## Internal Mechanics

SQS pricing is per-request: .40/million for Standard, .50/million for FIFO queues. Each API action counts as one request. Batch operations count as a single request for up to 10 messages. The 64KB chunking rule means messages >64KB must be split or stored in S3 with a pointer in SQS. Lambda polling for SQS invokes Lambda functions in batches; idle polling of empty queues still incurs costs.

## Common Mistakes

- Using short polling (default): each poll of empty queue costs; long polling reduces empty receives by 95%\n- Not batching messages: each message individually costs 10x more than batch\n- Max message size ignored: messages >64KB incur additional costs; use S3 pointer pattern\n- Idle Lambda polling: Lambda functions that poll empty queues incur invocation cost\n- Not monitoring DLQ: failed messages accumulate, incurring storage costs and masking failures

## Related Knowledge Units
- K10: SQS Pricing Model
- K11: SQS Batching Savings

## Research Notes
The 64KB chunking rule is one of the most overlooked SQS cost drivers. For apps storing serialized Eloquent models directly in SQS messages (common in Laravel), payloads often exceed 64KB. Mitigations: (1) Store only IDs/keys in message, have worker fetch from DB/cache; (2) Compress JSON payloads with gzip before sending; (3) Use SQS Extended Client Library for large payloads (stores in S3, sends reference). For Laravel, message serialization often includes full model data Ã¢â‚¬â€ store only identifiers.
