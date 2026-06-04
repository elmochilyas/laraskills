## Pivot Relation Events vs Custom Pivot Model Events

Choosing between listening to `Illuminate\Database\Events\Pivot\*` events (attaching, attached, detaching, detached, updating, updated) and using custom pivot model observers for reacting to pivot changes.

---

## Decision Context

When a many-to-many relationship row is created, updated, or deleted, you must decide whether to react via pivot relation events or custom pivot model events.

---

## Decision Criteria

* whether the pivot row is created via `attach()`/`detach()`/`sync()` (relation methods) or via `$pivot->save()` (model save)
* whether per-row granularity is needed for `sync()` operations
* whether pre-event validation (authorization, business rules) is needed
* whether the pivot has a custom model with casts/accessors

---

## Decision Tree

Reacting to pivot table changes?

↓

Is the pivot change made via `attach()`/`detach()`/`sync()` (relation-level)?

YES → Use Pivot Relation Events — `attaching`, `attached`, `detaching`, `detached`, `updating`, `updated`

    Is pre-event validation needed (e.g., max roles check)?

    YES → Use `attaching` (pre-event) — throw to abort

    NO → Use `attached` (post-event) for side effects (cache invalidation, logging)

    Does `sync()` need per-row events?

        YES → Iterate IDs manually instead of single `sync()` call

        NO → Pivot relation events batch per operation type — sufficient

NO → Is the pivot change made via `$pivot->save()` (custom pivot model)?

    YES → Use standard Model Events — observer pattern on custom pivot model

    Does the pivot need type casting?

    YES → Custom pivot model (extends Pivot/MorphPivot) with `$casts`

        Then use model events on that custom model

---

## Rationale

`attach()`/`detach()` do NOT go through the pivot model's save cycle — they insert/delete directly. So pivot model observers won't fire. Pivot relation events (`Attached`, `Detached`) are the correct hook for relationship-level changes. When you explicitly call `$pivot->save()`, standard model events fire.

---

## Recommended Default

**Default:** Pivot relation events for `attach()`/`detach()/`sync()`; model events for `$pivot->save()`
**Reason:** The two event systems react to different code paths — using the wrong one silently does nothing

---

## Risks Of Wrong Choice

Custom pivot model observers never fire for `attach()`/`detach()`; pivot relation events miss changes made via `$pivot->save()`.

---

## Related Rules

- Register pivot event listeners in `EventServiceProvider` (from pivot-events standardized knowledge)

---

## Related Skills

- Pivot event listener registration (relationships/06-skills.md)
- Pivot event faking in tests (relationships/06-skills.md)
