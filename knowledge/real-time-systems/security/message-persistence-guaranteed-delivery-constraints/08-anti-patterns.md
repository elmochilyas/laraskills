# ECC Anti-Patterns — Message Persistence & Guaranteed Delivery Constraints

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Security |
| **Knowledge Unit** | Message Persistence & Guaranteed Delivery Constraints |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Assuming Reliable Broadcast Delivery (Fire-and-Forget Misunderstanding)
2. Broadcast as Sole Delivery Mechanism for Critical Data
3. No Missed Event Recovery on Client Reconnection
4. No Unique Event IDs for Deduplication
5. No Documented Delivery Guarantees

---

## Repository-Wide Anti-Patterns

- God Services
- Hidden Database Queries

---

## Anti-Pattern 1: Assuming Reliable Broadcast Delivery (Fire-and-Forget Misunderstanding)

### Category
Architecture

### Description
Designing application features with the assumption that all broadcast events are reliably delivered to all connected clients, ignoring that Laravel's broadcasting is fire-and-forget with multiple loss points.

### Warning Signs
- Features built assuming every broadcast reaches every client
- No error handling for undelivered broadcasts
- Critical business logic depends on broadcast delivery
- No fallback mechanism for missed events

### Why It Is Harmful
Laravel's broadcast pipeline has multiple loss points: queue job failures (retryable but can exhaust), broadcast driver HTTP errors (unreachable Pusher/Ably API), WebSocket server saturation (message dropped), client disconnection (event never reaches the client). Each stage is fire-and-forget — no acknowledgment, no retry, no guarantee. Features that assume reliable delivery will silently lose events and produce incorrect application state.

### Real-World Consequences
A team builds an order tracking feature that sends status updates exclusively via broadcast. Users must see "Order Shipped" to know their order status. When the queue worker pauses due to resource pressure, 15% of broadcast events are lost. Those users never see the status update. They contact support asking "Where is my order?" The support team confirms the order shipped, but the user never received the notification.

### Preferred Alternative
Treat broadcast as an optimization for real-time UX, not as an authoritative data delivery mechanism. Always have a REST API fallback for critical data.

### Refactoring Strategy
1. Identify all features that rely solely on broadcast delivery
2. Add REST API endpoints for the same data
3. Implement client-side "fetch on reconnection" pattern
4. Document that broadcast is additive, not authoritative

### Detection Checklist
- [ ] Features depend on reliable broadcast delivery
- [ ] No REST API fallback for critical data
- [ ] No handling of missed events

### Related Rules
- (Rule: Never assume broadcast delivery is reliable)

---

## Anti-Pattern 2: Broadcast as Sole Delivery Mechanism for Critical Data

### Category
Reliability

### Description
Using broadcasting as the only way to deliver important data (order confirmations, payment notifications, alerts) without persisting the data or having an API fallback.

### Warning Signs
- Critical data sent only via broadcast
- No database persistence of broadcast events
- No API fallback for offline users
- Users must be connected to WebSocket to receive important information

### Why It Is Harmful
Users who are offline or disconnected during the broadcast window permanently miss critical data. Unlike push notifications or email, broadcast events have no persistence. A disconnected user not only misses the real-time update — they have no way to retrieve it. For order status, payment confirmations, or security alerts, this creates data loss that erodes trust.

### Real-World Consequences
A payment processing application sends "Payment Approved" events exclusively via broadcast. A user submits a payment and the WebSocket is briefly disconnected during the approval window. The broadcast event is lost. The user sees no confirmation. They resubmit the payment, creating a duplicate charge. The user is double-billed and must contact support for a refund.

### Preferred Alternative
Always persist critical data in the database and have the client fetch it via API on reconnection. Use broadcast only as a real-time notification that data is available.

### Refactoring Strategy
1. Store all critical broadcast data in the database
2. Create an API endpoint to fetch missed data
3. Have the client call the API on connection/reconnection
4. Treat broadcast as a "heads up" not the data itself

### Detection Checklist
- [ ] Critical data delivered only via broadcast
- [ ] No database persistence of events
- [ ] Disconnected users permanently lose data

### Related Rules
- (Rule: Never use broadcast as sole delivery mechanism)

---

## Anti-Pattern 3: No Missed Event Recovery on Client Reconnection

### Category
Reliability

### Description
Not implementing a mechanism for clients to fetch events they missed while disconnected, causing permanent data loss after any WebSocket disconnection.

### Warning Signs
- Clients do not fetch missed events on reconnect
- No "last seen event ID" tracking
- No REST endpoint for missed event retrieval
- Events dispatched during disconnections are permanently lost

