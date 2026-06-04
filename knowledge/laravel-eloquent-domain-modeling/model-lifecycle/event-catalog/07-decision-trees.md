## Before vs After Event Selection

Choosing between `*ing` (before) and `*ed` (after) events for lifecycle reaction placement.

---

## Decision Context

When reacting to a model lifecycle event, you must place logic in either the before-event (`saving`, `creating`, `updating`, `deleting`) or the after-event (`saved`, `created`, `updated`, `deleted`).

---

## Decision Criteria

* whether the operation should be prevented (before-event can halt)
* whether the operation has already succeeded (after-event is post-persistence)
* whether the side effect depends on the model having an ID
* whether the reaction must happen atomically with the persistence

---

## Decision Tree

Reacting to a model lifecycle event?

↓

Do you need to potentially prevent/abort the operation?

YES → Use `*ing` event (can return `false` to halt)

    Examples: validation, authorization, uniqueness checks

NO → Use `*ed` event (operation already succeeded)

    Does the reaction depend on the model having a DB-generated ID?

    YES → Use `created` (not `saving` — ID not yet assigned)

    Does the reaction need to happen atomically with the persist?

    YES → Use `*ing` event (runs in same transaction before commit)

---

## Rationale

`*ing` events fire before the database operation and can abort by returning `false`. `*ed` events fire after the operation succeeds and cannot abort. Side effects (cache, notifications) belong in `*ed` events since the operation already completed successfully.

---

## Recommended Default

**Default:** Use `*ed` events for side effects, `*ing` events for validation/authorization
**Reason:** `*ing` events should be reserved for halting conditions; `*ed` events are safer for non-critical side effects

---

## Risks Of Wrong Choice

Using `*ed` event for validation (can't abort the operation after persist); using `*ing` event for side effects (runs even if the operation might fail later).

---

## Related Rules

- Event timing and halting behavior (from event-catalog standardized knowledge)

---

## Related Skills

- Event listener registration (model-lifecycle/06-skills.md)

---

## Event Type Selection (created vs updated vs saved)

Choosing between `created`, `updated`, and `saved` for post-persistence reactions.

---

## Decision Context

When a post-persistence reaction is needed, you must decide whether it should fire on all saves (`saved`), only on creates (`created`), or only on updates (`updated`).

---

## Decision Criteria

* whether the distinction between insert and update matters
* whether the same reaction should fire for both creates and updates
* whether the reaction needs to check `$model->wasChanged()`

---

## Decision Tree

Post-persistence reaction needed?

↓

Should this fire on both create AND update?

YES → Use `saved` event

Should this fire only on create (first save)?

YES → Use `created` — fires only on INSERT

Should this fire only on update (existing model changed)?

YES → Use `updated` — fires only on UPDATE with changes

---

## Rationale

`saved` fires for both creates and updates. Use `created`/`updated` when the distinction matters (e.g., send welcome email only on create). Use `saved` when the same reaction should apply regardless (cache invalidation).

---

## Recommended Default

**Default:** Use `created`/`updated` when the distinction matters; use `saved` when it doesn't
**Reason:** More precise events prevent unintended behavior; `saved` is simpler for duplicate-safe operations

---

## Risks Of Wrong Choice

Using `saved` when email should only send on first create (duplicate emails on update); using `created` when cache invalidation is needed on both create and update (stale cache on update).
