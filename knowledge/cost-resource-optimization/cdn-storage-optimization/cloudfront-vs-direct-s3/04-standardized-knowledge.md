# CloudFront vs Direct S3 Cost

## Metadata
- **ID**: KU-18-CLOUDFRONT-VS-S3
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: CloudFront vs Direct S3
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
CloudFront over S3 is cheaper at every volume than direct S3 delivery. S3-to-CloudFront transfer is free, CloudFront egress is cheaper per-GB than S3 direct ($0.085/GB vs $0.09/GB), and CloudFront's free tier covers the first 1TB/month. With cache hit ratios above 85%, origin fetches are reduced by 85%+, compounding savings. At 1TB/month, direct S3 costs $92.16 vs $0-26.78 via CloudFront.

## Best Practices
- **Route all public S3 content through CloudFront**: Always — at every volume level (WHY: S3-to-CloudFront transfer is free; CloudFront egress is $0.005/GB cheaper than S3 direct; free tier covers 1TB; the only scenario where direct S3 beats CloudFront is presigned URLs)
- **Use CloudFront signed URLs or signed cookies for private content**: Replaces S3 presigned URLs (WHY: S3 presigned URLs bypass CloudFront; CloudFront signed URLs provide equivalent access control with CDN caching and cost benefits; use signed cookies for groups of files)
- **Set Cache-Control headers for maximum cache hit ratio**: max-age=31536000 for versioned assets (WHY: high cache hit ratio reduces origin fetches to 5-15% of requests; fewer S3 GET requests = lower S3 request costs; versioned URLs prevent stale content without invalidation)
- **Monitor CacheHitRatio metric**: Target >95% for static assets (WHY: low hit ratio means CloudFront isn't reducing origin load; investigate TTL settings, cache key configuration, or query string handling)

## Related Topics
- CloudFront Free Tier (ku-17)
- S3 to CloudFront Transfer (ku-19)
- CloudFront Compression (ku-20)

## AI Agent Notes
- Default: CloudFront in front of all public S3 content
- Cheaper at every volume — no reason to serve direct S3 for public content
- Use CloudFront signed URLs/cookies for private content access
- Target >95% cache hit ratio for static assets
