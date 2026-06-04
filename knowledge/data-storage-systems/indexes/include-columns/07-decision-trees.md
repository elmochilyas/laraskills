# 3-16 INCLUDE Columns - Decision Trees

## INCLUDE Columns vs Key Columns in PostgreSQL

---

## Decision Context

Choosing between adding columns as INCLUDE (non-key payload) or as key columns in a PostgreSQL index for covering queries.

---

## Decision Criteria

* performance: INCLUDE doesn't affect B-Tree depth or uniqueness; key columns do
* architectural: PostgreSQL 11+ feature
* maintainability: INCLUDE columns simpler to manage
* security: none

---

## Decision Tree

Need to add extra columns to a PostgreSQL index for covering?

↓

What role do the extra columns play?

↓

Where/Join/Order by filter?

YES → Must be key columns (INCLUDE doesn't support filtering)

NO → SELECT-only (payload for index-only scan)?

    YES → Use INCLUDE
    
        ↓
        `CREATE INDEX ON orders (tenant_id, status) INCLUDE (total, currency)`
        
        ↓
        Benefits over key columns:
        - Doesn't increase B-Tree depth
        - Doesn't affect unique constraint
        - Doesn't count toward key column limit (32)
        
        ↓
        Also works with unique indexes:
        `CREATE UNIQUE INDEX ON users (email) INCLUDE (name, avatar)`
        → Unique on email, covering for name+avatar queries

NO → Need uniqueness on the extra columns?

    YES → Must be key columns (INCLUDE columns don't participate in uniqueness)
    
        ↓
        `UNIQUE INDEX (a, b)` → unique on (a, b)
        `UNIQUE INDEX (a) INCLUDE (b)` → unique on a only, b is payload

---

## Rationale

INCLUDE columns are stored in index leaf pages but don't participate in the B-Tree structure, uniqueness, or leftmost prefix rules. This makes them ideal for covering queries without the downsides of adding key columns (larger tree depth, uniqueness changes).

---

## Recommended Default

**Default:** Use INCLUDE for SELECT-only payload columns; key columns for WHERE/JOIN/ORDER BY
**Reason:** INCLUDE provides covering benefits without structural costs.

---

## Risks Of Wrong Choice

Adding payload as key columns: increases B-Tree depth, may break uniqueness constraints, wastes index space. Not using INCLUDE in PostgreSQL: over-maintained indexes, missed optimization opportunity.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Use Covering Indexes for Index-Only Scans

---

## INCLUDE vs Composite Key for Unique Index Covering

---

## Decision Context

Adding payload columns to a unique index while preserving the uniqueness constraint — choosing between INCLUDE and adding as composite key columns.

---

## Decision Criteria

* performance: INCLUDE maintains uniqueness; key columns change it
* architectural: INCLUDE keeps semantics clean
* maintainability: INCLUDE easier to reason about
* security: none

---

## Decision Tree

Need a unique index that also covers additional SELECT columns?

↓

Using PostgreSQL?

YES → Use INCLUDE with UNIQUE INDEX

    ↓
    `CREATE UNIQUE INDEX ON users (email) INCLUDE (name, avatar_url)`
    
    ↓
    Semantics:
    - Uniqueness enforced only on `email`
    - `name` and `avatar_url` stored in leaf pages
    - Queries like `SELECT name FROM users WHERE email = ?` are index-only
    
    ↓
    Advantages:
    - No false uniqueness errors (name variations don't affect uniqueness)
    - Smaller B-Tree (only email in tree nodes)
    - Same query performance

NO → Not using PostgreSQL?

    YES → Add as key columns with caution
    
        ↓
        `UNIQUE INDEX (email, name, avatar_url)` — WRONG: now unique on combination
        
        Solution: Add columns as separate covering index:
        `INDEX (email) INCLUDE (name, avatar_url)` — but MySQL pre-8.0 doesn't support INCLUDE
        
        MySQL alternative: use two indexes — unique on (email), covering on (email, name, avatar_url) — but the covering index must include email as leading column

---

## Rationale

PostgreSQL's INCLUDE is uniquely suited for this use case. It allows adding payload to a unique index without changing the uniqueness semantics. In MySQL, you need separate indexes or accept the wider unique constraint.

---

## Recommended Default

**Default:** PostgreSQL: UNIQUE INDEX with INCLUDE; MySQL: separate unique + covering indexes
**Reason:** INCLUDE is the cleanest solution. MySQL requires redundancy but can achieve the same effect.

---

## Risks Of Wrong Choice

Adding payload as key columns to a unique index: changes uniqueness semantics, potentially causing data integrity issues or application errors.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Use Covering Indexes for Index-Only Scans
