# Decomposition: Message Persistence Guaranteed Delivery Constraints

## Topic Overview
Laravel's broadcasting system does not guarantee message delivery. The default architecture is fire-and-forget: events are queued for broadcast, but if a client is disconnected when the event reaches the WebSocket server, the event is silently lost. Neither Reverb, Pusher, nor Ably's basic broadcasting mode provides built-in message persistence or guaranteed delivery. For reliable delivery, additional infrastructure is required: message queues with persistence, client-side reconnection with `...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
security/K40-message-persistence-guaranteed-delivery-constraints/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Message Persistence Guaranteed Delivery Constraints
- **Purpose:** Laravel's broadcasting system does not guarantee message delivery. The default architecture is fire-and-forget: events are queued for broadcast, but if a client is disconnected when the event reaches the WebSocket server, the event is silently lost. Neither Reverb, Pusher, nor Ably's basic broadcasting mode provides built-in message persistence or guaranteed delivery. For reliable delivery, additional infrastructure is required: message queues with persistence, client-side reconnection with `...
- **Difficulty:** Advanced
- **Dependencies:
  - K01: Laravel Broadcasting Architecture
  - K15: Reconnection Strategies & Storm Mitigation
  - K07: Ably Integration & Enterprise Features
  - K19: Real-Time Notifications (Broadcast + Database)

## Dependency Graph
**Depends on:**
  - K01: Laravel Broadcasting Architecture
  - K15: Reconnection Strategies & Storm Mitigation
  - K07: Ably Integration & Enterprise Features
  - K19: Real-Time Notifications (Broadcast + Database)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Fire-and-forget (default)**: Simple, low overhead, no delivery guarantees**Client-side reconnection replay**: Maintain an event log on the server; replay missed events on reconnect via Last-Event-ID**Database-backed delivery**: Store events in the database; clients fetch missed events on reconnect (combine with broadcast for real-time)**Ably guaranteed delivery**: Use Ably's at-least-once delivery mode for critical events**Queue with deduplication**: Use unique event IDs and deduplication in the client to handle at-least-once delivery**Fire-and-forget as default**: Most real-time use cases (dashboards, notifications, typing indicators) tolerate occasional message loss**Guaranteed delivery adds complexity**: Persistence, replay, deduplication, and ordering all require additional infrastructure**Client-side compensation**: For critical events, have the client fetch the current state from the API on reconnection (fallback to REST)**Ably as the guaranteed delivery option**: Ably's distributed queue architecture provides built-in at-least-once delivery**Fire-and-forget vs. guaranteed delivery**: Fire-and-forget is simple and fast; guaranteed delivery adds latency, storage cost, and complexity**Message persistence cost**: Storing broadcast events for replay requires database/Redis storage and adds write overhead per event**Replay complexity**: The server must track which events each client has received (vector clocks, sequence numbers, or timestamps)**Idempotency requirement**: At-least-once delivery requires clients to handle duplicate events gracefully**Ordering guarantees**: Reverb/Pusher don't guarantee event ordering; Ably provides ordering within channels at additional costFire-and-forget: latency is queue + Redis pub/sub + WebSocket write (~5-20ms total)Persistent delivery: add database/Redis write per event (5-50ms additional), client replay fetch on reconnectEvent history storage: grows linearly with event volume; implement TTL-based pruningReplay overhead: fetching and re-sending missed events on reconnect adds load proportional to offline durationAbly guaranteed delivery: acknowledgment round-trip adds latency vs. fire-and-forgetFor critical events, implement a "fetch missed events" API that clients call on reconnectionUse unique event IDs in broadcast payloads to enable client-side deduplicationSet appropriate TTL on event history (seconds for live context, minutes for replay window)Monitor broadcast delivery failures via queue job failures and Reverb error logsConsider Ably for features requiring guaranteed delivery (financial data, compliance)For non-critical events, accept fire-and-forget semantics—the real-time UX is additive, not authoritativeDocument delivery guarantees (or lack thereof) in your application's real-time contractAssuming broadcast events are reliably delivered to all clients (they are not—disconnected clients miss them)Implementing guaranteed delivery on top of fire-and-forget without considering ordering and deduplicationNot handling the case where a client reconnects after missing critical broadcast eventsStoring broadcast events indefinitely without TTL or pruning (unbounded storage growth)Using broadcast as the sole delivery mechanism for important data (always have a REST API fallback)Expecting exactly-once delivery from a fire-and-forget system**Silent message loss**: Client briefly disconnected during delivery; event never received; no error logged**Duplicate delivery**: Client receives the same event multiple times due to queue retry or reconnection replay**Ordering inversion**: Events delivered out of order to a reconnecting client if replay sends old events after new ones**History buffer overflow**: Event history exceeds storage capacity; old events evicted; reconnecting client misses events older than eviction horizon**Reconnection replay flood**: Client offline for hours; replay sends thousands of events; overwhelms client processingChat applications: messages should be persisted; broadcast is for real-time display, not authoritative deliveryOrder updates: events should be fire-and-forget; the authoritative state is the database; client refreshes on reconnectNotifications: database persistence (Laravel's database notification channel) provides reliability; broadcast adds real-time layerDashboards: fire-and-forget is acceptable; stale data is replaced by next broadcastFinancial tickers: require at-least-once delivery; Ably or custom replay system neededIoT device status: fire-and-forget is acceptable; last-known-state via API on reconnectK01: Laravel Broadcasting ArchitectureK15: Reconnection Strategies & Storm MitigationK07: Ably Integration & Enterprise FeaturesK19: Real-Time Notifications (Broadcast + Database)

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization