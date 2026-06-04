# Decomposition: 10.14 Connection health checks (hearbeat queries, idle connection timeout)

## Topic Overview
Connection health checks verify that pooled connections are still alive. Idle connections can be dropped by the database (wait_timeout, idle_in_transaction_session_timeout), proxy (pgbouncer server_idle_timeout), or network equipment. Health check: `SELECT 1` (MySQL) or `SELECT 1` (PostgreSQL) — minimal query that validates the connection works.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
10-14-connection-health-checks/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 10.14 Connection health checks (hearbeat queries, idle connection timeout)
- **Purpose:** Connection health checks verify that pooled connections are still alive. Idle connections can be dropped by the database (wait_timeout, idle_in_transaction_session_timeout), proxy (pgbouncer server_idle_timeout), or network equipment.
- **Difficulty:** Advanced
- **Dependencies:** 10.1 Connection lifecycle, 10.7 Connection count

## Dependency Graph
**Depends on:** "10.1 Connection lifecycle", "10.7 Connection count"

**Depended on by:** More advanced KUs in Connection Management & Pooling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Heartbeat query**: `DB::select('SELECT 1')` before using a pooled connection. If it fails, discard connection and create new one.; - **Idle timeout**: MySQL `wait_timeout` (default 28800s = 8h). PostgreSQL `idle_in_transaction_session_timeout` (default 0 = disabled). Pooler must expect connection drops.; - **Octane health check**: Octane automatically checks connection health before returning from pool. Dead connections are recreated..
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