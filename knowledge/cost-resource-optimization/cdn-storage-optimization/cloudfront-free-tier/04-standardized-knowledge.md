# CloudFront Free Tier Economics

## Metadata
- **ID**: KU-17-CLOUDFRONT-FREE-TIER
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: CloudFront Free Tier
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
CloudFront offers 1TB of free egress per month permanently (not just first year), plus 10M HTTP/HTTPS requests. This is the most generous CDN free tier available. For small-to-medium Laravel apps, the free tier covers most or all CDN costs. At 1TB/month, CloudFront costs $0 vs $92.16 for direct S3 egress. This makes CloudFront the single highest-ROI infrastructure decision for any Laravel app serving assets.

## Best Practices
- **Always put CloudFront in front of S3 for public assets**: 1TB free egress + cheaper per-GB after free tier (WHY: CloudFront egress is always cheaper than S3 direct; free tier covers most small-to-medium apps; S3-to-CloudFront transfer is free; the only reason not to use CloudFront is presigned URLs for private content)
- **Monitor monthly free tier consumption**: Track CloudFront data transfer in Cost Explorer (WHY: free tier covers 1TB/month; if usage exceeds 1TB, cost jumps from $0 to $0.085/GB; forecast when free tier will be exhausted to budget for paid tier)
- **Use PriceClass_100 for US/EU-only audiences**: Maximize free tier value for regional apps (WHY: PriceClass_100 serves from US/EU edge locations only; cheaper per-GB than global; free tier covers same 1TB regardless of price class)
- **Combine free tier with compression**: Compressible content effectively doubles free tier value (WHY: compression reduces transfer 60-70%; 1TB free tier becomes 2.5-3TB effective; more content served within free tier limits)

## Related Topics
- CloudFront vs Direct S3 (ku-18)
- S3 to CloudFront Transfer (ku-19)
- CloudFront Compression (ku-20)

## AI Agent Notes
- Default: CloudFront in front of S3 for all public assets
- 1TB free egress is permanent, not trial
- Free tier covers majority of small-to-medium app CDN costs
- Compression effectively extends free tier 2-3x
