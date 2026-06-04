# 3-2 Hash Indexes - Decision Trees

## Index Type: Hash vs B-Tree for Equality Lookups

---

## Decision Context

Choosing between a PostgreSQL hash index and a B-Tree index for a column queried only with equality conditions (`WHERE col = ?`).

---

## Decision Criteria

* performance: hash smaller storage, no range/sort support
* architectural: PostgreSQL only (MySQL has no hash index support)
* maintainability: hash indexes may need rebuilds in older PG versions
* security: no direct security impact

---

## Decision Tree

Need an index for equality-only lookups in PostgreSQL?

↓

Could the column ever need range queries (>, <, BETWEEN), ORDER BY, or LIKE in the future?

YES → Use B-Tree Index (supports all future query patterns)

NO → Is storage space a concern?

    YES → Use Hash Index (smaller than B-Tree for same column)
    
    NO → Is the column highly selective (many distinct values)?
    
        YES → Hash Index (fast equality lookup)
        
        NO → Low-cardinality column (e.g., status with 3 values)?
        
            YES → No index at all (index scan likely more expensive than seq scan)
            
            NO → Hash Index

---

## Rationale

Hash indexes are smaller than B-Tree but limited to equality. If any range/sort query is possible, B-Tree is safer. For low-cardinality columns, neither index type helps much — the optimizer will prefer a full table scan.

---

## Recommended Default

**Default:** B-Tree Index
**Reason:** Safer choice that supports all query patterns. Hash indexes are a niche optimization only beneficial when storage savings matter and the query pattern is guaranteed equality-only.

---

## Risks Of Wrong Choice

Hash index on a column that later needs range queries forces a full index rebuild. Hash index on low-cardinality columns wastes storage without query benefit. B-Tree where hash would suffice is slightly larger but functionally equivalent.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Apply Hash Indexes for Equality-Only Lookups
* Design B-Tree Indexes for Equality and Range Queries

---

## PostgreSQL Hash Index: When to Deploy

---

## Decision Context

Deciding whether to deploy a hash index in PostgreSQL based on version compatibility, crash safety requirements, and maintenance practices.

---

## Decision Criteria

* performance: hash smaller, no range support
* architectural: PostgreSQL 10+ required for crash safety
* maintainability: pre-PG10 indexes are not WAL-logged, lost on crash
* security: none

---

## Decision Tree

Ready to create a hash index?

↓

PostgreSQL version >= 10?

YES → Hash index is WAL-logged and crash-safe → Proceed with CREATE INDEX

NO → PostgreSQL < 10 (rare)?

    YES → Hash index is NOT WAL-logged
    
        ↓
        Accept risk of index loss on crash?
        
        YES → Proceed (not recommended)
        
        NO → Use B-Tree instead

↓

Create with: `DB::statement('CREATE INDEX hash_idx ON table USING HASH (col)')`

↓

Verify with EXPLAIN that the hash index is being used for equality lookups

---

## Rationale

Pre-PostgreSQL 10, hash indexes were not WAL-logged, meaning a crash could corrupt or lose the index, requiring a rebuild. Since PG 10, hash indexes are fully crash-safe. Most production environments today are PG 12+.

---

## Recommended Default

**Default:** Avoid hash indexes unless PostgreSQL >= 10 and equality-only pattern is guaranteed
**Reason:** Hash indexes are a niche optimization. B-Tree handles equality equally well with no restrictions.

---

## Risks Of Wrong Choice

Using hash indexes on PG < 10 risks index corruption on crash. Using hash when B-Tree is needed forces index rebuild.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Hash Indexes for Equality-Only Lookups
