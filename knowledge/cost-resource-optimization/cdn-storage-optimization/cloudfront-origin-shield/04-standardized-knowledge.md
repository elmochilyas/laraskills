# CloudFront Origin Shield

## Metadata
- **ID**: KU-43-ORIGIN-SHIELD
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: CloudFront Origin Shield
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
CloudFront Origin Shield adds a regional caching layer between edge locations and your origin, reducing origin requests by 70-90% for global audiences. Instead of each edge POP requesting content from the origin independently, all edges route through a single shield POP. This reduces origin load, improves cache hit ratio, and reduces origin egress costs. Shield is included in standard CloudFront pricing (no additional fee).

## Best Practices
- **Enable Origin Shield for all multi-region audience deployments**: Reduces origin requests 70-90% (WHY: without Shield, 10 global edge POPs each independently request uncached content from origin; with Shield, 10 edge POPs request from 1 Shield POP → 1 origin request; origin load drops 90%)
- **Co-locate Shield region with origin**: Choose shield region closest to your origin server (WHY: Shield POP forwards to origin; latency between Shield and origin affects cache miss response time; choosing nearby region minimizes added latency on cache misses)
- **Monitor origin request count before and after Shield**: CloudWatch metrics show origin request reduction (WHY: validates Shield effectiveness; if origin requests don't drop >50%, Shield region may be misconfigured or content is uncacheable)
- **Not needed for single-region apps**: Shield benefits scale with geographic distribution (WHY: Shield's main benefit is aggregating cache misses from multiple edge POPs; if most traffic is from one region, Shield may not reduce origin requests meaningfully)

## Related Topics
- CloudFront Free Tier (ku-17)
- CloudFront vs Direct S3 (ku-18)
- CloudFront Compression (ku-20)

## AI Agent Notes
- Default: enable Origin Shield for global audience deployments
- Free feature — no additional cost
- Reduces origin requests 70-90% for multi-region traffic
- Co-locate Shield with origin for lowest latency
