# Broadcast Events Trait

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Lifecycle
- **Last Updated:** 2026-06-02

## Executive Summary
The `BroadcastsEvents` trait (and its variant `BroadcastsEventsAfterCommit`) enables Eloquent models to broadcast their lifecycle events to frontend clients via Laravel's event broadcasting system. When applied to a model, it automatically broadcasts `created`, `updated`, `deleted`, and `trashed`/`restored` events to configured broadcast channels. This enables real-time UI updates without polling or custom WebSocket code.

## Core Concepts
- **`BroadcastsEvents` trait:** Applied to a model, automatically broadcasts model events (created, updated, deleted, restored, trashed) as Laravel broadcast events.
- **Broadcast channel convention:** By default, broadcasts go to a channel named `eloquent.{model}.{event}` (e.g., `eloquent.user.created`). This can be customized via the model's `broadcastChannel()` method.
- **Broadcast payload:** The broadcast includes the model's serialized data (`toArray()` representation). Relationships are not included by default.
- **`BroadcastsEventsAfterCommit`:** A variant that only broadcasts after the database transaction commits. Prevents broadcasts of data that might be rolled back.
- **No observer required:** The trait registers its own event listeners during boot, automatically hooking into the model lifecycle.
- **Broadcast identification:** Each broadcast includes the event type (`created`, `updated`, `deleted`, etc.), the model class, and the model's serialized data. Clients use this to determine how to update the UI.

## Mental Models
- **Auto-broadcast:** Think of the trait as a radio transmitter attached to the model. Every time the model is created, updated, or deleted, a signal (broadcast) is automatically sent to all listeners on the appropriate channel.
- **Frontend mirror:** The broadcast event is a real-time mirror of the database change. Frontend clients receive the serialized model and can update the UI to reflect the new state without a page refresh.
- **Transactional guard:** `BroadcastsEventsAfterCommit` is a safety net â€” it ensures broadcasts only fire if the transaction commits. If the transaction rolls back, the broadcast is never sent, preventing UI inconsistencies.

## Internal Mechanics

> **Reference:** 
- The trait's `bootBroadcastsEvents()` method registers event listeners for `created`, `updated`, `deleted`, `restored`, `trashed`:

```php
public static function bootBroadcastsEvents(): void
{
    static::created(function ($model) {
        $model->broadcastCreated();
    });
    
    static::updated(function ($model) {
        $model->broadcastUpdated();
    });
    
    static::deleted(function ($model) {
        $model->broadcastDeleted();
    });
    
    // ... restored, trashed
}
```

- Each `broadcast*()` method constructs a `BroadcastEvent` instance and dispatches it through Laravel's broadcasting system:

```php
protected function broadcastCreated(): void
{
    $this->broadcastEvent(new BroadcastEvent($this, 'created'));
}
```

- `BroadcastEvent` is a standard Laravel broadcast event class. It implements `ShouldBroadcast` and defines the channel name, payload, and broadcast queue.
- `broadcastChannel()` returns the channel name. The default implementation:

```php
public function broadcastChannel(): string
{
    return 'eloquent.'.strtolower(class_basename($this)).'.'.
           strtolower(class_basename(static::class));
}
```

- `BroadcastsEventsAfterCommit` extends the behavior by setting the `$afterCommit` property on the broadcast event, ensuring it only dispatches after the database transaction commits.

## Patterns
- **Real-time dashboard updates:** Apply `BroadcastsEvents` to models that power live dashboards. When data changes, the dashboard updates in real-time without polling.
- **Collaborative editing:** Use broadcast events to notify other users when a shared resource is updated. Combined with presence channels for real-time collaboration.
- **Activity feeds:** Broadcast model events to a user-specific channel to power activity feeds. The frontend appends new items to the feed as broadcast events arrive.
- **Cross-tab synchronization:** Use broadcast events to synchronize state across browser tabs for the same user. When one tab creates a record, all other tabs receive the broadcast and update.
- **Custom channels per user:** Override `broadcastChannel()` to broadcast to user-specific channels:

```php
public function broadcastChannel(): string
{
    return 'user.'.$this->user_id;
}
```

## Architectural Decisions
- **Why a trait instead of an observer?** â€” Broadcasting is a cross-cutting concern tightly coupled to the model's lifecycle. A trait makes the broadcast behavior explicit on the model class, similar to how `SoftDeletes` is a trait rather than an observer.
- **Why broadcast `*ed` events instead of `*ing`?** â€” Broadcasting after the operation ensures the data being broadcast reflects the committed state. Broadcasting a `creating` event would send stale data to clients.
- **Why `BroadcastsEventsAfterCommit` exists separately?** â€” Transactional safety is a significant behavioral difference. Making it a separate trait forces developers to explicitly choose between immediate broadcast and after-commit broadcast.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero-configuration real-time broadcasting | Broadcasts fire for ALL model operations, including bulk/seed | Use `withoutEvents()` for bulk operations that should not broadcast |
| Automatic serialization of model data | Sensitive fields may be exposed in broadcasts | Use `$hidden` or implement `broadcastWith()` to filter payload |
| `BroadcastsEventsAfterCommit` prevents stale broadcasts | After-commit broadcasts may not fire if the transaction never commits (unlikely) | Acceptable tradeoff for data consistency |
| Customizable channel naming | Channel namespace can become inconsistent across models | Establish a channel naming convention in `broadcastChannel()` |

