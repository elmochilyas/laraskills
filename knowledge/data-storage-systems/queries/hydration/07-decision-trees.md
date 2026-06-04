# 2-20 Hydration - Decision Trees

## Hydrate from Cache vs Query Database

---

## Decision Context

Choosing between hydrating Eloquent models from cached data vs querying the database for read-heavy, cache-friendly data.

---

## Decision Criteria

* performance: cache hydration avoids DB round-trip
* architectural: model events fire on hydration (side-effects)
* maintainability: cache invalidation logic needed

---

## Decision Tree

Need to display model data that doesn't change frequently?

↓

Is the data cache-friendly (same data served to many users)?

YES → Cache + hydrate

    ↓
    ```php
    $data = Cache::remember('posts:active', 3600, fn() => 
        Post::active()->get()->toArray()
    );
    $posts = Post::hydrate($data);
    ```
    
    ↓
    Fires `retrieved` event on each model
    Avoids DB query for cache hits
    
    ↓
    Important: Invalidate cache on model save
    `Post::saved(fn() => Cache::forget('posts:active'))`

NO → Data changes frequently or is user-specific?

    → Query database directly (cache invalidation overhead > benefit)

---

## Recommended Default

**Default:** Query database directly; cache + hydrate only for hot, stable data
**Reason:** Cache invalidation complexity often outweighs benefits for frequently-changing data.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Hydration for Model Creation from Arrays
