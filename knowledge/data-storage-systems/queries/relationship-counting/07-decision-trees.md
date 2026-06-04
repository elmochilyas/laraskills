# 2-7 Relationship Counting - Decision Trees

## withCount vs Loading Full Relationship

---

## Decision Context

Choosing between using `withCount` (subquery aggregate) and loading the full relationship just to get a count.

---

## Decision Criteria

* performance: withCount is a single scalar; loading is full collection
* architectural: withCount adds a computed attribute
* maintainability: withCount is the standard pattern

---

## Decision Tree

Need the count of related records?

↓

Do you also need the actual related records?

YES → Use `with()` for the records

    ↓
    `Post::with('comments')->get()`
    Then: `$post->comments` and `$post->comments->count()`
    
    ↓
    Loading the collection to iterate over AND counting — full data needed

NO → Only the count is needed?

    YES → Use `withCount()`
    
        ↓
        `Post::withCount('comments')->get()`
        Then: `$post->comments_count`
        
        ↓
        SQL adds subquery: `(SELECT COUNT(*) FROM comments WHERE post_id = posts.id)`
        No Comment models hydrated → much less memory
        
        ↓
        Filtered count:
        `withCount(['comments' => fn($q) => $q->where('approved', true)])`
        
        Nested count:
        `withCount(['comments as approved_comments' => fn($q) => $q->where('approved', true)])`

NO → Need sum/max/min/avg instead?

    → Use `withSum('relation', 'column')`, `withMax()`, etc.
    Same pattern as withCount

---

## Rationale

Loading entire related model collections just to call `->count()` in PHP is extremely wasteful — it hydrates thousands of model objects, reads all columns, and consumes memory. `withCount` adds a simple subquery that returns a single integer per parent row.

---

## Recommended Default

**Default:** Always use `withCount()` when you only need the count
**Reason:** Memory-efficient, no unnecessary model hydration. Use `with()` only when you need the actual related records.

---

## Risks Of Wrong Choice

`$post->comments->count()` loads ALL comments into memory just to get a number. For posts with 10K comments, this hydrates 10K unnecessary model instances. Never use collection count for related models.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Relationship Counting with withCount
