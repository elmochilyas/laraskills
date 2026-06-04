# Route 53 Routing Costs

## Metadata
- **ID**: KU-54-ROUTE53-COSTS
- **Subdomain**: multi-region-global-cost
- **Domain**: cost-resource-optimization
- **Topic**: Route 53 Routing Costs
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Route 53 routing costs are minimal compared to data transfer costs in multi-region architectures. Latency-based routing charges $0.50/M queries, geolocation $0.70/M, and weighted routing $0.40/M. The cost difference between routing policies is negligible for most Laravel apps (<$5-10/month). The primary cost lever in global architecture is data transfer, not DNS routing policy choice.

## Core Concepts
- **Basic queries**: $0.40 per million queries (standard)
- **Latency-based**: $0.50 per million queries
- **Geolocation/Geo-proximity**: $0.70 per million queries
- **Health checks**: $0.50 per health check per month
- **Traffic Flow**: $50/month per policy

## When To Use
- Latency-based routing: Global apps serving traffic from nearest region for performance
- Geolocation routing: Compliance requirements needing content restricted by geography
- Weighted routing: Canary deployments, A/B testing, gradual traffic migration
- Failover routing: Active-passive architectures for disaster recovery
- Simple routing: Single-region deployments where DNS cost should be minimal

## When NOT To Use
- Traffic Flow ($50/month): Only for complex routing policies (>5 records) at large scale
- Geolocation for performance: Use latency-based; geolocation is for compliance, not speed
- Failover routing as default: Use latency-based with health checks; failover for simple active-passive
- Multi-region just for DNS optimization: CloudFront solves 80% of global routing needs
- Expensive routing policies for single-region apps: Basic routing ($0.40/M) is sufficient

## Best Practices
- **Choose routing policy based on requirements, not cost**: DNS cost difference is negligible (<$5/month) between any policy (WHY: 10M queries/month at $0.40-0.70/M = $4-7/month difference; the performance and reliability benefits of latency-based routing far outweigh the $2-3/month extra)
- **Use Route 53 health checks judiciously**: $0.50/check/month; 50 health checks = $25/month (WHY: health checks can add up for large fleets; monitor each endpoint individually or aggregate behind load balancer health check; 50 individual checks = $25/month vs 1 ALB check = $0.50/month)
- **Set appropriate TTLs for failover**: Use 60-second TTL for active-passive failover; 300-second for stable endpoints (WHY: low TTL enables faster failover but increases query costs slightly; 60s vs 300s TTL increases query volume 5x but cost difference is pennies; prioritize failover speed over DNS cost)
- **Use alias records for AWS resources**: Route 53 alias records to ELB, CloudFront, S3 are free (WHY: alias records have no per-query charge; pointing to CloudFront via alias costs $0 vs standard A record at $0.40/M queries)
- **Consolidate hosted zones**: Use fewer hosted zones to reduce monthly fees (WHY: each hosted zone costs $0.50/month; 10 zones = $5/month; consolidate subdomains into fewer zones where possible)

## Architecture Guidelines
- Single-region: Simple routing ($0.40/M) through CloudFront
- Multi-region active-passive: Failover routing + health checks
- Multi-region active-active: Latency-based routing ($0.50/M)
- Compliance: Geolocation routing ($0.70/M)
- Canary deploys: Weighted routing ($0.40/M)
- Use alias records for all AWS resources (free vs standard records)

## Performance Considerations
- Route 53 latency-based routing adds <10ms DNS resolution time; negligible
- DNS TTL: 60-300 seconds is standard; lower TTL = faster failover but more queries
- Health check intervals: 10-30 seconds standard; 10-second = $0.50/check + higher query volume
- Route 53 is an authoritative DNS service; does not cache; each query resolves at AWS edge
- Global DNS resolution time: 20-50ms average across Route 53 edge locations

## Security Considerations
- Route 53 supports DNSSEC for domain signing
- Route 53 Shield Advanced for DDoS protection on DNS queries ($3000/month)
- Health check traffic comes from AWS health check IP ranges; allow in security groups
- Route 53 Resolver DNS Firewall for filtering outbound DNS queries
- API-based changes to Route 53 should be logged via CloudTrail

## Common Mistakes
1. **Choosing routing policy based on cost**: Latency-based routing at $0.50/M vs simple at $0.40/M — saving $1/month on 10M queries (Cause: comparing DNS query costs in isolation; Consequence: sacrificing performance or reliability for pennies; Better: pick routing policy for functionality; DNS cost is rounding error in infrastructure bill)
2. **Health check proliferation**: Creating individual health checks for every EC2 instance behind ALB (Cause: monitoring each instance directly; Consequence: $0.50/check × 50 instances = $25/month; Better: health check the ALB endpoint — 1 check covers all instances)
3. **Not using alias records**: CNAME or A records pointing to CloudFront or ELB incur per-query charges (Cause: not knowing alias records exist; Consequence: $0.40/M queries × 10M = $4/month for what should be free; Better: use alias records for CloudFront, ELB, S3, and Route 53 — always free)
4. **Over-engineering routing for single-region apps**: Latency-based routing with health checks for single-region deployment (Cause: following multi-region best practices blindly; Consequence: unnecessary complexity and extra health check costs; Better: simple routing for single-region CloudFront-based apps)

## Anti-Patterns
- **Traffic Flow for simple setups**: $50/month policy for <5 routing rules
- **Geolocation for performance**: Use latency-based; geolocation is for restrictions
- **Low TTL on stable records**: 60-second TTL when 300-second suffices (more queries = more cost)
- **Health checking every instance**: Health check the load balancer, not individual instances

## Examples
- **Single-region app (CloudFront, 10M queries/month)**: Simple routing via alias to CloudFront = $0 (alias) + 1 hosted zone ($0.50) = $0.50/month
- **Multi-region active-passive (5M queries/month)**: Failover routing ($0.40/M × 5M = $2) + 2 health checks ($1) + 1 hosted zone ($0.50) = $3.50/month
- **Multi-region active-active (20M queries/month)**: Latency-based ($0.50/M × 20M = $10) + 4 health checks ($2) + 1 hosted zone ($0.50) = $12.50/month

## Related Topics
- Cross-Region Data Transfer (ku-51)
- Aurora Global Database Cost (ku-52)
- Active-Passive Multi-Region (ku-53)

## AI Agent Notes
- Default: simple routing for single-region, latency-based for multi-region
- DNS cost is negligible; choose policy for functionality
- Use alias records for AWS resources (free)
- Health check ALB, not individual instances
- Traffic Flow only for complex multi-region setups
