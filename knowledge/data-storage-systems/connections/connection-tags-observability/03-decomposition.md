# Decomposition: 10.8 Connection tags and observability (application_name, per-connection metadata)

## Topic Overview
Set per-connection metadata to identify the application, tenant, or request in database monitoring. PostgreSQL: `SET application_name = 'laravel-web'`. MySQL: `SET @@session.metrics = 'tenant:123'`.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-8-connection-tags-observability/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.8 Connection tags and observability (application_name, per-connection metadata)
- **Purpose:** Set per-connection metadata to identify the application, tenant, or request in database monitoring. PostgreSQL: `SET application_name = 'laravel-web'`.
- **Difficulty:** Intermediate
- **Dependencies:** 10.1 Connection lifecycle, 5.5 Global scopes

## Dependency Graph
**Depends on:** "10.1 Connection lifecycle", "5.5 Global scopes"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **application_name (PostgreSQL)**: `config(['database.connections.pgsql.application_name' => 'app_'.$tenant])`. Set per connection. Visible in `pg_stat_activity`.; - **MySQL connection attributes**: `$pdo->setAttribute(PDO::ATTR_CONNECTION_STATUS, 'tenant_id:123')`. Visible in `SHOW FULL PROCESSLIST`.; - **Per-request tagging**: In middleware, execute `SET application_name = 'web|user:'.$userId` after connection. Overrides the default..
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