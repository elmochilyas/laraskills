# 2-3 Eager Loading - Decision Trees

## Eager Loading Strategy: with() vs load() vs loadMissing()

---

## Decision Context

Choosing the right method for loading relationships — at query time or after hydration.

---

## Decision Criteria

* performance: eager load at query time is most efficient
* architectural: load() for conditional; loadMissing() for shared components
* maintainability: with() is simplest; loadMissing() prevents redundant loads

---

## Decision Tree

Need to load a relationship for a model/collection?

↓

Do you already have the parent models?

NO (before query) → Use `with()`

    ↓
    `Post::with('comments')->get()`
    
    ↓
    Most efficient: relationship loaded in single query alongside parents

YES (after query) → Use `load()` or `loadMissing()`

    ↓
    Is this a shared/reusable component (resource, accessor, view)?
    
    YES → Use `loadMissing()`
        
        ↓
        `$post->loadMissing('comments')`
        
        Only loads if not already loaded
        Prevents redundant queries in nested components
        
    NO → Use `load()`
    
        ↓
        `$post->load('comments')`
        
        Loads every time called (may cause redundant loads in call stacks)

---

## Rationale

`with()` is the most efficient because the relationship data is fetched in the same query as the parent. `load()` is for post-query scenarios. `loadMissing()` prevents redundant loading when a component might be called multiple times in a chain.

---

## Recommended Default

**Default:** `with()` at query time; `loadMissing()` in reusable components
**Reason:** `with()` is most efficient. `loadMissing()` prevents N+1 chain loading in shared code.

---

## Risks Of Wrong Choice

Lazy loading in loops: N+1 query problem, potentially thousands of queries. Blind eager loading: loading large relationships that are never used, wasting memory and bandwidth.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Eager Loading to Prevent N+1 Queries
