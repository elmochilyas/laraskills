# KU-01-DATA-TRANSFER-COSTS: Data Transfer Costs

## Metadata
- **ID**: KU-01-DATA-TRANSFER-COSTS
- **Subdomain**: Multi-Region & Global Cost
- **Topic**: Data Transfer Costs
- **Source**: Multi-Region & Global Cost, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
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

## Mental Models
- Default: same-AZ deployment for app + database
- Default: VPC Endpoints over NAT Gateway for AWS services
- Default: CloudFront for global content delivery
- Cross-region writes should be asynchronous

## Internal Mechanics
- Cross-region latency: 50-200ms round trip (unacceptable for synchronous calls)
- Cross-AZ latency: 1-5ms (acceptable but adds up over many queries)
- VPC Endpoint latency: <1ms added (negligible)
- Compression benefit: 30-70% data size reduction (lower cost, faster transfer)
- CloudFront: <10ms for cache hits, 50-200ms for misses (vs origin)

## Patterns
- Keep app and database in same AZ
- Use VPC Endpoints for AWS services
- Use CloudFront for global content delivery
- Minimize cross-region writes
- Use Aurora Global Database for cross-region replication
- Monitor DataTransfer costs in Cost Explorer

## Architectural Decisions
- Default: single-region deployment with local cache and local database
- Multi-region: Deploy independently per region (local DB, local cache); use event bus for cross-region data sync
- Avoid synchronous cross-region API calls in request path
- Use CloudFront as entry point for all global applications
- Compress data before transfer (gzip reduces text size by 70%+)
- Route53 latency-based routing directs users to nearest region

## Tradeoffs
**When To Use:**
- Same-region deployment: Default for cost optimization; all services in one region
- Multi-region: Global user base with latency requirements; compliance (data residency)
- Cross-region replicas: Aurora Global Database, RDS cross-region read replicas
- CloudFront: Cheaper egress than EC2 direct; add at edge for global users
- VPC peering: Connect VPCs in same region for free; cross-region at $0.01-0.02/GB

**When NOT To Use:**
- Cross-region database sync for same-region users: Adding latency and cost with no benefit
- NAT Gateway for AWS services: Use VPC Endpoints (free for S3/DynamoDB)
- Cross-region cache sync: Multi-region Redis replication is expensive; use local caches instead
- Direct Connect for small data: Minimum monthly fee ($36+) may exceed data transfer cost
- Unnecessary cross-AZ traffic: Deploy app + DB in same AZ to avoid $0.01/GB

## Performance Considerations
- Cross-region latency: 50-200ms round trip (unacceptable for synchronous calls)
- Cross-AZ latency: 1-5ms (acceptable but adds up over many queries)
- VPC Endpoint latency: <1ms added (negligible)
- Compression benefit: 30-70% data size reduction (lower cost, faster transfer)
- CloudFront: <10ms for cache hits, 50-200ms for misses (vs origin)

## Production Considerations
- Encrypt cross-region data transfer (TLS; AWS backbone encrypts by default)
- VPC peering traffic stays within AWS network (no public internet)
- Cross-region replication must comply with data residency regulations
- CloudFront origin access control (OAC) prevents direct S3 access
- Monitor DataTransfer for anomalies (potential data exfiltration)

## Common Mistakes
- **Cross-region database queries**: API in us-east-1 queries database in eu-west-1 (Cause: "database is in EU for compliance, users are global"; Consequence: 100ms latency per query, $0.09/GB transfer cost; Better: local read replicas per region; write to primary asynchronously)
- **Ignoring cross-AZ transfer costs**: EC2 instances in AZ-a connecting to RDS in AZ-b (Cause: availability-focused deployment; Consequence: $200-500/month cross-AZ data transfer; Better: deploy app + DB in same AZ; use Multi-AZ only for failover)
- **Using NAT Gateway for all outbound traffic**: 500GB/month to SQS, SNS, S3 through NAT (Cause: default route table configuration; Consequence: $22.50/month NAT processing cost + $0.045/GB; Better: VPC Gateway Endpoints for S3/DynamoDB (free), Interface Endpoints for SQS/SNS ($7/month flat))

## Failure Modes
- **Hub-and-spoke database**: All regions read/write to single database in one region (latency, cost, single point of failure)
- **No data compression before transfer**: Transferring uncompressed JSON across regions (3-5x cost)
- **Cross-region cache eviction**: Writing cache changes cross-region for every update (costly and slow)

## Ecosystem Usage
- **Before**: 3 app servers in AZ-a, database in AZ-b; 1000 queries/s cross-AZ = 1000 queries/s * $0.01/GB * 2.7M sec/month = $270/month wasted
- **After**: App servers in same private subnet as database (same AZ); cross-AZ cost = $0
- **Multi-region app**: us-east-1 (primary), eu-west-1 (replica); Aurora Global Database for replication; Route53 latency routing; local cache in each region

## Related Knowledge Units
- Region Selection (ku-02)
- Multi-Region Database (ku-03)
- Global Load Balancing (ku-04)
- Region Data Affinity

## Research Notes
Derived from Multi-Region & Global Cost, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.