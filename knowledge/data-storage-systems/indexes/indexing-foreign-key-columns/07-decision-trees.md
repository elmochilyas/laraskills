# 3-24 Indexing Foreign Key Columns - Decision Trees

## constrained() vs Manual FK + Index

---

## Decision Context

Choosing between Laravel's `constrained()` helper (auto-indexes FK) and manual FK definition with explicit index.

---

## Decision Criteria

* performance: both create the same index; `constrained()` is less error-prone
* architectural: `constrained()` enforces FK + index in one call
* maintainability: `constrained()` is cleaner and more readable
* security: referential integrity

---

## Decision Tree

Creating a foreign key column in a migration?

↓

Using Laravel's Schema Builder?

YES → Prefer `constrained()` helper

    ↓
    `$table->foreignId('user_id')->constrained()`
    
    ↓
    Benefits:
    - Auto-creates index on the FK column
    - Correct ON DELETE behavior (restrict by default)
    - Shorter, cleaner syntax
    
    ↓
    Custom table name: `->constrained('custom_users_table')`
    Custom index name: use `->index('idx_name')` after constrained

NO → Manual FK definition (when needed)

    ↓
    When constrained() doesn't fit:
    - Custom ON DELETE action: `$table->foreignId('user_id')->constrained()->onDelete('cascade')`
    - Composite FK: multiple columns
    - Named constraint: `$table->foreign('user_id', 'fk_name')->references('id')->on('users')`
    
    ↓
    Critical: Always add index explicitly after manual FK
    `$table->foreign('user_id')->references('id')->on('users');`
    `$table->index('user_id');`  ← DON'T FORGET THIS

---

## Rationale

`constrained()` is the safest and most concise way to define FKs in Laravel — it always creates both the FK constraint and the index. Manual FK definitions often forget the index, leading to full table scan joins.

---

## Recommended Default

**Default:** Always use `constrained()` unless there's a specific need for manual definition
**Reason:** Eliminates the most common FK indexing mistake (missing index).

---

## Risks Of Wrong Choice

Manual FK without index: every JOIN on this FK column performs a full table scan — severe performance degradation that grows with table size.

---

## Related Rules

* Rule 2: Always index foreign key columns

---

## Related Skills

* Design B-Tree Indexes for Equality and Range Queries

---

## FK Index Redundancy Check: Keep or Drop

---

## Decision Context

Checking whether an existing FK index is redundant because a composite index already covers the FK column.

---

## Decision Criteria

* performance: redundant indexes waste write I/O
* architectural: composite indexes with FK as leading column cover FK queries
* maintainability: fewer indexes to maintain

---

## Decision Tree

FK column already has an index — is it redundant?

↓

Check existing indexes on the table

↓

Does a composite index have the FK column as the leading column?

YES → The single-column FK index is redundant

    ↓
    Example:
    - Composite: INDEX (user_id, created_at)
    - FK index: INDEX (user_id)
    
    → Composite's leftmost prefix covers queries filtering by user_id
    
    → Drop INDEX (user_id) — it's redundant

NO → Composite has FK as a non-leading column?

    YES → FK index is NOT redundant
        
        ↓
        Example: Composite INDEX (status, user_id)
        → Query filtering by user_id alone CANNOT use this composite
        
        → Keep INDEX (user_id) — it's needed
        
        Exception: If there's no query filtering by user_id alone, the FK index may still be unused

NO → No composite with FK column?

    → FK index is not redundant (keep it)

---

## Rationale

A composite index with the FK column as the first column serves all queries that filter by the FK column alone (leftmost prefix rule). An additional single-column FK index becomes redundant and can be dropped to reduce write amplification.

---

## Recommended Default

**Default:** Keep FK index; drop only if a composite index has the FK as the leading column
**Reason:** FK indexes are critical for JOIN performance. Be conservative — only drop when definitely redundant.

---

## Risks Of Wrong Choice

Dropping a non-redundant FK index: JOIN queries on that FK suddenly become full table scans. Keeping redundant FK indexes: wasted write I/O on every INSERT/UPDATE/DELETE.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables
* Rule 2: Always index foreign key columns

---

## Related Skills

* Design B-Tree Indexes for Equality and Range Queries
