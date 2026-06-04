# Skill: Hook into Model Lifecycle with Events and Observers

## Purpose

Attach side-effect logic (logging, cache invalidation, notifications, slug generation, audit trails) to model lifecycle events — retrieved, creating/created, updating/updated, saving/saved, deleting/deleted, trashed, forceDeleted — using model event closures or Observer classes.

## When To Use

- Automatic slug generation on creation
- Cache invalidation on update or delete
- Audit logging on model changes
- Observer classes for cross-cutting concerns

## When NOT To Use

- Operations that shouldn't block the HTTP response (dispatch to queue)
- Bulk operations where model events don't fire

## Prerequisites

- Understanding of the model lifecycle event order
- Knowledge that bulk operations don't fire model events

## Inputs

- Event type (creating, created, updating, updated, saving, saved, deleting, deleted)
- Side-effect logic (closure or Observer method)
- Conditions for cancellation (returning false from creating/updating/saving/deleting)

## Workflow

1. Register event in model's `boot()` method or create an Observer class
2. For simple events: `static::creating(fn($model) => $model->slug = Str::slug($model->title))`
3. For multiple events on one model: create `PostObserver` with methods matching event names
4. Register observer in `AppServiceProvider::boot()`: `Post::observe(PostObserver::class)`
5. Return false from creating/updating/saving/deleting to cancel the operation

## Validation Checklist

- [ ] Heavy operations queue jobs instead of blocking in events
- [ ] Bulk operations (query()->update()) are handled separately (events don't fire)
- [ ] Observers registered in a service provider
- [ ] Returning false is used intentionally for cancellation

## Common Failures

### Performing heavy operations in events
API calls, long computations, or queue dispatches inside model events block the HTTP response.

### Model events not firing in bulk operations
`User::query()->update(...)` does NOT fire model events. Only individual model `save()`, `update()`, `delete()` calls fire events.

## Decision Points

### Closure vs Observer?
Use closures in `boot()` for simple, model-specific logic. Use Observers for cross-cutting concerns (logging, auditing, notifications).

### Event vs Queue?
Use events for lightweight side effects. Dispatch to queue for heavy operations (email, API calls, file processing).

## Performance Considerations

Model events execute synchronously and block the response. Heavy operations should dispatch queued jobs. Bulk operations bypass events entirely.

## Security Considerations

Events execute with the model's current state. Ensure authorization is handled at the controller/action level, not in model events.

## Related Rules

- Dispatch heavy operations from events to the queue
- Remember bulk operations don't fire model events
- Use Observers for cross-cutting concerns

## Related Skills

- Transform Model Attributes with Accessors and Mutators
- Configure Model Serialization
- Touch Parent Timestamps on Child Changes

## Success Criteria

- Side effects are properly attached to lifecycle events
- Heavy operations are queued, not blocking
- Observer classes organize related event logic
- Bulk operations don't silently skip expected event logic
