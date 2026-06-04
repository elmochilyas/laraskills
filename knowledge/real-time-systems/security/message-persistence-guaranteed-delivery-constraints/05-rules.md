## Never Assume Broadcast Delivery Is Reliable
---
## Architecture
---
Never use broadcasting as the sole delivery mechanism for authoritative or critical data.
---
Laravel's broadcasting is fire-and-forget. Events are lost if the client is disconnected, the queue fails, or the WebSocket server drops the message. There is no retry or acknowledgment mechanism.
---
```php
// Sole delivery mechanism — users may miss critical updates
broadcast(new PaymentReceived($payment));
```
---
```php
// Broadcast + database persistence
broadcast(new PaymentReceived($payment));
$payment->notify(new PaymentReceived($payment)); // Database fallback
```
---
Non-critical notifications where loss is acceptable (typing indicators, dashboard metrics). No common exceptions.
---
Data loss; missed critical updates; compliance violations.

## Always Implement "Fetch Missed Events" on Client Reconnection
---
## Reliability
---
Always provide a REST API endpoint for clients to fetch events they missed while disconnected.
---
When a client reconnects after a disconnection, it has no knowledge of events that occurred during the offline period. Without a fetch mechanism, those events are permanently lost.
---
```javascript
// No missed event recovery — permanent data loss on disconnect
```
---
```javascript
Echo.connector.pusher.connection.bind('connected', async () => {
    const missed = await fetch(`/api/events/missed?since=${lastEventId}`);
    missed.events.forEach(event => processEvent(event));
});
```
---
Applications where missed events are acceptable. No common exceptions.
---
Permanent data loss on disconnect; inconsistent client state.

## Always Use Unique Event IDs for Client-Side Deduplication
---
## Reliability
---
Always include unique, monotonically increasing event IDs in broadcast payloads for client-side deduplication.
---
Without deduplication, implementing at-least-once delivery guarantees is dangerous — duplicate events display duplicate notifications, process duplicate actions, or corrupt client state.
---
```php
public function broadcastWith(): array {
    return ['order_id' => $this->order->id, 'status' => 'shipped']; // No event ID
}
```
---
```php
public function broadcastWith(): array {
    return [
        'event_id' => (string) Str::uuid(),
        'order_id' => $this->order->id,
        'status' => 'shipped',
    ];
}
```
---
Fire-and-forget scenarios where duplicates don't matter. No common exceptions.
---
Duplicate processing; state corruption; duplicate notifications.

## Always Set TTL on Event History
---
## Maintainability
---
Always configure TTL-based pruning for stored broadcast event history.
---
Stored event history grows linearly with broadcast volume. Without TTL, storage costs increase unbounded and query performance degrades over time.
---
```php
// No TTL — event history grows unbounded
BroadcastEvent::create([...]);
```
---
```php
// TTL-based cleanup
BroadcastEvent::create([...]);
BroadcastEvent::where('created_at', '<', now()->subMinutes(5))->delete();
```
---
Applications requiring permanent event audit trails. No common exceptions.
---
Unbounded storage growth; query performance degradation.

## Always Document Delivery Guarantees in the Real-Time Contract
---
## Maintainability
---
Always document the application's real-time message delivery guarantees (or lack thereof) for consumers.
---
Without documented guarantees, frontend developers assume reliable delivery and build features that break under message loss. Clear documentation sets correct expectations.
---
```php
// No documentation — developers assume reliable delivery
```
```php
/**
 * BROADCASTING DELIVERY GUARANTEES
 *
 * - Fire-and-forget: events may be lost if client is disconnected
 * - No ordering guarantees between events
 * - Client should fetch current state from REST API on reconnect
 * - See: MessagePersistence.md for detailed constraints
 */
```
---
No common exceptions; delivery semantics should always be documented.
---
Incorrect assumptions; brittle frontend code; user-facing data loss.
