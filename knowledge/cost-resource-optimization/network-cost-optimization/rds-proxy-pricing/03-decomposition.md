# Decomposition: RDS Proxy Pricing

## Topic Overview
RDS Proxy costs ~$0.015/vCPU-hour ($21.60/month for db.m5.large), but has a hidden minimum charge of 8 ACUs (~$300/month) when used with Aurora Serverless v2. For provisioned RDS, the cost scales linearly with vCPU. RDS Proxy is most cost-effective for Lambda-backed applications that need connection pooling to prevent database connection exhaustion.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
k34-rds-proxy-pricing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### RDS Proxy Pricing
- **Purpose:** RDS Proxy costs ~$0.015/vCPU-hour ($21.60/month for db.m5.large), but has a hidden minimum charge of 8 ACUs (~$300/month) when used with Aurora Serverless v2.
- **Difficulty:** Intermediate
- **Dependencies:** K35: PgBouncer Alternative, K06: Aurora Serverless v2 Pricing

## Dependency Graph
**Depends on:**
- K35: PgBouncer Alternative
- K06: Aurora Serverless v2 Pricing

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Pricing model
- Provisioned example
- Aurora Serverless v2
- ROI
- Minimum charge
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- K35: PgBouncer Alternative, K06: Aurora Serverless v2 Pricing

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