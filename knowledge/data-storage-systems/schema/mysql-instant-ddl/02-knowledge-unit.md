# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.16 MySQL instant DDL (ALGORITHM=INSTANT, 64-version limit)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

MySQL 8.0.12 introduced `ALGORITHM=INSTANT` for DDL operations, enabling certain schema changes (primarily adding columns) to be performed as metadata-only operations — no table copy, no significant lock duration. However, each table has a 64-version limit on INSTANT operations, after which it must use INPLACE or COPY. Understanding INSTANT DDL is critical for zero-downtime migration strategies in MySQL-based Laravel applications.

---

# Core Concepts

- **INSTANT operations**: Add columns (8.0.12+), add/drop virtual columns, add/drop/alter column defaults, rename column (8.0.28+), modify column ENUM values.
- **No table rebuild**: INSTANT modifies only metadata. The operation completes in milliseconds regardless of table size.
- **64-version limit**: Each INSTANT operation increments an internal version counter. After 64, further DDL must use INPLACE or COPY.
- **Row format**: INSTANT operations use the "instant" row format, which stores version information per row.

---

# Mental Models

INSTANT DDL is a schema versioning system inside MySQL. Each INSTANT operation adds a version tag. Old rows are stored in the format of their creation version; new versions are stored in the current format. MySQL handles reading rows from multiple versions transparently.

---

# Internal Mechanics

- MySQL maintains an internal version number per table.
- INSTANT operations add new column definitions to metadata but don't physically add storage for them.
- When a row is read, MySQL checks its version. If the row lacks a column added by a later version, MySQL returns NULL for that column.
- When a row is updated, it is rewritten in the current version format.
- After 64 INSTANT operations, the table requires a physical rebuild (INPLACE or COPY) before further INSTANT operations.

---

# Patterns

**Prefer INSTANT for column additions**: For MySQL 8.0.12+, adding a column should always use INSTANT when possible. Use raw SQL: `ALTER TABLE table ADD COLUMN col type ALGORITHM=INSTANT`.

**Track INSTANT version count**: Monitor `information_schema.INNODB_TABLES.TOTAL_ROW_VERSIONS` to know how many INSTANT operations remain.

**Use INPLACE for column drops**: Column drops cannot use INSTANT — use ALGORITHM=INPLACE, LOCK=NONE.

---

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| ALGORITHM=INSTANT | Adding columns, renaming (8.0.28+) | Dropping columns, adjusting indexes, changing types |
| ALGORITHM=INPLACE | Index operations, column drops | Operations that require full rebuild (some type changes) |
| ALGORITHM=COPY | Last resort (blocks DML) | Any production environment |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Millisecond completion for column additions | 64-version limit per table | Requires periodic INPLACE rebuilds
No application downtime | Row version overhead | Slightly larger row storage
No table lock during operation | Cannot perform on all DDL types | Must fall back to INPLACE for complex changes

---

# Performance Considerations

- INSTANT operations are effectively free (metadata-only).
- Rows with mixed versions may have slightly higher read overhead.
- After 64 INSTANT operations, a physical rebuild is forced. Plan for this by scheduling periodic rebuilds.

---

# Production Considerations

- **Monitor version count**: Alert when a table approaches the 64-INSTANT limit.
- **NOT in MySQL 5.7 or MariaDB**: INSTANT is MySQL 8.0.12+ only.
- **Not compatible with all ROW_FORMATs**: Some formats may block INSTANT. Verify before assuming INSTANT availability.

---

# Common Mistakes

**Assuming INSTANT works for all DDL**: Many operations (column drop, index change, column type change) cannot use INSTANT.

**Hitting the 64-version limit**: A frequently-migrated table hits the limit. Subsequent migrations that assume INSTANT fail and fall back to INPLACE (which may hold locks).

---

# Ecosystem Usage

MySQL INSTANT DDL is the preferred method for adding columns in MySQL 8.0.12+ Laravel deployments. Managed MySQL providers (RDS, Cloud SQL, Azure Database for MySQL) all support INSTANT transparently. The `gh-ost` tool (and its successor Spirit) automatically attempt INSTANT DDL before falling back to row-copying — a feature contributed by the same team that built Spirit. PlanetScale/Vitess also leverage INSTANT DDL for non-blocking schema changes. MariaDB does not support ALGORITHM=INSTANT, making Laravel applications targeting both MySQL and MariaDB require separate migration strategies.

# Failure Modes

- **64-version limit exceeded**: A table undergoing frequent column additions (common in CI/CD-heavy deployments) exhausts its 64 INSTANT operations. Further DDL fails with error 4080. Track via `INFORMATION_SCHEMA.INNODB_TABLES.TOTAL_ROW_VERSIONS` and schedule a rebuild.
- **INSTANT not supported for operation**: Attempting INSTANT on an unsupported operation (DROP COLUMN, index changes) raises error 1845. Always verify operation support before relying on INSTANT.
- **Incompatible ROW_FORMAT**: Tables using COMPRESSED or REDUNDANT row formats may not support INSTANT. Verify with `SHOW TABLE STATUS`.
- **Replication incompatibility**: Some INSTANT operations on source may cause replication errors on replicas running older MySQL versions. Ensure all replicas are on MySQL 8.0.12+.
- **Foreign key tables**: Tables involved in foreign key relationships have additional restrictions on INSTANT operations. Test thoroughly.

---

# Research Notes

INSTANT DDL significantly reduces the risk of column additions for MySQL 8.0+ users. The 64-version limit is the primary operational concern — teams should track version counts and schedule rebuilds proactively. For most Laravel applications, INSTANT is the safest way to add columns in production.

## Related Knowledge Units

- **Online DDL tools**: gh-ost (GitHub Online Schema Transitions), pt-online-schema-change (Percona Toolkit) — trigger-based approaches for MySQL that replicate data to a shadow table, then swap atomically.
- **Zero-downtime migration patterns**: Expand-contract pattern, blue-green schema deployment, view-based migration (pgroll), and trigger-based migration (gh-ost). Each approach has tradeoffs in complexity, reversibility, and database compatibility.
- **Schema versioning tools**: Flyway (Java), Liquibase (Java), Sqitch (Perl/Node), and Alembic (Python) — migration management frameworks with different versioning philosophies (version-numbered, timestamped, or state-based).
- **Database locking and DDL**: MySQL lock types (metadata lock, table lock, row lock), PostgreSQL lock levels (ACCESS EXCLUSIVE, SHARE ROW EXCLUSIVE), and how they interact with DDL operations. Understanding lock escalation is essential for zero-downtime schema changes.
- **Replica-safe DDL**: Techniques for applying schema changes to replicated environments without breaking replication — including replica-first deployment, statement-based vs row-based replication considerations, and GTID-based failover safety.
