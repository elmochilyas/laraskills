# ECC Anti-Patterns — Model Broadcasting (BroadcastsEvents Trait)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Real-Time Systems |
| **Subdomain** | Event Broadcasting Architecture |
| **Knowledge Unit** | Model Broadcasting (BroadcastsEvents Trait) |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Model Broadcasting for Everything
2. No broadcastWith() Override — Broadcasting Entire Model
3. Broadcasting During Migrations/Seeding
4. No Auth Callback for Auto-Generated Private Channels
5. Assuming Returning Model Creates Public Channel

---

## Repository-Wide Anti-Patterns

- Duplicate Business Logic
- Hidden Database Queries

---

## Anti-Pattern 1: Model Broadcasting for Everything

### Category
Performance

### Description
Adding the `BroadcastsEvents` trait to every model in the application without filtering event types, causing unnecessary broadcasts for all CRUD operations across all models.

### Warning Signs
- Every Eloquent model has the `BroadcastsEvents` trait
- No `broadcastOn()` filtering by event type
- Broadcast queue flooded with irrelevant model changes
- Models where clients never listen for broadcasts still trigger events

### Why It Is Harmful
Model broadcasting fires on every `created`, `updated`, `deleted`, `trashed`, and `restored` event by default. Adding the trait to every model floods the broadcast system with events that no client is listening for, wasting queue capacity and bandwidth.

### Real-World Consequences
The `BroadcastsEvents` trait is added to all 20 models in an application. Only 2 models have corresponding frontend listeners. The other 18 models generate 95% of broadcast events that are never consumed. Queue workers are saturated with useless jobs.

### Preferred Alternative
Use model broadcasting only on models that need real-time frontend updates. Filter event types in `broadcastOn()`.

### Refactoring Strategy
1. Audit all models with the `BroadcastsEvents` trait
2. Remove trait from models without frontend listeners
3. For remaining models, filter event types in `broadcastOn()`
4. Measure reduction in broadcast queue volume

### Detection Checklist
- [ ] `BroadcastsEvents` trait on models without frontend listeners
- [ ] No event type filtering in `broadcastOn()`
- [ ] High broadcast volume from unneeded models

### Related Rules
- (Rule: Always filter event types in broadcastOn() to avoid unnecessary broadcasts)

### Related Skills
- (Related: Use Model Broadcasting with the BroadcastsEvents Trait)

---

## Anti-Pattern 2: No broadcastWith() Override — Broadcasting Entire Model

### Category
Performance

### Description
Not overriding `broadcastWith()` on models with many attributes, causing the entire model (including relationships, binary data, and internal fields) to be serialized and sent to every subscribed client.

### Warning Signs
- `broadcastWith()` not defined on model
- Broadcast payload includes all model attributes
- Large payloads (10KB+) for models with relationships
- Sensitive internal fields exposed to clients
- Serialization overhead during broadcast

### Why It Is Harmful
By default, the entire model's public attributes are serialized. Heavy models with relationships, descriptions, or binary data produce large payloads that waste bandwidth, slow serialization, and may leak internal data.

### Real-World Consequences
A `Product` model has 50 attributes including `internal_notes`, `supplier_cost`, and a base64-encoded image thumbnail. Without `broadcastWith()`, all 50 attributes are broadcast on every update. Payload is 30KB. 1,000 updates = 30MB broadcast to all connected clients.

### Preferred Alternative
Override `broadcastWith()` to return only the attributes needed by the frontend.

### Refactoring Strategy
1. Define `broadcastWith(string $event): array` on the model
2. Return only fields needed by frontend (id, status, name, etc.)
3. Exclude sensitive/internal fields
4. Verify payload size reduction

### Detection Checklist
- [ ] `broadcastWith()` not overridden
- [ ] Broadcast payload includes all model attributes
- [ ] Sensitive fields exposed in payload

### Related Rules
- (Rule: Always override broadcastWith() on heavy models)

### Related Skills
- (Related: Use Model Broadcasting with the BroadcastsEvents Trait — payload control)

---

## Anti-Pattern 3: Broadcasting During Migrations/Seeding

### Category
Reliability

### Description
Running migrations, seeders, or bulk `Model::update()` calls without suppressing model broadcasting, causing thousands of broadcast events to fire for data operations that clients should not see.

### Warning Signs
- Broadcast queue spikes during deployment
- Clients receive stale or incomplete data during bulk operations
- Seeder execution triggers broadcast events
- `Order::where('status', 'pending')->update([...])` generates N broadcasts

### Why It Is Harmful
Bulk operations fire model events for every affected row, generating thousands of broadcast events. These events deliver incomplete or incorrect data (mid-update state) to clients. The queue is flooded with meaningless jobs.

