# Region Selection

## Metadata
- **ID**: KU-02-REGION-SELECTION
- **Subdomain**: multi-region-global-cost
- **Domain**: cost-resource-optimization
- **Topic**: Region Selection
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
AWS region selection directly impacts compute, data transfer, and service costs. Pricing varies up to 40% between regions for identical services. For Laravel applications, choosing a region involves balancing user latency (revenue impact), compliance (data residency), service availability (feature parity), and cost. The most popular regions (us-east-1, eu-west-1) have the widest service selection and lowest prices.

## Core Concepts
- **Region pricing variance**: Same instance type costs 10-40% more in some regions vs us-east-1
- **us-east-1 (North Virginia)**: Lowest prices, widest service availability, most features first
- **eu-west-1 (Ireland)**: Similar pricing to us-east-1; good for European user base
- **ap-southeast-1 (Singapore)**: 10-20% more expensive; good for Southeast Asia
- **sa-east-1 (Sao Paulo)**: 30-50% more expensive; highest costs for AWS services
- **Data transfer pricing**: Outbound data costs vary by region ($0.05-0.16/GB)
- **Service availability**: New features (Graviton, Aurora, Serverless) launch in us-east-1 first
- **Compliance/data residency**: GDPR requires EU data in EU regions; specific country regulations

## When To Use
- us-east-1: Default for cost optimization; lowest prices, best service availability
- eu-west-1/eu-central-1: European user base; GDPR compliance
- ap-northeast-1 (Tokyo): Japanese user base (low latency)
- ap-southeast-1: SE Asia user base (balance cost and latency)
- Multi-region: Global user base >100K monthly active users needing <100ms latency
- us-west-2: West coast US users; AWS innovation region

## When NOT To Use
- sa-east-1: Avoid unless Brazil-specific business requirement (30-50% premium)
- Regions without needed services: Don't choose a region that lacks Graviton/Aurora if you need them
- Overly distributed multi-region: 3+ regions for <50K MAU; complexity and cost outweigh benefit
- ap-southeast-1 for cost alone: If latency is acceptable, us-east-1 is 10-20% cheaper
- GovCloud regions: Only for US government workloads; 2-3x more expensive with limited services

## Best Practices
- **Default to us-east-1 for cost optimization**: Lowest prices, first to get new services (WHY: us-east-1 is 10-40% cheaper than other regions; Graviton (20% savings), Aurora Serverless, and new instance types launch here first; if latency to user base is acceptable, this is the cheapest choice)
- **Use region cost comparison before choosing**: Compare EC2, RDS, and data transfer costs across 3 candidate regions (WHY: a 10% price difference between us-east-1 and eu-west-1 on $5000/month compute = $6000/year; compounding with data transfer, the gap widens)
- **Select region based on user latency + compliance**: Primary region should be closest to majority of users, within compliance boundaries (WHY: every 100ms additional latency reduces conversion by 7% (Amazon study); compliance violation fines can be millions; balance cost against these factors)
- **Use Route53 latency routing for multi-region**: Direct users to nearest region; health checks failover if region is down (WHY: geo-routing based on latency optimizes user experience; failover ensures availability if primary region has issues)
- **Plan for multi-region from the start if global**: Design event-driven architecture with local databases per region; async replication between regions (WHY: retrofitting single-region app for multi-region is expensive and risky; plan data partitioning, event replication, and failover strategy early)

## Architecture Guidelines
- Single-region: us-east-1 (cost) or nearest major region to user base
- Two-region: Primary in us-east-1, secondary in eu-west-1 (US + EU coverage)
- Three-region: Primary us-east-1, eu-west-1, ap-southeast-1 (global coverage)
- Each region: Independent deployment (CI/CD per region); local database + cache
- Cross-region: Aurora Global Database or event-driven async replication
- Route53: Latency-based routing with health checks

## Performance Considerations
- us-east-1 to Europe: 60-100ms latency (acceptable for many apps)
- us-east-1 to Asia: 150-250ms latency (consider local region)
- eu-west-1 to Africa: 100-200ms (best option for African users)
- ap-southeast-1 to Australia: 50-100ms (vs us-east-1 at 200ms)
- Same-region latency: <5ms between EC2 and RDS in same AZ

## Security Considerations
- GDPR: EU user data must stay in EU regions (eu-west-1, eu-central-1, etc.)
- Brazil: LGPD requires data in Brazil (sa-east-1) or specific transfer agreements
- Japan: Data residency may require ap-northeast-1 for financial services
- AWS Artifact: Check region-specific compliance certifications
- Cross-region data transfer must comply with data sovereignty laws

## Common Mistakes
1. **Choosing region by "closest to me"** : Developer in India selects ap-south-1 because they're geographically close (Cause: personal convenience; Consequence: ap-south-1 has limited service availability and 5-10% higher prices; Better: choose based on user base location and cost, not developer location)
2. **Ignoring service availability**: Choosing ap-southeast-1 for Aurora Serverless v2 when it's not available there (Cause: assuming all regions have same services; Consequence: forced to use provisioned RDS or different region; Better: verify service availability first; us-east-1 has everything)
3. **Single region for global app**: All users worldwide connecting to us-east-1 (Cause: cost-centric decision; Consequence: 200-300ms latency for Asia-Pacific users, poor conversion; Better: add read replicas or CloudFront; eventually multi-region)
4. **sa-east-1 for "South American users"**: Even though user base is 95% in US (Cause: covering 5% of users; Consequence: paying 30-50% premium; Better: use CloudFront for South American users from us-east-1)

## Anti-Patterns
- **3+ regions for small app**: Over-engineering multi-region for app with 1000 users
- **No cost comparison across regions**: Picking a random region without checking pricing differences
- **Choosing region by AWS certification lab**: Using a region from personal training without business rationale
- **Hoping compliance doesn't apply**: Ignoring data residency regulations

## Examples
- **US-based app (cost-optimized)**: us-east-1; $5000/month vs $7000/month in eu-west-1
- **EU-based app (compliance)**: eu-west-1; GDPR compliance; slightly higher prices than us-east-1 but acceptable for latency
- **Global app (3-region)**: us-east-1 + eu-west-1 + ap-southeast-1; Route53 latency routing; Aurora Global Database; local caches
- **Cost mistake**: sa-east-1 for US-based app = $5000/month vs $3500/month in us-east-1 (42% premium)

## Related Topics
- Data Transfer Costs (ku-01)
- Multi-Region Database (ku-03)
- Global Load Balancing (ku-04)

## AI Agent Notes
- Default: us-east-1 for cost optimization
- Check service availability before recommending region
- Multi-region only justified for global user base (>100K MAU) or compliance

## Verification
- [ ] Region selected based on user location + cost + compliance
- [ ] Service availability verified in chosen region
- [ ] Pricing compared across candidate regions
- [ ] Single region for <100K MAU; multi-region for global scale
- [ ] Data residency/compliance requirements met
- [ ] CloudFront used for global edge caching regardless of region
