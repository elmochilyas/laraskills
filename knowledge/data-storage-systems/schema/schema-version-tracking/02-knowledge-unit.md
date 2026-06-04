# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.14 Schema version tracking across multiple database connections
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Each database connection has its own `migrations` table. Multi-tenant with DB-per-tenant: N migrations tables (one per tenant). `php artisan migrate --database=tenant_123` runs against a specific connection. Central `migrations` table tracks which tenants are at which version. Ensures schema consistency across all connections.

---

# Core Concepts

- **Per-connection migrations table**: Each database connection has its own `migrations` table. `migrate` command defaults to `database.connections.mysql` connection.
- **Multi-DB migration command**: `php artisan migrate --database=tenant_001; php artisan migrate --database=tenant_002; ...`. Scripted via loop.
- **Central version ledger**: A central database's `migrations` table doesn't track per-tenant state. Use a custom `tenant_schema_versions` table instead.

---

# Patterns

**Migration batch per tenant**: `for each tenant: \Config::set('database.connections.tenant.database', $tenant->db); \DB::purge('tenant'); \Artisan::call('migrate', ['--database' => 'tenant', '--force' => true])`.

**Central migration tracker**: `tenant_schema_versions(tenant_id, batch, migration_name, applied_at)`. Updates after each tenant migration.

---

# Common Mistakes

**Running migration once assuming all connections are synchronized**: Each connection has its own `migrations` table. Running `migrate` once only updates the default connection.

---

# Related Knowledge Units

5.9 Migration orchestration | 5.19 Schema version ledger
## Ecosystem Usage

gh-ost for MySQL trigger-free migrations. pt-online-schema-change for trigger-based MySQL. pgroll for PostgreSQL view-based migrations. Spirit as gh-ost successor for MySQL 8.0+.

## Failure Modes

Trigger overhead from pt-osc degrades write performance. gh-ost cut-over fails under high write load. Insufficient disk space during online DDL.

## Performance Considerations

Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

## Production Considerations

Test full migration flow in staging. Monitor disk space during migration. Have rollback plan for every phase.

## Research Notes

Spirit provides faster row copying for MySQL 8.0+. pgroll view-based approach avoids trigger overhead. Industry trends toward application-level orchestration.

## Internal Mechanics

gh-ost creates ghost table, copies rows in chunks, streams binlog, atomically swaps. pt-osc uses triggers. pgroll creates PostgreSQL views.

## Architectural Decisions

gh-ost: MySQL 8.0+, binlog trigger-free, millisecond lock. pt-osc: MySQL 5.7+, trigger-based, millisecond lock. pgroll: PostgreSQL 14+, view-based, no exclusive locks.

## Tradeoffs

Zero-downtime DDL requires complex tool setup. Reversible migrations only with PostgreSQL. Trigger-free requires binlog enabled.

## Mental Models

Online schema changes use shadow table strategy. Think of changing a tire while the car is moving.

