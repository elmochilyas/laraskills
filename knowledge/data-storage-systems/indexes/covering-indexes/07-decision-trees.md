# 3-10 Covering Indexes - Decision Trees

## Covering Index: INCLUDE Columns vs Additional Key Columns

---

## Decision Context

Deciding whether to add columns as INCLUDE (PostgreSQL) or as key columns (MySQL/PostgreSQL) to enable index-only scans.

---

## Decision Criteria

* performance: index-only scans avoid heap fetches, reducing random I/O
* architectural: PostgreSQL INCLUDE columns don't affect tree structure
* maintainability: more columns = larger index = more write amplification
* security: none

---

## Decision Tree

Need to add SELECT columns to an index for covering?

↓

Using PostgreSQL?

YES → Use INCLUDE clause for non-filtered, non-sorted columns

    ↓
    Index key: columns used in WHERE, ORDER BY, JOIN
    INCLUDE: columns used in SELECT but not in WHERE/ORDER BY
    
    ↓
    `CREATE INDEX ON orders (tenant_id, status) INCLUDE (total, currency)`
    
    ↓
    INCLUDE columns:
    - Don't affect B-Tree depth
    - Don't affect uniqueness
    - Enable index-only scans for queries selecting total, currency

NO → Using MySQL?

    YES → Add as key columns (no INCLUDE support pre-8.0)
    
        ↓
        For MySQL 8.0+: can use functional indexes or add as trailing key columns
        For MySQL 5.7: only option is adding as regular key columns
        
        ↓
        Tradeoff: covering index vs index size
        If index becomes too wide (>20% of table size), covering benefit may not justify cost

---

## Rationale

PostgreSQL's INCLUDE adds columns as payload in the index leaf pages without affecting the B-Tree structure. This is ideal for covering indexes: you get index-only scans without increasing tree depth or affecting uniqueness/ordering. MySQL must add them as key columns, which increases the tree size.

---

## Recommended Default

**Default:** PostgreSQL: use INCLUDE for payload columns; MySQL: add key columns only for critical queries
**Reason:** INCLUDE is low-cost for covering. MySQL key columns increase tree size — only add when index-only scan savings are significant.

---

## Risks Of Wrong Choice

Over-covering (adding too many columns): index approaches table size, write amplification increases, benefit diminishes. Under-covering (not enough columns): queries still do heap fetches, missing the optimization opportunity.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Use Covering Indexes for Index-Only Scans
* Design Composite Indexes with Correct Leftmost Prefix

---

## Covering Index vs Query Restructuring

---

## Decision Context

Deciding whether to add a covering index or restructure the query (select fewer columns) to improve query performance.

---

## Decision Criteria

* performance: covering index optimal for repeated queries; query restructure reduces data transfer
* architectural: covering index adds write overhead; query restructure adds app complexity
* maintainability: covering index is passive; query restructure requires code changes
* security: covering index stores more data in index pages

---

## Decision Tree

Slow query selecting many columns?

↓

Does the query run frequently (many times per second)?

YES → Consider covering index (add SELECT columns to existing index)

    ↓
    Measure: how much of the query time is heap fetches?
    
    If heap fetches dominate → covering index helps
    
    If network/application processing dominates → covering index may not help

NO → Query is run occasionally?

    YES → Consider query restructure first
    
        ↓
        Select only needed columns (not SELECT *)
        Use pagination
        Add LIMIT
        
        ↓
        If still slow, then consider covering index
    
    NO → Consider caching (application cache or materialized view)

---

## Rationale

Covering indexes trade write overhead for read performance. For high-frequency queries, this tradeoff is usually worthwhile. For rare queries, restructuring (selecting fewer columns) is often sufficient and has no maintenance cost.

---

## Recommended Default

**Default:** Covering index for hot queries; query restructure for cold queries
**Reason:** Hot queries benefit from the read optimization; cold queries don't justify the write overhead.

---

## Risks Of Wrong Choice

Covering index for cold query: wasted storage and write amplification for infrequent benefit. No covering index for hot query: repeated expensive heap fetches under load.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Use Covering Indexes for Index-Only Scans
