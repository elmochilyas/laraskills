# S3 to CloudFront Transfer Economics Rules

## Rule 1: Use S3 as Origin for All Static Assets
- **Category**: Cost Management
- **Rule**: Always use S3 as the origin for CloudFront serving static assets; never serve directly from S3
- **Reason**: S3-to-CloudFront transfer is free; CloudFront egress is cheaper than S3 direct ($0.085/GB vs $0.09/GB); free 1TB/month tier makes CloudFront cheaper at every volume
- **Bad Example**: Serving images directly from S3 public URLs, paying $0.09/GB egress with no caching
- **Good Example**: S3 origin with CloudFront in front; S3->CloudFront transfer is free, CloudFront egress is $0.085/GB, and caching reduces origin requests by 85%+
- **Exceptions**: Presigned URLs for time-limited private access bypass CloudFront
- **Consequences Of Violation**: Higher data transfer costs (S3 egress is more expensive); no edge caching benefit

## Rule 2: Avoid Non-S3 Origins for Static Content
- **Category**: Cost Management
- **Rule**: Use S3—not ALB or EC2—as CloudFront origin for static assets
- **Reason**: Free S3-to-CloudFront transfer is specific to S3 origins; using ALB or EC2 origin means paying for data transfer from compute to CloudFront
- **Bad Example**: Pointing CloudFront to an ALB for serving static assets; each cache miss incurs data transfer from ALB to CloudFront
- **Good Example**: Separating static assets into an S3 bucket with CloudFront origin; only dynamic content goes through ALB
- **Exceptions**: Dynamic content that cannot be pre-generated must use ALB/EC2 origin despite transfer costs
- **Consequences Of Violation**: Unnecessary data transfer costs from compute to CloudFront for static content

## Rule 3: Use Versioned Asset URLs to Avoid Invalidation Costs
- **Category**: Cost Management
- **Rule**: Use content-hashed filenames for all static assets to eliminate CloudFront invalidation needs
- **Reason**: CloudFront invalidation costs $0.005/request (first 1000 free); versioned URLs mean new deploy = new URL, no invalidation needed; old versions naturally age out of cache
- **Bad Example**: Deploying new CSS to the same `style.css` URL and paying for CloudFront invalidation to clear the old cached version
- **Good Example**: Using Laravel Mix/Vite hashing (`app.a1b2c3d4.css`); new deploy generates a new URL, old version expires naturally
- **Exceptions**: Dynamic content that must update at the same URL cannot use versioned URLs
- **Consequences Of Violation**: Ongoing invalidation costs ($0.005/request) or serving stale assets to users

## Rule 4: Account for S3 GET Request Costs in Cache Miss Analysis
- **Category**: Cost Management
- **Rule**: Monitor S3 GET request costs as a component of total CDN cost
- **Reason**: While S3-to-CloudFront transfer is free, each cache miss incurs an S3 GET request at $0.0004/10K requests; at high miss rates, request costs add up
- **Bad Example**: Focusing only on egress costs and ignoring that 1M cache misses/month cost $0.04 in S3 GET requests
- **Good Example**: Including both CloudFront egress ($0.085/GB) and S3 GET requests ($0.0004/10K) in total cost calculation
- **Exceptions**: With 95%+ cache hit ratio, S3 GET request costs are negligible (<$1/month)
- **Consequences Of Violation**: Underestimating total delivery cost; surprised by S3 line items in the bill
