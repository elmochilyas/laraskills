# ECC Anti-Patterns — ShouldBroadcast Interface & Event Lifecycle

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Event Broadcasting Architecture |
| **Knowledge Unit** | ShouldBroadcast Interface & Event Lifecycle |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No broadcastWith() — Relying on Public Property Serialization
2. ShouldBroadcastNow for All Events
3. No broadcastAs() — Client Bound to FQCN
4. Broadcasting Before Database Transaction Commits
5. No broadcastWhen() — Broadcasting Unchanged State

---

## Repository-Wide Anti-Patterns

- Hardcoded Configuration
- Duplicate Business Logic

---

## Anti-Pattern 1: No broadcastWith() — Relying on Public Property Serialization

### Category
Security | Performance

### Description
Not implementing `broadcastWith()` on `ShouldBroadcast` events, relying on automatic public property serialization that can expose entire Eloquent models, loaded relationships, and sensitive data to all channel subscribers.

### Warning Signs
- `broadcastWith()` not defined on event
- Broadcast payload includes entire Eloquent model with all relationships
- Sensitive fields appear in WebSocket messages
- Payload sizes are large (10KB+) for model-backed events

### Why It Is Harmful
All public properties of the event class are automatically serialized and broadcast. Models in public properties are serialized with all their attributes (and loaded relationships via `SerializesModels`), potentially exposing internal notes, PII, or sensitive fields.

### Real-World Consequences
An `OrderShipped` event has a public `$order` property. The entire `Order` model is serialized and broadcast, including `internal_notes`, `supplier_pricing`, and `customer_ssn` fields. All subscribed clients receive this data.

### Preferred Alternative
Always implement `broadcastWith()` to explicitly define the payload.

### Refactoring Strategy
1. Add `broadcastWith(): array` to the event class
2. Return only the fields needed by clients
3. Mark sensitive properties as `protected` or `private`
4. Verify payload in browser developer tools

### Detection Checklist
- [ ] `broadcastWith()` not implemented
- [ ] Eloquent models in event constructor properties
- [ ] Sensitive data visible in broadcast payload

### Related Rules
- (Rule: Always override broadcastWith() to control event payload)
- (Rule: Never expose sensitive data in public event properties)

### Related Skills
- (Related: Create and Customize ShouldBroadcast Events)

---

## Anti-Pattern 2: ShouldBroadcastNow for All Events

### Category
Performance

### Description
Implementing `ShouldBroadcastNow` for all broadcast events instead of the default queued `ShouldBroadcast`, causing every broadcast to block the HTTP response until WebSocket delivery completes.

### Warning Signs
- All events implement `ShouldBroadcastNow`
- HTTP response time degrades under broadcast load
- No event uses standard `ShouldBroadcast`
- Queue worker not configured but broadcasts still fire

### Why It Is Harmful
`ShouldBroadcastNow` bypasses the queue entirely, coupling HTTP response time to broadcast dispatch. A slow broadcast driver (network latency, WebSocket server load) directly impacts user-facing response times.

### Real-World Consequences
A marketing campaign triggers 50 broadcast events per request. Each broadcast takes ~15ms via `ShouldBroadcastNow`. HTTP response time goes from 120ms to 870ms. The site feels unresponsive.

### Preferred Alternative
Use the default queued `ShouldBroadcast` interface. Reserve `ShouldBroadcastNow` only for latency-critical events requiring sub-100ms delivery.

### Refactoring Strategy
1. Change events from `ShouldBroadcastNow` to `ShouldBroadcast`
2. Ensure queue worker is running
3. Identify truly latency-critical events (cursor sync, collaborative editing)
4. Keep `ShouldBroadcastNow` only for those

### Detection Checklist
- [ ] All events use `ShouldBroadcastNow`
- [ ] HTTP response time correlates with broadcast count
- [ ] No queue worker for broadcasts

### Related Rules
- (Rule: Prefer ShouldBroadcastNow only for latency-critical events)

---

## Anti-Pattern 3: No broadcastAs() — Client Bound to FQCN

### Category
Maintainability

### Description
Not defining `broadcastAs()` on broadcast events, causing the client to listen for the fully-qualified PHP class name, which breaks on any class rename or namespace change.

