# Pivot Events — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Pivot Events
- **ECC Version:** 1.0

## Overview
Pivot events are lifecycle hooks that fire when many-to-many relationship rows are attached, detached, or updated. Eloquent dispatches `attached`, `detached`, and `updated` events (and their pre-event counterparts) on the `BelongsToMany` relation instance. These are separate from standard Eloquent model events — they fire on the relationship, not on the pivot model itself.

## Core Concepts
- `attach()` fires `attaching` (before) and `attached` (after) events
- `detach()` fires `detaching`/`detached` events
- `updateExistingPivot()` fires `updating`/`updated` events
- Event classes: `Illuminate\Database\Events\Pivot\Attached`, `Detached`, `Updated`
- Pivot model lifecycle events (saving, saved, etc.) do NOT fire during `attach()`/`detach()`
- `sync()` fires one event per unique operation type (insert/delete/update), not per row
- Event payload includes parent model, related class name, and pivot IDs affected
- Custom pivot models that call `$pivot->save()` explicitly DO fire model events

## When To Use
- Audit logging: record when relationships are created or destroyed
- Cache invalidation: clear caches when pivot data changes
- Side-effect triggering: dispatch jobs on relationship changes (notifications, counters)
- Validation: use `attaching` event to prevent invalid relationships
- Synchronization: keep external systems in sync with relationship changes

## When NOT To Use
- Do NOT use pivot events for side effects that should happen on model lifecycle events
- Do NOT use when you need per-row granularity with `sync()` — events are batched per operation type
- Do NOT use when the overhead of event dispatch is unacceptable in hot paths (rare)
- Do NOT expect custom pivot model observers to fire on `attach()`/`detach()` — they won't

## Best Practices (WHY)
- Use `attaching` (pre-event) for validation/authorization — throw to abort
- Use `attached` (post-event) for side effects like notifications and cache clearing
- Keep listeners fast — they run synchronously during the request
- For heavy side effects, dispatch a queued job from the event listener
- Wrap `sync()` in a database transaction when transactional integrity is needed
- Register listeners in `EventServiceProvider` using the event class namespace

## Architecture Guidelines
- Distinguish between pre-events (validation) and post-events (side effects)
- Use `Event::fake()` in tests to assert pivot events were dispatched
- Be aware that pivot events fire even in console commands, tinker, and tests
- For per-row event granularity with `sync()`, iterate IDs manually
- Document that pivot model observers don't fire on `attach()`/`detach()`

## Performance
- Event dispatch is a single method call per operation — minimal overhead
- `sync()` with hundreds of IDs fires one event per operation type, not per row
- Custom pivot model `$pivot->save()` triggers full model event chain — significantly more expensive
- The event payload includes parent model and IDs — no full model hydration

## Security
- `attaching` event can be used to authorize relationship changes (throw to reject)
- Ensure pivot event listeners don't leak sensitive information in their payloads
- `Event::fake()` in tests can be used to assert pivot events without executing handlers

## Common Mistakes
- Registering model observers on pivot models expecting them to fire on `attach()`/`detach()` — they don't
- Not distinguishing between `attaching`/`attached` lifecycle phases — using only "after" events
- Assuming `sync()` fires per-row events — events are batched per operation type
- Forgetting to register the event listener in a service provider — listener silently never fires

## Anti-Patterns
- **Heavy synchronous listeners**: running expensive operations in pivot event listeners
- **Expecting model events from attach/detach**: relying on pivot model observers for relationship changes
- **Per-row sync without batching**: calling sync() in a loop when a single sync() with all IDs works
- **Unvalidated attach**: not using `attaching` event when pre-write validation is needed

## Examples
```php
// Register listener
class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        \Illuminate\Database\Events\Pivot\Attached::class => [
            LogRoleAttachment::class,
        ],
        \Illuminate\Database\Events\Pivot\Detached::class => [
            ClearRoleCache::class,
        ],
    ];
}

// Pre-event validation
Event::listen(\Illuminate\Database\Events\Pivot\Attaching::class, function ($event) {
    if ($event->parent instanceof User && $event->parent->roles()->count() >= 10) {
        throw new \RuntimeException('Maximum roles exceeded');
    }
});

// Side effect on attach
class LogRoleAttachment
{
    public function handle(\Illuminate\Database\Events\Pivot\Attached $event): void
    {
        Log::info('Role attached', [
            'parent' => get_class($event->parent),
            'parent_id' => $event->parent->id,
            'pivot_ids' => $event->pivotIds,
        ]);
    }
}

// Custom pivot model save (fires model events)
$pivot = $user->roles->first()->pivot;
$pivot->expires_at = now()->addYear();
$pivot->save(); // This fires model events (saving, saved, etc.)

// Testing pivot events
Event::fake();
$user->roles()->attach($roleId);
Event::assertDispatched(\Illuminate\Database\Events\Pivot\Attached::class);
```

## Related Topics
- Pivot Table Conventions — pivot table operations
- Pivot Attributes — pivot data that changes triggers events
- Custom Pivot Models — when to use model events vs relation events
- Model Events & Observers — standard Eloquent event system

## AI Agent Notes
- `attach()`/`detach()` events are dispatched on the RELATION, not the pivot model
- Custom pivot model `save()` DOES fire model events — but `attach()` does not call `save()`
- `sync()` batches events: one `attached` event per operation type, not per row
- Use `attaching` (pre-event) for validation, `attached` (post-event) for side effects
- Register listeners with the full `Illuminate\Database\Events\Pivot\*` namespace

## Verification
- [ ] Pivot event listeners are registered in `EventServiceProvider`
- [ ] `attaching` event used for validation where needed
- [ ] `attached` event used for side effects (cache invalidation, logging)
- [ ] Listeners are fast and synchronous or dispatch queued jobs
- [ ] Test coverage verifies pivot events fire and assert correctly
- [ ] No expectation that pivot model observers fire on `attach()`/`detach()`
