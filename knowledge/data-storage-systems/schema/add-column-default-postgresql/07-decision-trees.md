# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-7 Add Column Default Postgresql
**Generated:** 2026-06-03

---

# Decision Inventory

* Metadata-Only vs Table Rewrite for Column Addition
* Add with Default vs Add Nullable Column First
* NOT VALID + VALIDATE vs Simple SET NOT NULL

---

# Architecture-Level Decision Trees

---

## Metadata-Only vs Table Rewrite for Column Addition

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer adding a column to a PostgreSQL table must determine whether the operation will be metadata-only (instant) or require a full table rewrite (hours on large tables).

---

## Decision Criteria

* performance considerations: execution time, IO impact, table size
* architectural considerations: PostgreSQL version, default expression volatility
* security considerations: no direct impact
* maintainability considerations: deployment timing, lock duration

---

## Decision Tree

Is the default expression non-volatile (constant or immutable)?
↓
YES → Use metadata-only ADD COLUMN (instant, PostgreSQL 11+)
NO → Is the table small enough for a maintenance window lock?
    YES → Use ALTER TABLE with volatile default (full rewrite)
    NO → Use expand-contract pattern (no default during add, backfill later)

---

## Rationale

PostgreSQL 11+ treats ADD COLUMN with a non-volatile default as metadata-only: the default is stored in the catalog, not written to rows. This takes milliseconds regardless of table size. Volatile defaults (random(), gen_random_uuid(), clock_timestamp()) force a full table rewrite. For large tables where a rewrite is unacceptable, the expand-contract pattern avoids the lock by adding without default and backfilling separately.

---

## Recommended Default

**Default:** Use non-volatile defaults for metadata-only ADD COLUMN
**Reason:** Adding a column with a constant default (0, false, 'pending') is instant on PostgreSQL 11+. This is the zero-downtime default. Only use volatile defaults when the application genuinely requires a per-row unique value at creation time.

---

## Risks Of Wrong Choice

Volatile default on a large production table causes hours of exclusive lock, blocking all writes. Non-volatile default where a volatile one is needed will assign the same value to all existing rows.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Add Columns with Defaults on PostgreSQL 11+ for Zero Downtime

---

## Add with Default vs Add Nullable Column First

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer adding a column to an existing table must decide whether to provide a default value immediately or add the column as nullable and fill it later.

---

## Decision Criteria

* performance considerations: instant ADD vs backfill overhead
* architectural considerations: NOT NULL requirements, application compatibility
* security considerations: data integrity during transition
* maintainability considerations: backfill complexity, migration phases

---

## Decision Tree

Does a sensible constant default exist for this column?
↓
YES → Add column with default (instant, data ready immediately)
NO → Add column as nullable, then backfill, then add NOT NULL

---

## Rationale

Adding with a constant default is instant and makes the new column immediately usable. Adding as nullable requires a separate backfill phase and a subsequent NOT NULL constraint addition. The nullable approach is more work but is necessary when there is no sensible default value (e.g., a computed value derived from other columns) or when the default must be backfilled from application logic.

---

## Recommended Default

**Default:** Add column with a non-volatile default
**Reason:** It's instant, provides immediate data consistency, and avoids a separate backfill job. Only use the nullable approach when no sensible default exists.

---

## Risks Of Wrong Choice

Defaulting to 0 or empty string when no sensible default exists creates data quality issues. Adding as nullable without a plan to backfill leaves columns permanently NULL.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Add Columns with Defaults on PostgreSQL 11+ for Zero Downtime

---

## NOT VALID + VALIDATE vs Simple SET NOT NULL

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer needs to add a NOT NULL constraint to an existing column and must choose between the safe multi-step approach and a direct ALTER.

---

## Decision Criteria

* performance considerations: table scan duration, lock type
* architectural considerations: PostgreSQL version (11+ for NOT VALID)
* security considerations: data integrity, constraint enforcement
* maintainability considerations: migration steps, monitoring

---

## Decision Tree

Is the table large (> 1M rows) and in active production use?
↓
YES → Use NOT VALID + VALIDATE (SHARE UPDATE EXCLUSIVE lock, no write blocking)
NO → Use simple SET NOT NULL (ACCESS EXCLUSIVE lock, brief on small tables)

---

## Rationale

Simple `SET NOT NULL` requires ACCESS EXCLUSIVE lock and scans the entire table — blocking all writes for the scan duration. The NOT VALID + VALIDATE approach adds the constraint first without validating existing rows (metadata-only, instant), then validates with `VALIDATE CONSTRAINT` which only holds SHARE UPDATE EXCLUSIVE lock (allows concurrent writes). For large tables, this is the difference between hours of downtime and zero downtime.

---

## Recommended Default

**Default:** NOT VALID + VALIDATE pattern
**Reason:** This pattern provides zero-downtime NOT NULL enforcement regardless of table size. The additional step is minimal effort for significant safety gain. Use simple SET NOT NULL only for tables where a brief exclusive lock is acceptable.

---

## Risks Of Wrong Choice

Simple SET NOT NULL on a large production table blocks all writes for minutes or hours. NOT VALID + VALIDATE on a table with NULL values will pass the constraint at add time but fail at VALIDATE time.

---

## Related Rules

Always test ALL migrations on a production-scale staging database before deploying.

---

## Related Skills

Add Columns with Defaults on PostgreSQL 11+ for Zero Downtime
