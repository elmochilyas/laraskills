# Active-Passive Multi-Region Cost

## Metadata
- **ID**: KU-53-ACTIVE-PASSIVE
- **Subdomain**: multi-region-global-cost
- **Domain**: cost-resource-optimization
- **Topic**: Active-Passive Multi-Region
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: Medium-High

## Overview
Active-passive multi-region architecture is significantly cheaper than active-active for most Laravel applications. In active-passive, the secondary region runs minimal compute (or zero with headless DR) until failover occurs. This reduces cross-region costs by 50-70% compared to active-active. For disaster recovery use cases, active-passive with headless Aurora clusters provides an optimal balance of cost and RTO.

## Core Concepts
- **Active-passive**: Primary region serves all traffic; secondary is standby
- **Active-active**: Both regions serve traffic (requires DNS routing, data sync)
- **Cost difference**: Active-passive is 40-60% cheaper than active-active
- **Failover RTO**: Typically 1-5 minutes for Aurora Global Database
- **Headless DR**: Zero compute in secondary; storage replicated, provisioned on failover

## When To Use
- Disaster recovery architectures where RTO of 1-5 minutes is acceptable
- Cost-sensitive multi-region deployments (most Laravel apps)
- Applications where active-active complexity (data conflict, double compute) isn't justified
- Compliance requirements needing data residency in multiple regions with minimal active compute
- Teams using Aurora Global Database for storage-level replication

## When NOT To Use
- Applications requiring sub-second failover (active-active or Route 53 with health checks)
- Real-time applications where even 1 minute of failover delay is unacceptable
- Workloads needing both regions to serve read traffic simultaneously (use active-active with read replicas)
- Small apps where multi-region cost itself isn't justified (CloudFront solves most latency)
- Financial trading or real-time bidding systems needing true active-active

## Best Practices
- **Use headless Aurora clusters for DR region**: Aurora storage replicated without compute in secondary until failover (WHY: compute is 40-60% of Aurora cost; headless DR eliminates secondary compute spend; storage replication cost is 10-20% of full DR region cost)
- **Put CloudFront in front of single-region origin**: Reduces the need for multi-region entirely (WHY: CloudFront caches at 400+ edge locations; origin in one region serves globally; 80-95% cache hit rate eliminates cross-region traffic for most apps)
- **Use Route 53 health checks for automated failover**: Configure health checks on primary endpoint; failover when unhealthy (WHY: manual failover takes hours; automated health checks detect failure in 15-30 seconds; DNS TTL + health check = 60-90s total failover time)
- **Test failover monthly**: Automated failover testing ensures RTO targets are met (WHY: untested failover processes fail during real incidents; monthly tests take 10 minutes; document procedure for disaster recovery runbook)
- **Right-size standby region**: Standby can use smaller instances than primary (WHY: standby serves no traffic during normal operation; can use 50-70% smaller instances; scale up is part of failover procedure)

## Architecture Guidelines
- Active-passive as default multi-region pattern for Laravel apps
- CloudFront with single-region origin before considering multi-region
- Aurora Global Database for storage-level replication (1-2s lag)
- Route 53 latency-based or failover routing for traffic management
- Headless DR clusters for maximum cost savings on standby
- For Laravel Cloud, multi-region requires manual VPC and Route 53 configuration

## Performance Considerations
- Cross-region latency: US-East to EU-West ~70-100ms; US-East to Asia-Pacific ~150-250ms
- Aurora Global DB replication lag: 1-2 seconds normal; can spike to 10+ seconds under heavy write
- Route 53 latency-based routing adds <10ms DNS resolution time
- CloudFront edge response time: 10-50ms for cache hits vs 200-500ms for origin fetch
- Failover time: DNS TTL (30-60s) + health check (15-30s) + application warm-up (30-120s)

## Security Considerations
- Cross-region data replication must comply with data residency requirements
- Aurora Global Database encrypts data in transit across regions
- Route 53 DNS failover is susceptible to DNS caching; use low TTL for critical records
- CloudFront WAF provides edge security before traffic reaches origin region
- Store encryption keys in each region (KMS multi-Region keys)

## Common Mistakes
1. **Running active-active when active-passive suffices**: Both regions running full compute, serving traffic, paying double (Cause: "active-active is more robust"; Consequence: 2x compute cost + data sync complexity; Better: active-passive with 5-min RTO handles 95% of disaster scenarios)
2. **Not using CloudFront before multi-region**: Deploying multi-region for latency when CDN solves it (Cause: assuming multi-region is required for global performance; Consequence: 5x cost of CloudFront solution; Better: start with CloudFront single-region origin; only add multi-region if latency requirements exceed CDN capability)
3. **Over-provisioning standby region**: Matching primary compute exactly in standby (Cause: "standby must match capacity"; Consequence: paying 2x compute for capacity used 0% of time; Better: standby can use 50% capacity; scale up during failover)
4. **Ignoring headless DR option**: Running full compute in DR region when storage-only replication works (Cause: not knowing headless DR exists; Consequence: 40-60% extra compute cost for unused DR compute; Better: use headless Aurora clusters; provision compute only on failover)

## Anti-Patterns
- **Active-active by default**: Double compute cost without evaluating if passive meets RTO
- **No failover testing**: DR plan that's never been tested
- **Multi-region without CloudFront first**: CDN solves latency for 80% of use cases
- **Same-size standby**: Matching primary compute for capacity used 0% of time

## Examples
- **Active-passive (US-East primary, EU-West standby)**: Primary $3000/month compute + $500 storage + $200 data transfer; Standby $200 storage (headless) + $50 replication = Total $3750/month
- **Active-active (both regions active)**: Primary $3000 + standby $3000 + data sync $400 + transfer $400 = Total $6800/month = 55% more
- **Alternative: CloudFront + single-region**: Origin $3000 + CloudFront $200 + data transfer $100 = Total $3300/month = saves 50% vs active-passive

## Related Topics
- Cross-Region Data Transfer (ku-51)
- Aurora Global Database Cost (ku-52)
- Route 53 Routing Costs (ku-54)

## AI Agent Notes
- Default: active-passive over active-active
- Use CloudFront before considering multi-region
- Headless DR for maximum standby cost savings
- Test failover monthly
- Standby can use smaller instances
