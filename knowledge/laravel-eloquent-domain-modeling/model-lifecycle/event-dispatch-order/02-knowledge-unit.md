# Event Dispatch Order

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
Eloquent model events fire in a strict, deterministic order during every database operation. The sequence follows a nested pattern: outer lifecycle (saving/saved) wraps inner lifecycle (creating/created or updating/updated), with trait boot events and relational cascading interspersed. Understanding this order is essential for writing predictable event listeners and diagnosing order-dependent bugs.

## Core Concepts
- **Insert order:** `saving` -> `creating` -> INSERT SQL -> `created` -> `saved`
- **Update order:** `saving` -> `updating` -> UPDATE SQL -> `updated` -> `saved`
- **Delete order:** `deleting` -> DELETE SQL -> `deleted`
- **Soft delete order:** `deleting` -> `trashing` -> UPDATE `deleted_at` -> `trashed` -> `deleted`
- **Restore order:** `restoring` -> UPDATE `deleted_at = NULL` -> `restored`
- **Force delete order (soft deleted):** `forceDeleting` -> DELETE SQL -> `forceDeleted`
- **Replicate order:** `replicating` -> attribute copy -> (no further events)
- **Boot order (construction):** parent constructor -> `booting` -> trait `boot*()` methods -> `booted` -> `retrieving` (if hydrating) -> `retrieved` (if hydrating)
- **Nested save behavior:** `saving`/`saved` fire exactly once per `save()` call. `creating`/`created` or `updating`/`updated` fire based on whether the operation is an insert or update. If `saving` returns false, the entire save chain is aborted.

## Mental Models
- **Matryoshka nesting:** Each persistence operation is a set of Russian nesting dolls. `saving` is the outer shell; `saved` closes it. Inside, the specific operation events (`creating`/`created` or `updating`/`updated`) form the inner shell.
- **Decision tree:** On `save()`, the model checks `$this->exists`. If true, it's an update path. If false, it's an insert path. This check happens between `saving` and the inner events.
- **Firewall halting:** A `false` return at any `*ing` (before) event aborts the entire chain. No further events in that chain fire; no DB operation occurs.

## Internal Mechanics

> **Reference:** 
- `save()` is defined in `Model.php`. It calls `fireModelEvent('saving')`, then either `performInsert()` or `performUpdate()`.
- `performInsert()` calls `fireModelEvent('creating')`, runs the INSERT, sets `$exists = true`, calls `fireModelEvent('created')`, and sets `$wasRecentlyCreated = true`.
- `performUpdate()` checks `getDirty()`; if dirty, calls `fireModelEvent('updating')`, runs the UPDATE, then calls `fireModelEvent('updated')`.
- After the inner operation, `save()` calls `fireModelEvent('saved')` and `finishSave()` which resets computed properties.
- `delete()` is more complex: for `SoftDeletes`, it can fire `deleting` -> `trashing` -> update timestamp -> `trashed` -> `deleted`. The `trashing`/`trashed` events are fired from `SoftDeletes::runSoftDelete()`.
- `restore()` fires `restoring`, runs the restoration query, then fires `restored`. Notably, it does NOT fire `saving`/`saved`.
- `forceDelete()` on a soft-deletable model fires `forceDeleting`, runs the DELETE, then fires `forceDeleted`.

## Patterns
- **Operation-specific listener:** Register `creating` to enforce insert-only validation (e.g., slug generation). The same logic in `saving` would also fire on updates.
- **Unified persistence hook:** Use `saving`/`saved` for logic that must run on both inserts and updates (e.g., cache invalidation, `updated_at` override).
- **Post-commit logic:** For side effects that must survive the transaction, wrap logic in `saved` and check `$model->wasRecentlyCreated` to differentiate insert from update.
- **Trait boot ordering awareness:** When multiple traits define `bootTraitName()`, the execution order follows trait composition order (left-to-right in `use` statement), not the event system. All boot methods execute before any `retrieved` event.

