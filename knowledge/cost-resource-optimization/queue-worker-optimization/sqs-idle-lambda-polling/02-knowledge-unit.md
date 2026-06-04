# K13: SQS Idle Lambda Polling Cost

## Metadata
- **ID**: K13
- **Subdomain**: Queue & Worker Cost Efficiency
- **Topic**: SQS Idle Lambda Polling
- **Source**: Industry Research, OneUptime (2026)
- **Reliability**: High

## Executive Summary
An idle SQS queue with Lambda event source mapping generates approximately 1.7 million ReceiveMessage requests per month simply from polling. This is because Lambda polls 5 SQS partitions concurrently with short polling, generating constant requests even when no messages exist. For an idle queue, this costs ~$0.68/month in SQS requests alone, plus Lambda invocation costs for empty responses.

## Core Concepts
- **Polling rate**: ~1.7M requests/month for idle queue (5 partitions Ãƒâ€” ~1000 requests/minute Ãƒâ€” 43800 minutes/month ÃƒÂ· 2)
- **Cost at idle**: ~$0.68/month for idle SQS requests (after free tier, this is usually free within 1M free tier)
- **Above free tier**: Beyond 1M requests, cost = ~$0.68 per idle queue per month
- **Multiple queues**: 50 idle queues = ~$34/month in wasted polling
- **Lambda side**: Lambda still invokes for empty receives, incurring Lambda costs

## Mental Models
- **Idle engine**: An idle Lambda-SQS mapping is like a car running in neutral Ã¢â‚¬â€ burning fuel going nowhere
- **Partition tax**: SQS's internal partitioning means 5x polling overhead even for zero-traffic queues

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
- K12: SQS Long Polling
- K45: KEDA Scale-to-Zero Workers

## Research Notes
The 1.7M figure is calculated from SQS's polling behavior: Lambda polls each of 5 partitions with ~1000 requests/minute. At idle, this generates continuous empty receives. Mitigations: (1) Enable long polling on the queue (Lambda ESM uses long polling by default), (2) Use KEDA to scale Lambda to zero when queue is empty, (3) Increase batch window to reduce polling frequency. This hidden cost is often overlooked in cost estimates for event-driven architectures.
