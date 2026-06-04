# Pivot Events

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Pivot Events
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Pivot events are lifecycle hooks that fire when many-to-many relationship rows are attached, detached, or updated. Eloquent dispatches `attached`, `detached`, and `updated` events (and their present-tense counterparts `attaching`, `detaching`, `updating`) on the `BelongsToMany` relation instance. These events are separate from standard Eloquent model events — they fire on the relationship, not on the pivot model itself. Understanding pivot events is critical for auditing relationship changes, triggering side effects on association, and maintaining referential integrity in application code.

---

## Core Concepts

When `attach()` is called on a `BelongsToMany` relation, Eloquent fires `attaching` (before) and `attached` (after) events. Similarly, `detach()` fires `detaching`/`detached`, and `updateExistingPivot()` fires `updating`/`updated`. These events are dispatched via the container's event dispatcher and can be listened to using the `Illuminate\Database\Events\Pivot\Attached`, `Detached`, `Updated` event classes (Laravel 8+). The pivot model's own lifecycle events (saving, saved, creating, created, etc.) do NOT fire — pivot rows are not treated as full Eloquent models during `attach()`/`detach()`. The event payload includes the parent model, the related model class name, and the pivot IDs affected. Custom pivot models that override `save()` or `delete()` can trigger model events, but the default `attach()`/`detach()` path bypasses the model entirely and performs raw SQL queries.

---

## Mental Models

Think of pivot events as **transaction log entries for graph edge mutations**. When a relationship is created or destroyed, the event is a notification that an edge in the graph changed, not that a vertex changed. This distinction explains why pivot events fire on the relation, not the model — they belong to the connection, not either endpoint. The asymmetry between "plain pivot writes fire events on the relation" and "custom pivot model writes can fire on the model" is a key nuance: using custom pivot models and calling `$pivot->save()` explicitly does trigger model events, while `attach()`/`detach()` does not.

---

## Internal Mechanics

`BelongsToMany` uses the `Illuminate\Database\Eloquent\Relations\Concerns\InteractsWithPivotTable` trait, which defines `attach()`, `detach()`, `sync()`, and `updateExistingPivot()`. Each method fires events via `static::$dispatcher->dispatch(new Pivot\Attached(...))`. The event classes extend `Illuminate\Database\Events\Pivot\PivotEvent` and carry `$parent` (the parent model), `$pivotIds` (array of related IDs affected), and for `Updated`, the changed attributes. The dispatch happens inside a database transaction for `sync()` but not for individual `attach()` calls. The `attaching` variant fires before the DB write, allowing listeners to veto or modify the operation by throwing an exception. Importantly, if the pivot model extends `Pivot` and has event listeners registered, calling `$pivot->save()` directly will fire those listeners — but the relationship's `attach()` method does not call `$pivot->save()`.

---

## Patterns

- **Audit logging**: Listen for `Attached`/`Detached` events to log relationship changes for compliance or activity feeds.
- **Cache invalidation**: On `attached`/`detached`, invalidate cache keys that depend on the related collection.
- **Side-effect triggering**: On `attached`, dispatch a job to send a notification or update a counter.
- **Validation via `attaching`**: Listen to the `attaching` event and throw an exception to prevent invalid relationships.
- **Custom pivot model saves**: If you need model events on pivot writes, use a custom pivot model and call `$pivot->fill(...)->save()` explicitly instead of `attach()`.

---

## Architectural Decisions

Laravel's choice to fire events on the relation rather than the pivot model is based on performance: `attach()` executes a raw `INSERT` without hydrating a pivot model instance, avoiding object construction overhead. Firing model events would require instantiating the pivot, which defeats the purpose of `attach()` as a lightweight operation. The introduction of dedicated `Pivot\Attached` event classes (Laravel 8) formalized this pattern. The design tradeoff is that developers expecting `saved`/`created` model events to fire on pivot rows will find those events absent during `attach()`/`detach()`.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| `attach()`/`detach()` stay lightweight (no model hydration) | No model events from relationship methods | Developers with observer-based workflows must pivot to relation events |
| Dedicated `Pivot\Attached` events are explicit and typed | Two event systems to learn: model vs pivot | Confusion about why pivot model observers don't fire |
| `attaching` event allows pre-write validation | No native way to abort a `sync()` mid-operation | `sync()` processes all operations; must validate before calling |
| Event payload includes parent model and IDs | Event doesn't include the full related model | Listeners must re-fetch related models if they need attribute data |

---

## Performance Considerations

