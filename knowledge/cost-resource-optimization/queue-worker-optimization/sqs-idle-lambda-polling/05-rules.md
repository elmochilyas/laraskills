# SQS Idle Lambda Polling Cost Rules

## Rule 1: Enable Long Polling on All Queues
- **Category**: Cost Management
- **Rule**: Always use long polling (ReceiveMessageWaitTimeSeconds=20) on every SQS queue with Lambda event source mappings
- **Reason**: Lambda ESM uses long polling by default, but custom workers and misconfigured mappings may use short polling, generating ~1.7M empty receives/month per idle queue at $0.68/month in SQS costs
- **Bad Example**: A custom Lambda consumer using short polling on an idle queue, generating 2.6M empty receives/month at $1.04/month in unnecessary costs
- **Good Example**: Ensuring all queue consumers (Lambda ESM or custom) use long polling, reducing empty receives from 1.7M to ~85K/month, dropping cost from $0.68 to ~$0.03 per idle queue
- **Exceptions**: None—long polling has no downside for queue consumers
- **Consequences Of Violation**: $0.03 → $0.68/month per idle queue in unnecessary SQS costs; at 50 idle queues, $34/month wasted

## Rule 2: Remove Unused Event Source Mappings
- **Category**: Cost Management
- **Rule**: Periodically audit and remove SQS event source mappings for disabled features, deprecated services, or test environments
- **Reason**: Unused queue mappings continue polling indefinitely, generating SQS request costs and Lambda invocation costs for empty responses
- **Bad Example**: A feature-flagged queue left with Lambda mapping for 6 months, accruing $4.08 in idle polling costs and hundreds of Lambda invocations
- **Good Example**: Implementing a quarterly audit of SQS event source mappings, removing mappings for disabled features, and tagging queues with lifecycle dates
- **Exceptions**: Queues that may be reactivated frequently should be paused, not deleted; consider disabling the mapping rather than removing it
- **Consequences Of Violation**: Ongoing costs for unused infrastructure; accumulated costs across many idle queues

## Rule 3: Increase Batch Window for Near-Idle Queues
- **Category**: Cost Management
- **Rule**: Configure batch_window to 60-300 seconds for Lambda ESM on low-traffic queues
- **Reason**: Longer batch windows reduce polling frequency and accumulate messages for fewer but larger batches, reducing empty receive and invocation costs
- **Bad Example**: Using default 0-second batch window on a queue receiving 1 message/hour, generating 3,600 empty polls/day
- **Good Example**: Setting batch_window to 120 seconds for a low-traffic queue, reducing polling frequency and accumulating messages for batch processing
- **Exceptions**: Time-sensitive workloads requiring sub-minute processing latency should use shorter batch windows
- **Consequences Of Violation**: Higher than necessary Lambda invocation costs and empty receive costs for low-traffic queues

## Rule 4: Use KEDA Scale-to-Zero for Kubernetes Workers
- **Category**: Architecture
- **Rule**: Use KEDA scale-to-zero for Kubernetes queue workers on idle queues to eliminate all polling costs
- **Reason**: KEDA monitors queue depth from the scaler (not the worker), scaling worker pods to zero when queues are empty and eliminating idle polling entirely
- **Bad Example**: Running a Kubernetes worker deployment with min=1 on an idle queue, constantly polling SQS and generating empty receive costs
- **Good Example**: Deploying KEDA with ScaledObject on the same queue, scaling workers to zero when empty and triggering scale-up only when messages arrive
- **Exceptions**: Not applicable for Lambda-based workers; use Lambda ESM with long polling instead
- **Consequences Of Violation**: Ongoing compute and SQS costs for idle Kubernetes workers that could scale to zero

## Rule 5: Attribute Idle Polling Costs to Specific Queues
- **Category**: Cost Management
- **Rule**: Tag SQS queues and Lambda functions with cost allocation tags to identify idle polling costs per team or feature
- **Reason**: Idle polling costs are often hidden in aggregate SQS billing; cost allocation tags reveal which teams/features are generating empty receive costs
- **Bad Example**: Receiving a $50/month SQS bill with no breakdown, unable to identify which queues are idle and which are actively processing
- **Good Example**: Tagging all queues with `team`, `feature`, and `environment` tags, then using Cost Explorer to identify idle queue costs per team
- **Exceptions**: Very small SQS bills (<$5/month) may not justify the overhead of cost allocation tagging
- **Consequences Of Violation**: Inability to identify waste; idle queue costs hidden in aggregate billing
