## Always Override `broadcastWith()` to Control Event Payload
---
## Security
---
Always implement `broadcastWith()` on `ShouldBroadcast` events instead of relying on public property serialization.
---
All public properties of the event class are automatically serialized and broadcast. This can inadvertently expose entire Eloquent models, sensitive fields, or loaded relationships.
---
```php
class OrderShipped implements ShouldBroadcast {
    public function __construct(public Order $order) {} // Entire Order broadcast
}
```
---
```php
class OrderShipped implements ShouldBroadcast {
    public function broadcastWith(): array {
        return ['order_id' => $this->order->id, 'status' => $this->order->status];
    }
}
```
---
Events with no sensitive data where all public properties are safe to expose. No common exceptions.
---
Data leakage; PII exposure; oversized payloads.

## Always Use `broadcastAs()` for Stable Client-Side Event Names
---
## Maintainability
---
Always define `broadcastAs()` to provide a stable, dot-notation event name independent of the PHP class name.
---
Without `broadcastAs()`, the client-side event name is the fully-qualified PHP class name. Renaming the class (refactoring, namespacing) silently breaks all frontend event listeners.
---
```php
// Client listens for: App\Events\OrderShipped (breaks on refactor)
```
---
```php
public function broadcastAs(): string { return 'order.shipped'; }
// Client listens for: order.shipped (survives refactoring)
```
---
Prototypes or one-off events with no frontend listeners. No common exceptions.
---
Broken frontend listeners after class renames; painful refactoring.

## Always Use `ShouldDispatchAfterCommit` for Transactional Consistency
---
## Reliability
---
Always implement `ShouldDispatchAfterCommit` on events dispatched within database transactions.
---
Broadcasting within an uncommitted transaction sends data to clients before it is persisted. If the transaction rolls back, clients have seen phantom data that never existed.
---
```php
class OrderCreated implements ShouldBroadcast { /* dispatched in transaction */ }
```
---
```php
class OrderCreated implements ShouldBroadcast, ShouldDispatchAfterCommit { /* waits for commit */ }
```
---
Events that don't depend on database state (e.g., typing indicators). No common exceptions.
---
Phantom data on clients; inconsistent UI state; rollback confusion.

## Always Define `broadcastWhen()` to Gate Unnecessary Broadcasts
---
## Performance
---
Always implement `broadcastWhen()` to prevent broadcasting when the event payload hasn't meaningfully changed.
---
Without `broadcastWhen()`, every dispatch results in a queue job, even when the event should be suppressed (e.g., status didn't actually change). This wastes queue capacity.
---
```php
// Broadcasts every time regardless of state
```
---
```php
public function broadcastWhen(): bool {
    return $this->order->status === 'shipped'; // Only broadcast when shipped
}
```
---
Events that should always broadcast regardless of state. No common exceptions.
---
Wasted queue jobs; unnecessary broadcast load.

## Always Route Broadcast Events to a Dedicated Queue
---
## Scalability
---
Always specify a dedicated queue for broadcast events using `broadcastQueue()` or the `$queue` property.
---
Sharing the default queue with other job types means a flood of broadcast events blocks emails, notifications, and other time-sensitive processing.
---
```php
class OrderShipped implements ShouldBroadcast { /* uses default queue */ }
```
---
```php
class OrderShipped implements ShouldBroadcast {
    public function broadcastQueue(): string { return 'broadcasts'; }
}
```
---
Low-volume applications where broadcast events are rare. No common exceptions.
---
Queue contention; delayed critical jobs during broadcast spikes.

## Never Expose Sensitive Data in Public Event Properties
---
## Security
---
Always mark sensitive data as `protected` or `private` on events implementing `ShouldBroadcast`.
---
Only public properties are serialized for broadcast. Protected and private properties are excluded from the payload, but this is opt-out — you must explicitly restrict access.
---
```php
public function __construct(
    public Order $order,
    public string $creditCardLastFour, // Broadcast to all subscribers
) {}
```
---
```php
public function __construct(
    public Order $order,
    private string $creditCardLastFour, // Not broadcast
) {}
```
---
No common exceptions; sensitive data should never be public on broadcast events.
---
PII/PCI data leakage to WebSocket subscribers.

## Prefer `ShouldBroadcastNow` Only for Latency-Critical Events
---
## Performance
---
Reserve `ShouldBroadcastNow` for events requiring sub-100ms delivery and accept the HTTP response time trade-off.
---
`ShouldBroadcastNow` bypasses the queue, making broadcast dispatch synchronous within the HTTP request. Overuse degrades response times and eliminates the benefits of queue-backed broadcasting.
---
```php
class EveryEvent implements ShouldBroadcastNow { } // All events bypass queue
```
---
```php
class LiveCursorUpdate implements ShouldBroadcastNow { } // Only cursor sync needs it
```
---
When broadcast latency is not critical and queue delay is acceptable. No common exceptions.
---
Degraded HTTP response times; cascading latency under load.
