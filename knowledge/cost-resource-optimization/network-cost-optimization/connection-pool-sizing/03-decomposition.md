# Decomposition: Connection Pool Sizing

## Topic Overview
Connection pool sizing determines the optimal number of database connections to maintain between application servers and the database. Too few connections cause queueing (requests wait for available connections). Too many connections overwhelm the database (CPU context switching, memory consumption). For Laravel with PHP-FPM, each worker typically holds one database connection. With Octane, connections persist and must be managed carefully. Correct pool sizing enables smaller database instances by preventing connection overload.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-01-connection-pool-sizing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Connection Pool Sizing
- **Purpose:** Connection pool sizing determines the optimal number of database connections to maintain between application servers and the database. Too few connections cause queueing (requests wait for available connections). Too many connections overwhelm the database (CPU context switching, memory consumption). For Laravel with PHP-FPM, each worker typically holds one database connection. With Octane, connections persist and must be managed carefully. Correct pool sizing enables smaller database instances by preventing connection overload.
- **Difficulty:** Foundation
- **Dependencies:** - Persistent Connections (ku-02), - Connection Limits Pricing (ku-06 in database-cost-optimization), - RDS Proxy vs PgBouncer

## Dependency Graph
**Depends on:**
- Persistent Connections (ku-02)
- Connection Limits Pricing (ku-06 in database-cost-optimization)
- RDS Proxy vs PgBouncer

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- RDS Proxy: Production Aurora/MySQL with PHP-FPM workers (>10 concurrent connections)
- PgBouncer: PostgreSQL with many workers; lower cost than RDS Proxy
- Transaction pooling: Default for PHP-FPM (connections released per transaction)
- Session pooling: For apps using session-state features (SET commands, temp tables)
- Pool sizing: Any database serving more than 20 concurrent connections
**Out of scope:**
- No pooler for 1-2 workers: Dev/staging with single connection; pooler adds cost without benefit
- RDS Proxy for PostgreSQL: RDS Proxy works with Aurora and RDS MySQL; PostgreSQL requires PgBouncer
- Transaction pooling with prepared statements: Prepared statements are session-scoped; transaction pooling breaks them
- Over-sizing pool: Pool size > 4x vCPUs causes database context switching issues
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