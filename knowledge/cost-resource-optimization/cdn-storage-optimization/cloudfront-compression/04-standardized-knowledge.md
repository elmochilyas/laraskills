# CloudFront Compression

## Metadata
- **ID**: KU-20-CLOUDFRONT-COMPRESSION
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: CloudFront Compression
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
CloudFront's native Gzip/Brotli compression reduces data transfer by 60-70% for compressible content (HTML, CSS, JS, JSON, SVG). This directly reduces egress costs and improves page load times. Enabling compression is a simple configuration toggle (`compress: true` in CloudFront distribution) with zero ongoing maintenance cost. For a typical Laravel app serving 500GB/month, compression saves $25-40/month in egress costs.

## Best Practices
- **Enable compression at CloudFront level, not origin**: CloudFront compresses before caching at edge (WHY: compression at origin means full bytes traverse to edge; compression at CloudFront level means only compressed bytes are stored and served from edge; reduces both origin transfer and edge storage costs)
- **Set compress: true in CloudFront distribution**: Single toggle in CloudFront configuration (WHY: no code changes needed; CloudFront automatically negotiates Gzip vs Brotli based on Accept-Encoding header; works for all text-based content types)
- **Only compress compressible content types**: HTML, CSS, JS, JSON, XML, SVG, fonts (WHY: images, videos, PDFs, and other binary formats are already compressed; attempting to compress them wastes CPU with no size reduction; CloudFront's default content type list handles this automatically)
- **Combine with versioned asset URLs**: Cache-busting ensures compressed versions are cached long-term (WHY: compressed assets cached at edge; versioned URLs prevent cache staleness; maximize cache hit ratio for compressed content)

## Related Topics
- CloudFront Free Tier (ku-17)
- CloudFront vs Direct S3 (ku-18)
- S3 to CloudFront Transfer (ku-19)

## AI Agent Notes
- Default: enable CloudFront compression (compress: true)
- One-time config change, ongoing 60-70% egress reduction
- Does not require application changes
- Images/videos should not be re-compressed
