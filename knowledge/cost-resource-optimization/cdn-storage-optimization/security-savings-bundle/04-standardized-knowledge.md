# Security Savings Bundle

## Metadata
- **ID**: KU-44-SECURITY-BUNDLE
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: CloudFront Security Savings Bundle
- **Version**: 1.0
- **Classification**: Emerging
- **Maturity**: High

## Overview
AWS CloudFront Security Savings Bundle (2025+) offers up to 30% discount on CloudFront combined with free WAF credits when purchased at commitment level. This bundles CloudFront data transfer with WAF, Shield, and bot control at a consolidated discount. For Laravel apps with significant CloudFront usage (>5TB/month), the bundle can reduce security + CDN costs by 20-30%.

## Best Practices
- **Evaluate the Security Savings Bundle at >5TB/month CloudFront usage**: Below this threshold, free tier + standard pricing is sufficient (WHY: the bundle requires annual commitment; for apps using <5TB/month, the free tier (1TB) and standard tier pricing (up to $0.085/GB) provide adequate cost structure without commitment)
- **Bundle pricing requires AWS Enterprise support or account manager**: Not available through standard AWS Console (WHY: the Security Savings Bundle is a negotiated agreement, not a self-service purchase; contact AWS account team for pricing; smaller apps may not qualify for bundle consideration)
- **Combine with compression and cache optimization first**: Maximize CloudFront efficiency before committing to bundle (WHY: compression reduces transfer 60-70%; cache optimization reduces origin fetches 85%+; these optimizations reduce CloudFront cost before any bundle discount; optimize first, commit second)
- **Consider CloudFront + WAF standard pricing before bundle**: Standard pricing may be sufficient for moderate security needs (WHY: CloudFront includes basic DDoS protection (AWS Shield Standard) free; WAF costs ~$10/month + $0.60/rule; for apps without compliance requirements, standard pricing may be cheaper than bundle commitment)

## Related Topics
- CloudFront Free Tier (ku-17)
- CloudFront vs Direct S3 (ku-18)
- CloudFront Origin Shield (ku-43)

## AI Agent Notes
- Default: optimize CloudFront (compression, cache) before evaluating bundle
- Bundle only makes sense at >5TB/month CloudFront usage
- Requires AWS Enterprise support or account manager
- Standard CloudFront + WAF is sufficient for most apps
