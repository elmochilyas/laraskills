# Event Catalog

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
Eloquent models fire 21+ lifecycle events during their lifetime, covering creation, update, deletion, soft deletes, restoration, replication, retrieval, and booting. These events are dispatched through Laravel's event dispatcher and provide hooks for side effects, validation, authorization, and synchronization. Every event maps to a specific phase of the model's interaction with the database, and understanding the full catalog is prerequisite to controlling model behavior without overriding methods.

## Core Concepts
- **Lifecycle phases:** Retrieval (from DB), Persistence (save/update), Deletion (delete/forceDelete), Soft Delete (trash/restore), Boot (class initialization), Replication (model copy)
- **Event naming convention:** Events use the past participle or present participle form (e.g., `created`, `creating`, `saved`, `saving`) â€” the present tense fires *before* the operation, the past tense fires *after* the operation completes.
- **Return value halting:** Returning `false` from a `*ing` (before) event prevents the operation from completing; `*ed` (after) events cannot halt.
- **Event payload:** Each event receives the model instance; some events (like `deleted`) also pass the previous state via the model's original attributes.
- **Pivot events:** `pivotAttaching`, `pivotAttached`, `pivotDetaching`, `pivotDetached`, `pivotUpdating`, `pivotUpdated` fire during `sync()`, `attach()`, `detach()`, and `updateExistingPivot()` on BelongsToMany relationships.

## Mental Models
- **Before/After sandwich:** Every mutating DB operation is wrapped in a before-event (present participle) and after-event (past participle). The before event can abort; the after event observes the result.
- **Event cascade chain:** Saving -> Creating -> Created -> Saved is the correct sequence for a new model. Understanding the nesting is critical because `saving` fires once per save, while `creating`/`created` fires only for inserts.
- **Pivot events as relationship lifecycle:** Birational relationships have their own mini lifecycle. Pivot events fire independently of the parent model events and follow the same before/after pattern.

## Internal Mechanics

> **Reference:** 
- `performInsert()` calls `fireModelEvent('creating')` before the INSERT SQL, then `fireModelEvent('created')` after.
- `performUpdate()` calls `fireModelEvent('updating')` before the UPDATE SQL, then `fireModelEvent('updated')` after.
- `save()` wraps `performInsert`/`performUpdate` with `fireModelEvent('saving')` and `fireModelEvent('saved')`.
- `delete()` fires `deleting` before the DELETE SQL, then `deleted` after. If using `SoftDeletes`, the delete path sets `deleted_at` instead.
- `replicate()` fires `replicating` before copying attributes.
- `newQuery()` and `newModelQuery()` fire `retrieved` on existing models when hydrated from the database. `retrieving` was added in Laravel 11.
- `boot()` and `initializeTraits()` fire `booting`/`booted` during construction.
- `BelongsToMany::sync()`, `attach()`, `detach()`, and `updateExistingPivot()` fire pivot events via the `PivotEventHandlers` trait.

### Complete Event Catalog

| Event | Phase | Halts? | Trigger |
|-------|-------|--------|---------|
| `retrieving` | Boot | No | Model hydration from DB (Laravel 11+) |
| `retrieved` | Boot | No | After model hydration from DB |
| `booting` | Boot | No | Before `boot()` traits are called |
| `booted` | Boot | No | After `boot()` traits are called |
| `replicating` | Persist | N/A | Before `replicate()` copies attributes |
| `saving` | Persist | Yes | Before INSERT or UPDATE |
| `saved` | Persist | No | After INSERT or UPDATE |
| `creating` | Persist | Yes | Before INSERT only |
| `created` | Persist | No | After INSERT only |
| `updating` | Persist | Yes | Before UPDATE only |
| `updated` | Persist | No | After UPDATE only |
| `trashing` | Soft Delete | Yes | Before setting `deleted_at` (SoftDeletes) |
| `trashed` | Soft Delete | No | After setting `deleted_at` (SoftDeletes) |
| `deleting` | Delete | Yes | Before DELETE or setting `deleted_at` |
| `deleted` | Delete | No | After DELETE or setting `deleted_at` |
| `forceDeleting` | Soft Delete | Yes | Before force DELETE when soft-deleted |
| `forceDeleted` | Soft Delete | No | After force DELETE when soft-deleted |
| `restoring` | Soft Delete | Yes | Before clearing `deleted_at` |
| `restored` | Soft Delete | No | After clearing `deleted_at` |
| `pivotAttaching` | Pivot | N/A | Before attaching a pivot record |
| `pivotAttached` | Pivot | No | After attaching a pivot record |
| `pivotDetaching` | Pivot | N/A | Before detaching a pivot record |
| `pivotDetached` | Pivot | No | After detaching a pivot record |
| `pivotUpdating` | Pivot | N/A | Before updating an existing pivot record |
| `pivotUpdated` | Pivot | No | After updating an existing pivot record |

## Patterns
- **Audit logging:** Listen to `created`, `updated`, `deleted` events to write audit trail entries. Log both old and new attributes via `$model->getOriginal()` vs `$model->getAttributes()`.
- **Validation enforcement:** Listen to `saving` or `creating` to perform business rule validation that cannot be expressed in standard Laravel validation rules. Return `false` to prevent save.
- **Cache invalidation:** Listen to `saved` or `deleted` to clear related caches. Use `saved` (not `updated`) to cover both creates and updates.
- **Soft delete cascade:** Listen to `deleting` to cascade soft deletes to related models, or `restored` to cascade restoration.
- **Read model projection:** Use `saved` and `deleted` to update denormalized read models or search indexes (Elasticsearch, Meilisearch).

