# Decomposition: Read Replicas Cost

## Topic Overview
Read replicas offload SELECT queries from the primary database, reducing CPU contention and enabling the primary to handle more write capacity. For Laravel applications, read replicas enable separating read-heavy queries (reports, dashboards, public listings) from write operations. However, each replica doubles (or more) database cost. The decision to use replicas must balance query throughput needs against additional instance costs.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-05-read-replicas-cost/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Read Replicas Cost
- **Purpose:** Read replicas offload SELECT queries from the primary database, reducing CPU contention and enabling the primary to handle more write capacity. For Laravel applications, read replicas enable separating read-heavy queries (reports, dashboards, public listings) from write operations. However, each replica doubles (or more) database cost. The decision to use replicas must balance query throughput needs against additional instance costs.
- **Difficulty:** Foundation
- **Dependencies:** - Query Optimization Cost (ku-01), - Serverless Database (ku-07), - Storage Tier Selection (ku-04)

## Dependency Graph
**Depends on:**
- Query Optimization Cost (ku-01)
- Serverless Database (ku-07)
- Storage Tier Selection (ku-04)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Read replicas: Query-heavy apps where reads > 80% of database operations
- Report/dashboard queries: Heavy analytical queries that shouldn't impact user-facing writes
- Geo-distribution: Cross-region replicas for global users (low latency reads)
- Scaling read capacity: When primary database CPU > 70% from SELECT queries
- Aurora replicas: Cost-effective multi-AZ reads (no storage cost, smaller instances possible)
**Out of scope:**
- Write-heavy apps: If 80%+ of queries are writes, replicas don't help (primary is still bottleneck)
- Low-traffic apps: <1000 queries/second; single database handles it fine
- Real-time consistency needs: Replication lag may serve stale data (<100ms usually acceptable)
- Budget-constrained: Each replica doubles database cost; optimize queries first before adding replicas
- Small data ( <50GB ): Query optimization + caching usually sufficient without replicas
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