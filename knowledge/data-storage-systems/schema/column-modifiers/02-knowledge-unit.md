# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.3 Column modifiers (nullable, default, after, comment, charset, collation, autoIncrement, unsigned, virtual/stored generated)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Column modifiers in Laravel migrations specify additional column attributes beyond type. They control nullability, default values, column ordering, character set, collation, auto-increment behavior, unsigned constraints, and generated columns. Modifiers encode business rules at the schema level and directly affect data integrity, storage efficiency, and query performance.

---

# Core Concepts

- **nullable()**: Allows NULL values in the column. Required for optional relationships and data that may not exist at creation time.
- **default($value)**: Sets a database-level default applied when no value is provided during INSERT.
- **after('column')**: MySQL-specific. Positions the new column after an existing column in the physical table layout.
- **comment('text')**: Adds a column comment visible in database tools — useful for documenting business meaning.
- **charset('utf8mb4') / collation('utf8mb4_unicode_ci')**: Override table-level character set and collation for specific columns.
- **autoIncrement()**: Makes the column auto-incrementing (typically used on primary keys).
- **unsigned()**: Restricts integer columns to non-negative values (doubles the positive range).
- **virtualAs() / storedAs()**: Generated columns computed from other column expressions. Virtual computed on read, stored computed on write.

---

# Mental Models

Modifiers are constraints and metadata applied at the column level. NULL == unknown/missing, not empty. DEFAULT is a fallback, not a validation. After/original position affects physical row layout only in MySQL.

---

# Internal Mechanics

- **nullable()** generates `NULL` (default in SQL) vs `NOT NULL`. In MySQL, NULL columns use an additional byte per row in the NULL bitmap.
- **default()** is expressed in the DDL as `DEFAULT value`. PostgreSQL 11+ can add `DEFAULT` to new columns as a metadata-only operation (no table rewrite).
- **generated columns**: `virtualAs()` computes on read (no storage), `storedAs()` persists to disk (mirroring the expression). Generated columns can be indexed, enabling efficient querying of derived data (e.g., JSON path extraction).
- **Modifier persistence during changes**: When using `->change()`, all modifiers must be explicitly specified — omitted modifiers revert to defaults, which may drop `nullable` or change `default`.

---

# Patterns

**NOT NULL with default for required columns**: Prevents insertion failures by providing a sensible default while enforcing non-null at the database level.

**DEFAULT for migration safety**: When adding a column to an existing table, `nullable()` or a `default()` prevents the migration from failing on existing rows (which would otherwise trigger a NOT NULL violation).

**virtualAs for JSON indexing**: `$table->string('zip_code')->virtualAs('data->>"$.zip"')->index()` enables indexed searches on JSON fields without a separate table.

---

# Architectural Decisions

| Decision | When | When Not |
|----------|------|----------|
| nullable() for new columns | Zero-downtime migrations, optional data | Business-required fields |
| storedAs() | Frequently queried derived data, warehousing | Infrequent reads, write-heavy tables |
| unsigned() | FK columns, counters, IDs | Signed use cases (negative balances tracked) |
| after() | MySQL tables where column order matters for ORM clarity | PostgreSQL (column order is irrelevant) |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
default() prevents null insertion | May mask missing application logic | Silent defaults replace explicit validation
virtualAs() no storage cost | Computed on every read | Performance impact on frequent reads
storedAs() indexed queries | Storage cost, write amplification | Faster reads at write expense

---

# Performance Considerations

- `nullable` columns have a per-row NULL bitmap overhead in MySQL (1 bit per nullable column, rounded to nearest byte).
- `storedAs()` generated columns add write cost — the expression is evaluated and stored on every INSERT/UPDATE.
- `virtualAs()` generated columns add read cost — the expression is evaluated on every SELECT that references the column.
- `after()` does not affect query performance; it only changes physical layout in MySQL for tools that read INFORMATION_SCHEMA.

---

# Production Considerations

- Modifying a column's modifiers via `->change()` in MySQL acquires a table lock — test with production-scale data first.
- Adding `NOT NULL` to a column that contains NULLs in production fails — backfill data in a separate step before adding the constraint.
- `after()` positioning is MySQL-only and ignored by other databases — don't rely on it for query optimization.

---

# Common Mistakes

**Omitting modifiers during ->change()**: `$table->string('name')->nullable()->change();` — if the original column had `default('')`, the default is dropped because it wasn't included in the change call. All existing modifiers must be re-specified.

**NOT NULL on add without default**: Adding a `NOT NULL` column to a table with existing rows fails immediately because existing rows have no value. Use `nullable()` or `default()` and backfill later.

---

# Failure Modes

- **Default value type mismatch**: `$table->boolean('active')->default('yes')` — MySQL silently coerces 'yes' to 0. No error, wrong semantics.
- **Generated column expression error**: `virtualAs('non_existent + 1')` — fails at migration time, not at query time, but complex expressions may be accepted and fail at read time.
- **Character set mismatch**: Setting `charset('utf8mb4')` on a column with `collation('utf8mb4_unicode_ci')` that conflicts with the connection charset causes implicit conversion overhead.

---

# Ecosystem Usage

Laravel's migration generator uses `nullable()` for `softDeletes()` and `timestamps()` (`created_at` and `updated_at` are nullable). Spatie media-library uses `nullable()` for model relationships. Nova uses generated columns read from schema metadata.

---

# Related Knowledge Units

1.2 Blueprint column types | 1.4 Foreign key definition | 12.39 Generated columns (PostgreSQL) | 13.14 Generated columns (MySQL)

---

# Research Notes

The most common silent production bug from modifiers is the `->change()` modifier drop — teams add a modifier without re-specifying existing ones, causing defaults to disappear and nullable constraints to be added. The `virtualAs()` pattern for JSON indexing is the most practical generated column use case in Laravel.
