# KEDA Scale-to-Zero Workers Rules

## Rule 1: Scale Workers to Zero on Idle Queues
- **Category**: Cost Management
- **Rule**: Configure KEDA ScaledObject to scale worker pods to zero when queues are empty
- **Reason**: Idle queue workers running 24/7 incur compute costs without processing any messages; scale-to-zero eliminates this baseline cost, reducing worker costs by 60-90% for variable-traffic apps
- **Bad Example**: Running 3 worker pods 24/7 on a queue that processes messages only during business hours, paying for idle capacity 16 hours/day
- **Good Example**: Deploying KEDA with ScaledObject scaling from 0 to 20 workers based on SQS queue depth, with zero pods during off-hours
- **Exceptions**: Queues where sub-minute processing latency is critical and cold-start delay is unacceptable
- **Consequences Of Violation**: 60-90% higher worker compute costs from idle capacity on variable-traffic queues

## Rule 2: Set Cooldown Period to 300 Seconds
- **Category**: Performance
- **Rule**: Configure KEDA cooldownPeriod to 300 seconds to prevent scaling thrashing
- **Reason**: Brief message bursts followed by empty queues trigger rapid scale-in/out without a cooldown; 300s cooldown ensures current in-flight messages finish processing before scaling down
- **Bad Example**: Setting cooldownPeriod to 30 seconds, causing workers to scale down while still processing the burst of messages that triggered scale-up
- **Good Example**: Setting cooldownPeriod to 300 seconds, allowing workers to drain the queue before scaling to zero
- **Exceptions**: Queues with very short job durations (<1 second) and predictable traffic may use shorter cooldown (120s minimum)
- **Consequences Of Violation**: Premature worker termination causing job retries and increased latency

## Rule 3: Configure Target Metric Based on Processing Capacity
- **Category**: Performance
- **Rule**: Set the KEDA target metric value based on per-worker throughput capacity
- **Reason**: The target metric determines how many workers are created per backlog message; too high = processing lag, too low = too many workers
- **Bad Example**: Using default target of 10 messages/replica for PDF-generation workers that process 1 job/minute each, causing 10-minute processing lag
- **Good Example**: Setting target to 1 message/replica for heavy jobs (PDF generation) and 10 for light jobs (email sending), matching per-worker throughput
- **Exceptions**: Fine-tune after observing actual worker throughput in production rather than guessing
- **Consequences Of Violation**: Queue backlog grows faster than workers can process, or too many workers waste compute

## Rule 4: Ensure Fast Worker Startup for Scale-from-Zero
- **Category**: Performance
- **Rule**: Optimize worker container startup time to under 10 seconds for KEDA scale-from-zero scenarios
- **Reason**: KEDA creates workers on demand when messages arrive; if startup takes 30 seconds, the first message waits 30+ seconds before processing
- **Bad Example**: A worker container that installs dependencies, compiles assets, and warms caches on startup, taking 45 seconds to become ready
- **Good Example**: Using minimal base images, lazy-loading connections, and deferring initialization to achieve <10 second startup
- **Exceptions**: Workers for batch queues where minutes of latency is acceptable may tolerate longer startup times
- **Consequences Of Violation**: poor user experience from delayed job processing; messages queued longer than acceptable latency targets

## Rule 5: Use KEDA for Kubernetes-Only; Use ECS Service Auto Scaling for Fargate
- **Category**: Architecture
- **Rule**: Use KEDA for Kubernetes workers (EKS, AKS, GKE) and ECS Service Auto Scaling with SQS metric for Fargate workers
- **Reason**: KEDA requires Kubernetes infrastructure; its event-driven scaling benefits are not available on Fargate, which has its own native SQS-based scaling
- **Bad Example**: Migrating to Kubernetes solely for KEDA when the application already runs on Fargate and could use simpler ECS Service Auto Scaling
- **Good Example**: On Fargate, configuring ECS Service Auto Scaling with target tracking on SQS ApproximateNumberOfMessagesVisible
- **Exceptions**: Organizations already running Kubernetes have KEDA available as a natural choice regardless of worker platform
- **Consequences Of Violation**: Unnecessary infrastructure complexity from adopting Kubernetes just for KEDA
