# 2-9 Subquery Ordering - Decision Trees

## Subquery OrderBy vs PHP Sorting

---

## Decision Context

Choosing between sorting results by a related computed value at the database level (subquery orderBy) or sorting in PHP after loading.

---

## Decision Criteria

* performance: DB sort uses indexes (with proper subquery index); PHP sort requires loading all data
* architectural: DB sort works on paginated queries; PHP sort needs all rows in memory
* maintainability: subquery syntax is complex

---

## Decision Tree

Need to sort by a related computed value?

↓

Is the result set paginated?

YES → Must use subquery orderBy (PHP sort won't work with LIMIT)

    ↓
    `User::orderByDesc(Order::select('created_at')
        ->whereColumn('user_id', 'users.id')
        ->latest()->limit(1))->paginate()`
    
    ↓
    Critical: Index on (user_id, created_at) for the subquery

NO → Small result set (< 1000 rows)?

    YES → PHP sort is acceptable (simpler)
    
        ↓
        `$users = User::with('latestOrder')->get();
        $sorted = $users->sortByDesc(fn($u) => $u->latestOrder?->created_at);`
        
    NO → Large result set, no pagination?
    
        YES → Subquery orderBy (more efficient)

---

## Rationale

Subquery ordering pushes the sort work to the database, enabling indexed sort and pagination. PHP sorting requires loading all rows into memory, which is impractical for large datasets. However, subquery ordering requires a matching index.

---

## Recommended Default

**Default:** Subquery orderBy for paginated or large result sets
**Reason:** Enables efficient indexed sorting and pagination. Avoid for small in-memory datasets.

---

## Risks Of Wrong Choice

No index on subquery columns: subquery orderBy is slow (nested loop). PHP sort on large dataset: memory exhaustion.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Subquery Selects for Computed Columns
