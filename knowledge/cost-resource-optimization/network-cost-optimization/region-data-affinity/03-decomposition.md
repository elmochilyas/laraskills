# Decomposition: Region Data Affinity

## Topic Overview
Region data affinity ensures that application servers connect to database and cache resources in the same AWS region and Availability Zone. Cross-region data transfer costs $0.01-0.09/GB and adds 10-100ms latency per request. Cross-AZ traffic within a region costs $0.01/GB each way. For Laravel applications, keeping compute and data in the same AZ eliminates cross-AZ data transfer costs and reduces latency. Proper architecture can save 5-20% of total infrastructure costs.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-region-data-affinity/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Region Data Affinity
- **Purpose:** Region data affinity ensures that application servers connect to database and cache resources in the same AWS region and Availability Zone. Cross-region data transfer costs $0.01-0.09/GB and adds 10-100ms latency per request. Cross-AZ traffic within a region costs $0.01/GB each way. For Laravel applications, keeping compute and data in the same AZ eliminates cross-AZ data transfer costs and reduces latency. Proper architecture can save 5-20% of total infrastructure costs.
- **Difficulty:** Foundation
- **Dependencies:** - Data Transfer Costs, - VPC Architecture, - Multi-Region Database, - Cross-AZ NAT Gateway Cost

## Dependency Graph
**Depends on:**
- Data Transfer Costs
- VPC Architecture
- Multi-Region Database
- Cross-AZ NAT Gateway Cost

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Same-AZ deployment: Cost-sensitive apps with single-AZ tolerance
- Cross-AZ deployment: High-availability requirement (multi-AZ failover)
- Same-region: All production deployments (app, DB, cache in same region)
- Multi-region: Global user base requiring low latency worldwide
- Private subnets: For database, cache, and internal services (avoids NAT Gateway costs)
**Out of scope:**
- Cross-region for same-region users: Unnecessary cost and latency for local user base
- Single-AZ for critical workloads: Single-AZ failure causes total outage; use multi-AZ with Same-AZ affinity for primary
- NAT Gateway for same-region VPC endpoints: Use VPC Endpoints (Gateway/Interface) instead of NAT for AWS services
- Public subnets for databases: Security risk; always use private subnets
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