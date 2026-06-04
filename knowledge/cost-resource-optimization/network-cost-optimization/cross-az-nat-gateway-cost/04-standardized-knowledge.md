# Cross-AZ and NAT Gateway Cost

## Metadata
- **ID**: KU-36-NETWORK-COST
- **Subdomain**: network-cost-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Cross-AZ and NAT Gateway Cost
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Cross-AZ data transfer costs $0.01/GB each direction ($0.02/GB round-trip) — this adds up significantly for chatty microservice communication. NAT Gateway costs ~$32/month + $0.045/GB processed. For a multi-AZ Laravel deployment with 10TB cross-AZ traffic/month, networking costs can reach $200-300/month. Collocating compute and database in the same AZ and using VPC endpoints for AWS services eliminates these costs entirely.

## Core Concepts
- **Cross-AZ transfer**: $0.01/GB each direction
- **NAT Gateway**: $0.045/hour (~$32/month) + $0.045/GB data processing
- **VPC endpoints**: Free (per-hour charge but eliminates NAT/transfer costs)
- **Same-AZ traffic**: Free (private IP, same AZ)
- **Cross-region**: $0.02/GB (more expensive)
- **S3/DynamoDB endpoints**: Free (VPC Gateway Endpoints, no hourly charge)

## When To Use
- VPC endpoints for high-volume AWS traffic (S3, DynamoDB, ECR) to avoid NAT processing fees
- Same-AZ architecture for cost-sensitive deployments where HA is not critical
- NAT Gateway when internet access is required from private subnets (Lambda, ECS tasks)
- Cross-AZ deployment for production HA when $200-300/month networking cost is acceptable
- VPC Gateway Endpoints for S3/DynamoDB to eliminate both NAT and transfer costs

## When NOT To Use
- NAT Gateway for AWS-only traffic: Use VPC endpoints instead (free for S3/DynamoDB)
- Cross-AZ for chatty microservices: Latency <2ms is fine, but $0.02/GB round-trip adds up
- Multiple NAT Gateways per AZ without evaluating cross-AZ traffic volume
- RDS Proxy for low-traffic apps where connection pooling benefit doesn't offset hourly cost
- PrivateLink for bursty low-volume traffic: VPC endpoint hourly charge may not be justified

## Best Practices
- **Collocate web servers and database in same AZ**: This single change eliminates cross-AZ data transfer costs (WHY: same-AZ traffic between EC2 and RDS is free; moving RDS to same AZ as web servers saves $50-200/month in data transfer)
- **Use VPC Gateway Endpoints for S3 and DynamoDB**: These are free (no hourly charge) and eliminate NAT processing for all S3/DynamoDB traffic (WHY: VPC Gateway Endpoints have no hourly cost or data processing fee; they route traffic through AWS backbone, not internet)
- **Use VPC Interface Endpoints for other AWS services**: ECR, CloudWatch, SQS, STS, etc. — each endpoint costs ~$7/month but eliminates NAT Gateway processing (WHY: NAT Gateway processes data at $0.045/GB; 200GB/month of NAT traffic costs $9/month; one endpoint pays for itself at ~155GB/month)
- **Minimize cross-AZ traffic**: Place services that communicate frequently in the same AZ (WHY: each GB crossing AZ boundaries costs $0.01 each way; 1TB/month inter-AZ = $20/month for nothing; service placement optimization is free)
- **Monitor NAT Gateway BytesProcessed**: Set CloudWatch alarm on this metric with a budget-aware threshold (WHY: unexpected NAT processing is a common cost surprise; alarm at $50/month estimated cost from BytesProcessed)

## Architecture Guidelines
- One NAT Gateway per AZ is required for high availability; avoid unnecessary AZ expansion
- Use VPC endpoints for all AWS services accessed from private subnets
- Place application and database in same AZ for lowest network cost
- For production HA, use multi-AZ but accept the $100-300/month network overhead
- RDS Proxy for Lambda/Fargate connection pooling; PgBouncer for stable server fleets
- Network cost optimization hierarchy: same-AZ collocation > VPC endpoints > NAT consolidation

## Performance Considerations
- NAT Gateway adds ~1-3ms latency per packet; VPC endpoints add <1ms
- RDS Proxy adds ~1-2ms per database connection; negligible for most workloads
- Cross-AZ latency: within same region, <2ms; acceptable for synchronous operations
- Connection pooling reduces connection establishment overhead from ~10ms to <1ms
- VPC endpoints have a bandwidth limit of 10Gbps; request increase for high-throughput scenarios

## Security Considerations
- NAT Gateway traffic traverses internet; VPC endpoints stay within AWS backbone
- VPC Gateway Endpoints use IAM policies for access control; no security groups needed
- VPC Interface Endpoints support security groups for finer control
- VPC endpoints prevent data exfiltration via S3 (compliance requirement)
- Enable VPC Flow Logs to monitor data transfer patterns and detect anomalies

## Common Mistakes
1. **Running multiple NAT Gateways without evaluating cross-AZ traffic**: 2 AZs = 2 NAT Gateways = $64/month + data processing (Cause: default multi-AZ deployment creates NAT per AZ; Consequence: $64/month baseline + data processing per AZ; Better: evaluate if single-AZ serves needs, or use VPC endpoints to reduce NAT processing)
2. **Not using VPC endpoints for high-volume AWS services**: 500GB/month S3 traffic through NAT = $22.50/month processing fee (Cause: not knowing VPC Gateway Endpoints are free; Consequence: paying NAT processing for traffic that could be free; Better: add VPC Gateway Endpoint for S3; zero cost, zero maintenance)
3. **Placing app and database in different AZs**: Web in us-east-1a, RDS in us-east-1b; every query pays $0.02/GB (Cause: not specifying AZ in deployment; Consequence: 1TB/month traffic = $20/month unnecessary cost; Better: specify same AZ for app and database)
4. **Ignoring cross-AZ cost in migration**: Lift-and-shift to multi-AZ without cost analysis (Cause: focusing on HA benefits; Consequence: surprise $200-300/month network bill; Better: model network costs before multi-AZ deployment)

## Anti-Patterns
- **NAT Gateway for all AWS traffic**: S3, DynamoDB traffic should use Gateway Endpoints
- **Multi-AZ without analysis**: Defaulting to multi-AZ without evaluating if single-AZ meets SLA
- **No VPC endpoints**: Letting all private subnet traffic go through NAT Gateway
- **Spread-eagle service placement**: Randomly distributing services across AZs without traffic analysis

## Examples
- **Single-AZ staging**: 0 cross-AZ cost; 0 NAT Gateway (if no private subnet internet); ~$0-32/month
- **Multi-AZ production (1TB inter-AZ traffic)**: 2 NAT Gateways ($64) + 1TB x $0.02 ($20) + 200GB NAT data ($9) = ~$93/month
- **Multi-AZ with VPC endpoints (1TB inter-AZ traffic)**: 2 NAT ($64) + 1TB x $0.02 ($20) + VPC endpoints ($21) = ~$105/month (higher baseline but lower variable cost at scale)

## Related Topics
- RDS Proxy Pricing (ku-34)
- PgBouncer Alternative (ku-35)
- Cross-Region Data Transfer (ku-51)

## AI Agent Notes
- Default: collocate app and database in same AZ
- Default: use VPC Gateway Endpoints for S3/DynamoDB
- One NAT Gateway per AZ is standard
- Monitor NAT Gateway BytesProcessed
- VPC Interface Endpoints > NAT for AWS service traffic
