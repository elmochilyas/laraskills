# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-14 Schema Version Tracking
**Generated:** 2026-06-03

---

# Decision Inventory

* Sequential vs Parallel Fan-Out for Multi-Connection Migrations
* Per-Migration vs Per-Batch Version Tracking
* Central Ledger vs Per-Connection Migration Table

---

# Architecture-Level Decision Trees

---

## Sequential vs Parallel Fan-Out for Multi-Connection Migrations

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer running migrations across multiple database connections (multi-tenant, multi-DB) must choose between sequential and parallel execution.

---

## Decision Criteria

* performance considerations: total migration time, connection pool limits
* architectural considerations: number of connections, dependency between tenants
* security considerations: isolation between tenant migrations
* maintainability considerations: error handling per connection

---

## Decision Tree

How many database connections need migration?
↓
< 20 connections → Use sequential iteration (simple, predictable)
20-100 connections → Use parallel fan-out with concurrency limit
100+ connections → Use queued fan-out (distributed, retry-capable)

---

## Rationale

Sequential migration is simplest and most predictable — each connection is processed one at a time. For 20+ connections, parallel fan-out with a concurrency limit (e.g., 5 at a time) reduces total time significantly. For 100+ connections, queued fan-out dispatches each connection's migration as a separate job, providing distributed processing, retry, and progress tracking.

---

## Recommended Default

**Default:** Sequential for small deployments, parallel for medium, queued for large
**Reason:** The overhead of parallel/queued infrastructure is only justified when migration time matters. For < 20 connections, sequential completes quickly enough. Scale up the approach as the number of connections grows.

---

## Risks Of Wrong Choice

Sequential migration of 500 connections takes hours and may exceed deployment timeouts. Parallel migration of 200 connections without limits exhausts the database connection pool.

---

## Related Rules

Iterate over all connections when migrating. Track per-connection versions in a central ledger.

---

## Related Skills

Track Schema Versions Across Multiple Database Connections

---

## Per-Migration vs Per-Batch Version Tracking

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer designing the central schema version ledger must choose the granularity of tracking: per-migration or per-batch.

---

## Decision Criteria

* performance considerations: ledger size, insert frequency
* architectural considerations: audit requirements, reconciliation needs
* security considerations: audit trail completeness
* maintainability considerations: query simplicity

---

## Decision Tree

Do you need a detailed audit trail per migration applied?
↓
YES → Use per-migration tracking (one row per migration per connection)
NO → Use per-batch tracking (one row per migrate command per connection)

---

## Rationale

Per-migration tracking records every individual migration file applied to each connection. This provides the most detailed audit trail and enables fine-grained reconciliation (compare per-migration entries between ledger and connection's migrations table). Per-batch tracking is simpler and uses less space but can mask partial failures within a batch.

---

## Recommended Default

**Default:** Per-migration tracking
**Reason:** The additional storage is negligible and the detailed audit trail is invaluable for debugging partial migration failures and reconciling drift between the ledger and actual connection state.

---

## Risks Of Wrong Choice

Per-batch tracking hides cases where some migrations in a batch succeeded and some failed. Per-migration tracking adds small overhead per migration but provides complete visibility.

---

## Related Rules

Track per-connection versions in a central ledger. Reconcile ledger with actual migration state.

---

## Related Skills

Track Schema Versions Across Multiple Database Connections

---

## Central Ledger vs Per-Connection Migration Table

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer managing many database connections must decide how to determine which connections are at which schema version.

---

## Decision Criteria

* performance considerations: querying many individual migration tables
* architectural considerations: single source of truth vs distributed state
* security considerations: ledger integrity
* maintainability considerations: reconciliation effort

---

## Decision Tree

Do you need to know the schema version of all connections without querying each one?
↓
YES → Use central ledger (tenant_schema_versions table) + per-connection tables
NO → Is this a single-DB deployment?
    YES → Use MySQL's built-in migrations table only
    NO → Use central ledger

---

## Rationale

Each connection's own `migrations` table is the source of truth for that connection. The central ledger provides a unified view across all connections without querying each one individually. For single-DB deployments, the built-in `migrations` table is sufficient. For multi-tenant or multi-DB architectures, the central ledger is essential for tracking per-connection progress.

---

## Recommended Default

**Default:** Central ledger for multi-connection, per-connection table only for single DB
**Reason:** The central ledger is necessary when you have more than a few connections — querying each connection's migration table to determine system-wide progress is impractical at scale.

---

## Risks Of Wrong Choice

No central ledger makes it impossible to determine which connections have been migrated without querying each one individually. Central ledger without per-connection tables loses the per-connection migration history.

---

## Related Rules

Iterate over all connections when migrating. Track per-connection versions in a central ledger.

---

## Related Skills

Track Schema Versions Across Multiple Database Connections
