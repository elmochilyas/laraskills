# Decomposition: Database Connection Pool

## Topic Overview
Database connection pooling reuses database connections across requests instead of creating a new connection per request. For Laravel, each PHP-FPM worker maintains its own database connection. Connection pools (RDS Proxy or PgBouncer) sit between the application and database, multiplexing connections to reduce database connection overhead and prevent connection exhaustion under load. Proper pooling reduces database CPU usage (fewer connection creations) and enables using smaller/cheaper database instances.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-09-database-connection-pool/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Database Connection Pool
- **Purpose:** Database connection pooling reuses database connections across requests instead of creating a new connection per request. For Laravel, each PHP-FPM worker maintains its own database connection. Connection pools (RDS Proxy or PgBouncer) sit between the application and database, multiplexing connections to reduce database connection overhead and prevent connection exhaustion under load. Proper pooling reduces database CPU usage (fewer connection creations) and enables using smaller/cheaper database instances.
- **Difficulty:** Foundation
- **Dependencies:** - Persistent Connections (ku-02 in connection-pooling), - Connection Limits Pricing (ku-06 in database-cost-optimization), - Region Data Affinity (ku-03 in connection-pooling)

## Dependency Graph
**Depends on:**
- Persistent Connections (ku-02 in connection-pooling)
- Connection Limits Pricing (ku-06 in database-cost-optimization)
- Region Data Affinity (ku-03 in connection-pooling)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- RDS Proxy: Production MySQL/Aurora with PHP-FPM (many workers = many connections)
- PgBouncer: PostgreSQL with PHP-FPM or Octane; lower cost than RDS Proxy
- Connection pooling: Any server with >10 PHP-FPM workers connecting to same database
- Serverless/auto-scaling: When worker count varies widely (prevents connection limit errors)
- Aurora Serverless v2: RDS Proxy required for connection management
**Out of scope:**
- RDS Proxy: For single-worker setups (dev, staging) where cost > benefit
- PgBouncer: For MySQL (MySQL has its own connection pool via SQLyog or ProxySQL)
- Connection pooling: Not needed if database max_connections > 2x PHP workers (no exhaustion risk)
- Transaction pooling for sessions: If app relies on session variables (SET SESSION commands); use session pooling instead
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