### Why It Is Harmful
WebSocket connections are inherently unreliable. Network interruptions, proxy timeouts, server restarts, and client navigation all cause disconnections. During each window, broadcast events are sent but never received. Without a missed-event recovery mechanism, every disconnection causes cumulative data loss. Over a normal application session, users may miss 5-15% of events.

### Real-World Consequences
A mobile user commutes through a tunnel, losing WebSocket connectivity for 60 seconds. During this time, 3 important notifications are broadcast. The client reconnects via EventSource auto-reconnect but has no way to know it missed events. The 3 notifications are permanently lost. The user discovers the missed information hours later and complains.

### Preferred Alternative
Implement a "fetch missed events" API endpoint that clients call on reconnection, passing the last event ID they received.

### Refactoring Strategy
1. Add unique monotonically increasing IDs to all broadcast events
2. Store events in a fast store (Redis with TTL) keyed by event ID
3. Create a REST endpoint that returns events since a given ID
4. Call the endpoint on Echo's connection established event
5. Process missed events on the client

### Detection Checklist
- [ ] No missed-event recovery on reconnect
- [ ] Last event ID not tracked
- [ ] Events lost during disconnections

### Related Rules
- (Rule: Always implement "fetch missed events" on client reconnection)

---

## Anti-Pattern 4: No Unique Event IDs for Deduplication

### Category
Reliability

### Description
Broadcasting events without unique, monotonically increasing event IDs, preventing client-side deduplication and making at-least-once delivery unsafe.

### Warning Signs
- Broadcast payloads have no `event_id` field
- Duplicate broadcast events cause duplicate UI updates
- No deduplication logic on the client
- Same event processed multiple times

### Why It Is Harmful
Without unique event IDs, clients cannot distinguish between a new event and a duplicate delivery. If events are retried or delivered multiple times (common with at-least-once guarantees), the client processes each duplicate as a new event. This creates duplicate notifications, duplicate state changes, and potentially corrupt local state (e.g., adding the same item to a list twice).

### Real-World Consequences
A chat application uses at-least-once delivery for chat messages. A network blip causes a message to be delivered twice. Without unique event IDs, the client renders the same message twice in the chat window. Users see "Hello, world!" and "Hello, world!" — two identical messages. They're confused about which is the real message.

### Preferred Alternative
Include a unique, monotonically increasing event ID in every broadcast payload and implement client-side deduplication.

### Refactoring Strategy
1. Add `event_id` (UUID or incrementing integer) to all broadcast event payloads
2. Maintain a set of received event IDs on the client
3. Before processing, check if the event ID was already processed
4. Skip processing for duplicate event IDs

### Detection Checklist
- [ ] No unique event IDs in broadcast payloads
- [ ] No client-side deduplication
- [ ] Duplicate events create duplicate UI elements

### Related Rules
- (Rule: Always use unique event IDs for client-side deduplication)

---

## Anti-Pattern 5: No Documented Delivery Guarantees

### Category
Maintainability

### Description
Not documenting the application's broadcast delivery guarantees, causing frontend developers to assume reliable delivery and build brittle features.

### Warning Signs
- No documentation of delivery semantics
- Frontend code assumes every broadcast reaches the client
- No mention of fire-and-forget in architecture docs
- Teams discover delivery limitations only after production incidents

### Why It Is Harmful
Without documented guarantees, developers default to assuming reliable delivery — it's the most intuitive mental model. Features are built around this assumption until a production incident reveals the truth. At that point, the team must refactor multiple features to handle eventual delivery, duplicate events, and missed events — a costly discovery.

### Real-World Consequences
A frontend developer builds a notification badge that increments on every broadcast event. They assume all events are delivered exactly once. During a storm, events are delivered 2-3 times. The badge shows "12 unread" when there are only 5. The developer blames the backend. The backend blames the network. No one documented that duplicate delivery is possible.

### Preferred Alternative
Document the application's real-time delivery guarantees in the architecture documentation and communicate them to all developers.

### Refactoring Strategy
1. Write a delivery guarantee document covering: fire-and-forget semantics, no ordering guarantees, duplicate possibility, missed event handling
2. Include the document in the developer onboarding process
3. Reference the guarantees in broadcast-related code comments
4. Review features that make incorrect delivery assumptions

### Detection Checklist
- [ ] No documented delivery guarantees
- [ ] Developers assume reliable delivery
- [ ] Production incidents from incorrect assumptions

### Related Rules
- (Rule: Always document delivery guarantees in the real-time contract)
