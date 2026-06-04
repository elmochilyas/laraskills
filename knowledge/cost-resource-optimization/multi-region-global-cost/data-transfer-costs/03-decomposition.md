# Decomposition: Data Transfer Costs

## Topic Overview
Data transfer between AWS regions, AZs, and to the internet is often a hidden cost that can exceed compute expenses. For Laravel applications with multi-region deployments (user base in US + EU + Asia), cross-region data transfer for database replication, cache synchronization, and API calls adds significant cost. Understanding data transfer pricing and minimizing cross-region traffic is essential for multi-region cost optimization.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-data-transfer-costs/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Data Transfer Costs
- **Purpose:** Data transfer between AWS regions, AZs, and to the internet is often a hidden cost that can exceed compute expenses. For Laravel applications with multi-region deployments (user base in US + EU + Asia), cross-region data transfer for database replication, cache synchronization, and API calls adds significant cost. Understanding data transfer pricing and minimizing cross-region traffic is essential for multi-region cost optimization.
- **Difficulty:** Foundation
- **Dependencies:** - Region Selection (ku-02), - Multi-Region Database (ku-03), - Global Load Balancing (ku-04), - Region Data Affinity

## Dependency Graph
**Depends on:**
- Region Selection (ku-02)
- Multi-Region Database (ku-03)
- Global Load Balancing (ku-04)
- Region Data Affinity

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Same-region deployment: Default for cost optimization; all services in one region
- Multi-region: Global user base with latency requirements; compliance (data residency)
- Cross-region replicas: Aurora Global Database, RDS cross-region read replicas
- CloudFront: Cheaper egress than EC2 direct; add at edge for global users
- VPC peering: Connect VPCs in same region for free; cross-region at $0.01-0.02/GB
**Out of scope:**
- Cross-region database sync for same-region users: Adding latency and cost with no benefit
- NAT Gateway for AWS services: Use VPC Endpoints (free for S3/DynamoDB)
- Cross-region cache sync: Multi-region Redis replication is expensive; use local caches instead
- Direct Connect for small data: Minimum monthly fee ($36+) may exceed data transfer cost
- Unnecessary cross-AZ traffic: Deploy app + DB in same AZ to avoid $0.01/GB
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