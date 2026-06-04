# SQS to RabbitMQ Migration Cost Analysis

## Metadata
- **ID**: KU-14-SQS-RABBITMQ
- **Subdomain**: queue-worker-optimization
- **Domain**: cost-resource-optimization
- **Topic**: SQS to RabbitMQ Migration
- **Version**: 1.0
- **Classification**: Speculative
- **Maturity**: Medium

## Overview
A 2026 case study documented a ~50% cost reduction migrating from SQS ($6K/month) to self-hosted RabbitMQ on EC2 ($2.8K/month). The savings come from eliminating SQS per-request charges at high volume (>100M messages/day). RabbitMQ requires operational management (3-node cluster, monitoring, patching) but provides fixed-cost pricing at any message volume. This tradeoff becomes favorable when message volume is sustained and predictable.

## Core Concepts
- **Breakeven**: RabbitMQ becomes cheaper than SQS at ~100M messages/day
- **SQS cost**: $0.40/M requests × message volume (adds batching, empty receives)
- **RabbitMQ cost**: ~$235/month for 3-node r7g.large cluster + ops overhead
- **Case study**: $6K/month SQS → $2.8K/month RabbitMQ (includes compute + ops)
- **Risk**: Operational burden of self-managed RabbitMQ (patching, monitoring, failover)

## When To Use
- Sustained message volume >100M messages/day
- Predictable queue workloads (RabbitMQ's fixed cost vs SQS's variable cost)
- Teams with RabbitMQ operational expertise
- Self-hosted infrastructure already exists (EC2, ECS, EKS)

## When NOT To Use
- Variable message volume (SQS's pay-per-use wins for variable workloads)
- No operational capacity for RabbitMQ management
- Low to medium volume (<10M messages/day) — not worth migration
- Need for managed service with AWS integration

## Best Practices
- **Model total cost**: RabbitMQ = EC2 + EBS + monitoring + engineering time; SQS = per-request charges (WHY: RabbitMQ's $235/month cluster cost is just compute; include EBS, monitoring, patching, and 5-10 hours/month ops time at $150-300/hour)
- **Start with SQS, migrate to RabbitMQ at scale-proof**: "SQS first, RabbitMQ when necessary" (WHY: SQS has zero operational overhead; RabbitMQ adds complexity; wait until volume justifies the operational cost; breakeven analysis should include engineering time for migration and ongoing management)
- **Use RabbitMQ on Spot instances**: Reduce EC2 cost by 60-70% for RabbitMQ cluster nodes (WHY: RabbitMQ nodes are fault-tolerant with clustering; Spot interruption = temporary node replacement, not data loss; reduces RabbitMQ monthly cost from $235 to ~$80 for 3-node cluster)

## Related Topics
- SQS Pricing Model (ku-10)
- SQS Batching Savings (ku-11)
- KEDA Scale-to-Zero Workers (ku-45)

## AI Agent Notes
- Default: start with SQS; evaluate RabbitMQ at >100M messages/day
- Model ops cost (not just compute) in RabbitMQ comparison
- Use Spot instances for RabbitMQ cluster nodes
- Breakeven varies by SQS usage pattern (batching, long polling, etc.)
