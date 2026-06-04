# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.26 MySQL ALGORITHM options (INPLACE, COPY, INSTANT) and LOCK options (NONE, SHARED, EXCLUSIVE, DEFAULT)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

MySQL's online DDL capability is controlled by ALGORITHM and LOCK options. ALGORITHM determines how the DDL is executed (metadata-only, in-place rebuild, or copy). LOCK controls concurrent DML access during the DDL. Choosing the correct options determines whether a migration blocks reads, blocks writes, or runs with zero application impact.

---

# Core Concepts

**ALGORITHM options**:
- `INSTANT`: Metadata-only change. No table rebuild. No DML blocking. Supported operations: adding columns (8.0.12+), dropping virtual columns, renaming columns (8.0.28+), modifying ENUM values.
- `INPLACE`: Table is rebuilt in-place. Allows concurrent DML (if LOCK=NONE) during the rebuild. Supports most ALTER operations: adding/dropping indexes, changing column types (in some cases), adding FKs.
- `COPY`: Full table copy to a temporary table. Blocks all concurrent DML (writes blocked, reads blocked during copy). Fallback for operations INPLACE can't handle.

**LOCK options**:
- `NONE`: Allows concurrent reads and writes during DDL.
- `SHARED`: Allows concurrent reads but blocks writes.
- `EXCLUSIVE`: Blocks all reads and writes.
- `DEFAULT`: MySQL chooses the least restrictive lock supported by the operation.

---

# Mental Models

ALGORITHM = how the change is executed. LOCK = how much concurrency is allowed during execution. The goal is ALGORITHM=INSTANT, LOCK=NONE for zero-impact DDL. Fall back to ALGORITHM=INPLACE, LOCK=NONE for most production operations.

---

# Internal Mechanics

- INSTANT: Only metadata changes in the data dictionary. No row format changes.
- INPLACE: MySQL rebuilds the table using an online algorithm. Changes are logged to the change buffer. Concurrent DML operations are redirected via row-logging.
- COPY: MySQL creates a temporary table with the new structure, copies all rows, swaps the table name, drops the original.

---

# Patterns

**Prefer INSTANT**: For column additions (MySQL 8.0.12+), specify `ALGORITHM=INSTANT` explicitly. If the operation doesn't support INSTANT, MySQL raises an error rather than silently falling back to INPLACE or COPY.

**INPLACE with LOCK=NONE for indexes**: Adding or dropping indexes on a live table: `ALTER TABLE ... ADD INDEX ... ALGORITHM=INPLACE LOCK=NONE`. This allows concurrent DML.

**COPY for complex ALTER**: When changing a column's type or reorganizing the table, COPY may be the only option. Schedule during maintenance windows.

---

# Architectural Decisions

| Operation | Best ALGORITHM | Best LOCK | Notes |
|-----------|---------------|-----------|-------|
| ADD COLUMN | INSTANT (8.0.12+) or INPLACE | NONE | INSTANT preferred |
| DROP COLUMN | INPLACE | NONE | Requires table rebuild |
| ADD INDEX | INPLACE | NONE | Read-only blocking during sort |
| DROP INDEX | INPLACE | NONE | Instant in most cases |
| RENAME COLUMN | INSTANT (8.0.28+) | NONE | |
| CHANGE COLUMN TYPE | COPY | EXCLUSIVE | Usually needs maintenance window |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
INSTANT: no downtime | Limited operations supported | Must know which operations are INSTANT-compatible
INPLACE LOCK=NONE: concurrent DML | Higher IO and CPU during rebuild | Monitor during execution
COPY: supports all operations | Full table copy, blocks all DML | Requires maintenance window for large tables

---

# Performance Considerations

- INPLACE operations rebuild the entire table — they read all data, sort indexes, and write the new table. Total IO is approximately 2x the table size.
- INSTANT operations have negligible performance impact.
- COPY operations require disk space for the full table copy (temporary table exists alongside original).

---

# Production Considerations

- **Explicit ALGORITHM/LOCK specification**: Laravel does not currently expose ALGORITHM/LOCK options in the Schema builder for all operations. Use raw `DB::statement()` to specify: `DB::statement('ALTER TABLE orders ADD COLUMN status INT ALGORITHM=INPLACE LOCK=NONE')`.
- **Default behavior**: Without explicit specification, MySQL uses ALGORITHM=DEFAULT LOCK=DEFAULT, which may select COPY or EXCLUSIVE for some operations.
- **Monitor during execution**: INPLACE operations show up as "altering table" in `SHOW PROCESSLIST`. Monitor progress via `performance_schema`.

---

# Common Mistakes

**Assuming INPLACE is always concurrent**: Some INPLACE operations (e.g., adding a FULLTEXT index) require a read lock during index building. Check the MySQL documentation for each operation type.

**Not specifying ALGORITHM/LOCK**: Letting MySQL choose DEFAULT may result in an unexpected table copy that blocks writes for minutes.

---

# Ecosystem Usage

Laravel's Schema builder abstracts ALGORITHM/LOCK options for most operations, but raw `DB::statement()` is required for explicit control in production migrations. The `migration:generate` command in packages like `kitloong/laravel-migrations-generator` does not emit ALGORITHM/LOCK options. MySQL 8.0.12+ users benefit from INSTANT as the default for column additions. Percona Toolkit's pt-online-schema-change internally uses INPLACE or COPY algorithms depending on the operation. Cloud providers like RDS and Cloud SQL honor ALGORITHM/LOCK options transparently.

# Failure Modes

- **Silent fallback to COPY**: Specifying ALGORITHM=DEFAULT may cause MySQL to choose COPY for an operation, holding EXCLUSIVE locks and blocking all DML. Always specify explicit ALGORITHM and LOCK in production migrations.
- **LOCK=NONE not supported**: Some operations (e.g., adding a FULLTEXT index, dropping a primary key) do not support LOCK=NONE. MySQL raises an error — the migration fails. Test on staging first.
- **Statement timeout**: INPLACE operations on large tables may exceed `innodb_lock_wait_timeout` or `max_execution_time`. Monitor long-running ALTER TABLE operations.
- **Replication lag**: INPLACE operations generate significant binlog traffic, causing replica lag on MySQL replication setups.

---

# Research Notes

Laravel's Schema builder abstracts away ALGORITHM/LOCK options, which is convenient for development but dangerous for production. Teams running MySQL 8.0+ should wrap critical production migrations in `DB::statement()` with explicit ALGORITHM=INPLACE LOCK=NONE to prevent unexpected table blocking.

## Related Knowledge Units

- **Online DDL tools**: gh-ost (GitHub Online Schema Transitions), pt-online-schema-change (Percona Toolkit) — trigger-based approaches for MySQL that replicate data to a shadow table, then swap atomically.
- **Zero-downtime migration patterns**: Expand-contract pattern, blue-green schema deployment, view-based migration (pgroll), and trigger-based migration (gh-ost). Each approach has tradeoffs in complexity, reversibility, and database compatibility.
- **Schema versioning tools**: Flyway (Java), Liquibase (Java), Sqitch (Perl/Node), and Alembic (Python) — migration management frameworks with different versioning philosophies (version-numbered, timestamped, or state-based).
- **Database locking and DDL**: MySQL lock types (metadata lock, table lock, row lock), PostgreSQL lock levels (ACCESS EXCLUSIVE, SHARE ROW EXCLUSIVE), and how they interact with DDL operations. Understanding lock escalation is essential for zero-downtime schema changes.
- **Replica-safe DDL**: Techniques for applying schema changes to replicated environments without breaking replication — including replica-first deployment, statement-based vs row-based replication considerations, and GTID-based failover safety.
