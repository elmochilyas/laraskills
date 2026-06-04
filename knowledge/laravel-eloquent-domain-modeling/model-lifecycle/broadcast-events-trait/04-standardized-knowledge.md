# Model Broadcasting

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Model Lifecycle |
| Knowledge Unit | Model Broadcasting |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Model broadcasting automatically broadcasts Eloquent model events to websocket channels. Using the `BroadcastsEvents` trait, models can push create/update/delete notifications to frontend clients in real time. This KU covers setup, payload customization, and commit strategies.

## Core Concepts

- **BroadcastsEvents trait**: Added to a model to enable automatic event broadcasting on CRUD operations
- **Broadcast channel naming**: `App.Models.{ModelName}.{Id}` by default (e.g., `App.Models.Order.42`)
- **Broadcast data**: Model attributes serialized to JSON by default
- **Broadcast event naming**: `eloquent.created`, `eloquent.updated`, `eloquent.deleted` by default
- **BroadcastsEventsAfterCommit**: Only broadcasts after the database transaction commits

## When To Use

- Real-time dashboard updates when data changes
- Live notifications of model state changes
- Collaborative features where multiple clients see the same model

## When NOT To Use

- The broadcast data isn't needed on the frontend (use explicit websocket messages)
- Security-sensitive model data that shouldn't reach the client
- High-frequency model updates (rate-limit broadcasts)

## Best Practices

- **Use `BroadcastsEventsAfterCommit` over `BroadcastsEvents`**: Broadcasting before the transaction commits can send stale data if the transaction rolls back. The "after commit" variant ensures data is persisted before broadcasting.
- **Customize broadcast data**: Override `broadcastWith()` to control what data is sent to the client. Don't broadcast sensitive model attributes.
- **Customize broadcast channel**: Override `broadcastChannel()` to use custom channel naming conventions.

## Architecture Guidelines

- Add `BroadcastsEventsAfterCommit` trait to models that need real-time updates
- Override `broadcastWith()` to filter serialized attributes
- Configure WebSockets integration (Laravel Reverb, Pusher) separately

## Performance Considerations

- Broadcasting adds network round-trips — batch broadcasts for bulk operations
- Use `BroadcastsEventsAfterCommit` to avoid broadcasting rolled-back data
- Consider rate-limiting broadcasts for high-frequency updates

## Security Considerations

- `broadcastWith()` controls what data reaches clients — always override to exclude sensitive data
- Broadcast authentication uses Laravel's broadcasting auth routes — configure appropriately
- Model broadcasts are public by default — use private channels for sensitive models

## Examples

```php
class Order extends Model
{
    use BroadcastsEventsAfterCommit;

    public function broadcastOn(): array
    {
        return [new PrivateChannel('orders.'.$this->id)];
    }

    public function broadcastWith(): array
    {
        return ['id' => $this->id, 'status' => $this->status];
    }
}
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Event Catalog |
| Closely Related | Event Control / Quiet Operations |
| Cross-Domain | Async & Distributed Systems |

## AI Agent Notes

- Use `BroadcastsEventsAfterCommit` to prevent stale data broadcasts
- Override `broadcastWith()` to control client-visible data
- Use private channels for sensitive models

## Verification

- [ ] `BroadcastsEventsAfterCommit` used (not `BroadcastsEvents`)
- [ ] `broadcastWith()` overridden to filter sensitive data
- [ ] Broadcast channels use appropriate privacy level (public/private/presence)