Pivot events add minimal overhead — the event dispatch is a single method call per operation. For bulk `sync()` calls with hundreds of IDs, the events are batched: `sync()` fires one `attached` event per unique operation type (insert/delete/update), not per row. This means a sync that attaches 100 roles fires one `attached` event with all 100 IDs. Custom pivot model saves that fire model events are significantly more expensive because each save triggers the full model event chain.

---

## Production Considerations

If using a queue for side effects, keep pivot event listeners fast — they run synchronously during the request. For heavy side effects (email notifications, external API calls), dispatch a queued job from the event listener. Pivot events are dispatched even when running in console commands, artisan tinker, or tests — be aware that seeders may trigger pivot event listeners. If you need transactional integrity, wrap `sync()` in a database transaction manually; Eloquent does not automatically wrap pivot operations in transactions.

---

## Common Mistakes

- **Registering model observers on pivot models expecting them to fire on `attach()`**: Why it happens: treating pivot models as regular Eloquent models. Why it's harmful: observer methods (created, saving, etc.) never execute during `attach()`/`detach()`. Better approach: use `dispatcher->listen(Pivot\Attached::class, ...)` or register on the `BelongsToMany` event.
- **Not distinguishing between `attaching`/`attached` lifecycle phases**: Why it happens: using only the "after" event. Why it's harmful: can't prevent invalid attachments. Better approach: use `attaching` for validation/authorization, `attached` for side effects.
- **Assuming `sync()` fires per-row events**: Why it happens: treating `sync()` as individual `attach`/`detach` calls. Why it's harmful: event listeners that expect per-row granularity receive batched IDs. Better approach: iterate IDs manually if per-row event granularity is needed.
- **Forgetting to register the event listener in a service provider**: Why it happens: listeners are registered in `EventServiceProvider` but the `Pivot\Attached` event is namespaced under `Illuminate\Database\Events`. Why it's harmful: listener silently never fires. Better approach: explicitly import the event class and register in `$listen`.

---

## Failure Modes

- **Listener throws on `attaching`**: If an event listener throws an exception, the entire `attach()` fails — but only for that one call. `sync()` may partially execute before failure.
- **Silent swallowing of pivot events**: If no listener is registered, the events are dispatched and consumed by the framework with no effect — but developers who inspect `Event::fake()` may be surprised that pivot events are still real.
- **Duplicate event dispatch from custom pivot model saves**: If a custom pivot model is saved explicitly AND the relationship event fires, side effects may run twice. Guard listeners with idempotency checks.
- **Event payload type confusion**: The `Attached` event carries `$pivotIds` as an array of mixed types — if using UUIDs, ensure the listener handles string IDs correctly.

---

## Ecosystem Usage

Laravel Nova uses pivot events to sync relationship data across form submissions. Spatie's activity log package listens to pivot events to record relationship changes in audit trails. E-commerce platforms listen to `attached` on order-product pivots to decrement inventory after order placement. Team management applications use `attaching` to validate team member capacity limits before allowing new members.

---

## Related Knowledge Units

### Prerequisites
- pivot-table-conventions (understanding pivot table operations)
- Eloquent Model Events & Observers (familiarity with Eloquent event system)
- pivot-attributes (understanding pivot data that changes triggers events)

### Related Topics
- custom-pivot-models (when to use model events vs relation events)
- sync vs attach vs detach operation semantics

### Advanced Follow-up Topics
- Event-driven relationship synchronization across microservices
- Pivot event idempotency patterns for queue reliability
- Custom event classes for domain-specific pivot operations

---

## Research Notes

### Source Analysis
`Illuminate\Database\Eloquent\Relations\Concerns\InteractsWithPivotTable` at `src/Illuminate/Database/Eloquent/Relations/Concerns/InteractsWithPivotTable.php`. The `attach()` method dispatches events at lines ~60–90. Event classes are in `Illuminate\Database\Events\Pivot\`. The `sync()` method uses `attach()` and `detach()` internally, so events fire through those methods.

### Key Insight
The pivot event system is deliberately separate from model events to keep `attach()`/`detach()` lightweight. This means developers must think in terms of "relationship mutation events" rather than "model lifecycle events" when working with many-to-many pivots.

### Version-Specific Notes
The `Attached`, `Detached`, `Updated` event classes were introduced in Laravel 8. Before Laravel 8, pivot events were dispatched as generic `eloquent.*` events. Laravel 9+ added `Pivot\Attaching` and `Pivot\Detaching` (pre-event variants). Laravel 11 did not change the pivot event system.
