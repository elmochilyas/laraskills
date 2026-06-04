# ECC Anti-Patterns — Public/Private/Presence Channel Patterns

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Channel Types & Authorization |
| **Knowledge Unit** | Public/Private/Presence Channel Patterns |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Public Channel for Everything
2. Presence Channel as General-Purpose Online Tracker
3. Flat Channel Namespace
4. Returning Entire User Model from Presence Auth
5. No Auth Callback for Private/Presence Channels

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries
- Fat Controllers

---

## Anti-Pattern 1: Public Channel for Everything

### Category
Security

### Description
Using public channels for all broadcast events regardless of data sensitivity, exposing user-specific data to any connected WebSocket client without authorization.

### Warning Signs
- All broadcast events use `new Channel('...')`
- No private or presence channels used anywhere
- User-specific data broadcast on channels without prefixes
- Any WebSocket client can receive any event

### Why It Is Harmful
Public channels require no authorization — any connected WebSocket client can subscribe and receive all events broadcast to that channel. Broadcasting sensitive data (email, order details, notifications) on public channels makes it accessible to anyone.

### Real-World Consequences
A team uses public channels for all events including `user.{id}` notifications. A malicious actor connects to the WebSocket server and subscribes to `user.*` channel patterns. They receive all users' notifications, including order confirmations with email addresses.

### Preferred Alternative
Apply least privilege: use private channels for user-specific data. Use public channels only for global announcements and public information.

### Refactoring Strategy
1. Audit all broadcast events: classify data as sensitive or non-sensitive
2. Change `new Channel()` to `new PrivateChannel()` for user-specific data
3. Register auth callbacks for private channel patterns
4. Test that unauthorized clients cannot subscribe

### Detection Checklist
- [ ] Public channels for user-specific data
- [ ] No private/presence channels used
- [ ] Any client can receive any event

### Related Rules
- (Rule: Always apply least privilege when choosing channel types)
- (Rule: Never broadcast sensitive data on public channels)

---

## Anti-Pattern 2: Presence Channel as General-Purpose Online Tracker

### Category
Performance

### Description
Using a presence channel for every user just to track online status, creating unnecessary join/leave event fan-out and Redis write overhead for what could be a simple REST endpoint.

### Warning Signs
- Presence channel per user just to know if they're online
- Each user has a `presence-user.{id}` channel
- Thousands of presence channels with no social/collaboration features
- Redis write pressure from join/leave events

### Why It Is Harmful
Presence channels generate join/leave events to all members on every subscription change. Using them just for online status creates O(n) fan-out — every user's browser receives join/leave events for every other user. For 10K users, that's 10K events per user join/leave.

### Real-World Consequences
An app with 5,000 users uses presence channels for each user to show online status. When user #500 connects, 4,999 browsers receive a `joining` event. Each join/leave generates Redis writes and WebSocket broadcasts. 50% of Redis CPU is spent on presence events.

### Preferred Alternative
Use a private channel per user with a REST status endpoint. Or use Redis for lightweight heartbeat-based online tracking without WebSocket broadcast.

### Refactoring Strategy
1. Replace presence channel with private channel for user-specific data
2. Implement REST endpoint: `GET /api/users/{id}/status`
3. Or use Redis heartbeat for online tracking
4. Monitor reduction in broadcast volume

### Detection Checklist
- [ ] Presence channels used only for online status
- [ ] Chat/collaboration features don't exist
- [ ] High join/leave event volume

### Related Rules
- (Rule: Never use presence channels when private + API status suffices)

---

## Anti-Pattern 3: Flat Channel Namespace

### Category
Maintainability

### Description
Using flat, unstructured channel names like `chat1`, `orders`, `user1` without resource-based hierarchical naming, leading to naming collisions and unmaintainable channel registrations.

### Warning Signs
- Channel names like `orders`, `chat`, `notifications`
- No `{resource}.{identifier}` pattern
- Channel authorization callbacks use string parsing to extract parameters
- Channel names collide between different features

