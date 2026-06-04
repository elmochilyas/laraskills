# Model Broadcasting Rules

## Rule 1: Always Prefer `BroadcastsEventsAfterCommit` Over `BroadcastsEvents`
---
## Category
Reliability
---
## Rule
Always use `BroadcastsEventsAfterCommit` instead of `BroadcastsEvents` on models that need real-time broadcasting.
---
## Reason
`BroadcastsEvents` dispatches before the database transaction commits. If the transaction rolls back, clients receive stale data. The after-commit variant guarantees the data is persisted before broadcasting.
---
## Bad Example
```php
use BroadcastsEvents; // Broadcasts before commit — stale data risk
```
---
## Good Example
```php
use BroadcastsEventsAfterCommit; // Only broadcasts after successful transaction
```
---
## Exceptions
You need to broadcast optimistically before the commit completes (e.g., real-time collaborative editing where latency is critical).
---
## Consequences Of Violation
Data inconsistency between broadcast state and persisted state; clients see phantom or rolled-back data.

---

## Rule 2: Always Override `broadcastWith()` to Filter Sensitive Data
---
## Category
Security
---
## Rule
Always override `broadcastWith()` to explicitly control which model attributes reach the client.
---
## Reason
By default, `BroadcastsEvents` serializes all model attributes to JSON. This may expose sensitive fields (passwords, tokens, PII) to unauthorized clients. An explicit allow-list prevents data leaks.
---
## Bad Example
```php
class Order extends Model
{
    use BroadcastsEventsAfterCommit;
    // Uses default broadcastWith() — all attributes exposed
}
```
---
## Good Example
```php
class Order extends Model
{
    use BroadcastsEventsAfterCommit;

    public function broadcastWith(): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'total' => $this->total_cents,
        ]; // Explicit allow-list
    }
}
```
---
## Exceptions
The model contains no sensitive data (e.g., a public read-model with only non-sensitive fields).
---
## Consequences Of Violation
Security breach from leaking credentials, PII, or internal state; compliance violations (GDPR, HIPAA).

---

## Rule 3: Use Private Channels for Sensitive Models
---
## Category
Security
---
## Rule
Use `PrivateChannel` or `PresenceChannel` for models containing user-specific or sensitive data instead of the default public channel.
---
## Reason
Model broadcasts use public channels by default (`App.Models.{Model}.{Id}`). Any authenticated client can subscribe to public channels and receive model data.
---
## Bad Example
```php
public function broadcastOn(): array
{
    return [$this]; // Resolves to a public channel by default
}
```
---
## Good Example
```php
public function broadcastOn(): array
{
    return [new PrivateChannel('orders.'.$this->user_id)];
}
```
---
## Exceptions
The model data is intentionally public (e.g., a public leaderboard or shared status board).
---
## Consequences Of Violation
Unauthorized data access; user data exposure across tenant boundaries; compliance violations.

---

## Rule 4: Override `broadcastAs()` for Semantic Event Names
---
## Category
Maintainability
---
## Rule
Override `broadcastAs()` to provide semantic event names instead of relying on the generic `eloquent.created` / `eloquent.updated` defaults.
---
## Reason
Default broadcast event names (`eloquent.created`) leak implementation details to frontend clients. Semantic names (`order.placed`, `order.shipped`) communicate domain meaning and decouple frontend from Eloquent internals.
---
## Bad Example
```php
// Frontend listens to "eloquent.created" — coupled to Eloquent
```
---
## Good Example
```php
public function broadcastAs(): string
{
    return 'order.placed';
}
```
---
## Exceptions
Rapid prototyping or internal admin panels where event naming conventions are not a concern.
---
## Consequences Of Violation
Tight coupling between frontend and Eloquent's internal event naming; harder to refactor or replace persistence layer.

---

## Rule 5: Override `broadcastChannel()` for Consistent Naming
---
## Category
Maintainability
---
## Rule
Override `broadcastChannel()` to define a consistent, meaningful channel name instead of relying on the default `App.Models.{Model}.{Id}` pattern.
---
## Reason
Default channel names include the fully qualified class name, which couples broadcasting consumers to the PHP class namespace. A stable channel name survives refactoring and is more readable in client code.
---
## Bad Example
```php
// Default: App.Models.Order.42 — exposes class namespace
```
---
## Good Example
```php
public function broadcastChannel(): string
{
    return 'orders.'.$this->id;
}
```
---
## Exceptions
Non-public channels explicitly controlled (private/presence channels) where the channel name is well-defined.
---
## Consequences Of Violation
Channel name changes when class is renamed; coupling of frontend consumers to backend namespaces; difficulty debugging channel subscriptions.

---

