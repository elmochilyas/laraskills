# Decomposition: CloudFront Origin Shield

## Topic Overview
CloudFront Origin Shield adds a regional caching layer between edge locations and your origin, reducing origin requests by 70-90% for global audiences. Instead of each edge POP requesting content from the origin independently, all edges route through a single shield POP. This reduces origin load, improves cache hit ratio, and reduces origin egress costs.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k43-cloudfront-origin-shield/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### CloudFront Origin Shield
- **Purpose:** CloudFront Origin Shield adds a regional caching layer between edge locations and your origin, reducing origin requests by 70-90% for global audiences.
- **Difficulty:** Intermediate
- **Dependencies:** K17: CloudFront Free Tier, K18: CloudFront vs Direct S3

## Dependency Graph
**Depends on:**
- K17: CloudFront Free Tier
- K18: CloudFront vs Direct S3

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- How it works
- Origin load reduction
- Cost impact
- Location
- Pricing
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K17: CloudFront Free Tier, K18: CloudFront vs Direct S3

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