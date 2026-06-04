# SQS Pricing Model Rules

## Rule 1: Batch All SQS Operations
- **Category**: Cost Management
- **Rule**: Always batch Send, Receive, and Delete SQS operations to the maximum of 10 messages per request
- **Reason**: SQS charges per API request, not per message; batching reduces request count by 90%, dropping effective cost from $0.40/M to $0.04/M for equivalent message volume
- **Bad Example**: Receiving 1 message per poll and deleting individually, generating 20 API calls for 10 messages
- **Good Example**: Using ReceiveMessage with MaxNumberOfMessages=10 and DeleteMessageBatch, generating 2 API calls for 10 messages
- **Exceptions**: FIFO queues with strict ordering where batch size must be limited per message group
- **Consequences Of Violation**: Paying up to 10x more than necessary for SQS API usage

## Rule 2: Enable Long Polling on All Queues
- **Category**: Cost Management
- **Rule**: Always set ReceiveMessageWaitTimeSeconds to 20 on every SQS queue
- **Reason**: Long polling eliminates 95%+ of empty receive costs with no downside; messages are still delivered immediately when available
- **Bad Example**: Using default short polling (0-second wait), polling every second on an idle queue and paying for 2.6M empty receives/month
- **Good Example**: Setting ReceiveMessageWaitTimeSeconds=20, reducing empty receives from 2.6M to ~130K/month
- **Exceptions**: None—long polling has no negative impact on message delivery latency
- **Consequences Of Violation**: Wasting $0.40/M requests on empty receives; accumulating unnecessary SQS costs on idle queues

## Rule 3: Keep Messages Under 64KB
- **Category**: Cost Management
- **Rule**: Keep SQS message payloads under 64KB by compressing payloads and using identifiers instead of serialized models
- **Reason**: Messages exceeding 64KB are billed in 64KB chunks (65KB = 2 requests); compression typically reduces JSON payloads by 60-80%
- **Bad Example**: Serializing a full Eloquent model with relations (80KB) directly into an SQS message, incurring 2 chunks per message
- **Good Example**: Sending only the model ID (<1KB) and fetching data from database in the worker, or compressing the payload with gzip to under 64KB
- **Exceptions**: Payloads that cannot be compressed effectively (already compressed binary data, encrypted content)
- **Consequences Of Violation**: Double or triple the per-message SQS cost for large payloads

## Rule 4: Monitor Free Tier Before Over-Optimizing
- **Category**: Cost Management
- **Rule**: Monitor SQS free tier usage (first 1M requests/month free) before implementing complex cost optimizations
- **Reason**: Small workloads may never exceed the free tier; optimizing a $0 cost wastes engineering effort
- **Bad Example**: Spending 8 hours implementing custom batching logic for a queue processing 500K requests/month—a $0 problem
- **Good Example**: Checking SQS usage in Cost Explorer, confirming 1.2M requests/month, then implementing batching to bring it under 1M
- **Exceptions**: New features expected to grow quickly should be built cost-efficiently from the start
- **Consequences Of Violation**: Wasted engineering time optimizing costs that are already free

## Rule 5: Evaluate Alternatives at Scale
- **Category**: Architecture
- **Rule**: Evaluate RabbitMQ or Kafka when SQS volume exceeds 100M messages/day
- **Reason**: At very high volume, per-request SQS pricing ($0.40/M) exceeds RabbitMQ's fixed-cost model (~$2,800/month for 3-node cluster)
- **Bad Example**: Paying $6,000+/month for SQS at 150M messages/day when RabbitMQ could handle the same volume for ~$2,800/month
- **Good Example**: At 120M messages/day, calculating SQS cost ($4,800/month) vs RabbitMQ TCO ($2,800/month) and planning migration
- **Exceptions**: Applications needing SQS's fully managed compliance, AWS integration, or variable workloads where fixed-cost RabbitMQ is risky
- **Consequences Of Violation**: Significant cost overruns at scale; paying 2-3x more than necessary for messaging infrastructure

## Rule 6: Use FIFO Queues Judiciously
- **Category**: Cost Management
- **Rule**: Use FIFO queues only when message ordering is strictly required; prefer Standard queues for all other use cases
- **Reason**: FIFO queues cost 25% more ($0.50/M vs $0.40/M) and have lower throughput limits (3,000 TPS vs unlimited)
- **Bad Example**: Using a FIFO queue for email notifications where processing order does not matter, paying 25% more for unnecessary ordering guarantees
- **Good Example**: Using Standard queue for email notifications and FIFO only for payment processing where order must be preserved
- **Exceptions**: Any workload where message ordering is business-critical (financial transactions, sequential state changes)
- **Consequences Of Violation**: 25% higher SQS costs on workloads that do not benefit from ordering guarantees
