# 2-12 whereRaw addBinding - Decision Trees

## Raw SQL vs Query Builder Methods

---

## Decision Context

Choosing between using `whereRaw` with bindings and standard query builder methods for complex WHERE conditions.

---

## Decision Criteria

* performance: raw can express what builder can't (e.g., CASE, MATCH...AGAINST)
* security: raw without bindings is SQL injection risk
* maintainability: raw SQL is harder to refactor

---

## Decision Tree

Need a complex WHERE condition?

↓

Can the standard query builder express it?

YES → Use query builder methods (safer, more portable)

    ↓
    `->where('status', 'active')->whereBetween('created_at', [$start, $end])`
    
NO → Need custom SQL (CASE, MATCH...AGAINST, JSON path)?

    YES → Use whereRaw with bound parameters
    
        ↓
        ```php
        ->whereRaw('MATCH(title, body) AGAINST(? IN BOOLEAN MODE)', [$search])
        ```
        
        ↓
        NEVER concatenate: `->whereRaw("status = '$status'")` → SQL injection
        
        ALWAYS use placeholders: `->whereRaw('status = ?', [$status])`

---

## Recommended Default

**Default:** Use query builder methods; fall back to whereRaw with bindings only when needed
**Reason:** Query builder is safer, more portable, and easier to maintain.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply WhereRaw with Safe Parameter Binding
