# Aurora Global Database Cost

## Metadata
- **ID**: KU-52-AURORA-GLOBAL
- **Subdomain**: multi-region-global-cost
- **Domain**: cost-resource-optimization
- **Topic**: Aurora Global Database Cost
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Aurora Global Database provides storage-level replication across AWS regions, enabling low-latency reads and disaster recovery. Costs include: compute in each region, storage replication ($0.20/M replicated write I/Os), and cross-region data transfer. Active-passive setups (compute only in primary, serverless readers in secondary) minimize cost. Aurora Global Database is most cost-effective for disaster recovery with headless clusters (storage replicated, compute provisioned only on failover).

## Core Concepts
- **Replication cost**: $0.20 per million replicated write I/Os
- **Secondary compute**: Pay for compute in each region where readers are provisioned
- **Storage**: Aurora storage replicated to secondary regions (same $0.10/GB/month)
- **Data transfer**: Cross-region transfer for replication traffic ($0.02/GB)
- **Headless DR**: Aurora storage replicated without compute in DR region until failover

## When To Use
- Disaster recovery requiring <1 minute RPO and <5 minute RTO
- Low-latency global reads for applications with read-heavy workloads
- Active-passive multi-region architectures for cost-sensitive DR
- Compliance requirements demanding data residency in multiple regions
- Write-heavy applications needing low-lag cross-region replication (1-2 seconds)

## When NOT To Use
- Single-region deployments (no multi-region need); use standard Aurora
- Read-heavy apps where read replicas in the same region suffice
- Applications tolerant of >5 minute RPO (use S3 cross-region replication for backups)
- Cost-sensitive deployments where headless DR isn't sufficient
- Write-heavy apps with >50K writes/second per cluster (replication lag spikes)

## Best Practices
- **Use headless DR clusters for secondary regions**: Replicate storage without compute; provision compute only on failover (WHY: compute is 40-60% of Aurora cost; headless DR eliminates 100% of secondary compute spend until failover; $0/month for DR compute vs $500+)
- **Use serverless v2 readers in secondary for variable traffic**: Auto-scaling readers in DR region for read traffic (WHY: serverless v2 can scale to near-zero when idle; pay only for ACU-hours used; provisioned readers run 24/7 at full cost)
- **Monitor replicated write I/O cost**: Track `AuroraReplicatedWriteIO` metric for cost management (WHY: write-heavy apps generate significant replication cost; $0.20/M writes adds up; 10M writes/month replication = $2/month on top of base storage)
- **Choose 2-region over 3-region unless necessary**: Each additional region adds storage replication cost + data transfer (WHY: 3-region Global Database triples storage costs for secondary storage; 2-region covers 99% of DR scenarios; add third region only for specific compliance needs)
- **Set up write forwarding for application-level writes from secondary**: Avoids application-level cross-region writes (WHY: writing from secondary region back to primary adds latency and cost; write forwarding handles this transparently at database level)

## Architecture Guidelines
- Aurora Global Database for DR with RTO <5 minutes and RPO <1 minute
- Headless DR for maximum cost savings in secondary regions
- Serverless v2 readers in secondary for variable read traffic
- Route 53 failover routing for automated failover
- CloudFront as primary entry point before Global Database
- For Laravel apps, 2-region active-passive with headless DR is the cost-effective choice

## Performance Considerations
- Replication lag: 1-2 seconds under normal conditions; can spike to 10+ seconds under heavy write
- Write forwarding adds 5-10ms per statement; minimize writes from secondary
- Cross-region reads: 70-100ms from EU to US; acceptable for read-after-write consistency
- Storage replication is asynchronous; commit happens on primary before replication
- Failover time: 1-3 minutes for Global Database vs 5-10 minutes for standard cross-region replicas

## Security Considerations
- Data in transit between regions encrypted using TLS
- KMS encryption keys can be replicated across regions using multi-Region keys
- Global Database shares the same security group controls per cluster
- Audit replication events in CloudTrail for compliance
- Data residency: storage in each region stays within that region's boundaries

## Common Mistakes
1. **Using provisioned readers in secondary when serverless suffices**: Provisioned r7g.large in DR region running 24/7 at $200/month (Cause: defaulting to provisioned instances; Consequence: paying for compute used 0% of time; Better: use serverless v2 readers; scale to near-zero when idle)
2. **Not using headless DR for non-read use cases**: Running compute in DR region when DR never serves reads (Cause: "compute must be running for failover"; Consequence: $200-500/month for unused compute; Better: headless DR provisions compute only on failover; no idle cost)
3. **3-region deployment without evaluating need**: Adding Asia-Pacific DR when US + EU covers rest (Cause: "more regions = more resilient"; Consequence: 3x storage cost + additional replication traffic; Better: 2 regions + CloudFront global coverage)
4. **Ignoring replicated write I/O costs**: Write-heavy app with 50M writes/month + replication = $10/month extra (Cause: focusing only on compute storage costs; Consequence: surprise replication charges at scale; Better: monitor AuroraReplicatedWriteIO; optimize write patterns)

## Anti-Patterns
- **Active-active Global Database**: Both regions writing causes conflicts; use active-passive
- **Over-provisioned secondary**: Matching primary compute exactly when DR doesn't serve traffic
- **No failover testing**: Global Database failover requires specific DNS and application config
- **CloudFront after Global Database**: CDN should be in front to minimize origin requests

## Examples
- **Headless DR (2-region)**: Primary $1000/month (compute+storage) + Secondary $50/month (storage replication only) = $1050/month
- **Serverless DR readers (2-region)**: Primary $1000 + Secondary $100-200/month (light read traffic on serverless) = $1100-1200/month
- **Provisioned DR (2-region)**: Primary $1000 + Secondary $500/month (provisioned r7g.large, zero traffic) = $1500/month (43% more than headless)

## Related Topics
- Cross-Region Data Transfer (ku-51)
- Active-Passive Multi-Region (ku-53)
- Route 53 Routing Costs (ku-54)

## AI Agent Notes
- Default: headless DR for maximum savings
- Use serverless v2 readers if secondary serves reads
- Monitor AuroraReplicatedWriteIO cost
- 2-region covers 99% of DR scenarios
- CloudFront before Global Database
