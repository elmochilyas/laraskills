# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.27 Online index creation in PostgreSQL/SQL Server (.online() modifier)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

PostgreSQL supports creating indexes without blocking writes via the `CONCURRENTLY` option. SQL Server supports similar online index operations. Laravel exposes this via the `.online()` modifier on index creation for SQL Server, but for PostgreSQL, it requires raw SQL. Online index creation prevents DDL from locking tables for writes during index building — critical for production environments with 24/7 traffic.

---

# Core Concepts

- **PostgreSQL CONCURRENTLY**: `CREATE INDEX CONCURRENTLY` builds the index in the background while allowing concurrent inserts, updates, and deletes. Takes longer but doesn't block writes.
- **PostgreSQL limitation**: `CONCURRENTLY` cannot be run inside a transaction. Each migration using `CONCURRENTLY` must be the only operation in its migration file.
- **Laravel SQL Server .online()**: `$table->index('column')->online()` for SQL Server online index creation.
- **Tradeoff**: Online index creation takes 2-3x longer than standard index creation but avoids write blocking.

---

# Mental Models

Online index creation trades speed for availability. The index build runs as a background process, reading the table and writing index entries while application writes continue. The database handles the concurrency coordination.

---

# Internal Mechanics

- PostgreSQL: `CREATE INDEX CONCURRENTLY` launches a background worker that performs a table scan, builds the index, and waits for all concurrent transactions to complete before finalizing.
- The index is not available for queries until the build completes.
- If the build is interrupted, the index remains in an invalid state and must be dropped.

---

# Patterns

**Use CONCURRENTLY for indexes on large tables**: Any table with > 10M rows that is actively written to should use CONCURRENTLY. The default index creation blocks writes for the entire duration.

**Single-migration for CONCURRENTLY**: Since CONCURRENTLY can't run inside a transaction, the migration must use raw SQL: `DB::statement('CREATE INDEX CONCURRENTLY ...')`. The migration must be the only operation.

**Multiple CONCURRENTLY indexes**: Each index requires its own migration because CONCURRENTLY can't run inside a transaction, and multiple CONCURRENTLY statements in the same transaction would all fail.

---

# Architectural Decisions

| Index Context | Create Method | When |
|--------------|--------------|------|
| Small table (< 1M rows) | Standard index | Fast enough, lock duration is short |
| Large table (> 1M rows), low traffic | Standard index | Lock duration acceptable |
| Large table, 24/7 traffic | CONCURRENTLY | Required for zero-downtime |
| During maintenance window | Standard index | Simpler, faster |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
No write blocking during index creation | 2-3x longer build time | Index takes longer to become available
Safe for 24/7 production | Cannot run inside a transaction | Requires separate migration
No DDL lock conflicts | Invalid index on failure | Must manually clean up if interrupted

---

# Performance Considerations

- CONCURRENTLY reads the table without blocking writes, but the additional IO may slow write operations slightly.
- Index build process competes with application queries for CPU and memory.
- The `maintenance_work_mem` setting in PostgreSQL affects CONCURRENTLY index build speed.

---

# Production Considerations

- **Vacuum considerations**: After CONCURRENTLY index creation, run `ANALYZE` to update statistics for the query planner to use the new index.
- **Failure cleanup**: If a CONCURRENTLY operation fails (e.g., out of disk space), the index exists in an `INVALID` state. Query it via `SELECT * FROM pg_class` to find and drop invalid indexes.
- **Disk space**: CONCURRENTLY index creation requires additional disk space for the index sort file.

---

# Common Mistakes

**Running CONCURRENTLY inside a transaction**: PostgreSQL prohibits this. The migration must use raw `DB::statement()` outside any transaction wrapper.

**Multiple CONCURRENTLY operations in one migration**: Two `CREATE INDEX CONCURRENTLY` statements in one migration. Each triggers an implicit commit, but the second fails because there's no active transaction for its commit context.

**Not cleaning up invalid indexes**: A failed CONCURRENTLY operation leaves an invalid index that must be dropped before retrying.

---

# Failure Modes

- **Invalid index state**: A failed CONCURRENTLY build leaves the index in `INVALID` state. It takes up space but is not used.
- **Exclusive lock conflict**: The finalization phase of CONCURRENTLY requires a brief SHARE UPDATE EXCLUSIVE lock. Long-running transactions can block this, causing the CONCURRENTLY build to wait.

---

# Related Knowledge Units

3.20 Concurrent index creation | 1.26 MySQL ALGORITHM options | 3.1 B-Tree index structure

---

# Ecosystem Usage

Laravel applications using PostgreSQL for production workloads increasingly rely on `CREATE INDEX CONCURRENTLY` for zero-downtime index operations. The `tpetry/laravel-postgresql-enhanced` package provides a `Schema::concurrently()` builder method. For SQL Server deployments, Laravel's native `.online()` modifier exposes this functionality directly. GitHub, GitLab, and other large-scale Rails/Laravel deployments use concurrent index creation as part of their standard migration workflow. Managed PostgreSQL providers like RDS, Cloud SQL, and Azure Database for PostgreSQL all support CONCURRENTLY natively.

# Research Notes

PostgreSQL's CONCURRENTLY is the gold standard for production index creation. The main operational difficulty is the single-statement-per-migration requirement. Teams should create a helper or use packages like `tpetry/laravel-postgresql-enhanced` to handle this cleanly.
