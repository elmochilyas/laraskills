# CloudFront vs Direct S3 Cost Rules

## Rule 1: Route All Public S3 Content Through CloudFront
- **Category**: Architecture
- **Rule**: Always put CloudFront in front of S3 for all publicly served content at every volume level
- **Reason**: CloudFront egress is cheaper than S3 direct at every tier ($0.085/GB vs $0.09/GB); free 1TB/month covers most apps; S3-to-CloudFront transfer is free
- **Bad Example**: Serving public images directly from S3 bucket URLs, paying $0.09/GB egress with no caching
- **Good Example**: CloudFront distribution with S3 origin; S3 bucket is fully private (OAC), all traffic goes through CloudFront
- **Exceptions**: Presigned URLs for private content that must bypass CloudFront caching
- **Consequences Of Violation**: Higher data transfer costs and no edge caching benefit

## Rule 2: Target >95% Cache Hit Ratio for Static Assets
- **Category**: Performance
- **Rule**: Configure Cache-Control headers and TTLs to achieve >95% cache hit ratio for static assets
- **Reason**: High cache hit ratio reduces origin fetches to 5-15% of requests; fewer S3 GET requests = lower S3 request costs and reduced origin load
- **Bad Example**: Cache hit ratio of 60% for static assets; 40% of requests go to S3 origin unnecessarily
- **Good Example**: Setting `Cache-Control: public, max-age=31536000, immutable` for versioned assets; hit ratio >95% with minimal origin requests
- **Exceptions**: User-uploaded content with unpredictable access patterns may have lower hit ratios
- **Consequences Of Violation**: Higher S3 request costs and potential origin overload from unnecessary cache misses

## Rule 3: Use CloudFront Signed URLs for Private Content
- **Category**: Architecture
- **Rule**: Use CloudFront signed URLs or signed cookies instead of S3 presigned URLs for private content
- **Reason**: S3 presigned URLs bypass CloudFront (no caching, no cost benefit); CloudFront signed URLs provide equivalent access control with CDN caching and cheaper egress
- **Bad Example**: Generating S3 presigned URLs for paywalled PDF downloads; each download goes directly to S3 with no caching
- **Good Example**: Generating CloudFront signed URLs with 5-minute expiry; CloudFront caches the PDF and serves it at edge
- **Exceptions**: S3 presigned URLs are appropriate when the client cannot use CloudFront (IoT devices, legacy systems)
- **Consequences Of Violation**: Higher data transfer costs and no caching for private content

## Rule 4: Monitor CacheHitRatio CloudWatch Metric
- **Category**: Performance
- **Rule**: Track the CloudFront CacheHitRatio metric and investigate if it falls below 85%
- **Reason**: Low hit ratio indicates CloudFront is not effectively reducing origin load; investigate TTL settings, cache key configuration, query string handling, or origin headers
- **Bad Example**: Cache hit ratio of 40% for static assets, with no monitoring or investigation
- **Good Example**: Dashboard showing CacheHitRatio = 97%; alert at <85% triggers investigation into cache configuration
- **Exceptions**: Mixed distributions with dynamic content will have lower aggregate hit ratios; separate metrics per cache behavior
- **Consquences Of Violation**: Undetected configuration issues causing excessive origin load and higher costs
