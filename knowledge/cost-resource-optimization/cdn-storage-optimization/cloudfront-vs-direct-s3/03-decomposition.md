# Decomposition: CloudFront vs Direct S3 Cost

## Topic Overview
CloudFront over S3 is cheaper at every volume than direct S3 delivery. S3-to-CloudFront transfer is free, CloudFront egress is cheaper per-GB than S3 direct ($0.085/GB vs $0.09/GB), and CloudFront's free tier covers the first 1TB/month. With cache hit ratios above 85%, origin fetches are reduced by 85%+, compounding savings.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k18-cloudfront-vs-direct-s3/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### CloudFront vs Direct S3 Cost
- **Purpose:** CloudFront over S3 is cheaper at every volume than direct S3 delivery.
- **Difficulty:** Foundation
- **Dependencies:** K17: CloudFront Free Tier, K19: S3 to CloudFront Transfer, K20: CloudFront Compression

## Dependency Graph
**Depends on:**
- K17: CloudFront Free Tier
- K19: S3 to CloudFront Transfer
- K20: CloudFront Compression

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- S3 direct egress
- CloudFront egress
- S3Ã¢â€ â€™CloudFront transfer
- Free tier
- Cache hit savings
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K17: CloudFront Free Tier, K19: S3 to CloudFront Transfer, K20: CloudFront Compression

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization