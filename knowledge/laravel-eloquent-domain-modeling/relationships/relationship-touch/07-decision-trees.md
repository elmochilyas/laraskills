## Automatic Touch vs Manual Touch vs Async Invalidation

Choosing between `$touches` property, manual `touch()` calls, and asynchronous cache invalidation for parent timestamp propagation.

---

## Decision Context

When a child model changes and the parent's `updated_at` needs to reflect that, you must decide how to propagate the timestamp update.

---

## Decision Criteria

* whether the relationship is BelongsTo or HasOne (works) vs HasMany/BelongsToMany (doesn't)
* write frequency of the child model
* depth of the touch chain (1 level vs 2+ levels)
* whether the operation is a batch/bulk operation or single save
* whether the touch is needed for cache invalidation vs freshness tracking

---

## Decision Tree

Propagating child changes to parent timestamp?

↓

Is the relationship type supported (BelongsTo, HasOne)?

NO → Cannot use touch at all — manage parent timestamps manually

YES → Is this a write-heavy relationship (>100 child writes/minute)?

    YES → Consider async cache invalidation (queued) — synchronous touches cause excessive UPDATEs

    Is it a batch operation (seeder, import, factory)?

    YES → Use `Model::withoutTouching()` wrapper

    NO → Single child save?

        YES → Is the chain 2+ levels deep (Comment → Post → User)?

            YES → Use `Model::withoutTouching()` on intermediate + manual `touch()` on root

            NO → Use `$touches` property for automatic propagation

        NO → One-off parent update?

            YES → Use manual `$parent->touch()`

---

## Rationale

`$touches` is convenient for automatic propagation but generates an extra UPDATE per child save. For write-heavy paths, the query cost becomes significant. Async invalidation decouples timestamp updates from the request but adds complexity. Manual touch gives precise control.

---

## Recommended Default

**Default:** `$touches` property for low-write, shallow chains; `Model::withoutTouching()` for batch ops
**Reason:** Automatic propagation is simplest and matches domain expectations for timestamp freshness

---

## Risks Of Wrong Choice

$touches on write-heavy relation causes N+1 UPDATEs; no touch at all leaves parent timestamps stale; async invalidation adds complexity for rare writes.

---

## Related Rules

- Touch chain depth limit (max 2 levels)
- withoutTouching in all batch operations

---

## Related Skills

- Manual touch() invocation (relationships/06-skills.md)
- withoutTouching() scoping (relationships/06-skills.md)
