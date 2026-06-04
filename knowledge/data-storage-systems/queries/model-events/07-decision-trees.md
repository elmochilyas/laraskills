# 2-19 Model Events - Decision Trees

## Event-Driven Logic vs Direct Call in Controller

---

## Decision Context

Choosing between implementing side-effects (logging, cache invalidation) via model events vs calling them directly in controller/service code.

---

## Decision Criteria

* performance: events are synchronous — heavy operations block the response
* architectural: events keep concerns separated; direct calls are explicit
* maintainability: Observer class groups related event logic

---

## Decision Tree

Need to perform side-effects when a model is saved?

↓

Is the operation heavy (>100ms API call, large computation)?

YES → Dispatch a queued job in the event

    ↓
    `static::saved(fn($model) => Dispatchable::dispatch($model->id))`
    
    ↓
    Never perform heavy sync operations in events — they block the response

NO → Simple operation (cache clear, log write)?

    YES → Use model event or Observer
        
        ↓
        Cache invalidation:
        `static::saved(fn($model) => Cache::forget("post:{$model->id}"))`
        
        ↓
        Multiple events? Use Observer:
        ```php
        class PostObserver
        {
            public function saved(Post $post) { Cache::forget("post:{$post->id}"); }
            public function deleted(Post $post) { Cache::forget("post:{$post->id}"); }
        }
        ```

---

## Recommended Default

**Default:** Use model events for cross-cutting concerns; queue heavy operations
**Reason:** Events keep side-effects near the model definition. Queuing prevents response-time bloat.

---

## Related Rules

* Rule 4: Review and apply core concepts

---

## Related Skills

* Apply Model Events and Observers for Side Effects
