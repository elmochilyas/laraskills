# 2-15 Scopes - Decision Trees

## Global Scope vs Local Scope for Filters

---

## Decision Context

Choosing between global scopes (always-on) and local scopes (explicitly called) for common query filters.

---

## Decision Criteria

* performance: global scopes add overhead to every query (even unwanted ones)
* architectural: tenant isolation demands global scopes; optional filters should be local
* maintainability: global scopes can be forgotten when bypassing

---

## Decision Tree

Need a common query filter?

↓

Should the filter ALWAYS apply to every query on this model?

YES → Global scope

    ↓
    Use cases: tenant isolation, soft deletes
    `addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id))`
    
    ↓
    Risk: must remember to bypass with `withoutGlobalScope()` for admin queries

NO → Filter is optional or context-dependent?

    YES → Local scope (explicitly called)
    
        ↓
        `scopeActive($query)` → `Model::active()->get()`
        
        ↓
        Only applied when called
        No hidden query conditions

---

## Recommended Default

**Default:** Local scopes for optional filters; global scopes only for mandatory filters
**Reason:** Global scopes add hidden query conditions. Use them sparingly.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Scopes for Reusable Query Constraints
