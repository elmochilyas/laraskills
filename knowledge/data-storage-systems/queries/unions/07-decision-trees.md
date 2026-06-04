# 2-14 Unions - Decision Trees

## union vs unionAll

---

## Decision Context

Choosing between `union` (deduplicates) and `unionAll` (no dedup) based on whether duplicate rows are possible and acceptable.

---

## Decision Criteria

* performance: unionAll avoids sort+distinct (faster)
* architectural: union ensures set semantics
* maintainability: unionAll is simpler

---

## Decision Tree

Combining multiple query results?

↓

Can the combined queries produce overlapping results?

YES → union (deduplicates)

    ↓
    `$query1->union($query2)`
    
    ↓
    Adds SORT + DISTINCT pass — more expensive
    Use only when duplicates are possible and must be removed

NO → Results are mutually exclusive?

    YES → Use unionAll (no dedup overhead)
    
        ↓
        `$query1->unionAll($query2)`
        
        ↓
    Faster: appends results without checking for duplicates

---

## Recommended Default

**Default:** `unionAll` unless deduplication is required
**Reason:** unionAll is faster. Only pay for dedup when needed.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Union and UnionAll for Combined Queries
