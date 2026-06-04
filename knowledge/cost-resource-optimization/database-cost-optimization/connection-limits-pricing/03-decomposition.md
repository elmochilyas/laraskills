# Decomposition: Connection Limits Pricing

## Topic Overview
Database connection limits constrain how many simultaneous connections the database can handle. AWS RDS enforces `max_connections` based on instance memory (typically `DBInstanceClassMemory/12582880`). Running out of connections causes "too many connections" errors. Connection poolers (RDS Proxy, PgBouncer) reduce connection count, but also have associated costs. The relationship between connections, instance size, and cost is critical: larger instances have higher connection limits but also higher prices.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-06-connection-limits-pricing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Connection Limits Pricing
- **Purpose:** Database connection limits constrain how many simultaneous connections the database can handle. AWS RDS enforces `max_connections` based on instance memory (typically `DBInstanceClassMemory/12582880`). Running out of connections causes "too many connections" errors. Connection poolers (RDS Proxy, PgBouncer) reduce connection count, but also have associated costs. The relationship between connections, instance size, and cost is critical: larger instances have higher connection limits but also higher prices.
- **Difficulty:** Foundation
- **Dependencies:** - Connection Pool Sizing (ku-01 in connection-pooling), - Serverless Database (ku-07), - Read Replicas Cost (ku-05)

## Dependency Graph
**Depends on:**
- Connection Pool Sizing (ku-01 in connection-pooling)
- Serverless Database (ku-07)
- Read Replicas Cost (ku-05)

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Connection pooler: Any production app with >20 PHP-FPM workers hitting same database
- RDS Proxy: Managed solution for MySQL/Aurora; IAM auth; failover handling
- PgBouncer: PostgreSQL; lower cost than RDS Proxy; more configuration control
- Monitor connections: Any database with connection count > 50% of max_connections
- Instance sizing for connections: Choose instance size based on max_connections, not just CPU/memory
**Out of scope:**
- No pooler for <10 workers: Single app server with 10 connections; max_connections is fine
- RDS Proxy for single-AZ dev: $11-30/month for dev environment where "too many connections" rarely occurs
- PgBouncer for MySQL: Use RDS Proxy or ProxySQL for MySQL; PgBouncer is PostgreSQL-only
- Over-sizing instance for connections: Don't go from t4g.medium to t4g.large just for 50 more connections (use pooler instead)
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