### Why It Is Harmful
Flat naming makes it difficult to understand authorization patterns, debug subscription issues, and manage channel registrations at scale. Without structured naming, authorization callbacks must parse names manually, increasing complexity.

### Real-World Consequences
A feature uses channel `orders` for order updates. Another feature later uses `orders` for active order count. Both broadcast on the same channel name. Clients subscribed to one feature also receive events from the other. Confusion and data corruption.

### Preferred Alternative
Use structured, hierarchical naming conventions: `resource.{identifier}` or `domain.resource.{id}`.

### Refactoring Strategy
1. Define naming convention: `{resource}.{identifier}` (e.g., `orders.{orderId}`)
2. Update all `broadcastOn()` methods to use structured names
3. Update all channel authorization callbacks
4. Update Echo subscriptions on frontend

### Detection Checklist
- [ ] Flat, unstructured channel names
- [ ] Name collisions between features
- [ ] Authorization parsing channel names manually

### Related Rules
- (Rule: Always use conventional naming for channel organization)

---

## Anti-Pattern 4: Returning Entire User Model from Presence Auth

### Category
Security

### Description
Returning the entire `$user` object from presence channel auth callbacks, broadcasting all user model attributes (including PII) to every channel member.

### Warning Signs
- Presence auth callback returns `$user` directly
- Presence channel events include email, phone, address fields
- All channel members receive full user object on join/leave

### Why It Is Harmful
The return value of a presence channel auth callback is broadcast to all channel members. Returning the entire User model exposes PII (email, phone, address, internal notes) to every subscriber.

### Real-World Consequences
A chat room presence callback returns `$user`. When user John joins, all 50 room members receive John's full User model, including email, phone number, and last login IP. John's PII is exposed without his knowledge.

### Preferred Alternative
Return only required fields: `['id' => $user->id, 'name' => $user->name, 'avatar' => $user->avatar_url]`.

### Refactoring Strategy
1. Identify all presence auth callbacks returning `$user`
2. Replace with explicit array of safe fields
3. Verify no sensitive fields appear in presence events

### Detection Checklist
- [ ] Presence callback returns `$user` or entire model
- [ ] PII visible in presence `joining` events
- [ ] Sensitive fields broadcast to all members

### Related Rules
- (Rule: Never return the entire User model from presence auth callbacks)

---

## Anti-Pattern 5: No Auth Callback for Private/Presence Channels

### Category
Framework Usage

### Description
Creating private or presence channels in `broadcastOn()` without registering the corresponding authorization callback in `routes/channels.php`, causing all subscription attempts to return 403.

### Warning Signs
- Private/presence channels in `broadcastOn()` but no matching `Broadcast::channel()` registration
- Clients receive 403 on subscription
- No error in Laravel logs about channel auth
- Features silently broken for all users

### Why It Is Harmful
Without a matching auth callback, the `/broadcasting/auth` endpoint has no pattern to match and returns 403 by default. Every subscription attempt fails silently — no error is logged, no warning is raised.

### Real-World Consequences
A team adds `new PrivateChannel('orders.'.$this->order->id)` to an event but forgets to add `Broadcast::channel('orders.{id}', ...)` in `routes/channels.php`. All clients get 403 when subscribing. The feature appears broken for 2 weeks before someone checks the network tab.

### Preferred Alternative
Always register a matching auth callback for every private and presence channel pattern.

### Refactoring Strategy
1. List all private/presence channel patterns from event classes
2. Ensure each has a corresponding `Broadcast::channel()` registration
3. Test subscription success/failure for each pattern

### Detection Checklist
- [ ] Private/presence channels without matching auth callback
- [ ] Clients receiving 403 on subscription
- [ ] No callback registered in `routes/channels.php`

### Related Rules
- (Rule: Always implement auth callbacks for both private and presence channels)
