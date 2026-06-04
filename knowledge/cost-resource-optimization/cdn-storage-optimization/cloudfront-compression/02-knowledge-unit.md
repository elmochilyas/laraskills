# K20: CloudFront Compression

## Metadata
- **ID**: K20
- **Subdomain**: CDN & Storage Optimization
- **Topic**: CloudFront Compression
- **Source**: AWS Documentation, CloudKeeper (2024)
- **Reliability**: High

## Executive Summary
CloudFront's native Gzip/Brotli compression reduces data transfer by 60-70% for compressible content (HTML, CSS, JS, JSON, SVG). This directly reduces egress costs and improves page load times. Enabling compression is a simple configuration toggle (`compress: true` in CloudFront distribution) with zero ongoing maintenance cost. For a typical Laravel app serving 500GB/month, compression saves $25-40/month in egress costs.

## Core Concepts
- **Compression formats**: Gzip and Brotli (CloudFront negotiates based on Accept-Encoding)
- **Compression ratio**: 60-70% reduction for text-based content
- **Cost impact**: Directly reduces data transfer out charges
- **Activation**: Single setting in CloudFront distribution
- **File types**: HTML, CSS, JS, JSON, XML, SVG, font files

## Mental Models
- **Compression as shrink ray**: 1GB of assets becomes 300-400MB after compression
- **Free money**: One-time config change, ongoing savings forever

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
- K17: CloudFront Free Tier
- K18: CloudFront vs Direct S3
- K19: S3 to CloudFront Transfer

## Research Notes
CloudFront's Brotli support was added in 2022. Both Gzip and Brotli are supported with content negotiation. For best results, serve assets with appropriate Cache-Control headers to enable edge caching of compressed versions. CloudFront compresses objects before caching, so compressed versions are served on cache hits without re-compressing. Uncompressible content (images, videos, PDFs) should not enable compression as it wastes CPU with no benefit.