## Architectural Decisions
- **Why does `saving` wrap the inner events?** â€” The wrapping ensures that any listener attached to `saving` can abort the entire persistence operation regardless of insert/update path. This reduces the need to register on both `creating` and `updating`.
- **Why does `restore()` not fire `saving`/`saved`?** â€” Restoration is conceptually separate from a regular save; it resets the soft-delete state. Wrapping it in `saving`/`saved` would cause duplicate execution of persistence listeners.
- **Why does `trashing` fire between `deleting` and the SQL?** â€” The order allows listeners on `deleting` to inspect the model before any mutation, and listeners on `trashing` to react specifically to the soft-delete timestamp update.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Deterministic order simplifies reasoning | Different paths (insert vs. update) share outer events | Listeners must check `$model->exists` or `wasRecentlyCreated` to branch |
| `saving` provides a single abort point | `restore()` bypasses `saving` | Restoration-specific logic cannot rely on `saving` listeners |
| Before/after sandwich is intuitive | Nested events can double-fire if not careful | `touch()` on related models re-enters the lifecycle |

## Performance Considerations
- **Event dispatch churn:** A single `save()` dispatches 4 events (saving -> creating/updating -> created/updated -> saved) plus all registered listeners. Each additional observer or listener multiplies dispatch time.
- **Halting overhead:** If a `saving` listener returns `false`, the inner events never fire. This is efficient for early-abort scenarios but wasteful if the inner events would have also returned false (duplicate checks).
- **`exists` check cost:** The `$this->exists` branching incurs no query cost â€” it's a boolean property check.

## Production Considerations
- **Transactional consistency:** Events fire within the same transaction (if one is active). If a listener throws an exception inside a transaction, the entire operation rolls back, including the firing of `*ed` events.
- **Observer interplay:** When observers define both `saving` and `creating`, `saving` fires first. If `saving` returns false, `creating` never fires. This can cause observers to behave differently than expected if they assume both always fire.
- **Logging dispatch order:** In development, log the event sequence for complex operations. This helps diagnose order-dependent side effects.

## Common Mistakes
- **Assuming `created` always follows `saving`:** On update, `saving` is followed by `updating`, not `creating`. `created` only fires on insert.
- **Expecting `saved` to fire after `restore()`:** `restore()` does NOT fire `saving`/`saved`. Attach restoration listeners to `restored` directly.
- **Relying on `wasChanged()` in `saving`:** `saving` fires before the DB operation. `wasChanged()` compares pre-save state and may not reflect what the listener just modified.
- **Registering on both `saving` and `creating` with overlapping logic:** The same code runs twice on insert. Always guard with `$model->exists` or restructure to use only `creating` for insert-only logic.

## Failure Modes
- **Re-entrant save loops:** A listener on `saved` that calls `save()` triggers a new event chain: saving -> ... -> saved -> saving -> ... This is the most common infinite loop in Eloquent applications.
- **Aborted chain leaves model mid-mutation:** If `saving` modifies model attributes then returns false, the model retains those modifications even though the DB was not updated. The model is in an inconsistent state.
- **Transaction rollback reverses event order perception:** If an exception occurs in a `created` listener, the INSERT is rolled back, but `saved` already fired. Some listeners observe a creation that never committed.

## Ecosystem Usage
- **Laravel Auditing:** Listens on `retrieved`, `created`, `updated`, `deleted`, `restored` to record audit entries. Depends on correct ordering to capture pre- and post-state.
- **Laravel Scout:** Listens on `saved` and `deleted` to sync search indexes. Does not use `created`/`updated` to avoid missing restore events.
- **Spatie Media Library:** Uses `saving` and `deleting` to manage file cleanup, depending on the before-event order.

## Related Knowledge Units

### Prerequisites
- Event Catalog (list of all events)

### Related Topics
- Event Propagation (halting mechanics)
- Event Control (quiet operations)
- Observer Pattern

### Advanced Follow-up Topics
- Trait Boot Ordering
- Transactional Events
- Nested Save Behavior

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Model.php` lines 640-680 (save), 700-730 (performInsert), 750-780 (performUpdate), 800-830 (delete). `Illuminate\Database\Eloquent\SoftDeletes.php` for `trashing`/`trashed` ordering.
- **Key Insight:** The order of `saving` before `creating`/`updating` means that a `saving` listener cannot know whether the operation will be an insert or update unless it checks `$model->exists`. The `exists` property is not updated until `performInsert()` sets it after the INSERT succeeds.
- **Version-Specific Notes:** Laravel 9.x introduced `forceDeleted` event. Laravel 11.x added `retrieving` event. The `trashing`/`trashed` events have been present since SoftDeletes was introduced in Laravel 4.x.
