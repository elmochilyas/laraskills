# 3-21 Index Management in Migrations - Decision Trees

## Blueprint Methods vs Raw DDL for Index Creation

---

## Decision Context

Choosing between Laravel's Schema Builder (Blueprint methods) and raw `DB::statement()` for creating indexes in migrations.

---

## Decision Criteria

* performance: both produce the same DDL; raw allows advanced features
* architectural: Blueprint handles basic indexes; raw needed for advanced types
* maintainability: Blueprint is more portable; raw ties to specific database

---

## Decision Tree

Need to create an index in a migration?

↓

Is it a standard B-Tree, Unique, Full-Text, or Spatial index?

YES → Use Blueprint methods

    ↓
    Single column: `$table->index('col')`
    Composite: `$table->index(['col1', 'col2'], 'idx_name')`
    Unique: `$table->unique('email')`
    Full-text: `$table->fullText('body')`
    Spatial: `$table->spatialIndex('location')`
    
    ↓
    Portable across MySQL and PostgreSQL
    Automatic rollback support

NO → Advanced index type needed?

    YES → Use raw DDL (DB::statement)
    
        ↓
        When to use raw:
        - PostgreSQL partial index: `CREATE INDEX ... WHERE status = 'active'`
        - Expression index: `CREATE INDEX ON users (LOWER(email))`
        - PostgreSQL hash index: `CREATE INDEX ... USING HASH (col)`
        - BRIN index: `CREATE INDEX ... USING BRIN (col)`
        - CONCURRENTLY: `CREATE INDEX CONCURRENTLY ...`
        - Descending index: `CREATE INDEX ... (col DESC)`
        - INCLUDE columns: `CREATE INDEX ... INCLUDE (col)`
        - Custom fillfactor: `CREATE INDEX ... WITH (fillfactor = 70)`
        
        ↓
        Handle manually:
        ```php
        public function up() {
            DB::statement('CREATE INDEX CONCURRENTLY idx_name ON table (col)');
        }
        public function down() {
            DB::statement('DROP INDEX IF EXISTS idx_name');
        }
        ```

---

## Rationale

Blueprint methods handle 90% of index creation needs and ensure cross-database portability. Raw DDL is required for the remaining 10% of advanced index types (partial, expression, BRIN, CONCURRENTLY) that Blueprint doesn't support.

---

## Recommended Default

**Default:** Blueprint methods for standard indexes; raw DDL for advanced types
**Reason:** Blueprint is portable and simpler. Use raw only when the index type requires it.

---

## Risks Of Wrong Choice

Raw DDL for simple indexes: reduced portability, manual rollback management. Blueprint for advanced indexes: not supported, error or silently creates a different index type.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Design Composite Indexes with Correct Leftmost Prefix