## Architectural Decisions
- **Why no `retrieved` on eager loaded relations?** â€” Eager loaded relations hydrate through the same `newFromBuilder()` path and do fire `retrieved`. This is consistent behavior, but the number of events scales with relation depth.
- **Why `saving`/`saved` wraps `creating`/`created`?** â€” The wrapping allows a single listener to intercept all persistence without distinguishing insert vs. update. Finer-grained listeners can target `creating` or `updating` specifically.
- **Why pivot events exist separately?** â€” Pivot records are not full Eloquent models by default; they need independent lifecycle hooks. `BelongsToMany` operations are batch-oriented and fire one event per affected row.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Comprehensive lifecycle hooks for all operations | 21+ events create cognitive overhead | Focus on the 5-7 high-use events (saving, saved, creating, created, deleting, deleted) |
| Before-events allow operation abortion | Aborted operations leave the model in a dirty state | Listeners must not partially modify state before returning false |
| Pivot events expose relationship mutation | Pivot events fire in bulk â€” attaching 10 rows fires 10 events | May need rate-limiting or batching for high-volume pivot operations |
| `retrieved` on eager loads is automatic | Deep eager loading can fire hundreds of events unexpectedly | Disable events globally if models are read-only in a context |

## Performance Considerations
- **Event dispatch overhead:** Each event dispatches through Laravel's event system, which iterates all registered listeners. For bulk operations (`insert()`, `update()` without model events), events do not fire â€” use the query builder instead.
- **`retrieved` scaling:** On large eager loads, `retrieved` fires for every hydrated model. Thousands of models in a collection means thousands of dispatched events. Consider disabling events via `Model::withoutEvents()` for read-heavy operations.
- **Pivot event batching:** `sync()` with 1000 IDs fires 1000 `pivotAttached` events. This is a performance cliff â€” use `syncWithoutDetaching()` or direct DB inserts for bulk pivot operations.
- **Observer overhead:** Each observer method is a separate registered listener. Multiple observers on the same event compound dispatch time.

## Production Considerations
- **Observer vs. event coupling:** Observers silently register on boot. Overuse makes production behavior opaque. Log observer execution in development environments.
- **Event idempotency:** `updated` fires even if no columns changed (the model still runs `performUpdate`), unless `getDirty()` is empty. Listeners must check `$model->wasChanged()` to detect real changes.
- **Serialization side effects:** Accessing `$model->getOriginal()` in a `deleted` listener is safe â€” the original attributes are stored before deletion.
- **Queueing event listeners:** For slow side effects (email, API calls), queue the listener. Use `ShouldQueue` on the listener class. Be aware that `$model->fresh()` in a queued listener returns null for deleted models.

## Common Mistakes
- **Using `saved` when only `created` is needed:** `saved` fires on every save; if the logic only applies to new models, use `created`.
- **Relying on `retrieved` for authorization:** `retrieved` fires on every hydration, including internal framework queries (auth, session). This can break login and other critical paths.
- **Forgetting `forceDeleted` exists:** Soft deleted models still fire `deleting` and `deleted` â€” they do not fire `forceDeleting`/`forceDeleted` unless a true force delete occurs.
- **Mutating model state in `*ing` events after returning false:** If a listener returns `false`, the operation is aborted but any model mutations made by the listener persist. This causes unexpected state.

## Failure Modes
- **Infinite event loop:** A listener on `saved` that calls `save()` again causes infinite recursion. Use `saveQuietly()` or a guard flag (`$model->savingWithoutEvents = true`).
- **Event suppression cascade:** Disabling events with `withoutEvents()` for a parent operation also suppresses child-model events if they fire synchronously. Children that depend on events (cache invalidation, audit) will miss them.
- **Pivot event silence:** `sync()` without a model instance (using raw IDs) does not fire pivot events. Only `sync()` with model instances triggers the event system.
- **Model not found in queued `deleted` listener:** By the time a queued listener processes, `$model->fresh()` returns null. Store needed data (model ID, attributes) explicitly in the job.

## Ecosystem Usage
- **Laravel Auditing (`owen-it/laravel-auditing`):** Relies on `retrieved`, `created`, `updated`, `deleted` to record audit trails.
- **Spatie Activitylog:** Listens to model events to log activity with context metadata.
- **Laravel Scout:** Uses `saved` and `deleted` events to sync search indexes.
- **Laravel Cashier:** Listens to subscription model events for billing lifecycle management.

## Related Knowledge Units

### Prerequisites
- Eloquent Model Basics
- Event Dispatcher

### Related Topics
- Event Dispatch Order (exact sequence)
- Event Propagation (halting)
- Observer Pattern (structured listeners)

### Advanced Follow-up Topics
- Quiet Operations (event suppression)
- Manual Event Firing
- Broadcast Events Trait

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\Model.php` â€” `fireModelEvent()`, `performInsert()`, `performUpdate()`, `delete()`. `Illuminate\Database\Eloquent\Concerns\HasEvents` trait contains the core event dispatch logic. `Illuminate\Database\Eloquent\Relations\BelongsToMany` contains pivot event logic.
- **Key Insight:** The before/after sandwich pattern means every save operation fires at minimum 4 events (saving -> creating/updating -> created/updated -> saved). This is important for performance tuning â€” each event dispatches to all registered listeners.
- **Version-Specific Notes:** `retrieving` event was added in Laravel 11. Prior to that, only `retrieved` existed. The `forceDeleted` event was added in Laravel 9.x. Pivot updating events were added in Laravel 10.x.
