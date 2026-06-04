# Standardized Knowledge: Model Broadcasting (BroadcastsEvents Trait)

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Event Broadcasting Architecture |
| Knowledge Unit ID | K30 |
| Knowledge Unit | Model Broadcasting (BroadcastsEvents Trait) |
| Difficulty | Intermediate |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

Model broadcasting automatically broadcasts Eloquent model state changes (created, updated, deleted, trashed, restored) to frontend clients. By adding the `BroadcastsEvents` trait to a model and defining a `broadcastOn()` method, Laravel automatically generates broadcast events when model instances change. The broadcast event name follows `{ModelClass}.{event}` (e.g., `Order.created`), and the payload includes the model's public attributes. The trait eliminates the need to create manual event classes for simple CRUD broadcasting. Channel names default to a private channel using the model's class name and primary key.

## Core Concepts

The `BroadcastsEvents` trait intercepts Eloquent model events and maps them to broadcast events. The `broadcastOn()` method receives the event name string and returns channels. If returning Eloquent model instances, Laravel auto-converts them to private channels using `App.Models.{ClassName}.{id}`. Customization via `broadcastAs($event)` and `broadcastWith($event)` receives the event type for per-event customization.

## When To Use

- Real-time dashboards showing latest model changes (orders, users, inventory)
- Admin panels with live-updating tables
- Activity feeds and audit trail visualization
- Simple CRUD broadcasting scenarios without complex event logic

## When NOT To Use

- Complex broadcast logic requiring conditional payloads or multiple channels per event type
- Events needing external context (who performed the update, reason for change)
- High-frequency model updates that would trigger broadcast storms
- Scenarios where `broadcastWhen()` filtering is needed (not available in the trait interface)

## Best Practices (WHY)

- **Selective event broadcasting**: Override `broadcastOn()` to filter which event types broadcast (e.g., only `updated`, not `created`)
- **Minimal payloads**: Heavy models should override `broadcastWith()` to send only necessary attributes
- **Channel authorization**: Define auth callbacks for auto-generated private channel names in `routes/channels.php`
- **Avoid N+1**: Ensure model serialization during broadcast does not trigger lazy-loaded relationships in queue workers

## Architecture Guidelines

- Defaults to private channel with model class+ID naming; no manual event classes needed
- Returning Eloquent models from `broadcastOn()` auto-creates private channels
- `broadcastOn($event)` receives event type for conditional channel selection
- No separate event files—reduces boilerplate for simple CRUD scenarios

## Performance Considerations

- Model broadcasting adds overhead to every Eloquent CRUD operation
- Use `broadcastOn()` to selectively broadcast only specific event types
- Heavy models with many attributes should override `broadcastWith()` to send minimal payloads
- Queue-backed automatically—HTTP response is not blocked
- `Model::update()` bulk operations generate unexpected broadcasts—be aware

## Security Considerations

- Auto-generated private channel names require matching auth callbacks
- Returning the model instance from `broadcastOn()` creates a private channel, not public
- Model serialization may expose attributes not intended for client consumption
- Broadcasting within uncommitted transactions delivers incomplete data to clients

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Forgetting `broadcastOn()` | Trait added without method | No channels subscribed; nothing broadcasts | Always define `broadcastOn()` on the model |
| Returning model expecting public channel | Misunderstanding auto-conversion | Creates private channel (breaks public expectations) | Explicitly return `new Channel(...)` for public |
| Broadcasting all event types indiscriminately | Not filtering in `broadcastOn()` | Excessive broadcasts for every CRUD operation | Filter by event type: return empty array for events that shouldn't broadcast |
| Assuming `ShouldBroadcastNow` works with model broadcasting | Trait uses standard queue | Events go through queue by default | Use trait's built-in queue; don't try to override with `ShouldBroadcastNow` |
| No auth callback for auto-generated channels | Channel name pattern unknown | Authorization failures for all model broadcasts | Register `App.Models.{ModelName}.{id}` pattern |

## Anti-Patterns

- **Model broadcasting for everything**: Using the trait on every model when only specific state changes need broadcasting
- **No `broadcastWith()` override**: Broadcasting the entire model with all relationships loaded
- **Broadcasting during migrations/seeding**: Model broadcasting fires during bulk data operations
- **Assuming public auto-resolution**: Returning model instances does not create public channels

## Examples

```php
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Database\Eloquent\BroadcastsEvents;

class Order extends Model
{
    use BroadcastsEvents;

    public function broadcastOn(string $event): array
    {
        if ($event === 'created') {
            return []; // Don't broadcast on create
        }

        return [$this];
    }

    public function broadcastWith(string $event): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'total' => $this->total,
        ];
    }

    public function broadcastAs(string $event): string
    {
        return match($event) {
            'updated' => 'order.updated',
            'deleted' => 'order.deleted',
            default => "order.{$event}",
        };
    }
}
```

## Related Topics

- K01: Laravel Broadcasting Architecture
- K02: ShouldBroadcast Interface & Event Lifecycle
- K11: Public/Private/Presence Channel Patterns
- K12: Channel Authorization (routes/channels.php)

## AI Agent Notes

- Model broadcasting was introduced in Laravel 7.x and remains structurally unchanged
- The trait uses Eloquent's `$dispatchesEvents` property internally
- Returning model instances from `broadcastOn()` auto-creates private channels (NOT public)
- The main usage caveat is the implicit private channel creation when returning model instances

## Verification

- [ ] Model uses `BroadcastsEvents` trait
- [ ] `broadcastOn()` method is defined and returns appropriate channels
- [ ] Channel auth callbacks are registered for auto-generated private channels
- [ ] `broadcastWith()` controls payload (not sending entire model)
- [ ] Broadcast is scoped to specific event types (not all CRUD operations)
- [ ] No N+1 queries are triggered during queue worker serialization
- [ ] Bulk operations (`Model::update()`) don't cause unexpected broadcast storms
