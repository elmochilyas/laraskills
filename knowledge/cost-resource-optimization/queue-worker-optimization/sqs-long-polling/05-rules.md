# SQS Long Polling Rules

## Rule 1: Enable Long Polling on Every Queue
- **Category**: Cost Management
- **Rule**: Always set ReceiveMessageWaitTimeSeconds to 20 on all SQS queues
- **Reason**: Long polling eliminates 95%+ of empty receive costs with zero latency impact on message delivery; messages arriving during the wait period are returned immediately
- **Bad Example**: Using short polling (0-second wait) on an idle queue, generating 2.6M empty receives/month at $1.04/month in unnecessary SQS costs
- **Good Example**: Setting ReceiveMessageWaitTimeSeconds=20, reducing empty receives from 2.6M to ~130K/month, saving $0.95/month per idle queue
- **Exceptions**: None—long polling is always beneficial and has no tradeoffs
- **Consequences Of Violation**: Unnecessary SQS costs from empty receives; can accumulate to $34+/month across 50 idle queues

## Rule 2: Configure at Queue Level, Not Per-Request
- **Category**: Maintainability
- **Rule**: Set long polling at the queue attribute level rather than per-request
- **Reason**: Queue-level configuration ensures consistent behavior across all consumers and prevents configuration drift when new consumers are added
- **Bad Example**: Relying on each consumer to pass WaitTimeSeconds=20 in every ReceiveMessage call; a new consumer using default SDK settings defaults to short polling
- **Good Example**: Setting the queue attribute `ReceiveMessageWaitTimeSeconds=20` so all current and future consumers automatically use long polling
- **Exceptions**: Consumers with different latency requirements may override per-request, but the queue-level default should still be 20
- **Consequences Of Violation**: Inconsistent polling behavior; new consumers inadvertently using expensive short polling

## Rule 3: Combine Long Polling with Batching
- **Category**: Cost Management
- **Rule**: Always combine long polling with batch operations (MaxNumberOfMessages=10) for maximum SQS cost reduction
- **Reason**: Long polling eliminates empty receive costs; batching reduces per-message request count by 10x; together they reduce total SQS costs by 95-99%
- **Bad Example**: Using one technique without the other—long polling reduces empty receives but still processing 1 message per poll (10x more API calls)
- **Good Example**: Configuring WaitTimeSeconds=20 and MaxNumberOfMessages=10 together, achieving 95%+ cost reduction on SQS API usage
- **Exceptions**: FIFO queues with strict ordering may need smaller batch sizes per message group
- **Consequences Of Violation**: Missing 50-90% of achievable SQS cost savings by using only one optimization

## Rule 4: Configure Explicitly for EC2/ECS Workers
- **Category**: Framework Usage
- **Rule**: Explicitly configure long polling for EC2, ECS, and Fargate queue workers; Lambda ESM uses long polling by default
- **Reason**: Lambda event source mapping automatically uses long polling with 20s wait time, but custom workers need explicit ReceiveMessageWaitTimeSeconds configuration
- **Bad Example**: Running Laravel queue workers on EC2 without setting WaitTimeSeconds in the SQS receive configuration, defaulting to short polling
- **Good Example**: Configuring `SqsQueue` in Laravel with `'polling_wait_time' => 20` or setting the queue attribute in AWS console
- **Exceptions**: Lambda custom consumers using SDK directly also need explicit configuration
- **Consequences Of Violation**: Short polling for non-Lambda workers generates 20x more API calls and costs than necessary

## Rule 5: Monitor Empty Receive Rate
- **Category**: Performance
- **Rule**: Monitor the ratio of empty receives to total receives as a cost efficiency metric
- **Reason**: A high empty receive ratio indicates long polling is not configured or queues are over-provisioned relative to message volume
- **Bad Example**: Empty receives accounting for 90%+ of all ReceiveMessage calls and not investigating the root cause
- **Good Example**: Tracking NumberOfEmptyReceives vs NumberOfReceives in CloudWatch, keeping empty rate below 5% with long polling
- **Exceptions**: Very low-traffic queues may have high empty rates even with long polling; focus on total cost rather than ratio
- **Consequences Of Violation**: Undetected short polling configurations causing ongoing cost waste
