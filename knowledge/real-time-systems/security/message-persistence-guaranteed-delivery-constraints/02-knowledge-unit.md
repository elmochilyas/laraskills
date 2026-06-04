# Metadata
Domain: Real-Time Systems
Subdomain: Security
Knowledge Unit: Message Persistence & Guaranteed Delivery Constraints
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
Laravel's broadcasting system does not guarantee message delivery. The default architecture is fire-and-forget: events are queued for broadcast, but if a client is disconnected when the event reaches the WebSocket server, the event is silently lost. Neither Reverb, Pusher, nor Ably's basic broadcasting mode provides built-in message persistence or guaranteed delivery. For reliable delivery, additional infrastructure is required: message queues with persistence, client-side reconnection with `Last-Event-ID` replay (SSE), or broadcaster-side message history (Ably history, Pusher webhook-backed replay). Understanding the delivery semantics of each broadcast driver is essential when building features that require at-least-once or exactly-once delivery.

## Core Concepts
The broadcasting delivery pipeline has multiple loss points: (1) the queue job may fail before reaching the broadcast driver, (2) the broadcast driver may fail to deliver to the WebSocket server (Reverb receives the event but the pub/sub fan-out fails), (3) the WebSocket server may fail to deliver to the client (client disconnected, connection lost, message too large). Laravel's queue system provides retry logic for step (1). Steps (2) and (3) are driver-dependent. Pusher and Reverb are fire-and-forget once the message reaches the driver. Ably provides guaranteed delivery (at-least-once) as a premium feature. All drivers lose messages if the target client is not connected at delivery time.

## Mental Models
Think of broadcasting as a PA system announcement. If you're not listening when the announcement is made, you miss it. There's no recording, no playback button. The message exists only at the moment of broadcast. If you need a recording (guaranteed delivery), you need to add your own DVR (message persistence and replay system).

## Internal Mechanics
In the standard broadcast pipeline: the queue worker calls `ReverbBroadcaster::broadcast()`, which publishes a message to Reverb's Redis pub/sub channel. Reverb receives the message, looks up which connected clients are subscribed to the target channel, and writes the message to each client's WebSocket stream. If the client has disconnected between the event fire and the Redis fan-out, the write fails silently (the socket is already closed). Reverb does not queue messages for offline clients. Ably's guaranteed delivery works by persisting messages to a distributed queue before acknowledging the publish; clients receive messages when they reconnect via the "history" API. Pusher has a "webhook" mechanism that notifies your server of delivery failures, but does not automatically retry.

## Patterns
- **Fire-and-forget (default)**: Simple, low overhead, no delivery guarantees
- **Client-side reconnection replay**: Maintain an event log on the server; replay missed events on reconnect via Last-Event-ID
- **Database-backed delivery**: Store events in the database; clients fetch missed events on reconnect (combine with broadcast for real-time)
- **Ably guaranteed delivery**: Use Ably's at-least-once delivery mode for critical events
- **Queue with deduplication**: Use unique event IDs and deduplication in the client to handle at-least-once delivery

## Architectural Decisions
- **Fire-and-forget as default**: Most real-time use cases (dashboards, notifications, typing indicators) tolerate occasional message loss
- **Guaranteed delivery adds complexity**: Persistence, replay, deduplication, and ordering all require additional infrastructure
- **Client-side compensation**: For critical events, have the client fetch the current state from the API on reconnection (fallback to REST)
- **Ably as the guaranteed delivery option**: Ably's distributed queue architecture provides built-in at-least-once delivery

## Tradeoffs
- **Fire-and-forget vs. guaranteed delivery**: Fire-and-forget is simple and fast; guaranteed delivery adds latency, storage cost, and complexity
- **Message persistence cost**: Storing broadcast events for replay requires database/Redis storage and adds write overhead per event
- **Replay complexity**: The server must track which events each client has received (vector clocks, sequence numbers, or timestamps)
- **Idempotency requirement**: At-least-once delivery requires clients to handle duplicate events gracefully
- **Ordering guarantees**: Reverb/Pusher don't guarantee event ordering; Ably provides ordering within channels at additional cost

## Performance Considerations
- Fire-and-forget: latency is queue + Redis pub/sub + WebSocket write (~5-20ms total)
- Persistent delivery: add database/Redis write per event (5-50ms additional), client replay fetch on reconnect
- Event history storage: grows linearly with event volume; implement TTL-based pruning
- Replay overhead: fetching and re-sending missed events on reconnect adds load proportional to offline duration
- Ably guaranteed delivery: acknowledgment round-trip adds latency vs. fire-and-forget

## Production Considerations
- For critical events, implement a "fetch missed events" API that clients call on reconnection
- Use unique event IDs in broadcast payloads to enable client-side deduplication
- Set appropriate TTL on event history (seconds for live context, minutes for replay window)
- Monitor broadcast delivery failures via queue job failures and Reverb error logs
- Consider Ably for features requiring guaranteed delivery (financial data, compliance)
- For non-critical events, accept fire-and-forget semantics—the real-time UX is additive, not authoritative
- Document delivery guarantees (or lack thereof) in your application's real-time contract

## Common Mistakes
- Assuming broadcast events are reliably delivered to all clients (they are not—disconnected clients miss them)
- Implementing guaranteed delivery on top of fire-and-forget without considering ordering and deduplication
- Not handling the case where a client reconnects after missing critical broadcast events
- Storing broadcast events indefinitely without TTL or pruning (unbounded storage growth)
- Using broadcast as the sole delivery mechanism for important data (always have a REST API fallback)
- Expecting exactly-once delivery from a fire-and-forget system

## Failure Modes
- **Silent message loss**: Client briefly disconnected during delivery; event never received; no error logged
- **Duplicate delivery**: Client receives the same event multiple times due to queue retry or reconnection replay
- **Ordering inversion**: Events delivered out of order to a reconnecting client if replay sends old events after new ones
- **History buffer overflow**: Event history exceeds storage capacity; old events evicted; reconnecting client misses events older than eviction horizon
- **Reconnection replay flood**: Client offline for hours; replay sends thousands of events; overwhelms client processing

## Ecosystem Usage
- Chat applications: messages should be persisted; broadcast is for real-time display, not authoritative delivery
- Order updates: events should be fire-and-forget; the authoritative state is the database; client refreshes on reconnect
- Notifications: database persistence (Laravel's database notification channel) provides reliability; broadcast adds real-time layer
- Dashboards: fire-and-forget is acceptable; stale data is replaced by next broadcast
- Financial tickers: require at-least-once delivery; Ably or custom replay system needed
- IoT device status: fire-and-forget is acceptable; last-known-state via API on reconnect

## Related Knowledge Units
- K01: Laravel Broadcasting Architecture
- K15: Reconnection Strategies & Storm Mitigation
- K07: Ably Integration & Enterprise Features
- K19: Real-Time Notifications (Broadcast + Database)

## Research Notes
Message persistence and guaranteed delivery are explicit non-goals of the default Laravel broadcasting architecture. The documentation treats broadcasting as "supplementary" rather than authoritative delivery. For production systems that require reliable delivery, the standard pattern combines: (1) broadcast for real-time push, (2) database/API fallback for state recovery on reconnect, (3) client-side idempotency for deduplication. Ably is the only Laravel-supported broadcast driver that offers guaranteed delivery out of the box. For self-hosted Reverb, implementing persistent delivery requires custom infrastructure (event history in Redis, replay endpoints, client-side replay tracking). The 2026 consensus: use broadcast for real-time notification, not as an authoritative delivery mechanism—the database and API are the source of truth.
