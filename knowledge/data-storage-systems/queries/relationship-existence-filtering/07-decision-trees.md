# 2-6 Relationship Existence Filtering - Decision Trees

## whereHas vs JOIN for Existence Queries

---

## Decision Context

Choosing between `whereHas` (EXISTS subquery) and explicit JOIN for filtering parent records by relationship conditions.

---

## Decision Criteria

* performance: JOIN can be faster for large tables; whereHas is more readable
* architectural: whereHas integrates with Eloquent scopes; JOIN requires raw
* maintainability: whereHas is more maintainable; JOIN requires dedup handling

---

## Decision Tree

Need to filter parents by relationship conditions?

↓

Is this a performance-critical endpoint (high traffic, large tables)?

YES → Consider JOIN instead of whereHas

    ↓
    Example: Find posts with approved comments
    
    JOIN approach:
    ```php
    Post::select('posts.*')
        ->join('comments', 'posts.id', '=', 'comments.post_id')
        ->where('comments.approved', true)
        ->distinct()
    ```
    
    ↓
    Faster: single query, index-friendly
    Downside: DISTINCT needed to avoid duplicates
    Downside: breaks if table name changes

NO → Moderate traffic or complex filtering?

    YES → Use whereHas (simpler, more readable)
    
        ↓
        `Post::whereHas('comments', fn($q) => $q->where('approved', true))->get()`
        
        ↓
        Generates: `WHERE EXISTS (SELECT 1 FROM comments WHERE posts.id = comments.post_id AND approved = 1)`
        
        ↓
        Readable, maintainable, integrates with relationships
        Slower for very large tables (per-row EXISTS evaluation)

---

## Rationale

`whereHas` generates correlated EXISTS subqueries that are evaluated for each parent row. For small-to-medium tables this is fine. For large tables with high traffic, a JOIN-based approach can be significantly faster because the database can use indexes more efficiently.

---

## Recommended Default

**Default:** `whereHas` for readability; JOIN for performance-critical hot paths
**Reason:** whereHas is clean and maintainable. Only optimize to JOIN when profiling shows it's needed.

---

## Risks Of Wrong Choice

whereHas on large hot tables: correlated subquery can be slow, especially with deep nesting. JOIN without DISTINCT: duplicate parent rows. JOIN with complex scope chain: hard to maintain.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Relationship Existence Filtering
