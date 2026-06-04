# Metadata

Domain: Data & Storage Systems
Subdomain: Schema Design & Migration Engineering
Knowledge Unit: 1.5 Index definition via migrations (index, unique, primary, fullText, spatial)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Indexes in Laravel migrations are defined using Blueprint methods that generate database-specific DDL. The five index types — `index`, `unique`, `primary`, `fullText`, `spatial` — serve different query optimization purposes. Defining indexes at migration time is the correct point to design the physical data access path, not after queries become slow in production.

---

# Core Concepts

- **index()**: Standard B-tree index. Use for columns frequently used in WHERE, JOIN, ORDER BY.
- **unique()**: Enforces uniqueness while providing index benefits. Automatically creates a B-tree index constraint.
- **primary()**: Typically handled by `id()` or `bigIncrements()`. Creates the clustered index (InnoDB) or primary key constraint.
- **fullText()**: Specialized index for full-text search (MySQL FULLTEXT, PostgreSQL GIN tsvector).
- **spatial()**: R-Tree index (MySQL) or GiST index (PostgreSQL) for spatial/GIS data.

---

# Mental Models

Indexes are data structures that trade write speed for read speed. An index is a sorted copy of a subset of table data that allows the database to find rows without scanning the entire table. Each index type optimizes for different query patterns.

---

# Internal Mechanics

- **index()** creates a B-tree by default (MySQL, PostgreSQL). B-trees support equality and range queries, prefix matching for LIKE, and ordered scans.
- **unique()** creates a B-tree with a uniqueness constraint. In MySQL, NULL values are considered distinct (multiple NULLs allowed). PostgreSQL 15+ can override this with `NULLS NOT DISTINCT`.
- **fullText()** in MySQL creates an inverted index (word -> document mapping). In PostgreSQL, it requires a GIN index on a tsvector column.
- **spatial()** in MySQL creates an R-Tree index. In PostgreSQL, spatial indexing requires a GiST index (created via raw SQL or package).

---

# Patterns

**Composite indexes for multi-column queries**: `$table->index(['status', 'created_at'])` handles queries filtering by both columns. Single-column indexes on each column do not provide the same optimization.

**Unique indexes for business rules**: `$table->unique(['email', 'tenant_id'])` enforces a business rule (unique email per tenant) at the database level, preventing race conditions in application-level checks.

**FullText indexes for text search**: `$table->fullText('body')` enables MySQL's MATCH...AGAINST queries. For PostgreSQL, use raw SQL to create a GIN tsvector index.

---

# Architectural Decisions

| Index Type | Best For | Avoid When |
|-----------|----------|------------|
| index() | General WHERE/JOIN/ORDER BY | Columns updated frequently (write amplification) |
| unique() | Business-unique constraints (email, slug) | Data that is not inherently unique |
| fullText() | Natural language search on text columns | Small tables (table scan is cheaper) |
| spatial() | Geographic queries (proximity, containment) | Non-spatial data (use standard indexes) |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Index on FK prevents table scans | Each index adds write overhead | INSERT/UPDATE/DELETE slower with more indexes
Unique index prevents data corruption | Insert failures for legitimate duplicates | Application must handle duplicate exceptions
FullText enables efficient text search | Index size can exceed data size for text-heavy columns | Storage planning required

---

# Performance Considerations

- Every index adds write amplification: each INSERT must update all indexes on the table.
- Indexes consume disk space and memory (buffer pool / shared buffers).
- FullText indexes are large — evaluate whether the search use case justifies the storage cost.
- Unique indexes on large or frequently written tables add constraint-check overhead.

---

# Production Considerations

- Adding an index to a large table in MySQL locks the table. Use concurrent index creation (PostgreSQL `CONCURRENTLY`, MySQL `ALGORITHM=INPLACE LOCK=NONE`).
- Index name collisions: Laravel auto-generates names like `table_column_index`. Explicit naming prevents conflicts: `$table->index(['a', 'b'], 'custom_index_name')`.
- Drop indexes before dropping columns — some databases error if you drop an indexed column.

---

# Common Mistakes

**Foreign key without index**: `$table->foreignId('user_id')` without `->constrained()` or `->index()`. The FK constraint exists, but the column is not indexed, causing full table scans on joins.

**Redundant indexes**: Creating both `unique('email')` and `index('email')` — the unique index already provides index functionality. The second index is redundant.

**FullText on small tables**: On tables with < 1000 rows, a full table scan is cheaper than a FullText index lookup. Only add FullText when the table size justifies it.

---

# Failure Modes

- **Unique constraint violation in production**: Application attempts to insert a duplicate that passed application-level validation (race condition under concurrent requests). Application must handle `QueryException` with error code 1062 (MySQL) or 23505 (PostgreSQL).
- **FullText index not supporting the query**: MySQL's FullText index only supports `MATCH...AGAINST` syntax. Regular `LIKE` queries do not use it.

---

# Ecosystem Usage

Laravel's `constrained()` automatically adds an index. `tpetry/laravel-postgresql-enhanced` adds support for partial and expression indexes in migrations. Scout integrates FullText search through dedicated search engines.

---

# Related Knowledge Units

3.1 B-Tree index structure | 3.8 Composite/compound indexes | 3.13 Full-text indexes | 3.20 Concurrent index creation | 3.21 Index management in Laravel migrations

---

# Research Notes

The single most impactful index pattern in Laravel apps is replacing three individual indexes on `(tenant_id)`, `(status)`, `(created_at)` with one composite `(tenant_id, status, created_at)`. This is the most common production optimization fix across team codebases.
