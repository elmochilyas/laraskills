# Skill: Track Schema Versions Across Multiple Database Connections

## Purpose

Manage migration state across multiple database connections in multi-tenant or multi-DB architectures by iterating over connections, running `migrate` per connection, and maintaining a central `tenant_schema_versions` table to track which connections are at which schema version.

## When To Use

- Multi-tenant SaaS with per-tenant databases
- Applications using multiple database connections
- Environments requiring independent schema versioning per connection

## When NOT To Use

- Single-database applications
- Shared-table multi-tenancy
- All connections always at the same schema version

## Prerequisites

- Named database connections configured in `config/database.php`
- Per-connection `migrations` tables
- Central version tracking table

## Inputs

- List of database connections
- Migration files to apply
- Batch size for parallel execution

## Workflow

1. For each database connection, iterate and run `php artisan migrate --database=connection_name --force`
2. After each connection's migration, update the central `tenant_schema_versions(tenant_id, migration_name, batch, applied_at)` table
3. Use a loop or queue to fan out migrations across connections
4. Before migrating a connection, check its current schema version from the central table
5. Run periodic reconciliation: compare central ledger entries with each connection's `SELECT * FROM migrations`

## Validation Checklist

- [ ] Each connection has its own `migrations` table
- [ ] Central `tenant_schema_versions` table tracks per-connection state
- [ ] Migration fan-out iterates over all connections
- [ ] Central ledger updated atomically per connection
- [ ] Reconciliation detects drift between ledger and connection state

## Common Failures

### Running migration once assuming all connections sync
Each connection has its own `migrations` table. Running `migrate` once only updates the default connection. Explicitly iterate over all connections.

### Central ledger not updated
Without a central ledger, it's impossible to know which connections are at which schema version. Always update the ledger after each connection's migration.

## Decision Points

### Sequential vs parallel fan-out?
Sequential for < 20 connections. Parallel for 20+ connections with concurrency limits. Queued fan-out for 100+ connections with retry capability.

### Single ledger per connection or per migration?
Per migration entry for granular tracking. Per batch entry for simpler queries. Per migration is recommended for detailed audit trails.

## Performance Considerations

Each connection migration creates its own database connection. Large connections take longer to migrate. Index the central ledger on `(tenant_id, batch)` for efficient queries at scale.

## Security Considerations

Use a dedicated database connection for ledger operations. Implement atomic upserts to prevent race conditions in the central table. Soft-delete connections where appropriate.

## Related Rules

- Iterate over all connections when migrating
- Track per-connection versions in a central ledger
- Reconcile ledger with actual migration state

## Related Skills

- Orchestrate Migrations Across Multi-Tenant Databases
- Track Per-Tenant Schema Versions
- Detect and Correct Schema Drift

## Success Criteria

- All database connections are migrated to the target schema version
- Central ledger accurately reflects each connection's state
- Reconciliation detects and reports drift
- Migration fan-out handles 100+ connections with retry
- Connection pool limits are respected during parallel execution
