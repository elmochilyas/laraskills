# Decomposition: 11.14 Schema version tracking across multiple database connections

## Topic Overview
Each database connection has its own `migrations` table. Multi-tenant with DB-per-tenant: N migrations tables (one per tenant). `php artisan migrate --database=tenant_123` runs against a specific connection.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
11-14-schema-version-tracking/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 11.14 Schema version tracking across multiple database connections
- **Purpose:** Each database connection has its own `migrations` table. Multi-tenant with DB-per-tenant: N migrations tables (one per tenant).
- **Difficulty:** Advanced
- **Dependencies:** 5.9 Migration orchestration, 5.19 Schema version ledger

## Dependency Graph
**Depends on:** "5.9 Migration orchestration", "5.19 Schema version ledger"

**Depended on by:** More advanced KUs in Production Schema Operations and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Per-connection migrations table**: Each database connection has its own `migrations` table. `migrate` command defaults to `database.connections.mysql` connection.; - **Multi-DB migration command**: `php artisan migrate --database=tenant_001; php artisan migrate --database=tenant_002; ...`. Scripted via loop.; - **Central version ledger**: A central database's `migrations` table doesn't track per-tenant state. Use a custom `tenant_schema_versions` table instead..
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