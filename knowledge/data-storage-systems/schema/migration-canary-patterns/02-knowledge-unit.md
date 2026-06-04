# Metadata

Domain: Data & Storage Systems
Subdomain: Production Schema Operations
Knowledge Unit: 11.15 Migration canary patterns (run migration on small subset first)
Difficulty Level: Expert
Last Updated: 2026-06-02

---

# Executive Summary

Canary migration: apply schema changes to a small subset of production traffic first. For multi-tenant: apply to internal tenants → low-usage tenants → high-usage tenants. For single-database: run on a read replica first, promote if successful. Canary reduces blast radius of bad migrations. Monitor error rates, latency, and replica lag during canary.

---

# Core Concepts

- **Multi-tenant canary**: Apply migration to 1% of tenants (internal/test tenants). Monitor for 15 minutes. If no errors, apply to 10%. Then 50%. Then 100%.
- **Replica canary**: Run migration on a read replica first. Verify schema, performance, and data integrity. Then run on primary during maintenance window.
- **Canary metrics**: Error rate (5xx, query exceptions), latency (P50/P99), replication lag, deadlock rate.

---

# Patterns

**Canary migration command**: `php artisan migrate:canary --connection=tenant --percentage=5`. Runs migration on randomly selected 5% of tenants. Logs results.

**Automated rollback**: Canary detects error rate increase. Automatically rolls back on canary tenants. Migration marked as failed. Not applied to remaining tenants.

---

# Common Mistakes

**No canary for significant migrations**: "I'll just run it on all tenants at once" — bad migration corrupts all data. Always canary.

---

# Related Knowledge Units

5.29 Tenant migration canary | 11.16 Testing migrations in CI
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

