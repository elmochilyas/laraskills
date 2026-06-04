# KU-04-GLOBAL-LOAD-BALANCING: Global Load Balancing

## Metadata
- **ID**: KU-04-GLOBAL-LOAD-BALANCING
- **Subdomain**: Multi-Region & Global Cost
- **Topic**: Global Load Balancing
- **Source**: Multi-Region & Global Cost, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Global load balancing distributes user traffic across multiple AWS regions to optimize latency, maximize availability, and minimize data transfer costs. Route53 provides latency-based routing (direct users to lowest-latency region), geolocation routing (compliance), and failover routing (DR). The cost tradeoff: multi-region load balancing adds Route53 costs and requires infrastructure in each region but reduces latency (improving conversion) and enables region-level HA.

## Core Concepts
- **Route53 latency routing**: DNS-based routing to region with lowest latency for each user
- **Route53 geolocation routing**: Route users based on geographic location (compliance, content localization)
- **Route53 failover routing**: Active-passive; primary region serves traffic, secondary on primary failure
- **Route53 weighted routing**: Distribute % traffic across regions (blue/green, canary deployments)
- **Route53 pricing**: $0.50/hosted zone/month + $0.40/million queries (standard); latency-based costs $0.60/million queries
- **Active-active**: All regions serve traffic simultaneously; requires multi-region database strategy
- **Active-passive**: Primary region serves all traffic; secondary region on standby; lower cost
- **Global Accelerator**: Anycast IP routing; 2 static IPs; 60% reduction in first-byte latency; $0.025/hour + $0.005/GB

## Mental Models
- Default: single region + CloudFront (cheapest, simplest)
- Multi-region only for global user base or DR compliance
- Active-passive > active-active for cost-sensitive apps
- Always combine with CloudFront for edge caching

## Internal Mechanics
- Route53 DNS caching: TTL of 60s means failover takes 60s + health check interval (30s) = max 90s failover time
- Global Accelerator: 60% reduction in first-byte latency (anycast IP bypasses DNS resolution)
- CloudFront: <10ms edge cache hit; 50-200ms origin fetch (from nearest region)
- Latency routing: Users in India get ~50ms latency (ap-south-1) vs 200ms (us-east-1)
- DNS queries: Each latency routing lookup takes 10-50ms (negligible for overall page load)

## Patterns
- Use Route53 latency routing for multi-region apps
- Prefer active-passive for DR cost savings
- Combine with CloudFront for edge caching
- Set health checks on Route53 routing
- Use weighted routing for canary deployments
- Monitor Route53 query costs

## Architectural Decisions
- Default: Single region with CloudFront (cheapest, simplest)
- Multi-region: Route53 latency routing -> CloudFront -> ALB per region
- DR: Route53 failover routing primary -> ALB (us-east-1); secondary -> ALB (us-west-2)
- Route53 health checks: Every 30 seconds on ALB endpoint
- DNS TTL: 60 seconds for quick failover (lower TTL = faster failover but more DNS queries)
- Global Accelerator: Only for non-HTTP protocols or when static IPs are required
- Each region: Independent ASG + ALB + RDS reader

## Tradeoffs
**When To Use:**
- Route53 latency routing: Global user base; multi-region deployment with local readers
- Route53 geolocation routing: Compliance (GDPR: route EU users to EU); content localization
- Route53 failover routing: DR with active-passive multi-region (lower cost than active-active)
- Global Accelerator: TCP/UDP optimization; non-HTTP protocols; need static IPs
- Active-active: Global user base needing <50ms latency; multi-region writes
- Active-passive: DR-only multi-region; cost-constrained; RTO < 5 minutes acceptable

**When NOT To Use:**
- Route53 latency routing with single region: Direct routing is simpler and free (no multi-region cost)
- Global Accelerator for simple HTTP: CloudFront is cheaper and provides similar latency benefits
- Geolocation routing for global content: If all content is the same regardless of location, use latency routing
- Active-active without database strategy: Both regions live but can't write simultaneously (no benefit)
- Multi-region for small apps: Cost of second region infrastructure > benefit; use CloudFront from single region

## Performance Considerations
- Route53 DNS caching: TTL of 60s means failover takes 60s + health check interval (30s) = max 90s failover time
- Global Accelerator: 60% reduction in first-byte latency (anycast IP bypasses DNS resolution)
- CloudFront: <10ms edge cache hit; 50-200ms origin fetch (from nearest region)
- Latency routing: Users in India get ~50ms latency (ap-south-1) vs 200ms (us-east-1)
- DNS queries: Each latency routing lookup takes 10-50ms (negligible for overall page load)

## Production Considerations
- Route53 DNS queries are logged in CloudTrail
- Shield Advanced integrates with Route53 for DDoS protection at DNS level
- DNSSEC signing for Route53 zones (prevents DNS spoofing)
- Health check requests can be a vector; restrict health check IP ranges
- Cross-region traffic should be encrypted (TLS between regions)

## Common Mistakes
- **Latency routing without regional infrastructure**: Setting up latency routing to multiple regions but only deploying in one (Cause: configuring Route53 before deploying infrastructure; Consequence: all DNS queries go to same region; latency routing has no effect; Better: deploy in multiple regions first, then configure routing)
- **Active-active without addressing cross-region data sync**: Both regions serve traffic but share single database in one region (Cause: database not part of multi-region planning; Consequence: app is multi-region but database calls go cross-region (200ms latency); Better: local database readers per region with async replication)
- **Global Accelerator for simple HTTP app**: Using Global Accelerator ($0.025/hour + $0.005/GB) for Laravel app (Cause: "faster = better" assumption; Consequence: $18/month + $5/GB vs CloudFront essentially free for similar latency benefit; Better: use CloudFront which includes CDN caching at edge)
- **Short TTL everywhere**: Setting 1-second TTL on all Route53 records (Cause: wanting instant failover; Consequence: high Route53 costs ($0.40/M queries x 86400 queries/day/server = $1/day/server for 1-second TTL); Better: 60-second TTL for production; 300-second for stable deployments)

## Failure Modes
- **Multi-region without monitoring**: No CloudWatch alarms per region; region goes down unnoticed
- **Identical capacity in all regions**: Active-active with same capacity in primary and secondary; over-spending on DR
- **No Route53 health checks**: DNS routes traffic to degraded regions (users get errors)
- **Forgetting CloudFront**: Multi-region app without CDN; CloudFront would handle 90% of traffic at edge

## Ecosystem Usage
- **Multi-region active-passive (DR)**: Route53 failover: primary region us-east-1 (full capacity), secondary us-west-2 (min capacity, scale on failover)
- **Multi-region active-active (global)**: Route53 latency routing -> CloudFront -> ALB per region; 3 regions: us-east-1, eu-west-1, ap-southeast-1; local DB readers per region
- **Canary deployment**: Route53 weighted routing: 95% -> current region, 5% -> new region; monitor errors; shift to 100% over 24 hours
- **Single region + CloudFront (cheapest)**: Route53 simple routing -> CloudFront -> ALB in us-east-1; CloudFront handles global traffic at edge

## Related Knowledge Units
- Region Selection (ku-02)
- Multi-Region Database (ku-03)
- Data Transfer Costs (ku-01)

## Research Notes
Derived from Multi-Region & Global Cost, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.