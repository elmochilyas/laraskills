# Decomposition: Global Load Balancing

## Topic Overview
Global load balancing distributes user traffic across multiple AWS regions to optimize latency, maximize availability, and minimize data transfer costs. Route53 provides latency-based routing (direct users to lowest-latency region), geolocation routing (compliance), and failover routing (DR). The cost tradeoff: multi-region load balancing adds Route53 costs and requires infrastructure in each region but reduces latency (improving conversion) and enables region-level HA.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-04-global-load-balancing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Global Load Balancing
- **Purpose:** Global load balancing distributes user traffic across multiple AWS regions to optimize latency, maximize availability, and minimize data transfer costs. Route53 provides latency-based routing (direct users to lowest-latency region), geolocation routing (compliance), and failover routing (DR). The cost tradeoff: multi-region load balancing adds Route53 costs and requires infrastructure in each region but reduces latency (improving conversion) and enables region-level HA.
- **Difficulty:** Foundation
- **Dependencies:** - Region Selection (ku-02), - Multi-Region Database (ku-03), - Data Transfer Costs (ku-01)

## Dependency Graph
**Depends on:**
- Region Selection (ku-02)
- Multi-Region Database (ku-03)
- Data Transfer Costs (ku-01)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Route53 latency routing: Global user base; multi-region deployment with local readers
- Route53 geolocation routing: Compliance (GDPR: route EU users to EU); content localization
- Route53 failover routing: DR with active-passive multi-region (lower cost than active-active)
- Global Accelerator: TCP/UDP optimization; non-HTTP protocols; need static IPs
- Active-active: Global user base needing <50ms latency; multi-region writes
- Active-passive: DR-only multi-region; cost-constrained; RTO < 5 minutes acceptable
**Out of scope:**
- Route53 latency routing with single region: Direct routing is simpler and free (no multi-region cost)
- Global Accelerator for simple HTTP: CloudFront is cheaper and provides similar latency benefits
- Geolocation routing for global content: If all content is the same regardless of location, use latency routing
- Active-active without database strategy: Both regions live but can't write simultaneously (no benefit)
- Multi-region for small apps: Cost of second region infrastructure > benefit; use CloudFront from single region
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