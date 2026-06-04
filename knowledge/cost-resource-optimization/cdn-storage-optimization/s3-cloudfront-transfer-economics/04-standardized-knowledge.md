# S3 to CloudFront Transfer Economics

## Metadata
- **ID**: KU-19-S3-CF-TRANSFER
- **Subdomain**: cdn-storage-optimization
- **Domain**: cost-resource-optimization
- **Topic**: S3 to CloudFront Transfer
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Data transfer from S3 to CloudFront is free. This is AWS's "best loophole" for reducing egress costs. Additionally, CloudFront's egress pricing is cheaper than S3 direct. The combination means: S3→CloudFront = free internal transfer, CloudFront→Internet = $0-0.085/GB vs S3→Internet = $0.09/GB. At scale, this saves 5-100% depending on volume.

## Best Practices
- **Understand the free transfer applies only to S3 origins**: Other origins (ALB, EC2, custom HTTP) incur data transfer costs (WHY: S3→CloudFront free transfer is specific to S3 origins; if CloudFront origin is your application server, data transfer from EC2/ALB to CloudFront is not free; use S3 for static assets, not ALB)
- **Use S3 as origin for all static assets—never serve directly**: Maximize free transfer benefit (WHY: S3→CloudFront is free; CloudFront→Internet is $0.085/GB; S3 direct→Internet is $0.09/GB; CloudFront is both cheaper and faster; Spatie Media Library and Laravel Filesystem support S3 + CloudFront natively)
- **Origin fetch costs are zero for S3 → CloudFront**: Only pay for CloudFront egress (WHY: even cache misses incur no data transfer cost from S3 to CloudFront; your only S3 cost is GET requests ($0.0004/10K); CloudFront egress is the only variable cost)
- **Versioned asset URLs eliminate cache invalidation costs**: No CloudFront invalidation requests needed (WHY: CloudFront invalidation costs $0.005/request (first 1000 free); versioned URLs mean new deploy = new URL; no invalidation needed; old versions naturally age out of cache)

## Related Topics
- CloudFront Free Tier (ku-17)
- CloudFront vs Direct S3 (ku-18)
- CloudFront Compression (ku-20)

## AI Agent Notes
- Default: S3 → CloudFront for all public assets
- S3→CloudFront transfer is free
- Other origins (ALB, EC2, custom) incur data transfer costs
- Free transfer + cheaper egress = always use CloudFront over S3
