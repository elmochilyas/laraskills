# CDN Integration

## Metadata
- **ID**: KU-01-CDN-INTEGRATION
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: CDN Integration
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
CDN integration (CloudFront in front of S3 or EC2/ALB) reduces origin load by caching static and dynamic content at edge locations. For Laravel, CloudFront caches CSS/JS/images while passing through uncacheable HTML. Proper integration reduces S3/EC2 data transfer costs by 60-90% and improves page load times globally.

## Core Concepts
- **CloudFront distribution**: Edge cache that sits between users and origin (S3/ALB)
- **Origin**: The source server (S3 bucket for static assets, ALB for dynamic content)
- **Cache behavior**: Path-based routing rules (e.g., /assets/* -> S3, /api/* -> ALB)
- **Free tier**: 1TB transfer/month + 10M requests/month free; sufficient for many apps
- **Data transfer pricing**: CloudFront -> Internet ($0.085/GB) vs S3 -> Internet ($0.09/GB); difference is small for data but CloudFront reduces origin requests significantly

## When To Use
- CloudFront: Always in production for serving static assets and reducing origin load
- CloudFront + S3: For all static file delivery (CSS, JS, images, downloads)
- CloudFront + ALB: For dynamic content when you need edge caching of API responses
- Free tier coverage: Apps under 1TB/month transfer and 10M requests/month

## When NOT To Use
- CloudFront: Not needed for purely backend API services with no public static assets
- CloudFront with dynamic-only apps: If 100% of traffic is uncacheable HTML, CloudFront adds latency (SSL negotiation) with no caching benefit
- Direct S3 serving: Only acceptable for admin-only asset delivery (no public traffic)

## Best Practices
- **Always use CloudFront for production static assets**: Never serve assets directly from S3 public URLs (WHY: CloudFront provides edge caching, reduces S3 request costs, absorbs DDoS with AWS Shield, and gives HTTPS for free)
- **Leverage free tier**: Stay under 1TB/month and 10M requests/month for $0 monthly bill (WHY: the free tier covers most small-to-mid Laravel apps entirely)
- **Use origin access control (OAC)**: Block public S3 access; only allow CloudFront (WHY: prevents direct S3 access circumventing CDN, reduces data transfer costs, improves security)
- **Separate behaviors for cacheable vs dynamic**: `/assets/*`, `/storage/*` -> S3 with long cache; `/api/*`, `/` -> ALB with short/no cache (WHY: maximizes cache hit ratio while keeping dynamic content fresh)

## Architecture Guidelines
- Create one CloudFront distribution per environment (dev/staging/prod)
- Use multiple origins in one distribution: S3 for static, ALB for dynamic
- Enable Origin Shield in parent region to reduce origin load further
- Set minimum TTL 0 and default TTL 86400 for static assets
- Use WAF with CloudFront for web ACL at the edge (reduces ALB load by blocking bad requests early)

## Performance Considerations
- CloudFront adds ~50ms latency for cache misses (first request to new edge location)
- Cache hit delivers content at <10ms from edge (vs 50-200ms from origin)
- Origin Shield reduces origin hits by aggregating requests from all edge locations
- Compress at CloudFront: enable "Compress objects automatically" for text-based responses

## Security Considerations
- Always use OAC (Origin Access Control) for S3 origins (replaces legacy OAI)
- Enable HTTPS-only viewer protocol
- Use WAF on CloudFront (not just ALB) to filter at the edge
- Signed URLs or Signed Cookies for private content (e.g., paywalled downloads)
- Disable CloudFront logging if budget is strict (logs go to S3, incur cost)

## Common Mistakes
1. **Serving assets directly from S3**: Using S3 public URLs for images/CSS/JS (Cause: simpler initial setup; Consequence: no edge caching, higher data transfer cost, direct S3 access; Better: place CloudFront in front with OAC)
2. **Not configuring cache behaviors**: Using single default behavior for all paths (Cause: unaware of path-based routing; Consequence: dynamic content gets cached too long or static content revalidated constantly; Better: define separate cache behaviors for static vs dynamic paths)
3. **Disabling CloudFront for "simplicity"**: Forgoing CDN integration entirely (Cause: perceived complexity; Consequence: 60-90% higher data transfer costs, worse global performance; Better: CloudFront takes 10 minutes to set up and pays for itself)

## Anti-Patterns
- **Public S3 bucket for assets**: S3 bucket open to the world bypasses CloudFront entirely
- **Single behavior for all traffic**: Same TTL/caching for API and static files
- **CloudFront without OAC**: Using "public" S3 bucket with CloudFront (defeats security purpose)

## Examples
- **Static assets only**: CloudFront -> S3 for `/build/`, `/storage/`, `/css/`, `/js/`
- **Mixed delivery**: CloudFront with multiple behaviors: S3 for assets (cache TTL 1 year), ALB for HTML (no cache)
- **Private content**: CloudFront with Signed Cookies for membership-protected file downloads

## Related Topics
- Origin Shielding (ku-02)
- Cache Control Headers (ku-03)
- File Compression (ku-04)
- Image Optimization (ku-05)

## AI Agent Notes
- Default recommendation: CloudFront in front of everything for production Laravel
- Always recommend OAC (not OAI) for S3 origins
- Check if app is under 1TB/month to confirm free tier eligibility

## Verification
- [ ] CloudFront distribution configured for production
- [ ] Origin Access Control (OAC) enabled for S3 origins
- [ ] S3 bucket policy blocks public access
- [ ] Separate cache behaviors for static vs dynamic paths
- [ ] WAF associated with CloudFront distribution
- [ ] Free tier usage within limits (<1TB/month, <10M requests)