## Rule 6: Do Not Broadcast Sensitive Model Relations by Default
---
## Category
Security
---
## Rule
Do not include eager-loaded relations in `broadcastWith()` unless each relation's attributes are explicitly allow-listed.
---
## Reason
If an observer or accessor includes relation data in the broadcast payload, sensitive nested data may leak to clients without explicit review.
---
## Bad Example
```php
public function broadcastWith(): array
{
    return $this->load('user')->toArray(); // User's email, address, etc. exposed
}
```
---
## Good Example
```php
public function broadcastWith(): array
{
    return [
        'id' => $this->id,
        'user_name' => $this->user->name, // Only non-sensitive field
    ];
}
```
---
## Exceptions
All relation data is intentionally public and reviewed for sensitivity.
---
## Consequences Of Violation
Accidental data leakage through eager-loaded relations; compliance violations.

---

## Rule 7: Rate-Limit High-Frequency Model Broadcasts
---
## Category
Performance
---
## Rule
Use throttling or debouncing when broadcasting models that update frequently (multiple times per second per model).
---
## Reason
Each broadcast triggers a web socket message and potentially re-renders UI components. High-frequency updates cause network saturation, frontend thrashing, and server load on the broadcasting backend.
---
## Bad Example
```php
// Order status updates fire broadcast on every save — 100 updates/second
for ($i = 0; $i < 100; $i++) {
    $order->update(['progress' => $i]);
    // Broadcasts every time
}
```
---
## Good Example
```php
// Throttle broadcasts — only broadcast the final state
$order->update(['progress' => 99]);
$order->broadcastUpdated(); // Or rely on after-commit trait with throttled dispatch
```
---
## Exceptions
Real-time collaborative editing where every keystroke must be broadcast; latency-sensitive financial tickers.
---
## Consequences Of Violation
Web socket server overload; frontend rendering performance degradation; increased bandwidth costs.

---

## Rule 8: Use `broadcastUpdated()` Only When the Broadcast Trait Is Insufficient
---
## Category
Framework Usage
---
## Rule
Do not call `broadcastUpdated()`, `broadcastCreated()`, or `broadcastDeleted()` manually unless you need to broadcast outside the normal save/delete flow.
---
## Reason
The `BroadcastsEvents` trait automatically fires broadcasts on every `save()` and `delete()`. Manual calls duplicate broadcasts or fire them at unexpected times, causing duplicate messages on the client.
---
## Bad Example
```php
$order->save();
$order->broadcastUpdated(); // Duplicate broadcast — client receives two updates
```
---
## Good Example
```php
$order->save(); // Single broadcast fires automatically from the trait
```
---
## Exceptions
Broadcasting custom events (not tied to save/delete) or broadcasting to additional channels beyond the trait's defaults.
---
## Consequences Of Violation
Duplicate client updates; increased bandwidth; confused users seeing duplicate notifications.

---

## Rule 9: Place `BroadcastsEventsAfterCommit` After Other Traits in the `use` Statement
---
## Category
Code Organization
---
## Rule
List `BroadcastsEventsAfterCommit` (or `BroadcastsEvents`) after domain behavior traits in the model's `use` statement.
---
## Reason
Trait boot methods run in `use` statement order. Broadcasting should be the last step in the lifecycle, after domain logic and persistence concerns have executed. Ordering it last prevents broadcast before other trait setup completes.
---
## Bad Example
```php
class Order extends Model
{
    use BroadcastsEventsAfterCommit, // Boots first, broadcasts early
        HasStatus,
        HasUuid;
}
```
---
## Good Example
```php
class Order extends Model
{
    use HasStatus,
        HasUuid,
        BroadcastsEventsAfterCommit; // Broadcasts last
}
```
---
## Exceptions
The model has no other traits with boot methods; broadcasting order is irrelevant.
---
## Consequences Of Violation
Broadcasts may fire before other trait initialization completes; inconsistent broadcast payloads during boot sequence.

---

## Rule 10: Always Test Broadcast Payloads
---
## Category
Testing
---
## Rule
Write tests that assert the exact structure and content of `broadcastWith()` output for each model event.
---
## Reason
Broadcast payloads are contracts between backend and frontend. An unintended change to `broadcastWith()` breaks the frontend silently. Tests catch payload regressions at deploy time.
---
## Bad Example
```php
// No tests for broadcast payload — frontend discovers breakage in production
```
---
## Good Example
```php
public function test_order_broadcast_payload(): void
{
    $order = Order::factory()->create();

    Event::fake(OrderBroadcast::class);
    // ... trigger broadcast

    Broadcast::assertSent(OrderBroadcast::class, fn ($event) =>
        $event->broadcastWith() === ['id' => $order->id, 'status' => 'placed']
    );
}
```
---
## Exceptions
Rapid prototyping where frontend contract is not yet defined.
---
## Consequences Of Violation
Frontend rendering errors; silent data contract violations; difficult debugging of client-side issues.
