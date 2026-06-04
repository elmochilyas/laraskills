# Decomposition: 7.19 RDS Proxy / Aurora (serverless connection multiplexing)

## Topic Overview
RDS Proxy (MySQL/PostgreSQL) and Aurora handle connection multiplexing at the AWS infrastructure level. They pool connections, handle failover transparently, and reduce database load from many short-lived connections. Particularly useful for Lambda (cold start connections) and serverless applications.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
7-19-rds-proxy-aurora/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 7.19 RDS Proxy / Aurora (serverless connection multiplexing)
- **Purpose:** RDS Proxy (MySQL/PostgreSQL) and Aurora handle connection multiplexing at the AWS infrastructure level. They pool connections, handle failover transparently, and reduce database load from many short-lived connections.
- **Difficulty:** Intermediate
- **Dependencies:** 7.8 Connection pooling replicas, 10.5 Serverless connection handling

## Dependency Graph
**Depends on:** "7.8 Connection pooling replicas", "10.5 Serverless connection handling"

**Depended on by:** More advanced KUs in Replication & Read/Write Splitting and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Connection multiplexing**: RDS Proxy maintains a small pool of persistent connections to the database. Many client connections share these pooled connections.; - **Failover handling**: RDS Proxy detects primary failover, reconnects to new primary transparently. Application doesn't see connection errors during failover.; - **IAM authentication**: RDS Proxy supports AWS IAM authentication. No database passwords in application config..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization