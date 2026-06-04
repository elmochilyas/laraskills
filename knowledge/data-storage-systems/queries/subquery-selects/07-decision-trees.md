# 2-8 Subquery Selects - Decision Trees

## Subquery Select vs Eager Loading for Single Related Record

---

## Decision Context

Choosing between a subquery select (addSelect with correlated subquery) and eager loading (with()) when you need data from the latest related record per parent.

---

## Decision Criteria

* performance: subquery is single scalar per row; eager loading loads all records
* architectural: subquery adds a column; with() loads a collection
* maintainability: subquery syntax is more verbose

---

## Decision Tree

Need the latest related record's data for each parent?

↓

Do you need the full related model or just one value?

↓

Just one value (e.g., last login date)?

YES → Use subquery select

    ↓
    `User::addSelect(['last_login_at' => LoginLog::select('created_at')
        ->whereColumn('user_id', 'users.id')
        ->latest()
        ->limit(1)
    ])->get()`
    
    ↓
    Single scalar value returned as attribute
    No extra model hydration
    Very efficient

NO → Full related model needed?

    YES → Use constrained eager loading
    
        ↓
        `User::with(['lastLogin' => fn($q) => $q->latest()->limit(1)])->get()`
        
        Requires a dedicated relationship or package for limit support
        
        ↓
        Tradeoff: hydrates a model but gives full object access

NO → Multiple aggregate values from same relation?

    → Multiple subquery selects or use withCount/withSum
    
    Can chain: `addSelect([...])` with multiple subqueries

---

## Rationale

Subquery selects add a single computed column per parent row — no model hydration, minimal overhead. Eager loading hydrates full model instances. When you only need one value from the latest related record, the subquery approach is significantly more efficient.

---

## Recommended Default

**Default:** Subquery select for single scalar values; constrained eager loading for full model
**Reason:** Subquery is more memory-efficient. Only hydrate models when you need object methods.

---

## Risks Of Wrong Choice

Without limit(1) on subquery: database error if multiple rows returned. Eager loading full relationship for one value: hydrates all related models unnecessarily.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Subquery Selects for Computed Columns
