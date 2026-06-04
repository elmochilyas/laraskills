# Decomposition: Multi-Region Database

## Topic Overview
Multi-region database strategies enable low-latency reads for global users and disaster recovery across regions. For Laravel applications, Aurora Global Database provides a single writer region with up to 5 secondary read-only regions, replicating at the storage layer with ~1 second lag. The key cost tradeoff: Aurora Global Database adds no per-GB replication cost but requires at least one instance per region. Alternatives include RDS cross-region replicas (lower cost for single-table replication) and application-level replication (complex but flexible).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-03-multi-region-database/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Multi-Region Database
- **Purpose:** Multi-region database strategies enable low-latency reads for global users and disaster recovery across regions. For Laravel applications, Aurora Global Database provides a single writer region with up to 5 secondary read-only regions, replicating at the storage layer with ~1 second lag. The key cost tradeoff: Aurora Global Database adds no per-GB replication cost but requires at least one instance per region. Alternatives include RDS cross-region replicas (lower cost for single-table replication) and application-level replication (complex but flexible).
- **Difficulty:** Foundation
- **Dependencies:** - Data Transfer Costs (ku-01), - Global Load Balancing (ku-04), - Region Selection (ku-02), - Read Replicas Cost

## Dependency Graph
**Depends on:**
- Data Transfer Costs (ku-01)
- Global Load Balancing (ku-04)
- Region Selection (ku-02)
- Read Replicas Cost

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Aurora Global Database: Global Laravel app needing <100ms read latency worldwide; 1 writer region with readers
- RDS cross-region replica: Compliance (cross-region backup); DR with RTO < 1 hour; lower budget
- Application-level replication: Active-active multi-region writes; complex conflict resolution needed
- Read replicas per region: Select-heavy app with users distributed globally
- Aurora Global Database DR: <1 minute failover; no data loss (RPO=0 at storage layer)
**Out of scope:**
- Multi-region for single-region users: Unnecessary cost (instances in idle regions)
- RDS cross-region replicas for high-write apps: Replication bandwidth may not keep up; lag grows
- Application-level replication for low-traffic: Complexity not justified; single region with CloudFront is sufficient
- Aurora Global Database for small data (<50GB): Overhead of managing multiple regional instances
- Synchronous multi-region writes: Use async replication; sync writes add latency and coupling
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