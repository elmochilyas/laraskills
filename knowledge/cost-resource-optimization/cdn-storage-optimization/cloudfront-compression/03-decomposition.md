# Decomposition: CloudFront Compression

## Topic Overview
CloudFront's native Gzip/Brotli compression reduces data transfer by 60-70% for compressible content (HTML, CSS, JS, JSON, SVG). This directly reduces egress costs and improves page load times. Enabling compression is a simple configuration toggle (`compress: true` in CloudFront distribution) with zero ongoing maintenance cost.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k20-cloudfront-compression/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### CloudFront Compression
- **Purpose:** CloudFront's native Gzip/Brotli compression reduces data transfer by 60-70% for compressible content (HTML, CSS, JS, JSON, SVG).
- **Difficulty:** Intermediate
- **Dependencies:** K17: CloudFront Free Tier, K18: CloudFront vs Direct S3, K19: S3 to CloudFront Transfer

## Dependency Graph
**Depends on:**
- K17: CloudFront Free Tier
- K18: CloudFront vs Direct S3
- K19: S3 to CloudFront Transfer

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Compression formats
- Compression ratio
- Cost impact
- Activation
- File types
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K17: CloudFront Free Tier, K18: CloudFront vs Direct S3, K19: S3 to CloudFront Transfer

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