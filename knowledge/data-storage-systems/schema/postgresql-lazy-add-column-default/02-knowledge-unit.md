# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.17 PostgreSQL lazy ADD COLUMN DEFAULT (PostgreSQL 11+)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Since PostgreSQL 11, `ALTER TABLE ... ADD COLUMN ... DEFAULT (non-volatile)` is a metadata-only operation that does not rewrite the table. Pre-11, PostgreSQL had to rewrite every row to store the default value. This change makes adding columns with defaults to large PostgreSQL tables essentially instant (milliseconds, regardless of table size). This is one of PostgreSQL's most important zero-downtime DDL features.

---

# Core Concepts

- **Metadata-only operation**: The column definition and default value are stored in the catalog. Existing rows return the default value on read without physical storage.
- **Non-volatile requirement**: Only works with immutable expressions (constants, `NOW()` is considered stable, not immutable in older versions). Volatile defaults (random, clock_timestamp) still require a table rewrite.
- **No NULL storage**: If the column is NOT NULL with a DEFAULT, existing rows don't store the value — it's computed on read from the catalog default.
- **NULL behavior**: If the column is nullable with no DEFAULT, existing rows implicitly have NULL. No rewrite needed.

---

# Mental Models

Think of column defaults as metadata annotations that the query planner resolves lazily. PostgreSQL stores the default once in the catalog, not once per row. This is schema-as-code, not schema-as-data.

---

# Internal Mechanics

- New column metadata is written to `pg_attribute`.
- Default value is stored in `pg_attrdef`.
- On SELECT, if a row lacks the physical column value, PostgreSQL checks the catalog default and returns it.
- Subsequent UPDATEs to the row materialize the value physically.
- `ALTER TABLE ... ALTER COLUMN ... DROP DEFAULT` is also metadata-only and instant.

---

# Patterns

**Add nullable column first, then set NOT NULL**: `ALTER TABLE ADD COLUMN IF NOT EXISTS slug text;` then backfill, then `ALTER TABLE ALTER COLUMN slug SET NOT NULL;`. The NOT NULL change requires a full table scan (validation).

**Add non-nullable column with default**: `ALTER TABLE ADD COLUMN created_by bigint NOT NULL DEFAULT 0;` — instant in PG 11+, no rewrite. The default ensures existing rows have a value.

---

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| ADD COLUMN with DEFAULT | PostgreSQL 11+, migration to production tables | Adding with volatile default (needs rewrite) |
| ADD COLUMN nullable, no default | Adding columns where NULL is semantically valid | Columns that require immediate NOT NULL enforcement |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Instant addition regardless of table size | Default value stored in catalog, not in row | Slightly slower reads for existing rows (catalog lookup)
No table lock during operation | Only applies to non-volatile defaults | Volatile defaults still require full rewrite
Reduced storage compared to pre-11 | Column metadata persists in catalog even after default is dropped | Minimal overhead

---

# Performance Considerations

- Read performance for existing rows fetching the new column is slightly slower (catalog lookup), but the overhead is negligible.
- After enough UPDATE operations rewrite all rows, the catalog default is no longer needed (the value is physically stored).
- The initial addition is O(1) regardless of table size.

---

# Production Considerations

- **Only non-volatile defaults**: `NOW()` is stable, not immutable, in some PostgreSQL versions — test before relying on it for instant addition.
- **NOT NULL after default**: Setting NOT NULL after adding the column validates ALL rows — this is a full table scan and holds ACCESS EXCLUSIVE lock briefly.
- **Dropping default**: `ALTER TABLE ... ALTER COLUMN ... DROP DEFAULT` is also instant.

---

# Common Mistakes

**Adding column with volatile default**: `ALTER TABLE ADD COLUMN random_id uuid DEFAULT gen_random_uuid()` — this is a volatile default and will rewrite the entire table.

**Assuming add-column is always instant**: Adding without DEFAULT or with NULL is instant. Adding any column with any default was NOT instant in PostgreSQL < 11.

---

# Ecosystem Usage

PostgreSQL's lazy ADD COLUMN DEFAULT (PG 11+) is one of the most impactful DDL improvements for production Laravel deployments. Cloud providers (RDS, Cloud SQL, Azure Database for PostgreSQL, Supabase) all support this transparently on PostgreSQL 11+. The pgroll tool leverages this feature for its view-based zero-downtime migrations. Laravel teams migrating from MySQL to PostgreSQL often notice that adding columns with defaults is significantly safer on PostgreSQL due to this metadata-only approach. The feature is particularly valuable for multi-tenant schemas where adding columns to hundreds of databases must be fast.

# Failure Modes

- **Volatile default triggers rewrite**: Using `gen_random_uuid()`, `clock_timestamp()`, or `random()` as the column default forces a full table rewrite, negating the performance benefit. Always test default volatility with `SELECT pg_get_expr(adbin, adrelid) FROM pg_attrdef`.
- **NOT NULL validation table scan**: Adding a column as NOT NULL with a default is metadata-only, but setting NOT NULL on an existing nullable column requires a full table scan with ACCESS EXCLUSIVE lock.
- **Catalog bloat**: Frequent add/drop default operations can accumulate catalog entries. Monitor `pg_attrdef` size in high-frequency migration environments.
- **Replication delay**: While the DDL itself is instant, the catalog update replicates as a DDL statement that may cause brief replication queue stalls.
- **Version incompatibility**: If a physical standby runs PostgreSQL < 11, the metadata-only DDL is not supported and replication fails.

---

# Research Notes

This is one of PostgreSQL 11's most impactful DDL improvements for production operations. Many Laravel teams still pre-rewrite data unnecessarily because they're unaware of this capability. Combined with concurrent index creation, PostgreSQL provides the best zero-downtime DDL story among major databases.

## Related Knowledge Units

- **Online DDL tools**: gh-ost (GitHub Online Schema Transitions), pt-online-schema-change (Percona Toolkit) — trigger-based approaches for MySQL that replicate data to a shadow table, then swap atomically.
- **Zero-downtime migration patterns**: Expand-contract pattern, blue-green schema deployment, view-based migration (pgroll), and trigger-based migration (gh-ost). Each approach has tradeoffs in complexity, reversibility, and database compatibility.
- **Schema versioning tools**: Flyway (Java), Liquibase (Java), Sqitch (Perl/Node), and Alembic (Python) — migration management frameworks with different versioning philosophies (version-numbered, timestamped, or state-based).
- **Database locking and DDL**: MySQL lock types (metadata lock, table lock, row lock), PostgreSQL lock levels (ACCESS EXCLUSIVE, SHARE ROW EXCLUSIVE), and how they interact with DDL operations. Understanding lock escalation is essential for zero-downtime schema changes.
- **Replica-safe DDL**: Techniques for applying schema changes to replicated environments without breaking replication — including replica-first deployment, statement-based vs row-based replication considerations, and GTID-based failover safety.
