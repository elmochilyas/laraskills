# Decomposition: Security Savings Bundle

## Topic Overview
AWS CloudFront Security Savings Bundle (2025+) offers up to 30% discount on CloudFront combined with free WAF credits when purchased at commitment level. This bundles CloudFront data transfer with WAF, Shield, and bot control at a consolidated discount. For Laravel apps with significant CloudFront usage (>5TB/month), the bundle can reduce security + CDN costs by 20-30%.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k44-security-savings-bundle/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Security Savings Bundle
- **Purpose:** AWS CloudFront Security Savings Bundle (2025+) offers up to 30% discount on CloudFront combined with free WAF credits when purchased at commitment level.
- **Difficulty:** Advanced
- **Dependencies:** K17: CloudFront Free Tier, K18: CloudFront vs Direct S3, K43: CloudFront Origin Shield

## Dependency Graph
**Depends on:**
- K17: CloudFront Free Tier
- K18: CloudFront vs Direct S3
- K43: CloudFront Origin Shield

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Discount
- Free WAF
- Bundle includes
- Commitment
- Best for
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K17: CloudFront Free Tier, K18: CloudFront vs Direct S3, K43: CloudFront Origin Shield

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