### Real-World Consequences
A nightly maintenance script updates `status` on 10,000 orders. Each update triggers a broadcast event. Clients receive 10,000 "order updated" notifications in seconds. The UI crashes from notification overload. The broadcast queue grows to 10K backlog.

### Preferred Alternative
Wrap bulk data operations in `Model::withoutEvents()` to suppress broadcasting.

### Refactoring Strategy
1. Wrap migrations/seeding in `Model::withoutEvents()`
2. Wrap bulk `Model::update()` calls in `withoutEvents()`
3. Use dedicated sync methods for operations that should broadcast
4. Verify broadcast queue is clean after bulk operations

### Detection Checklist
- [ ] Seeder execution triggers broadcasts
- [ ] Bulk `Model::update()` generates per-row broadcasts
- [ ] Deployment causes broadcast queue spike

### Related Rules
- (Rule: Avoid model broadcasting during bulk data operations)

### Related Skills
- (Related: Use Model Broadcasting with the BroadcastsEvents Trait — bulk operations)

---

## Anti-Pattern 4: No Auth Callback for Auto-Generated Private Channels

### Category
Security

### Description
Using the `BroadcastsEvents` trait and returning model instances from `broadcastOn()` without registering authorization callbacks for the auto-generated `App.Models.{ModelName}.{id}` channel pattern, causing all client subscriptions to fail with 403.

### Warning Signs
- Model broadcasts dispatched but clients never receive them
- Client-side subscription errors (403) on model channels
- No `App.Models.*` pattern in `routes/channels.php`
- `broadcastOn()` returns `[$this]` but no auth callback registered

### Why It Is Harmful
When a model instance is returned from `broadcastOn()`, Laravel auto-creates a private channel with the pattern `App.Models.{ClassName}.{id}`. Without a matching auth callback in `routes/channels.php`, all subscription attempts are denied.

### Real-World Consequences
A team adds the `BroadcastsEvents` trait to the `Order` model. `broadcastOn()` returns `[$this]`, auto-creating `App.Models.Order.{id}`. No auth callback is registered. All clients get 403 when subscribing. No one can see real-time order updates. Team spends 2 days debugging.

### Preferred Alternative
Register authorization callbacks for all auto-generated private channel patterns from model broadcasting.

### Refactoring Strategy
1. Identify all models using `BroadcastsEvents` that return `$this` from `broadcastOn()`
2. Register `App.Models.{ModelName}.{id}` patterns in `routes/channels.php`
3. Add appropriate authorization logic in each callback
4. Test client subscription succeeds

### Detection Checklist
- [ ] Model returns `$this` from `broadcastOn()` without auth callback
- [ ] Client subscription returns 403
- [ ] `App.Models.*` pattern not registered

### Related Rules
- (Rule: Always register auth callbacks for auto-generated private channels)

### Related Skills
- (Related: Authorize Private and Presence Channels)

---

## Anti-Pattern 5: Assuming Returning Model Creates Public Channel

### Category
Framework Usage

### Description
Returning Eloquent model instances from `broadcastOn()` expecting a public channel but receiving a private channel instead, breaking client-side subscriptions that expect unauthenticated access.

### Warning Signs
- `broadcastOn()` returns `[$this]` expecting public access
- Clients fail to subscribe without authentication
- Developer surprised by 403 on "public" channel
- No explicit `new Channel(...)` used

### Why It Is Harmful
Laravel automatically converts Eloquent model instances returned from `broadcastOn()` into `PrivateChannel` instances. This implicit behavior surprises developers who expect public broadcasting. It's a security measure (data isn't accidentally exposed) but breaks public channel expectations.

### Real-World Consequences
A developer adds model broadcasting for a public leaderboard feature. `broadcastOn()` returns `[$this]`, expecting public access. The leaderboard only shows data for authenticated users because the channel is actually private. The leaderboard feature is broken for anonymous visitors.

### Preferred Alternative
Return explicit `new Channel('name')` instances from `broadcastOn()` for public channels, or `new PrivateChannel('name')` for private channels.

### Refactoring Strategy
1. Identify `broadcastOn()` methods returning `$this` for public channels
2. Replace with `return [new Channel('leaderboard')]`
3. Update client-side subscriptions to match the channel type
4. Test both public and private channel scenarios

### Detection Checklist
- [ ] `broadcastOn()` returns `$this` but public channel intended
- [ ] Client subscription requires unexpected authentication
- [ ] No explicit channel type instantiation

### Related Rules
- (Rule: Never assume returning a model creates a public channel)
