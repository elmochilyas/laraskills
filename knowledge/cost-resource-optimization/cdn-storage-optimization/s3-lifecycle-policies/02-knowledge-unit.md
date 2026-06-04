# K21: S3 Lifecycle Policies

## Metadata
- **ID**: K21
- **Subdomain**: CDN & Storage Optimization
- **Topic**: S3 Lifecycle Policies
- **Source**: AWS Best Practices, AWS Documentation
- **Reliability**: High

## Executive Summary
S3 lifecycle policies automatically transition objects to lower-cost storage tiers based on age. Moving objects to S3 Infrequent Access after 30 days saves ~40% vs Standard. Transitioning to Glacier Flexible Retrieval after 90 days saves ~80%. S3 Intelligent-Tiering automatically optimizes storage cost for unknown access patterns with a small monitoring fee. For Laravel apps with log files, user uploads, and backups, lifecycle policies are the primary storage cost control mechanism.

## Core Concepts
- **S3 Standard**: $0.023/GB Ã¢â‚¬â€ for frequently accessed data
- **S3 Infrequent Access**: $0.0125/GB Ã¢â‚¬â€ 40%+ savings, minimum 30-day charge
- **S3 Glacier Instant Retrieval**: $0.004/GB Ã¢â‚¬â€ 83% savings, millisecond retrieval
- **S3 Glacier Flexible**: $0.0036/GB Ã¢â‚¬â€ 84% savings, minutes retrieval
- **S3 Glacier Deep Archive**: $0.00099/GB Ã¢â‚¬â€ 96% savings, hours retrieval
- **S3 Intelligent-Tiering**: Auto-moves between tiers; $0.0025/1K objects monitoring fee

## Mental Models
- **Storage as hotel**: Standard is 5-star (expensive, instant); Glacier is budget motel (cheap, limited service)
- **Lifecycle as moving truck**: Objects automatically move down the pricing ladder as they age

## Ecosystem Usage

- **Laravel Forge**: Server provisioning with CloudFront integration for asset CDN; Forge handles invalidation on deploy\n- **Laravel Vapor**: Serves assets via CloudFront automatically; Vapor's CDN integration is built-in\n- **Spatie Media Library**: Stores uploaded files on S3 with CloudFront URL generation; cache-friendly URL structure\n- **Laravel Filesystem**: S3 driver integrates with CloudFront via custom URL; use expiration for private assets

## Performance Considerations

- CloudFront cache hit ratio >95% achievable with proper cache control headers; improves latency from 50-200ms to <10ms\n- Origin Shield reduces origin load by aggregating cache misses; typical hit ratio improvement 5-15%\n- S3 Transfer Acceleration improves upload speeds by 30-70% for large files across continents\n- Compression reduces time-to-first-byte by 30-60% for compressible content (HTML, JSON, CSS, JS)

## Production Considerations

- Set Cache-Control headers (max-age, s-maxage) to maximize CloudFront cache hits\n- Configure multiple origins with path patterns for different content types (static vs dynamic)\n- Use CloudFront Origin Failover for HA: primary region fails, secondary region serves\n- Enable CloudFront WAF to protect against DDoS at the edge, reducing origin compute cost\n- Monitor CloudFront cache hit ratio and origin request count; low hit ratio indicates misconfigured cache

## Failure Modes

- Origin Shield regional failure: if Origin Shield fails in a region, requests fall through to origin directly, increasing origin load\n- Cache stampede: simultaneous cache expiry causes all origins to be hit at once; use Origin Shield and staggered TTL\n- S3 lifecycle misconfiguration: objects deleted inadvertently by overly aggressive lifecycle rules; test with small prefix first\n- WAF false positives: overly restrictive WAF rules block legitimate traffic; monitor WAF logs during rollout

## Architectural Decisions

- CloudFront vs direct S3: CloudFront adds CDN cost but reduces S3 transfer cost (free origin fetches within same region)\n- Origin Shield: mandatory for multi-region deployments; pays for itself through reduced origin transfer\n- S3 storage class: Standard for hot data, Express One Zone for performance-critical, Glacier for compliance archives\n- CloudFront security bundle (WAF + Shield Advanced): evaluate if DDoS protection requirements justify cost

## Tradeoffs

- **CloudFront vs direct S3**: CDN adds per-request cost but reduces latency and S3 data transfer charges\n- **Origin Shield vs direct origin**: Shield adds ~-50/month per region but reduces origin transfer costs 50-80%\n- **Compression vs CPU**: Brotli at CloudFront level reduces bytes but adds ~5ms compression latency at edge\n- **S3 Standard vs Glacier**: Standard is 50x more expensive than Glacier Deep Archive; use lifecycle transitions

## Patterns

- Use CloudFront Origin Shield to aggregate cache misses and reduce origin transfer costs by 50-80%\n- Enable compression (Brotli/gzip) at CloudFront level to reduce transfer bytes 50-80%\n- S3 Lifecycle policies: transition objects through tiers (Standard -> IA -> Glacier) to reduce storage costs\n- Use S3 Transfer Acceleration for large objects across continents (pay per accelerated GB)

## Internal Mechanics

CloudFront pricing consists of data transfer out (per-GB, tiered by monthly volume) and request costs (per-10K HTTP/HTTPS requests). Regional pricing varies significantly: US/EU cheapest, South America/Asia most expensive. Origin Shield adds a regional caching layer that reduces origin load and data transfer costs by aggregating requests at a regional POP before forwarding to origin.

## Common Mistakes

- Not using Origin Shield for multi-region deployments: each region independently hits origin, doubling transfer costs\n- Setting TTL too low: serves content fresh but eliminates CDN benefits; tune TTL to 24h+ for static assets\n- Not enabling compression at CDN level: compression after CDN (origin-level) still transfers full bytes to edge\n- Using S3 Standard for archived content that hasn't been accessed in 90+ days\n- Not configuring cache invalidation: stale content served from edge; use versioned URLs instead of invalidation

## Related Knowledge Units
- K43: CloudFront Origin Shield
- K18: CloudFront vs Direct S3

## Research Notes
Lifecycle policies are set-and-forget cost optimization. Recommended rules for Laravel: (1) Logs Ã¢â€ â€™ transition to IA after 14 days, Glacier after 60 days, delete after 365 days; (2) User uploads Ã¢â€ â€™ transition to IA after 30 days, Glacier after 180 days; (3) Backups Ã¢â€ â€™ transition to Glacier Deep Archive after 7 days; (4) Build artifacts Ã¢â€ â€™ delete after 7 days. S3 Intelligent-Tiering is useful when access patterns are unknown, but the monitoring fee adds up for high-object-count buckets.
