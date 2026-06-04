# CDN Integration Rules

## Rule 1: Always Use CloudFront for Production Static Assets
- **Category**: Architecture
- **Rule**: Always put CloudFront in front of S3 for all production static asset delivery
- **Reason**: CloudFront provides edge caching, 1TB free egress/month, lower per-GB pricing than S3 direct, DDoS protection via AWS Shield, and free HTTPS; S3-to-CloudFront transfer is free
- **Bad Example**: Serving production assets directly from S3 public URLs; no caching, higher egress costs, direct S3 exposure
- **Good Example**: CloudFront distribution with S3 origin; bucket is fully private via OAC; all traffic goes through CloudFront
- **Exceptions**: Admin-only asset delivery where public traffic does not exist
- **Consequences Of Violation**: 60-90% higher data transfer costs; no edge caching; direct S3 exposure to DDoS

## Rule 2: Use Origin Access Control (OAC)
- **Category**: Security
- **Rule**: Always configure CloudFront Origin Access Control (OAC) to block direct S3 access
- **Reason**: Prevents users from bypassing CloudFront to access S3 directly, which would circumvent caching, cost savings, and access control
- **Bad Example**: Keeping S3 bucket publicly readable with CloudFront in front; users can access S3 directly ignoring CloudFront
- **Good Example**: OAC enabled, S3 bucket policy blocks all public access, only CloudFront origin identity can read objects
- **Exceptions**: Public buckets for unauthenticated uploads may need public access
- **Consequences Of Violation**: Direct S3 access circumvents CDN; higher costs and data transfer bypass caching

## Rule 3: Separate Cache Behaviors for Static vs Dynamic Content
- **Category**: Architecture
- **Rule**: Configure separate CloudFront cache behaviors for static paths (`/assets/*`, `/storage/*`) and dynamic paths (`/api/*`, `/`)
- **Reason**: Static assets need long TTLs (1 year) and aggressive caching; dynamic content needs short TTLs or bypass; mixing them results in suboptimal performance for both
- **Bad Example**: Using a single default cache behavior for all paths; static assets expire too quickly or dynamic content caches too long
- **Good Example**: Path pattern `/build/*` -> S3 origin, TTL 1 year; path pattern `/` -> ALB origin, TTL 0 (no-cache)
- **Exceptions**: Apps serving only static content (JAMstack) may use a single behavior
- **Consequences Of Violation**: Static assets purged prematurely generating unnecessary origin requests, or dynamic content served stale

## Rule 4: Leverage Free Tier Before Scaling
- **Category**: Cost Management
- **Rule**: Monitor CloudFront free tier usage and scale distribution configuration to stay within 1TB/month and 10M requests/month if possible
- **Reason**: CloudFront's free tier (1TB transfer + 10M requests) is generous; many small-to-medium Laravel apps can operate at $0 CDN cost
- **Bad Example**: Paying for CloudFront data transfer when the app uses <1TB/month and has not configured compression or PriceClass optimization
- **Good Example**: Monitoring free tier consumption monthly; enabling compression (effectively 2-3x free tier value) and using PriceClass_100 for regional audiences
- **Exceptions**: Apps that exceed 1TB/month must budget for paid tier ($0.085/GB)
- **Consequences Of Violation**: Paying for data transfer that would be covered by the free tier or optimization strategies

## Rule 5: Use WAF with CloudFront for Edge Filtering
- **Category**: Security
- **Rule**: Attach AWS WAF to the CloudFront distribution to filter malicious traffic at the edge before it reaches the origin
- **Reason**: WAF at CloudFront blocks bad requests before they reach ALB or EC2, reducing origin load and protecting against common web exploits; block at edge = no compute cost at origin
- **Bad Example**: Running WAF only at the ALB level; malicious traffic that reaches CloudFront still passes through to ALB for filtering
- **Good Example**: WAF attached to CloudFront distribution with SQL injection and XSS rule groups; malicious requests blocked before reaching ALB
- **Exceptions**: Budget-constrained apps where WAF cost ($10/month + $0.60/rule) exceeds benefit
- **Consequences Of Violation**: Malicious traffic reaches origin servers; unnecessary compute cost for processing and filtering bad requests
