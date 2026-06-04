# K52: Aurora Global Database Cost

## Metadata
- **ID**: K52
- **Subdomain**: Multi-Region & Global Cost
- **Topic**: Aurora Global Database Cost
- **Source**: AWS Documentation, CloudZero (2026)
- **Reliability**: High

## Executive Summary
Aurora Global Database provides storage-level replication across AWS regions, enabling low-latency reads and disaster recovery. Costs include: compute in each region, storage replication ($0.20/M replicated write I/Os), and cross-region data transfer. Active-passive setups (compute only in primary, serverless readers in secondary) minimize cost. Aurora Global Database is most cost-effective for disaster recovery with headless clusters (storage replicated, compute provisioned only on failover).

## Core Concepts
- **Replication cost**: $0.20 per million replicated write I/Os
- **Secondary compute**: Pay for compute in each region where readers are provisioned
- **Storage**: Aurora storage replicated to secondary regions (same $0.10/GB/month)
- **Data transfer**: Cross-region transfer for replication traffic ($0.02/GB)
- **Headless DR**: Aurora storage replicated without compute in DR region until failover

## Mental Models
- **Global DB as insurance**: You pay for replication even if you never use the secondary region
- **Headless vs provisioned**: Like having a backup generator that's free to own but costs when you need power

## Ecosystem Usage

- **Laravel Cloud**: Single-region by default; multi-region requires manual VPC and Route 53 configuration\n- **Laravel Vapor**: Supports multi-region deployment via application environments per region\n- **Laravel Forge**: Forge provisions servers in single region; multi-region requires multiple Forge servers\n- **Laravel Horizon + Redis**: Cross-region Redis replication adds cost and latency

## Performance Considerations

- Cross-region latency: US-East to EU-West ~70-100ms; US-East to Asia-Pacific ~150-250ms\n- Aurora Global DB replication lag: 1-2 seconds under normal conditions; can spike to 10+ seconds under heavy write load\n- Route 53 latency-based routing adds <10ms DNS resolution time; negligible for most applications\n- CloudFront edge response time: 10-50ms for cache hits vs 200-500ms for origin fetch

## Production Considerations

- Use CloudFront as the primary global entry point; origin in single region reduces multi-region complexity\n- Route 53 health checks: configure endpoint health checks for automatic failover (DNS TTL adds 30-60s delay)\n- Aurora Global DB: configure write forwarding to avoid cross-region application-level writes\n- Data transfer cost monitoring: enable Cost Explorer for per-region data transfer analysis\n- Test failover regularly: automated failover testing ensures RTO targets are met

## Failure Modes

- Cross-region failover delay: DNS TTL + health check interval = 60-90 seconds before traffic redirects\n- Data replication lag during failover: writes to primary not yet replicated to secondary cause data loss; measure RPO\n- Route 53 query cost spike: DDoS via DNS queries can increase monthly bill; use Route 53 Shield Advanced\n- CloudFront regional cache miss: all regional edge nodes miss simultaneously; Origin Shield mitigates this

## Architectural Decisions

- Active-passive vs active-active: passive is lower cost (standby doesn't serve traffic)\n- Aurora Global Database vs cross-region read replicas: Global DB has lower replication lag but higher minimum cost\n- CloudFront as single-region origin: place origin in one region, serve globally via CDN\n- Route 53 routing policy: latency-based for performance, geolocation for compliance, weighted for testing

## Tradeoffs

- **Active-passive vs active-active**: Passive halves compute cost in standby\n- **CloudFront vs multi-region origin**: CDN is cheaper but adds edge latency\n- **Aurora Global DB vs cross-region replicas**: Lower lag (1-2s) vs higher cost\n- **Route 53 latency vs geolocation**: Latency-based for performance vs geolocation for content restrictions

## Patterns

- Route 53 latency-based routing: direct users to nearest region for lowest latency\n- Active-passive: primary handles all traffic; standby serves only during failover; lower cost than active-active\n- Aurora Global Database: one primary region, up to 5 secondary regions; replication lag ~1-2 seconds\n- CloudFront: edge caching reduces origin region requests by 80-95%; minimizes cross-region transfer\n- Data transfer optimization: compress data before transfer, batch small requests, cache aggressively

## Internal Mechanics

Cross-region data transfer is AWS's most expensive network cost: .02-0.16/GB depending on regions. Data transfer IN to AWS is free; data transfer OUT is charged. Route 53 charges per hosted zone (.50/month) plus per query (.40-0.60 per million). Active-passive multi-region uses one primary region and one standby; standby incurs compute/storage cost with no user traffic.

## Common Mistakes

- Running active-active without evaluating if active-passive (50% lower cost) meets RTO requirements\n- Ignoring data transfer costs: cross-region traffic is the #1 hidden cost in multi-region architectures\n- Not using CloudFront before considering multi-region: CDN solves 80% of latency problems\n- Over-provisioning standby region: standby should match primary capacity but can use smaller instances\n- Not compressing cross-region data: compression reduces transfer volume by 60-90%

## Related Knowledge Units
- K51: Cross-Region Data Transfer
- K53: Active-Passive Multi-Region
- K54: Route 53 Routing Costs

## Research Notes
Aurora Global Database cost optimization: (1) Use serverless v2 readers in secondary regions (scale to near-zero when idle); (2) Use headless DR clusters for disaster recovery (no compute in DR until failover); (3) Monitor replicated write I/O costs Ã¢â‚¬â€ they add up for write-heavy apps; (4) Consider 2-region vs 3-region carefully (each additional region adds storage replication cost). For most Laravel apps, a 2-region active-passive setup with headless DR is the cost-effective choice.
