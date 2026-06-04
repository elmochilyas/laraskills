# Decomposition: S3 to CloudFront Transfer Economics

## Topic Overview
Data transfer from S3 to CloudFront is free. This is AWS's "best loophole" for reducing egress costs. Additionally, CloudFront's egress pricing is cheaper than S3 direct.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k19-s3-cloudfront-transfer-economics/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### S3 to CloudFront Transfer Economics
- **Purpose:** Data transfer from S3 to CloudFront is free.
- **Difficulty:** Foundation
- **Dependencies:** K17: CloudFront Free Tier, K18: CloudFront vs Direct S3, K20: CloudFront Compression

## Dependency Graph
**Depends on:**
- K17: CloudFront Free Tier
- K18: CloudFront vs Direct S3
- K20: CloudFront Compression

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- S3Ã¢â€ â€™CloudFront
- CloudFrontÃ¢â€ â€™Internet
- Origin fetch
- Free tier
- The loophole
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K17: CloudFront Free Tier, K18: CloudFront vs Direct S3, K20: CloudFront Compression

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