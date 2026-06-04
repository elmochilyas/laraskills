# 3-15 Descending Indexes - Decision Trees

## Descending vs Ascending Index for ORDER BY DESC

---

## Decision Context

Choosing between a descending index and a default ascending index for queries that sort by a column in descending order.

---

## Decision Criteria

* performance: descending index avoids reverse scan; critical for composite indexes
* architectural: MySQL 8.0+, PostgreSQL both support descending indexes
* maintainability: single-column DESC rarely needs descending index
* security: none

---

## Decision Tree

Query uses ORDER BY col DESC — does it need a descending index?

↓

Is the column in a composite index?

YES → Does the composite also include equality-filtered columns?

    YES → Add DESC to the sort column:
        `INDEX (status, created_at DESC)`
        
        Benefits:
        - Avoids reverse scan
        - Enables "latest records per group" queries
        
        ↓
        Example: "Get most recent 10 orders for each user"
        `WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`
        → Index: (user_id, created_at DESC)

NO → Single-column ORDER BY DESC?

    YES → Descending index NOT needed
    
        ↓
        MySQL and PostgreSQL both reverse-scan single-column indexes efficiently
        `ORDER BY col DESC` on `INDEX (col ASC)` works fine
        
        Exception: if combined with other query conditions, may still need DESC
        
    NO → Neither? (not sorting by that column)
    
        → Don't add the column to index for sort purposes

---

## Rationale

Single-column B-Tree indexes can be scanned in either direction efficiently. Descending indexes matter most for composite indexes where one column is used for equality and another for descending sort. Without DESC, the database must scan the index backward, which is less efficient for composite indexes.

---

## Recommended Default

**Default:** Only use descending indexes in composite indexes with mixed equality+sort patterns
**Reason:** Single-column reverse scans are efficient. The optimization is needed for composite indexes where sort direction must match the tree order.

---

## Risks Of Wrong Choice

No descending index on composite (equality, sort DESC): database does a backward scan through the equality matches, potentially scanning many rows instead of walking the tree in the correct order. Using DESC on a single column unnecessarily: adds complexity without performance benefit.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Design Descending Indexes for ORDER BY DESC Queries
