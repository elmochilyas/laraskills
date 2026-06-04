# 2-2 Relationship Types - Decision Trees

## Polymorphic vs Dedicated FK for Shared Relationships

---

## Decision Context

Choosing between a polymorphic relationship (morphMany/morphTo) and dedicated foreign key columns for shared model relationships (e.g., comments on both posts and videos).

---

## Decision Criteria

* performance: polymorphic requires two-column index (type + id), harder to optimize
* architectural: polymorphic adds schema complexity; dedicated FKs are cleaner
* maintainability: polymorphic schemas are harder to evolve
* security: RLS is more complex with polymorphic types

---

## Decision Tree

Need a model that belongs to multiple other model types?

↓

Are the parent models truly unrelated (different tables, different contexts)?

YES → Consider polymorphic relationship

    ↓
    Example: Comments on Posts AND Videos
    
    ```php
    // Comment model
    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }
    ```
    
    Migration: `commentable_id` (bigint) + `commentable_type` (string)
    Index: INDEX (commentable_type, commentable_id)
    
    ↓
    Tradeoffs:
    - No FK constraint possible (type column is string)
    - Index on (type, id) is less selective
    - Schema migrations harder (adding a new moprhable type)

NO → Could use separate join/pivot tables?

    YES → Use dedicated relationships
        
        ↓
        Post hasMany Comment
        Video hasMany Comment
        
        Two separate foreign key columns or a single polymorphic approach
        
        ↓
        If the behavior is identical, polymorphic may be simpler
        
        If behavior differs, use separate relationships

NO → Only one parent type now, but could be more in future?

    → Start with dedicated FK. Polymorphism can be added later. Premature polymorphism complicates the schema.

---

## Rationale

Polymorphic relationships are flexible but sacrifice database integrity (no FK constraints) and performance (two-column index). Dedicated relationships are more performant and maintainable but less flexible. Start simple and add polymorphism when genuinely needed.

---

## Recommended Default

**Default:** Start with dedicated FKs; use polymorphic only when truly needed for multiple unrelated parent types
**Reason:** Dedicated FKs are more performant, support FK constraints, and are easier to index.

---

## Risks Of Wrong Choice

Polymorphic for simple use cases: no FK integrity, complex indexes, harder schema evolution. Dedicated columns for many parent types: schema bloat, N FK columns instead of 2 generic columns.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Define Relationships with Proper Types
