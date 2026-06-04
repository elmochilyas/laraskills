# Security Savings Bundle Rules

## Rule 1: Optimize CloudFront Before Evaluating Bundle
- **Category**: Cost Management
- **Rule**: Implement compression, caching, and Origin Shield optimization before purchasing the Security Savings Bundle
- **Reason**: Compression reduces transfer 60-70%; cache optimization reduces origin fetches 85%+; these optimizations reduce CloudFront cost first, making any bundle discount more meaningful
- **Bad Example**: Committing to an annual bundle at current usage levels, then later discovering compression could have reduced usage by 60%, making the bundle unnecessary
- **Good Example**: First enabling compression, optimizing cache headers, and enabling Origin Shield; then evaluating bundle only if still needed
- **Exceptions**: Apps already fully optimized may evaluate the bundle directly
- **Consequences Of Violation**: Committing to an annual discount on inflated usage figures; paying more than necessary

## Rule 2: Evaluate Bundle Only Above 5TB/Month
- **Category**: Cost Management
- **Rule**: Only consider the Security Savings Bundle when CloudFront usage exceeds 5TB/month
- **Reason**: The bundle requires annual commitment; free tier (1TB) and standard tier pricing cover most apps adequately below 5TB/month
- **Bad Example**: Purchasing an annual bundle at 2TB/month usage, locking into a commitment that doesn't provide meaningful savings over standard pricing
- **Good Example**: At 8TB/month CloudFront, calculating standard pricing vs bundle pricing and committing only if savings exceed 15%
- **Exceptions**: Apps with aggressive growth projections may benefit from early commitment if pricing is favorable
- **Consequences Of Violation**: Annual commitment that does not pay off; locked into spending more than standard pricing

## Rule 3: Compare Standard WAF + CloudFront Pricing First
- **Category**: Cost Management
- **Rule**: Calculate standard CloudFront + WAF pricing before committing to the Security Savings Bundle
- **Reason**: CloudFront includes basic DDoS protection (AWS Shield Standard) free; WAF costs ~$10/month + $0.60/rule; for apps without compliance requirements, standard pricing is likely cheaper than bundle commitment
- **Bad Example**: Buying the bundle for WAF credits when the app only needs 2 WAF rules costing ~$11/month
- **Good Example**: Calculating that standard WAF ($11/month) + standard CloudFront ($X/month) is cheaper than bundle minimum commitment
- **Exceptions**: Apps requiring advanced WAF features (bot control, rate limiting, managed rules) that benefit from bundled pricing
- **Consequences Of Violation**: Paying for bundled security features that are cheaper on standard pricing

## Rule 4: Understand Bundle Availability Requirements
- **Category**: Architecture
- **Rule**: Confirm bundle eligibility by engaging AWS account team before planning budget
- **Reason**: The Security Savings Bundle requires AWS Enterprise support or an account manager and is not available through the standard AWS Console
- **Bad Example**: Planning annual budget around bundle savings without confirming eligibility, then discovering the bundle is not available for the account
- **Good Example**: Contacting AWS account team, confirming bundle pricing and eligibility, then incorporating into budget
- **Exceptions**: Organizations with Enterprise support may assume eligibility but should still confirm pricing
- **Consequences Of Violation**: Budget shortfall if expected bundle savings are not available
