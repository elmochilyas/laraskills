# Decomposition: PgBouncer Alternative

## Topic Overview
PgBouncer is free, open-source connection pooling software that runs on a small EC2 instance ($5-20/month compute). It provides comparable connection pooling to RDS Proxy at 10-20% of the cost. The tradeoffs: (1) Transaction mode breaks session-level features (advisory locks, prepared statements); (2) No IAM authentication; (3) Requires operational management.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k35-pgbouncer-alternative/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### PgBouncer Alternative
- **Purpose:** PgBouncer is free, open-source connection pooling software that runs on a small EC2 instance ($5-20/month compute).
- **Difficulty:** Intermediate
- **Dependencies:** K34: RDS Proxy Pricing, K36: Cross-AZ and NAT Gateway Cost

## Dependency Graph
**Depends on:**
- K34: RDS Proxy Pricing
- K36: Cross-AZ and NAT Gateway Cost

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Cost
- vs RDS Proxy
- Modes
- Transaction mode traps
- Best for
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K34: RDS Proxy Pricing, K36: Cross-AZ and NAT Gateway Cost

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