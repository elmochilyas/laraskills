# Cross-Region Data Transfer Costs

## Metadata
- **ID**: KU-51-CROSS-REGION-TRANSFER
- **Subdomain**: multi-region-global-cost
- **Domain**: cost-resource-optimization
- **Topic**: Cross-Region Data Transfer
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Cross-region data transfer costs $0.02/GB ($0.01-0.09 depending on region pair) and is the most overlooked cost in multi-region architectures. For globally distributed Laravel apps, cross-region data transfer can dominate the infrastructure bill — often exceeding compute costs. Common sources: S3 CRR, RDS read replicas across regions, DynamoDB Global Tables, and application-level API calls between regional deployments.

## Core Concepts
- **Standard rate**: $0.02/GB inter-region (one direction)
- **Range**: $0.01/GB (adjacent US regions) to $0.09/GB (US->South America)
- **Free inbound**: Target region ingress is free
- **Common sources**: Database replication, log aggregation, backup replication
- **Cost driver**: Data volume × distance (regional pricing varies)

## When To Use
- Multi-region deployments where global latency is critical for user experience
- Disaster recovery with data replication across regions
- Compliance-driven multi-region data storage requirements
- Applications with read-heavy workloads that benefit from regional data proximity
- Global user base where CloudFront edge caching alone isn't sufficient

## When NOT To Use
- Single-region deployments with global user base (CloudFront solves most latency)
- Read-heavy apps where read replicas in the same region suffice
- Cost-sensitive apps where cross-region transfer would exceed 20% of infrastructure budget
- Applications where data can be replicated asynchronously via application-level batching
- Compliance setups where data can't leave source region (use CloudFront only)

## Best Practices
- **Use CloudFront as primary global entry point**: CDN caching reduces origin region requests by 80-95% (WHY: CloudFront serves content from edge locations; only cache misses go to origin region; reduces cross-region transfer by 80-95%; CloudFront-to-origin transfer is free for AWS origins)
- **Compress data before cross-region transfer**: Enable compression on database replication and API calls (WHY: Gzip reduces transfer volume by 60-90%; $0.02/GB compressed = $0.002-0.008/GB effective cost; compression is CPU-cheap but bandwidth-expensive)
- **Aggregate data at source before transfer**: Batch small writes into larger payloads (WHY: each write operation has per-request overhead; 100 small writes = 100x the metadata cost of 1 batch write; batch at source for 50-80% fewer transfer operations)
- **Selective replication over full replication**: Replicate only what's needed across regions (WHY: replicating entire database vs. subset of tables can be 10x cost difference; use selective S3 CRR rules, Global Table subsetting, or application-level selective sync)
- **Monitor per-region data transfer in Cost Explorer**: Enable Cost Explorer for per-region analysis (WHY: transfer costs vary by region pair; US-East to EU-West is $0.02/GB; US-East to South America is $0.09/GB; monitor to catch expensive region pairs)

## Architecture Guidelines
- CloudFront as primary global entry point before multi-region
- Active-passive over active-active to halve data transfer
- Selective replication over full database replication
- Compress all cross-region data
- Batch small operations into larger payloads
- For Laravel apps with global users: CloudFront (80% of use), Global Database (15%), multi-region app (5%)

## Performance Considerations
- Cross-region latency: US-East to EU-West ~70-100ms; US-East to Asia-Pacific ~150-250ms
- Aurora Global DB replication lag: 1-2 seconds under normal conditions
- Compression adds 1-5ms processing time per request; network savings outweigh overhead
- Batching reduces per-request overhead but adds latency for first item in batch
- Data transfer bandwidth: 1-10 Gbps per instance type; aggregate across instances for higher throughput

## Security Considerations
- Cross-region data transfer stays within AWS backbone (not internet)
- Encryption in transit is automatic for AWS service-to-service replication
- KMS keys may need to be replicated for cross-region decryption
- Compliance: ensure data transfer doesn't violate data residency laws
- VPC endpoints keep cross-region traffic within AWS network

## Common Mistakes
1. **Not using CloudFront before multi-region**: Deploying multi-region for latency when CDN solves 80% (Cause: "CDN is just for static content"; Consequence: 5x infrastructure cost for marginal latency improvement; Better: start with CloudFront single-region origin; only add multi-region if latency requirements exceed CDN capability)
2. **Replicating everything instead of selective sync**: S3 CRR replicating all buckets, all prefixes (Cause: "just replicate everything"; Consequence: paying for data transfer of non-critical data; Better: selective CRR rules, replicate only business-critical data)
3. **No compression on replication**: Sending uncompressed database replication traffic (Cause: assuming compression requires application changes; Consequence: 60-70% higher data transfer cost; Better: enable native replication compression where available, or compress at application layer)
4. **Ignoring region pair pricing differences**: Choosing South America for DR when US region suffices (Cause: DR region chosen for geographic diversity; Consequence: $0.09/GB vs $0.02/GB transfer cost; Better: evaluate region pair pricing; consider US West as alternative to South America for geographic diversity at lower cost)

## Anti-Patterns
- **Full database replication for all tables**: Only critical tables need cross-region sync
- **No aggregation before transfer**: 1M small writes cost the same transfer as 100K large writes
- **CloudFront after multi-region**: CDN should be in front of origin, not behind
- **Compression as afterthought**: Enable compression from day one

## Examples
- **CloudFront + single-region origin (10TB/month transfer saved)**: $0 transfer to origin (free) + CloudFront egress ($85/10TB) = $85 vs $200 direct S3 cross-region
- **Selective replication (10% of data)**: 100GB/month selective vs 1TB full replication = $2/month vs $20/month; 90% savings
- **Compressed replication**: 500GB uncompressed vs 150GB compressed = $10/month vs $3/month; 70% savings

## Related Topics
- Aurora Global Database Cost (ku-52)
- Active-Passive Multi-Region (ku-53)
- Route 53 Routing Costs (ku-54)

## AI Agent Notes
- Default: CloudFront before multi-region
- Compress all cross-region data transfers
- Selective replication over full replication
- Monitor per-region transfer costs
- Region pair pricing varies 4-5x
