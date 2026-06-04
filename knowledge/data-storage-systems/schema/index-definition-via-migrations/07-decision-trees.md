# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-5 Index Definition Via Migrations
**Generated:** 2026-06-03

---

# Decision Inventory

* Index type selection (index vs unique vs fullText vs spatial)
* Single-column vs composite indexes
* Index timing: migration time vs production

---

# Architecture-Level Decision Trees

---

## Index Type Selection

---

## Decision Context

Choosing the correct index type for the query pattern, balancing read performance against write amplification.

---

## Decision Criteria

* performance: each index adds write amplification on every INSERT/UPDATE
* architectural: fullText indexes are large; spatial indexes require specific data types
* maintainability: indexes cannot be changed — must drop and recreate
* security: unique indexes enforce data integrity at the DB level

---

## Decision Tree

Adding an index to a column or set of columns?
↓
Does the column need value uniqueness enforced?
YES → Use unique()
    ↓
    Is uniqueness scoped (e.g., unique email per tenant)?
    YES → Unique composite: $table->unique(['email', 'tenant_id'])
    NO → Single column unique
NO → Is this for full-text search (MATCH...AGAINST or tsvector)?
    YES → Use fullText()
    ↓
    Is the table small (< 1000 rows)?
    YES → Skip index — table scan is cheaper
    NO → Add fullText index
NO → Is this for spatial/GIS queries?
    YES → Use spatial()
    NO → Is this for general WHERE/JOIN/ORDER BY?
        YES → Use index()
            ↓
            Is it a single column?
            YES → $table->index('col')
            NO → Is it a multi-column query?
                → $table->index(['col1', 'col2', 'col3'])
                → Order by selectivity (most selective first)

---

## Rationale

Index types are specialized for different query patterns. Using the wrong type (e.g., fullText for exact lookup) wastes resources. Composite indexes must match the query's column order (leftmost prefix rule). Unique indexes serve dual purpose: constraint enforcement AND query optimization.

---

## Recommended Default

**Default:** index() for general WHERE/JOIN/ORDER BY, unique() for business-unique columns
**Reason:** B-tree indexes cover the widest range of query patterns. Unique indexes add constraint enforcement at no extra storage cost.

---

## Risks Of Wrong Choice

* Redundant indexes: unique + index on same column wastes storage
* FullText on small tables: table scan is cheaper than index lookup
* Missing composite index: single-column indexes don't optimize multi-column queries
* Over-indexing: write amplification on every INSERT/UPDATE

---

## Related Rules

* Add indexes at migration time, not after queries are slow
* Don't create both unique and index on the same column

---

## Related Skills

* Define indexes in Laravel migrations
