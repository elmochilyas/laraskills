# Decomposition: Serverless Database

## Topic Overview
Serverless databases (Aurora Serverless v2, Neon) automatically scale compute capacity based on demand, charging only for what you use. For Laravel applications with variable traffic, serverless databases eliminate over-provisioning waste: you don't pay for idle capacity during low traffic. Aurora Serverless v2 scales in ACU increments (0.5-256 ACU). Neon Serverless Postgres offers pay-per-use with instant branching for development and preview environments.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-07-serverless-database/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Serverless Database
- **Purpose:** Serverless databases (Aurora Serverless v2, Neon) automatically scale compute capacity based on demand, charging only for what you use. For Laravel applications with variable traffic, serverless databases eliminate over-provisioning waste: you don't pay for idle capacity during low traffic. Aurora Serverless v2 scales in ACU increments (0.5-256 ACU). Neon Serverless Postgres offers pay-per-use with instant branching for development and preview environments.
- **Difficulty:** Foundation
- **Dependencies:** - Reserved Instances (ku-01 in compute-commitment), - Read Replicas Cost (ku-05), - Data Archival (ku-03)

## Dependency Graph
**Depends on:**
- Reserved Instances (ku-01 in compute-commitment)
- Read Replicas Cost (ku-05)
- Data Archival (ku-03)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Aurora Serverless v2: Variable traffic, infrequent peaks, or unpredictable workloads
- Neon: Development/staging/CI databases; preview environments; branch-per-feature workflow
- Serverless: When you don't want to manage database instance sizing
- Serverless: Spiky workloads (marketing campaigns, seasonal apps)
- Serverless: Multi-tenant SaaS with variable per-tenant load
- Neon branching: Parallel development teams needing isolated database branches
**Out of scope:**
- Aurora Serverless: Predictable high-traffic workloads > 100 ACU sustained (RIs are cheaper)
- Serverless v1: Aurora Serverless v1 has cold start (5-30 seconds); not suitable for production
- Serverless for steady 24/7 load: Provisioned RDS with 3-year RI is 60-70% cheaper at sustained load
- Serverless during warm-up: Scaling takes 1-5 seconds for large jumps; not suitable for instant burst
- Neon for production data > 50GB: Neon's pricing model favors smaller databases (<50GB)
- Related topics covered in other Knowledge Units within this domain.

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

No Knowledge Unit is overloaded

No major concept is missing

Boundaries are clear

Future phases can operate on individual units

The structure can scale without reorganization