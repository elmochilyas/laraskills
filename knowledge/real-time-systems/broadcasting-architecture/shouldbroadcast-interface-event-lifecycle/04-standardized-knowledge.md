# Standardized Knowledge: ShouldBroadcast Interface & Event Lifecycle

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Event Broadcasting Architecture |
| Knowledge Unit ID | K02 |
| Knowledge Unit | ShouldBroadcast Interface & Event Lifecycle |
| Difficulty | Intermediate |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

The `ShouldBroadcast` interface transforms a standard Laravel event into a broadcastable one. Implementing it signals the framework to queue the event for WebSocket delivery. The event lifecycle proceeds through: instantiation, channel resolution (`broadcastOn()`), payload customization (`broadcastWith()`), event naming (`broadcastAs()`), conditional broadcasting (`broadcastWhen()`), and queue dispatch. Public event properties are automatically serialized unless overridden. The `ShouldBroadcastNow` variant bypasses the queue. The `ShouldDispatchAfterCommit` interface delays broadcasting until database transactions complete.

## Core Concepts

The `ShouldBroadcast` interface requires a single method: `broadcastOn()` returning channel(s). Customization methods are all optional: `broadcastWith()` controls payload data, `broadcastAs()` sets the client-side event name (defaults to fully-qualified class name), `broadcastWhen()` gates whether the event broadcasts. Event dispatch can use `event()`, `broadcast()`, or `::dispatch()` via `Dispatchable` trait.

When `dispatch()` is called, Laravel checks if the event implements `ShouldBroadcast`. If yes, `BroadcastManager::queue()` wraps the event in a `BroadcastEvent` job and pushes to the queue. The `BroadcastEvent::handle()` method calls the driver's `broadcast()` with channels, payload, and name.

## When To Use

- Any server-side event that should be pushed to connected WebSocket clients
- Real-time notifications, order updates, chat messages
- Model state changes (via model broadcasting or manual events)
- Dashboard metric updates

## When NOT To Use

- Server-to-server communication only (use queues directly)
- Events that should not reach clients (use regular Laravel events)
- Client-originated events (use client events/whispers)
- High-frequency, low-latency events better handled by `ShouldBroadcastNow`

## Best Practices (WHY)

- **Keep payloads minimal**: Override `broadcastWith()` to send only data the client needs, not entire models
- **Use `broadcastAs()` for stable event names**: Dot-notation names (`order.shipped`) survive class renames
- **Route to dedicated queue**: Use `broadcastQueue()` or `$queue` property to isolate broadcast jobs
- **Use `ShouldDispatchAfterCommit`**: Prevent clients from seeing data before the database transaction commits
- **Use `broadcastWhen()`**: Filter broadcasts early to avoid unnecessary queue jobs

## Architecture Guidelines

- Broadcasting is asynchronous by design (queue-backed) to keep HTTP responses fast
- Public property convention reduces boilerplate but can accidentally expose sensitive data
- Dot-notation naming convention enables client-side event filtering by prefix
- `ShouldBroadcastNow` bypasses the queue for synchronous dispatch

## Performance Considerations

- Event payload size: Keep lean—only send what the client needs
- Serialization cost: Every public property is serialized; use `broadcastWith()` to select specific attributes
- Queue throughput: High-frequency events should use `ShouldBroadcastNow` or client events
- `broadcastWhen()` acts as an early filter, preventing unnecessary queue jobs

## Security Considerations

- Public properties are auto-serialized—mark sensitive data as `protected` or `private`
- Models in event properties are serialized via `SerializesModels`; loaded relationships may expose extra data
- `broadcastWith()` should explicitly select fields to prevent accidental data leakage
- Channel authorization (`broadcastOn()`) prevents clients from subscribing to unauthorized channels

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Public sensitive model properties | Auto-serialization convenience | Data leaked in broadcast payloads | Mark sensitive properties protected/private; use `broadcastWith()` |
| Sending entire Eloquent models | Not implementing `broadcastWith()` | Large payloads, over-fetching data | Define `broadcastWith()` to select specific fields |
| Broadcasting before DB commit | Event dispatched in transaction | Clients see stale data that doesn't exist yet | Use `ShouldDispatchAfterCommit` |
| Excessive `ShouldBroadcastNow` | All events bypass queue | HTTP response time degraded | Only bypass queue for latency-critical events |
| No dedicated queue for broadcasts | Default queue shared with other jobs | Broadcast backlog starves other job types | Define `broadcastQueue()` to isolate broadcasts |

## Anti-Patterns

- **Monolithic event classes**: One event handling multiple channel types with complex conditional logic
- **No `broadcastWith()`**: Relying on public property serialization without explicit payload control
- **`ShouldBroadcastNow` for all events**: Synchronous dispatch defeats the purpose of queue-backed architecture
- **`broadcastOn()` returning hardcoded channel names**: Prevents reuse and parameterization

## Examples

```php
class OrderShipped implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Order $order,
        public User $user,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("orders.{$this->order->id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.shipped';
    }

    public function broadcastWith(): array
    {
        return [
            'order_id' => $this->order->id,
            'status' => $this->order->status,
            'shipped_at' => $this->order->shipped_at,
        ];
    }

    public function broadcastWhen(): bool
    {
        return $this->order->status === 'shipped';
    }
}
```

## Related Topics

- K01: Laravel Broadcasting Architecture
- K30: Model Broadcasting (BroadcastsEvents Trait)
- K31: Client Events (Whisper, Typing Indicators)
- K19: Real-Time Notifications (Broadcast + Database)

## AI Agent Notes

- The `ShouldBroadcast` interface has remained stable since Laravel 5.x
- Laravel 11+ introduced `#[Queue]` and `#[Connection]` PHP 8 attributes for queue routing
- `ShouldBroadcastNow` and `ShouldDispatchAfterCommit` provide targeted control
- The `ShouldRescue` interface (Laravel 11+) prevents broadcast exceptions from surfacing to users

## Verification

- [ ] Event class implements `ShouldBroadcast` interface
- [ ] `broadcastOn()` returns valid channel instances
- [ ] `broadcastWith()` controls payload explicitly
- [ ] `broadcastAs()` provides a stable client-side event name
- [ ] `broadcastWhen()` conditionally gates broadcast dispatch
- [ ] No sensitive data in public properties
- [ ] Queue worker is processing broadcast events
- [ ] `ShouldDispatchAfterCommit` is used for transaction-dependent broadcasts
