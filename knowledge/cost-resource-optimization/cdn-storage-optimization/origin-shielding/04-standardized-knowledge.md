# Origin Shielding

## Metadata
- **ID**: KU-02-ORIGIN-SHIELDING
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: Origin Shielding
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
CloudFront Origin Shield is an additional caching layer in a single AWS region that sits between CloudFront edge locations and your origin. Without Origin Shield, each edge location sends its own request to the origin on a cache miss. Origin Shield centralizes these into a single origin request, reducing origin load by up to 80% for global applications.

## Core Concepts
- **Origin Shield**: Regional caching layer (one region) that aggregates requests from all edge locations
- **Edge location**: 600+ CloudFront points of presence globally; each independently caches content
- **Origin Shield region**: The AWS region where Origin Shield runs; should be close to your origin
- **Cache miss aggregation**: 10 edge locations requesting same file -> 10 origin requests without Shield -> 1 origin request with Shield

## When To Use
- Global audience: Apps with users in multiple continents (multiple edge locations requesting same objects)
- Expensive origin compute: When each origin request requires significant CPU/database work
- High request volume: >100 requests/second to same objects (e.g., popular images, PDFs)
- S3 origin: Less critical (S3 scales easily), but still reduces S3 request costs

## When NOT To Use
- Single-region users: If all users are in one AWS region close to origin, minimal benefit
- Low-traffic apps: <10 requests/second; shield adds small latency with negligible origin reduction
- Dynamic-only content: If no cacheable content is served (100% uncacheable HTML/API)
- Minimal cost: Origin Shield costs $0.01/GB of edge data; very cheap but adds to bill

## Best Practices
- **Enable Origin Shield for multi-region audiences**: Place Shield in the same region as your origin (WHY: each edge location miss is aggregated; with 10 edge locations, Shield reduces origin requests by 90%)
- **Set Shield region to origin region**: If ALB is in us-east-1, set Shield region to us-east-1 (WHY: minimizes latency between Shield and origin while centralizing requests)
- **Combine with long cache TTL**: Origin Shield is most effective with TTL > 24 hours (WHY: longer TTL means fewer refreshes; Shield's benefit increases with cache persistence)
- **Monitor origin request reduction**: Track CloudFront "OriginRequests" metric before/after enabling Shield (WHY: validates Shield is working; should show 60-90% reduction in origin requests)

## Architecture Guidelines
- Enable Origin Shield in production for any app with >50K daily requests
- Always set Shield region to the origin's AWS region
- Origin Shield works per-distribution, not per-behavior; enable at distribution level
- Shield does not increase data transfer costs; it only reduces origin requests

## Performance Considerations
- Origin Shield adds <5ms latency to the first cache miss (negligible)
- Cache hits at Shield serve in <5ms vs 50-200ms from origin
- Edge-to-Shield latency depends on geographical distance; users far from Shield region may see slight increase on first miss
- Total performance improvement: most requests become Shield hits (fast) rather than origin hits (slow)

## Security Considerations
- Origin Shield does not change security model; it sits between CloudFront and origin
- Origin Shield inherits CloudFront's encryption (TLS) to origin
- No additional attack surface; Shield is internal to AWS CloudFront

## Common Mistakes
1. **Not enabling Origin Shield for global apps**: Users on 3+ continents but Shield disabled (Cause: unaware of feature; Consequence: 2-3x higher origin load than necessary; Better: enable Shield with origin-region placement)
2. **Wrong Shield region**: Placing Shield far from origin (e.g., Shield in us-east-1 for origin in ap-southeast-1) (Cause: not setting Shield region explicitly; Consequence: increased latency for Shield-to-origin communication; Better: always match Shield region to origin region)
3. **Expecting Shield benefit for dynamic content**: Enabling Shield for 100% uncacheable content (Cause: misunderstanding Shield purpose; Consequence: no benefit, slight latency increase; Better: only expect benefit for cacheable, re-requested content)

## Anti-Patterns
- **Shield for single-region low traffic**: 10 requests/day from same region; Shield adds cost with no benefit
- **Shield with no cacheable content**: If all responses have Cache-Control: no-cache, Shield does nothing
- **Shield region different from origin**: Unnecessary cross-region latency for first misses

## Examples
- **Global SaaS app**: Users in US, EU, Asia; Shield in us-east-1 (origin region); origin requests drop by 75%
- **Media download site**: 100K downloads/day; Shield aggregates edge misses; S3 request cost drops from $15/month to $3/month
- **Laravel asset delivery**: `/build/` files served via CloudFront + Shield; origin load for S3 reduced by 90%

## Related Topics
- CDN Integration (ku-01)
- Cache Control Headers (ku-03)
- File Compression (ku-04)

## AI Agent Notes
- Enable Origin Shield by default for any CloudFront recommendation serving cacheable content
- Place Shield in origin's region, not randomly

## Verification
- [ ] Origin Shield enabled on CloudFront distribution
- [ ] Shield region matches origin region
- [ ] OriginRequests metric shows 60-90% reduction
- [ ] Content is cacheable (proper Cache-Control headers)