## Performance Considerations
- **Queueing broadcasts:** Broadcast events are queued by default. The trait uses `ShouldBroadcast` which dispatches to the queue, not the current request. This means the broadcast overhead is offloaded from the HTTP response.
- **Payload serialization:** The model's `toArray()` is called during serialization. For models with many attributes or loaded relationships, this adds serialization overhead.
- **Broadcast frequency:** In high-frequency update scenarios (e.g., real-time counters), broadcasting every change can overwhelm the broadcast driver (Pusher, Soketi, Reverb). Throttle or debounce broadcasts where appropriate.

## Production Considerations
- **Payload size limits:** Broadcast drivers have message size limits (e.g., Pusher: 10KB per message). Ensure the serialized model does not exceed these limits. Exclude large attributes (descriptions, JSON blobs) via `broadcastWith()`.
- **Authentication:** Broadcast channels must be authorized. Define channel authorization routes in `routes/channels.php` to control who can listen to model events.
- **Environment considerations:** Broadcasting consumes external service resources and may incur costs. Disable broadcasting in development/testing environments where real-time updates are not needed.
- **Sensitive data leakage:** The broadcast payload includes all model attributes visible in `toArray()`. Use `broadcastWith()` to filter sensitive fields:

```php
public function broadcastWith(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        // Exclude email, internal notes, etc.
    ];
}
```

## Common Mistakes
- **Broadcasting entire relations:** By default, broadcast includes only the model's direct attributes. Loading relations and expecting them in the broadcast requires customizing `broadcastWith()`.
- **Forgetting channel authorization:** Clients receive "unauthorized" errors if channels are not properly authorized. Define channel authorization rules in `routes/channels.php`.
- **Over-broadcasting with `deleted`:** When soft-deleting, both `trashed` and `deleted` broadcast events fire. Frontend code must handle both or deduplicate.
- **No broadcast rate limiting:** In rapid-update scenarios (e.g., typing indicators), broadcasting every change can flood the broadcast driver. Implement debouncing on the frontend or server side.

## Failure Modes
- **Stale broadcasts due to transactions:** If using `BroadcastsEvents` (not AfterCommit) inside a transaction, the broadcast fires before the transaction commits. If the transaction rolls back, the broadcast contains data that never persisted.
- **Broadcast driver failure:** If the broadcast driver is unavailable (network issue, service outage), the model operation still succeeds (broadcasts are queued and can fail silently). Monitor broadcast queue failures.
- **Queue worker not running:** Broadcasts are queued. If no queue worker is processing the broadcast queue, broadcasts accumulate and never reach clients. Ensure the appropriate queue worker is running.
- **Serialization errors:** If the model contains non-serializable attributes (binary data, closures), the broadcast serialization fails. Ensure all model attributes are serializable.

## Ecosystem Usage
- **Laravel Reverb:** The first-party WebSocket server for Laravel. Works seamlessly with `BroadcastsEvents` for real-time model broadcasting.
- **Pusher / Pusher Channels:** The most common third-party broadcast driver. Receives model broadcast events and pushes them to connected clients.
- **Laravel Nova:** Uses broadcasting internally for real-time resource updates in Nova dashboards.
- **Laravel Livewire:** Often used alongside model broadcasting â€” Livewire handles UI updates, while broadcast events provide cross-user synchronization.

## Related Knowledge Units

### Prerequisites
- Event Catalog
- Laravel Event Broadcasting

### Related Topics
- Commit Strategies (after-commit vs. before-commit)
- Observer Pattern

### Advanced Follow-up Topics
- WebSocket Integration
- Reverb
- Presence Channels

## Research Notes
- **Source Analysis:** `Illuminate\Database\Eloquent\BroadcastsEvents` trait â€” defines `bootBroadcastsEvents()` and helper methods `broadcastCreated()`, `broadcastUpdated()`, `broadcastDeleted()`, `broadcastRestored()`, `broadcastTrashed()`. `Illuminate\Broadcasting\BroadcastEvent` for the dispatched event class.
- **Key Insight:** The trait leverages the existing model event system to trigger broadcasts. It does NOT create a parallel broadcast system â€” it simply adds broadcast listeners to the standard model events. This means quiet operations (`saveQuietly()`) also suppress broadcast events.
- **Version-Specific Notes:** `BroadcastsEvents` was introduced in Laravel 10.x. `BroadcastsEventsAfterCommit` was added shortly after. Prior to Laravel 10, developers had to manually implement model broadcasting using observers and dedicated broadcast event classes.
