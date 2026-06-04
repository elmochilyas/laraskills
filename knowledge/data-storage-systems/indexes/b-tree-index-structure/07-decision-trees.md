# 3-1 B-Tree Index Structure - Decision Trees

## Index Type Selection

---

## Decision Context

Choosing between B-Tree, Hash, GIN, GiST, BRIN, or SP-GiST for a given column based on query patterns and data type.

---

## Decision Criteria

* performance: O(log n) vs O(1) lookup, range vs equality, write amplification
* architectural: PostgreSQL vs MySQL, clustered vs heap storage
* security: RLS policy alignment with partial indexes
* maintainability: index bloat, maintenance overhead

---

## Decision Tree

Need to choose an index type?

↓

Query pattern includes range (>, <, BETWEEN) or ORDER BY?

YES → B-Tree (default for most cases)

NO → Query is equality-only (=)?

    YES → PostgreSQL and storage-constrained?
    
        YES → Hash Index (smaller, no range support)
    
        NO → B-Tree Index

    NO → Query is spatial or range overlap?
    
        YES → GiST (PostgreSQL) / R-Tree (MySQL)
    
        NO → Query is JSONB containment or array membership?
        
            YES → GIN with jsonb_path_ops (if `@>` only) or default opclass (if `?`, `?|`, `?&` needed)
        
            NO → Query is full-text search?
            
                YES → GIN (better query perf) or GiST (better write perf)
            
                NO → Query is on huge ordered table with correlated data?
                
                    YES → BRIN (100-1000x smaller than B-Tree)
                    
                    NO → B-Tree

---

## Rationale

B-Tree is the universal default because it supports equality, range, prefix, and sort. Hash indexes are smaller but limited to equality. GIN excels at multi-valued data (JSONB, arrays, text search). GiST handles spatial and nearest-neighbor. BRIN is ideal for time-series where data is physically ordered.

---

## Recommended Default

**Default:** B-Tree Index
**Reason:** Supports all common query patterns (equality, range, sort, prefix). Available in both MySQL and PostgreSQL. No risk of future query incompatibility.

---

## Risks Of Wrong Choice

Using Hash when range queries are needed later forces index rebuild. Using B-Tree for JSONB containment results in full table scans. Using GIN on write-heavy columns causes severe write amplification and vacuum pressure.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables (max 5-6 indexes)
* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design B-Tree Indexes for Equality and Range Queries
* Apply Hash Indexes for Equality-Only Lookups
* Design GIN Indexes for JSONB and Full-Text Search
* Design BRIN Indexes for Time-Series Data

---

## Composite Index Column Ordering

---

## Decision Context

When creating a multi-column (composite) B-Tree index, deciding the order of columns to maximize query coverage and index utilization.

---

## Decision Criteria

* performance: leftmost prefix rule, selectivity, index-only scans
* architectural: query pattern analysis, covering index design
* maintainability: number of indexes needed versus index size

---

## Decision Tree

Need to order columns in a composite index?

↓

Identify columns used in WHERE clauses

↓

Place equality columns first (WHERE col = ?)

↓

Then place range/sort columns (WHERE col > ?, ORDER BY col)

↓

Then include low-selectivity columns or INCLUDE columns for covering

↓

Does the leading column cover the most frequent query pattern?

YES → Index is optimized for the primary pattern

NO → Consider reordering or creating a separate index for the other pattern

---

## Rationale

The leftmost prefix rule means the index can only be used if queries filter on the leading column(s). Equality columns should come before range columns so the index can narrow to exact matches before scanning a range. Placing a low-cardinality column first may help if it's always filtered.

---

## Recommended Default

**Default:** Most selective equality column first, then range column, then INCLUDE columns
**Reason:** Maximizes the number of queries that can use the index via leftmost prefix matching.

---

## Risks Of Wrong Choice

Placing a range column before equality columns means the index scans a wider range for each equality value. Ordering by insertion order (e.g., just adding columns as they're needed) leads to unused indexes and wasted write I/O.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables
* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design B-Tree Indexes for Equality and Range Queries
* Design Composite Indexes with Correct Column Ordering

---

## Clustered vs Non-Clustered Index Strategy

---

## Decision Context

Understanding how InnoDB (clustered) and PostgreSQL (heap) store data and how this affects secondary index design, primary key choice, and table access patterns.

---

## Decision Criteria

* performance: secondary index lookup overhead, table bloat, HOT updates
* architectural: MySQL vs PostgreSQL, UUID vs auto-increment PK
* maintainability: VACUUM vs page splits

---

## Decision Tree

Which database engine?

↓

MySQL/InnoDB (Clustered)?

YES → Choose a narrow, monotonically increasing PK

    ↓
    UUID PK?
    
    YES → Expect page splits and fragmentation. Consider alternatives or use ORDER BY UUID.
    
    NO → Auto-increment integer? 
    
        YES → Optimal for InnoDB. Data inserts at end of table.
    
    ↓
    Secondary index strategy: Keep narrow (index on small columns) because each secondary index entry includes the PK value.

NO → PostgreSQL (Heap)?

    YES → PK choice is less critical for storage
    
        ↓
        Use any PK type (UUID, natural keys, serial)
        
        ↓
        Index strategy: Prefer INCLUDE columns for index-only scans to avoid heap lookups
        
        ↓
        Monitor for index bloat and use VACUUM appropriately

---

## Rationale

InnoDB stores row data within the PK index (clustered). A wide or random PK bloats all secondary indexes and causes page splits. PostgreSQL stores rows in a heap; indexes point to TIDs. HOT updates allow row updates without index maintenance if no indexed column changes.

---

## Recommended Default

**Default:** InnoDB: narrow auto-increment PK; PostgreSQL: UUID PK with INCLUDE indexes
**Reason:** Aligns with each engine's storage architecture. InnoDB benefits from sequential PK inserts. PostgreSQL handles UUIDs efficiently with heap storage.

---

## Risks Of Wrong Choice

InnoDB with UUID PK: 3-4x index size, page splits, fragmentation. PostgreSQL with poorly chosen indexes: index bloat, slow index-only scans requiring heap lookups.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables
* Rule 2: Always index foreign key columns

---

## Related Skills

* Design B-Tree Indexes for Equality and Range Queries
* Apply Covering Indexes for Index-Only Scans