### Warning Signs
- `broadcastAs()` not defined on event
- Client listens for `App\\Events\\OrderShipped`
- Frontend tests reference PHP class names
- Refactoring event classes breaks client subscriptions

### Why It Is Harmful
The default client-side event name is the fully-qualified PHP class name (e.g., `App\Events\OrderShipped`). Renaming the class, moving it to a new namespace, or refactoring the event hierarchy silently breaks all frontend event listeners.

### Real-World Consequences
A team renames `App\Events\OrderShipped` to `App\Events\OrderConfirmed`. All frontend listeners for `order.shipped` (client-side) break. But actually, they were listening for `App\\Events\\OrderShipped` (the FQCN default) which also breaks. Either way, no `broadcastAs()` means a rename breaks everything.

### Preferred Alternative
Always define `broadcastAs()` with a stable dot-notation name.

### Refactoring Strategy
1. Add `public function broadcastAs(): string { return 'order.shipped'; }`
2. Update client-side listeners to use the dot-notation name
3. Set `namespace: ''` in Echo config (if using custom names)

### Detection Checklist
- [ ] `broadcastAs()` not defined
- [ ] Client listens for PHP class names
- [ ] Event class rename breaks frontend

### Related Rules
- (Rule: Always use broadcastAs() for stable client-side event names)

---

## Anti-Pattern 4: Broadcasting Before Database Transaction Commits

### Category
Reliability

### Description
Dispatching broadcast events inside database transactions without implementing `ShouldDispatchAfterCommit`, causing clients to receive stale or phantom data before the transaction completes.

### Warning Signs
- Events dispatched within `DB::transaction()` or transactional operations
- `ShouldDispatchAfterCommit` not implemented
- Clients see data that temporarily exists then disappears
- Reports of phantom records appearing briefly in UIs

### Why It Is Harmful
Broadcasting within an uncommitted transaction sends data to clients before it is persisted. If the transaction rolls back, clients have already seen phantom data. Even if committed, clients may see stale state before the transaction completes.

### Real-World Consequences
An order creation flow dispatches `OrderCreated` inside a transaction. Clients receive the event and show "Order #1234 created." The transaction then fails (payment declined). The order doesn't exist, but the client already showed it. User is confused.

### Preferred Alternative
Implement `ShouldDispatchAfterCommit` on events dispatched within transactions.

### Refactoring Strategy
1. Add `ShouldDispatchAfterCommit` to the event class
2. It does not add a method — it's a marker interface
3. Verify events only fire after successful commit

### Detection Checklist
- [ ] Event dispatched in transactional context
- [ ] `ShouldDispatchAfterCommit` not implemented
- [ ] Phantom data appears on clients temporarily

### Related Rules
- (Rule: Always use ShouldDispatchAfterCommit for transactional consistency)

---

## Anti-Pattern 5: No broadcastWhen() — Broadcasting Unchanged State

### Category
Performance

### Description
Not implementing `broadcastWhen()` on events, causing broadcast dispatch to fire on every trigger even when the event payload hasn't meaningfully changed.

### Warning Signs
- `broadcastWhen()` not defined
- Events dispatched when state hasn't changed
- Queue filled with broadcasts for "same status" updates
- Clients receive redundant updates for unchanged data

### Why It Is Harmful
Without `broadcastWhen()`, every event dispatch results in a queue job even when the broadcast should be suppressed (e.g., status didn't change, update was a no-op). This wastes queue capacity and floods clients with irrelevant updates.

### Real-World Consequences
An `OrderStatusUpdated` event fires every time an order is saved, even when status doesn't change. `Model::touch()` triggers timestamps and fires the event. 80% of broadcasts are for unchanged status. Clients receive 5x more updates than needed.

### Preferred Alternative
Implement `broadcastWhen()` to gate broadcasting on meaningful state changes.

### Refactoring Strategy
1. Add `public function broadcastWhen(): bool`
2. Check if relevant state actually changed
3. Return false when broadcast is unnecessary

### Detection Checklist
- [ ] `broadcastWhen()` not defined
- [ ] High broadcast volume from unchanged state
- [ ] Redundant client updates

### Related Rules
- (Rule: Always define broadcastWhen() to gate unnecessary broadcasts)
