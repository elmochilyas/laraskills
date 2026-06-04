# 2-5 Constrained Eager Loading - Decision Trees

## Load All vs Top N per Parent

---

## Decision Context

Choosing between loading all related records and using constrained eager loading with limit for list views displaying top N items per parent.

---

## Decision Criteria

* performance: limiting reduces data transfer and memory
* architectural: top N per parent common in dashboards and list views
* maintainability: constrained loading requires remembering the pattern

---

## Decision Tree

Loading a relationship for a list view?

↓

Will all related records be displayed for each parent?

YES → Load all (no constraint needed)

    ↓
    Example: Show all comments on a single post page
    
    `Post::with('comments')->find($id)`

NO → Only top N shown per parent?

    YES → Use constrained eager loading with limit (Laravel 12+)
    
        ↓
        Example: Show 3 most recent comments per post on blog index
        
        `Post::with(['comments' => fn($q) => $q->latest()->limit(3)])->get()`
        
        ↓
        Pre-Laravel 12: Use staudenmeir/eloquent-eager-limit package
        
        ↓
        Also: filter by conditions
        `Post::with(['comments' => fn($q) => $q->where('approved', true)])`

---

## Rationale

Loading 500 comments per post when only 3 are displayed wastes bandwidth, memory, and time. Constrained eager loading with `limit()` or `where()` loads only the needed subset, reducing data transfer by orders of magnitude.

---

## Recommended Default

**Default:** Always constrain eager loading on list endpoints to only load what's displayed
**Reason:** Prevents massive over-fetching of related data in list views.

---

## Risks Of Wrong Choice

Loading all related records for each parent in a list: if 100 posts each have 500 comments, loading 50,000 comments when only 300 are displayed. Not constraining: memory exhaustion, slow responses.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Constrained Eager Loading with Limit/Filter
