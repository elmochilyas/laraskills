# 2-13 Joins - Decision Trees

## INNER JOIN vs LEFT JOIN

---

## Decision Context

Choosing between INNER JOIN and LEFT JOIN for combining tables based on whether all rows from the parent table must be preserved.

---

## Decision Criteria

* performance: INNER JOIN is usually faster (fewer rows)
* architectural: LEFT JOIN may produce unexpected NULLs
* maintainability: INNER JOIN is simpler to reason about

---

## Decision Tree

Joining two tables — which join type?

↓

Must all rows from the parent table be preserved even if no match exists?

YES → LEFT JOIN

    ↓
    `->leftJoin('comments', 'posts.id', '=', 'comments.post_id')`
    
    ↓
    Posts without comments will have NULL comment columns
    Used for: "show all posts, with comment count" (post exists even with 0 comments)

NO → Only rows with matching records needed?

    YES → INNER JOIN
        
        ↓
        `->join('comments', 'posts.id', '=', 'comments.post_id')`
        
        ↓
        Only posts that have at least one comment
        Faster than LEFT JOIN (fewer rows, better index usage)
        Used for: "show posts that have comments"

---

## Recommended Default

**Default:** INNER JOIN; only use LEFT JOIN when NULLs from non-matching rows are needed
**Reason:** INNER JOIN is faster and avoids unexpected NULL handling.

---

## Related Rules

* Rule 2: Always index foreign key columns

---

## Related Skills

* Optimize Join Performance with Proper Indexing
