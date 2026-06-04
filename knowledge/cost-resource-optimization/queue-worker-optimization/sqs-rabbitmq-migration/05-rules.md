# SQS to RabbitMQ Migration Cost Rules

## Rule 1: Evaluate Breakeven Before Migration
- **Category**: Cost Management
- **Rule**: Do not migrate from SQS to RabbitMQ until message volume exceeds 100M messages/day
- **Reason**: SQS's pay-per-use pricing is cheaper at low-to-medium volume; RabbitMQ's fixed operational cost only becomes favorable above breakeven
- **Bad Example**: Migrating to RabbitMQ at 10M messages/day and paying $2,800/month for RabbitMQ infrastructure when SQS would cost ~$400/month
- **Good Example**: At 150M messages/day, computing SQS cost ($6,000/month) vs RabbitMQ total cost ($2,800/month + ops), then migrating for 50%+ savings
- **Exceptions**: Teams already running RabbitMQ for other workloads may leverage existing infrastructure regardless of volume
- **Consequences Of Violation**: Higher costs due to paying for RabbitMQ infrastructure without sufficient SQS savings to offset it

## Rule 2: Model Total Cost of Ownership
- **Category**: Cost Management
- **Rule**: Always include operational overhead in RabbitMQ TCO calculations
- **Reason**: RabbitMQ's $235/month cluster compute cost is only part of TCO; monitoring, patching, failover testing, and engineering time add significant hidden costs
- **Bad Example**: Comparing $6,000/month SQS vs $235/month RabbitMQ compute and concluding 96% savings, then discovering ops costs add $1,500/month
- **Good Example**: Comparing $6,000/month SQS vs $2,800/month RabbitMQ (compute $235 + EBS $100 + monitoring $200 + 5h ops at $200/h = $1,000 + buffer)
- **Exceptions**: Existing ops tooling and automation can reduce overhead; adjust TCO based on actual team maturity
- **Consequences Of Violation**: Budget overruns from unaccounted operational costs; unexpected engineering time allocation

## Rule 3: Start with SQS, Migrate to RabbitMQ at Scale
- **Category**: Architecture
- **Rule**: Default to SQS for new queue workloads; evaluate RabbitMQ only when volume justifies operational investment
- **Reason**: SQS has zero operational overhead and full AWS integration; RabbitMQ adds complexity that is only justified at scale
- **Bad Example**: Starting a new project with RabbitMQ "just in case" it grows, paying $2,800/month from day one for a queue processing 1,000 messages/day
- **Good Example**: Launching with SQS, monitoring volume growth, and planning migration when daily volume approaches 100M messages
- **Exceptions**: Applications requiring RabbitMQ-specific features (complex routing, pub/sub, message TTL per-queue) that SQS does not support
- **Consequences Of Violation**: Unnecessary infrastructure cost and operational burden for low-volume workloads

## Rule 4: Use Spot Instances for RabbitMQ Cluster
- **Category**: Cost Management
- **Rule**: Use Spot instances for RabbitMQ cluster nodes when fault tolerance is configured
- **Reason**: RabbitMQ's clustering provides resilience to node failure; Spot instances reduce EC2 cost by 60-70%, dropping cluster cost from ~$235 to ~$80/month
- **Bad Example**: Running all 3 RabbitMQ nodes on On-Demand instances at $235/month when Spot interruption would only cause a temporary node replacement
- **Good Example**: Configuring a 3-node RabbitMQ cluster with Spot instances and ensuring at least 2 nodes remain available during Spot interruptions
- **Exceptions**: Single-node RabbitMQ deployments or clusters without proper quorum configuration should use On-Demand
- **Consequences Of Violation**: Paying 3x more for compute than necessary; missing 60-70% cost savings on RabbitMQ infrastructure

## Rule 5: Evaluate Alternatives Beyond SQS and RabbitMQ
- **Category**: Architecture
- **Rule**: Consider Kafka and other messaging systems before committing to RabbitMQ migration
- **Reason**: At very high volume, Kafka may offer better throughput and lower cost than RabbitMQ for specific use cases (streaming, log aggregation, event sourcing)
- **Bad Example**: Migrating from SQS to RabbitMQ at 200M messages/day only to discover Kafka serves the use case better with lower operational overhead
- **Good Example**: Evaluating SQS, RabbitMQ, and Kafka against specific workload requirements (retention, replay, throughput, ordering) before choosing
- **Exceptions**: Teams with deep RabbitMQ expertise and existing infrastructure may reasonably prefer RabbitMQ over learning Kafka
- **Consequences Of Violation**: Suboptimal technology choice leading to future migration costs or ongoing operational inefficiency

## Rule 6: Plan Rollback Capability
- **Category**: Reliability
- **Rule**: Keep SQS queues active during RabbitMQ migration until migration is validated
- **Reason**: RabbitMQ migration may uncover operational gaps, performance issues, or reliability problems; SQS fallback provides insurance against migration failure
- **Bad Example**: Deleting SQS queues immediately after RabbitMQ goes live, then discovering a cluster failure with no fallback
- **Good Example**: Running both SQS and RabbitMQ in parallel for a validation period, with application logic preferring RabbitMQ but falling back to SQS
- **Exceptions**: Simple queue workloads with thorough load testing may not require parallel run
- **Consequences Of Violation**: Complete queue processing outage if RabbitMQ fails; emergency migration back to SQS under pressure
