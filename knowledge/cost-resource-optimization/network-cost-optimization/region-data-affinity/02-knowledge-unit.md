# KU-03-REGION-DATA-AFFINITY: Region Data Affinity

## Metadata
- **ID**: KU-03-REGION-DATA-AFFINITY
- **Subdomain**: Network Cost Optimization
- **Topic**: Region Data Affinity
- **Source**: Network Cost Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Region data affinity ensures that application servers connect to database and cache resources in the same AWS region and Availability Zone. Cross-region data transfer costs $0.01-0.09/GB and adds 10-100ms latency per request. Cross-AZ traffic within a region costs $0.01/GB each way. For Laravel applications, keeping compute and data in the same AZ eliminates cross-AZ data transfer costs and reduces latency. Proper architecture can save 5-20% of total infrastructure costs.

## Core Concepts
- **Same-AZ traffic**: Free (no data transfer cost); <1ms latency between EC2 and RDS in same AZ
- **Cross-AZ traffic**: $0.01/GB each way; 1-5ms latency overhead
- **Cross-region traffic**: $0.01-0.09/GB; 10-100ms latency overhead
- **NAT Gateway**: $0.045/hour + $0.045/GB processed; private subnet traffic to internet
- **VPC Peering/Transit Gateway**: Cross-VPC connectivity; data transfer costs apply
- **Application placement group**: Ensures instances are in same AZ for maximum affinity

## Mental Models
- Default: deploy all services in same AZ for cost optimization
- Default: VPC Endpoints (free) over NAT Gateway for AWS services
- Multi-AZ for HA only; optimize primary traffic to same AZ

## Internal Mechanics
- Same-AZ: 0.1-0.5ms latency between EC2 and RDS
- Cross-AZ: 1-5ms additional latency (10-50% increase on query time)
- Cross-region: 10-100ms additional latency (unacceptable for synchronous database calls)
- NAT Gateway latency: Adds 1-3ms for outbound traffic vs VPC Endpoint (<1ms)
- Placement groups: <1ms latency, 10 Gbps throughput between instances in same placement group

## Patterns
- Deploy app and database in same AZ
- Use VPC Endpoints for AWS services
- Place cache and database in same AZ as web servers
- Use Multi-AZ for availability, not for cost
- Configure RDS Proxy in same AZ as app

## Architectural Decisions
- Deploy ALB + EC2 Web + ElastiCache + RDS Primary all in AZ-a (primary traffic zone)
- Deploy RDS Standby in AZ-b (for failover only)
- Use ASG with AZ balancing disabled (keep all instances in AZ-a)
- For HA cross-AZ: Deploy second ASG in AZ-b, use Route53 latency routing
- Use VPC Endpoints instead of NAT Gateway for S3, SQS, DynamoDB access
- Monitor DataTransfer metrics in Cost Explorer to track cross-AZ charges

## Tradeoffs
**When To Use:**
- Same-AZ deployment: Cost-sensitive apps with single-AZ tolerance
- Cross-AZ deployment: High-availability requirement (multi-AZ failover)
- Same-region: All production deployments (app, DB, cache in same region)
- Multi-region: Global user base requiring low latency worldwide
- Private subnets: For database, cache, and internal services (avoids NAT Gateway costs)

**When NOT To Use:**
- Cross-region for same-region users: Unnecessary cost and latency for local user base
- Single-AZ for critical workloads: Single-AZ failure causes total outage; use multi-AZ with Same-AZ affinity for primary
- NAT Gateway for same-region VPC endpoints: Use VPC Endpoints (Gateway/Interface) instead of NAT for AWS services
- Public subnets for databases: Security risk; always use private subnets

## Performance Considerations
- Same-AZ: 0.1-0.5ms latency between EC2 and RDS
- Cross-AZ: 1-5ms additional latency (10-50% increase on query time)
- Cross-region: 10-100ms additional latency (unacceptable for synchronous database calls)
- NAT Gateway latency: Adds 1-3ms for outbound traffic vs VPC Endpoint (<1ms)
- Placement groups: <1ms latency, 10 Gbps throughput between instances in same placement group

## Production Considerations
- VPC Endpoints keep traffic within AWS network (never traverses internet)
- NAT Gateway provides outbound internet for private subnets with elastic IP
- VPC Flow Logs capture data transfer between AZs/regions for audit
- Cross-region traffic should be encrypted (VPC Peering or Transit Gateway encrypts)
- Security groups by AZ: limit cross-AZ traffic to only required ports

## Common Mistakes
- **Random AZ deployment**: Auto Scaling launches instances across AZs randomly; database is in one AZ, 50% of traffic crosses AZs (Cause: ASG default behavior; Consequence: paying cross-AZ for 50% of traffic; Better: launch all instances in same AZ as database, use AZ-balanced only for multi-AZ HA)
- **Using NAT Gateway for AWS services**: SQS access via NAT Gateway ($0.045/GB) instead of VPC Endpoint (free) (Cause: default routing; Consequence: $0.045/GB for all SQS traffic; 100GB/month SQS = $4.50 wasted; Better: create VPC Gateway or Interface Endpoint for each AWS service)
- **Cross-region database for global app**: Synchronous database replication across regions (Cause: "all data in one database" approach; Consequence: 50-200ms query latency for non-local users; $0.09/GB data transfer; Better: read replicas in each region, local cache, or distributed database)

## Failure Modes
- **Single-AZ with no multi-region**: All services in one AZ with no failover (50% monthly risk of AZ outage)
- **All services in public subnets**: Paying NAT Gateway costs and exposing databases to internet
- **Cross-region synchronous calls**: Every request makes cross-region database/API calls (unacceptable latency)
- **Ignoring DataTransfer costs**: Not monitoring cross-AZ/region data transfer; surprise bills

## Ecosystem Usage
- **Standard cost-optimized**: EC2 + RDS + Redis all in AZ-a; VPC Endpoints for S3/SQS; no NAT Gateway
- **HA with cost optimization**: Primary app in AZ-a + AZ-b; database cross-AZ; route primary traffic to AZ-a (same-AZ as DB primary)
- **Multi-region global**: App in us-east-1, eu-west-1, ap-southeast-1; each region has local RDS read replica; Aurora Global Database for replication

## Related Knowledge Units
- Data Transfer Costs
- VPC Architecture
- Multi-Region Database
- Cross-AZ NAT Gateway Cost

## Research Notes
Derived from Network Cost Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.