# 3-20 Concurrent Index Creation - Decision Trees

## Standard vs Concurrent Index Creation

---

## Decision Context

Choosing between standard (blocking) and concurrent (non-blocking) index creation based on table size, traffic, and downtime tolerance.

---

## Decision Criteria

* performance: concurrent creation takes 2-3x longer
* architectural: cannot run inside a transaction (PostgreSQL)
* maintainability: failed concurrent index leaves INVALID state
* security: none

---

## Decision Tree

Adding an index to an existing table?

↓

Is the table small (< 1M rows) or has low traffic?

YES → Standard index creation (no CONCURRENTLY)

    ↓
    Non-production or maintenance window: standard is fine
    
    In migration: `$table->index(['col1', 'col2'])`
    
    ↓
    Fastest approach (1x time)

NO → Large table with live traffic?

    YES → Use concurrent index creation
    
        ↓
        PostgreSQL: `CREATE INDEX CONCURRENTLY` — but NOT inside a transaction
        
        ↓
        In migration:
        ```php
        public function up()
        {
            DB::statement('CREATE INDEX CONCURRENTLY idx_name ON table (col)');
        }
        ```
        
        Rules:
        - One CONCURRENTLY per migration file
        - Cannot be inside DB::transaction()
        - Check for INVALID state after creation
        
        ↓
        MySQL: `ALTER TABLE ADD INDEX ... ALGORITHM=INPLACE LOCK=NONE`
        
        In migration:
        ```php
        DB::statement('ALTER TABLE table ADD INDEX idx_name (col) ALGORITHM=INPLACE LOCK=NONE');
        ```

---

## Rationale

Standard index creation acquires a write lock on the table, preventing all DML (INSERT/UPDATE/DELETE) for the duration. For large tables, this can be minutes or hours of downtime. Concurrent creation avoids this by building the index in the background while allowing concurrent writes.

---

## Recommended Default

**Default:** Standard for small tables (<1M rows); CONCURRENTLY for large tables under live traffic
**Reason:** Small tables are indexed quickly enough that the lock duration is negligible. Large tables require non-blocking methods for zero-downtime operations.

---

## Risks Of Wrong Choice

Standard index creation on large live table: minutes/hours of downtime, blocked writes, queue buildup. Multiple CONCURRENTLY in one migration: PostgreSQL raises error due to implicit commits.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Design B-Tree Indexes for Equality and Range Queries
