# Standardized Knowledge: Message Persistence & Guaranteed Delivery Constraints

## Metadata
| Field | Value |
|-------|-------|
| Domain | Real-Time Systems |
| Subdomain | Security |
| Knowledge Unit ID | K40 |
| Title | Message Persistence & Guaranteed Delivery Constraints |
| Difficulty | Advanced |
| Dependencies | K01, K15, K07, K19 |

## Overview
Laravel's broadcasting system does not guarantee message delivery. The default architecture is fire-and-forget: events are queued for broadcast, but if a client is disconnected when the event reaches the WebSocket server, the event is silently lost. Neither Reverb, Pusher, nor Ably's basic broadcasting mode provides built-in message persistence. For reliable delivery, additional infrastructure is required: message queues with persistence, client-side reconnection with event replay, or broadcaster-side message history.

## Core Concepts
- The broadcasting delivery pipeline has multiple loss points: queue job failure, broadcast driver failure to reach WebSocket server, WebSocket server failure to reach client
- Laravel's queue system provides retry logic for step 1; steps 2 and 3 are driver-dependent
- Pusher and Reverb are fire-and-forget once the message reaches the driver
- Ably provides at-least-once delivery as a premium feature via its distributed queue architecture
- All drivers lose messages if the target client is not connected at delivery time

## When To Use
- Fire-and-forget is acceptable for: dashboards, typing indicators, non-critical notifications
- Guaranteed delivery needed for: financial data, compliance requirements, chat applications
- At-least-once: when duplicates are acceptable but loss is not

## When NOT To Use
- This is an awareness KU—all broadcasting implementations should understand delivery semantics
- Do not assume broadcast is reliable for authoritative data delivery

## Best Practices (Why)
- **Accept fire-and-forget as default**: Most use cases tolerate occasional message loss; the real-time UX is additive, not authoritative
- **Implement "fetch missed events" API**: On reconnection, clients call a REST endpoint to get missed events—combines real-time push with reliable pull
- **Use unique event IDs for client-side deduplication**: Enables safe at-least-once delivery from the server without duplicate display
- **Set TTL on event history**: Store broadcast events with appropriate TTL (seconds for live context, minutes for replay window)
- **Consider Ably for guaranteed delivery**: Ably's distributed queue provides built-in at-least-once delivery without custom infrastructure

## Architecture Guidelines
- Fire-and-forget is simple and fast; guaranteed delivery adds latency, storage cost, and complexity
- For critical events, have the client fetch current state from the API on reconnection (fallback to REST)
- Never use broadcast as the sole delivery mechanism for important data—always have a REST API fallback
- Document delivery guarantees (or lack thereof) in your application's real-time contract

## Performance Considerations
- Fire-and-forget latency: queue + Redis pub/sub + WebSocket write (~5-20ms total)
- Persistent delivery: add database/Redis write per event (5-50ms additional) + client replay fetch on reconnect
- Event history storage grows linearly with event volume; implement TTL-based pruning
- Replay overhead: fetching and re-sending missed events on reconnect adds load proportional to offline duration

## Security Considerations
- Event history stored for replay must have appropriate access controls
- Unique event IDs prevent replay attacks if combined with proper authentication
- Client-side deduplication must not be susceptible to ID manipulation

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Assuming reliable delivery | Assuming all connected clients receive all events | Misunderstanding fire-and-forget semantics | Missed events go undetected | Design for occasional message loss |
| Implementing guaranteed delivery without dedup | At-least-once without idempotent handling | Not considering duplicate events | Duplicate display, state corruption | Use unique event IDs + client deduplication |
| Broadcast as sole delivery | No fallback for disconnected clients | Over-relying on real-time | Users miss critical updates | Combine broadcast + API state recovery |
| No TTL on event history | Storing events indefinitely | Not planning storage growth | Unbounded storage costs | Set TTL based on replay window needs |

## Anti-Patterns
- **Exactly-once delivery expectations from fire-and-forget systems**: Exactly-once requires idempotent consumers and ordering guarantees—neither is provided by Reverb/Pusher
- **Ordering guarantees assumed**: Reverb and Pusher don't guarantee event ordering; Ably provides ordering at additional cost
- **Using broadcast for authoritative state**: The database and API are the source of truth; broadcast is a real-time notification layer

## Examples

### Client-side missed event recovery
```javascript
Echo.private(`user.${userId}`)
    .listen('OrderUpdated', (event) => {
        updateOrderUI(event.order);
    })
    .on('pusher:connection_established', async () => {
        // Fetch missed events since last known event ID
        const missed = await fetch(`/api/events/missed?since=${lastEventId}`);
        missed.events.forEach(event => updateOrderUI(event));
    });
```

### Event history storage
```php
// Storing broadcast events for replay
BroadcastEvent::create([
    'channel' => $event->broadcastOn(),
    'name' => $event->broadcastAs(),
    'payload' => json_encode($event->broadcastWith()),
    'created_at' => now(),
]);

// Cleanup old events
BroadcastEvent::where('created_at', '<', now()->subMinutes(5))->delete();
```

## Related Topics
- K01: Laravel Broadcasting Architecture
- K15: Reconnection Strategies & Storm Mitigation
- K07: Ably Integration & Enterprise Features
- K19: Real-Time Notifications (Broadcast + Database)

## AI Agent Notes
- This KU is atomic—no further decomposition needed
- Message persistence is an explicit non-goal of the default Laravel broadcasting architecture
- The standard pattern: broadcast for real-time push + database/API fallback + client-side idempotency
- Ably is the only Laravel-supported driver with guaranteed delivery out of the box

## Verification
- [ ] Fire-and-forget semantics understood and documented
- [ ] Client implements "fetch missed events" on reconnection
- [ ] Unique event IDs used in broadcast payloads
- [ ] Client-side deduplication implemented
- [ ] Event history TTL configured
- [ ] REST API fallback exists for critical data
- [ ] Delivery guarantees documented in real-time contract
- [ ] For critical events, Ably or custom replay considered
