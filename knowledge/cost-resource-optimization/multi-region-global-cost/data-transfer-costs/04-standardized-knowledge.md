# Data Transfer Costs

## Metadata
- **ID**: KU-01-DATA-TRANSFER-COSTS
- **Subdomain**: multi-region-global-cost
- **Domain**: cost-resource-optimization
- **Topic**: Data Transfer Costs
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Data transfer between AWS regions, AZs, and to the internet is often a hidden cost that can exceed compute expenses. For Laravel applications with multi-region deployments (user base in US + EU + Asia), cross-region data transfer for database replication, cache synchronization, and API calls adds significant cost. Understanding data transfer pricing and minimizing cross-region traffic is essential for multi-region cost optimization.

## Core Concepts
- **Same-AZ transfer**: Free (no cost)
- **Cross-AZ transfer**: $0.01/GB each way (EC2 -> another AZ in same region)
- **Cross-region transfer**: $0.02-0.09/GB (varies by source/destination region pair)
- **Internet egress**: $0.05-0.09/GB (EC2/ALB to internet); free inbound
- **CloudFront egress**: $0.085/GB (cheaper than EC2 egress for most regions)
- **NAT Gateway data processing**: $0.045/hour + $0.045/GB processed
- **VPC peering transfer**: $0.01-0.02/GB cross-region; free same-region
- **Direct Connect**: $0.00-0.02/GB (dedicated connection to on-premises)

## When To Use
- Same-region deployment: Default for cost optimization; all services in one region
- Multi-region: Global user base with latency requirements; compliance (data residency)
- Cross-region replicas: Aurora Global Database, RDS cross-region read replicas
- CloudFront: Cheaper egress than EC2 direct; add at edge for global users
- VPC peering: Connect VPCs in same region for free; cross-region at $0.01-0.02/GB

## When NOT To Use
- Cross-region database sync for same-region users: Adding latency and cost with no benefit
- NAT Gateway for AWS services: Use VPC Endpoints (free for S3/DynamoDB)
- Cross-region cache sync: Multi-region Redis replication is expensive; use local caches instead
- Direct Connect for small data: Minimum monthly fee ($36+) may exceed data transfer cost
- Unnecessary cross-AZ traffic: Deploy app + DB in same AZ to avoid $0.01/GB

## Best Practices
- **Keep app and database in same AZ**: Deploy EC2/Fargate web servers in same AZ as primary RDS/Aurora (WHY: cross-AZ data transfer costs $0.01/GB each way; at 100 req/s with 10 queries each, that's 1000 cross-AZ calls/s = ~$260/month wasted; same-AZ = $0)
- **Use VPC Endpoints for AWS services**: S3 Gateway Endpoint (free), Interface Endpoints for SQS, SNS, etc. (~$7/month each) (WHY: NAT Gateway charges $0.045/GB for data processing; 500GB/month SQS traffic through NAT = $22.50 vs VPC Endpoint = $7/month flat)
- **Use CloudFront for global content delivery**: CloudFront egress ($0.085/GB) is cheaper than EC2 egress ($0.09/GB) and adds CDN benefits (WHY: CloudFront also reduces origin load; free tier covers 1TB/month; for multi-region users, CloudFront caches at edge, avoiding cross-region data transfer)
- **Minimize cross-region writes**: Writes should be local to each region; use event replication (async, eventual) instead of synchronous cross-region database calls (WHY: synchronous cross-region writes cost $0.09/GB AND add 50-200ms latency; async replication can batch and compress data)
- **Use Aurora Global Database for cross-region replication**: 1 writer region, multiple reader regions; replication within AWS backbone (no public internet) (WHY: Aurora Global Database replicates at the storage layer (no query-based replication); ~0.5-1s lag; cost of replication data transfer is included in Aurora pricing)
- **Monitor DataTransfer costs in Cost Explorer**: Set Cost Explorer budget for DataTransfer; investigate services driving costs (WHY: data transfer is often the fastest-growing cost; monthly review catches anomalies (misconfigured cross-region traffic, unexpected egress))

## Architecture Guidelines
- Default: single-region deployment with local cache and local database
- Multi-region: Deploy independently per region (local DB, local cache); use event bus for cross-region data sync
- Avoid synchronous cross-region API calls in request path
- Use CloudFront as entry point for all global applications
- Compress data before transfer (gzip reduces text size by 70%+)
- Route53 latency-based routing directs users to nearest region

## Performance Considerations
- Cross-region latency: 50-200ms round trip (unacceptable for synchronous calls)
- Cross-AZ latency: 1-5ms (acceptable but adds up over many queries)
- VPC Endpoint latency: <1ms added (negligible)
- Compression benefit: 30-70% data size reduction (lower cost, faster transfer)
- CloudFront: <10ms for cache hits, 50-200ms for misses (vs origin)

## Security Considerations
- Encrypt cross-region data transfer (TLS; AWS backbone encrypts by default)
- VPC peering traffic stays within AWS network (no public internet)
- Cross-region replication must comply with data residency regulations
- CloudFront origin access control (OAC) prevents direct S3 access
- Monitor DataTransfer for anomalies (potential data exfiltration)

## Common Mistakes
1. **Cross-region database queries**: API in us-east-1 queries database in eu-west-1 (Cause: "database is in EU for compliance, users are global"; Consequence: 100ms latency per query, $0.09/GB transfer cost; Better: local read replicas per region; write to primary asynchronously)
2. **Ignoring cross-AZ transfer costs**: EC2 instances in AZ-a connecting to RDS in AZ-b (Cause: availability-focused deployment; Consequence: $200-500/month cross-AZ data transfer; Better: deploy app + DB in same AZ; use Multi-AZ only for failover)
3. **Using NAT Gateway for all outbound traffic**: 500GB/month to SQS, SNS, S3 through NAT (Cause: default route table configuration; Consequence: $22.50/month NAT processing cost + $0.045/GB; Better: VPC Gateway Endpoints for S3/DynamoDB (free), Interface Endpoints for SQS/SNS ($7/month flat))

## Anti-Patterns
- **Hub-and-spoke database**: All regions read/write to single database in one region (latency, cost, single point of failure)
- **No data compression before transfer**: Transferring uncompressed JSON across regions (3-5x cost)
- **Cross-region cache eviction**: Writing cache changes cross-region for every update (costly and slow)

## Examples
- **Before**: 3 app servers in AZ-a, database in AZ-b; 1000 queries/s cross-AZ = 1000 queries/s * $0.01/GB * 2.7M sec/month = $270/month wasted
- **After**: App servers in same private subnet as database (same AZ); cross-AZ cost = $0
- **Multi-region app**: us-east-1 (primary), eu-west-1 (replica); Aurora Global Database for replication; Route53 latency routing; local cache in each region

## Related Topics
- Region Selection (ku-02)
- Multi-Region Database (ku-03)
- Global Load Balancing (ku-04)
- Region Data Affinity

## AI Agent Notes
- Default: same-AZ deployment for app + database
- Default: VPC Endpoints over NAT Gateway for AWS services
- Default: CloudFront for global content delivery
- Cross-region writes should be asynchronous

## Verification
- [ ] App and database in same AZ (avoid cross-AZ costs)
- [ ] VPC Endpoints used for S3, SQS, SNS (not NAT Gateway)
- [ ] CloudFront used for global content delivery
- [ ] No synchronous cross-region database calls
- [ ] Cross-region data compressed (gzip)
- [ ] DataTransfer costs monitored (Cost Explorer budget)
- [ ] Cross-region replication uses AWS backbone (not internet)
