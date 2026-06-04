# Decomposition: S3 Lifecycle Policies

## Topic Overview
S3 lifecycle policies automatically transition objects to lower-cost storage tiers based on age. Moving objects to S3 Infrequent Access after 30 days saves ~40% vs Standard. Transitioning to Glacier Flexible Retrieval after 90 days saves ~80%.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k21-s3-lifecycle-policies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### S3 Lifecycle Policies
- **Purpose:** S3 lifecycle policies automatically transition objects to lower-cost storage tiers based on age.
- **Difficulty:** Intermediate
- **Dependencies:** K43: CloudFront Origin Shield, K18: CloudFront vs Direct S3

## Dependency Graph
**Depends on:**
- K43: CloudFront Origin Shield
- K18: CloudFront vs Direct S3

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- S3 Standard
- S3 Infrequent Access
- S3 Glacier Instant Retrieval
- S3 Glacier Flexible
- S3 Glacier Deep Archive
- S3 Intelligent-Tiering
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K43: CloudFront Origin Shield, K18: CloudFront vs Direct S3

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