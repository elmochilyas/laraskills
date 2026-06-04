# Decomposition: Region Selection

## Topic Overview
AWS region selection directly impacts compute, data transfer, and service costs. Pricing varies up to 40% between regions for identical services. For Laravel applications, choosing a region involves balancing user latency (revenue impact), compliance (data residency), service availability (feature parity), and cost. The most popular regions (us-east-1, eu-west-1) have the widest service selection and lowest prices.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-02-region-selection/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Region Selection
- **Purpose:** AWS region selection directly impacts compute, data transfer, and service costs. Pricing varies up to 40% between regions for identical services. For Laravel applications, choosing a region involves balancing user latency (revenue impact), compliance (data residency), service availability (feature parity), and cost. The most popular regions (us-east-1, eu-west-1) have the widest service selection and lowest prices.
- **Difficulty:** Foundation
- **Dependencies:** - Data Transfer Costs (ku-01), - Multi-Region Database (ku-03), - Global Load Balancing (ku-04)

## Dependency Graph
**Depends on:**
- Data Transfer Costs (ku-01)
- Multi-Region Database (ku-03)
- Global Load Balancing (ku-04)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- us-east-1: Default for cost optimization; lowest prices, best service availability
- eu-west-1/eu-central-1: European user base; GDPR compliance
- ap-northeast-1 (Tokyo): Japanese user base (low latency)
- ap-southeast-1: SE Asia user base (balance cost and latency)
- Multi-region: Global user base >100K monthly active users needing <100ms latency
- us-west-2: West coast US users; AWS innovation region
**Out of scope:**
- sa-east-1: Avoid unless Brazil-specific business requirement (30-50% premium)
- Regions without needed services: Don't choose a region that lacks Graviton/Aurora if you need them
- Overly distributed multi-region: 3+ regions for <50K MAU; complexity and cost outweigh benefit
- ap-southeast-1 for cost alone: If latency is acceptable, us-east-1 is 10-20% cheaper
- GovCloud regions: Only for US government workloads; 2-3x more expensive with limited services
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