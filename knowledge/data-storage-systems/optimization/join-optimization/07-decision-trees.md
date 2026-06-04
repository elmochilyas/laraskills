# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Query Optimization & Profiling
**Knowledge Unit:** 4-24 Join Optimization
**Generated:** 2026-06-03

---

# Decision Inventory

* INNER vs LEFT JOIN selection
* Join column index verification
* Join order optimization

---

# Architecture-Level Decision Trees

---

## Join Type and Index Strategy

---

## Decision Context

Choosing the correct join type and ensuring proper indexing for optimal join performance.

---

## Decision Criteria

* performance: INNER JOIN can optimize join order; LEFT JOIN drives from left
* architectural: join column on inner table MUST be indexed
* maintainability: FK column indexes serve join performance
* security: no direct impact

---

## Decision Tree

Writing a JOIN query?
↓
Is the relationship mandatory (every parent has children)?
YES → Use INNER JOIN
    → Optimizer can choose join order (smaller table first)
    → Returns only rows with matches
NO → Is the relationship optional (parent may not have children)?
    → Use LEFT JOIN (returns all parent rows)
    → LEFT JOIN always drives from the left table
↓
Is the JOIN column indexed on the INNER (joined) table?
YES → Index exists — join will use index lookup
NO → MUST ADD INDEX — without it, full table scan per outer row
    → ALTER TABLE joined_table ADD INDEX (join_column)
↓
Verify with EXPLAIN:
→ Access method on joined table should be ref or eq_ref
→ If type=ALL on joined table, index is missing or not used

---

## Rationale

The single most important rule: the column used in the ON clause of the inner/joined table must be indexed. Without it, the database performs a full table scan on the joined table for every row in the driving table (nested loop join). INNER JOIN is more flexible for the optimizer than LEFT JOIN.

---

## Recommended Default

**Default:** INNER JOIN for mandatory relationships, always index the join column
**Reason:** INNER JOIN enables optimizer join order optimization. Indexed join columns are essential for nested loop join performance.

---

## Risks Of Wrong Choice

* JOIN without index on FK column: full table scan per outer row
* LEFT JOIN when INNER JOIN suffices: unnecessary NULL rows and less optimal plan
* Forcing join order with hints: optimizer usually chooses correctly

---

## Related Rules

* Always index foreign key columns used in JOINs
* Prefer INNER JOIN over LEFT JOIN when NULL cases aren't needed

---

## Related Skills

* Optimize JOIN queries with proper indexing
