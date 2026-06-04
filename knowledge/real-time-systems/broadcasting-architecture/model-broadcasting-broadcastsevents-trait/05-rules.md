## Always Define `broadcastOn()` When Using the `BroadcastsEvents` Trait
---
## Framework Usage
---
Always implement `broadcastOn()` on models using the `BroadcastsEvents` trait.
---
Without `broadcastOn()`, the trait has no channels to broadcast on, and no events are dispatched. Models appear to do nothing despite having the trait.
---
```php
use BroadcastsEvents; // No broadcastOn() method — nothing broadcasts
```
---
```php
use BroadcastsEvents;
public function broadcastOn(string $event): array {
    return [$this]; // Auto-creates private channel
}
```
---
No common exceptions; the method is required for the trait to function.
---
No broadcasts emitted; silent failure.

## Always Filter Event Types in `broadcastOn()` to Avoid Unnecessary Broadcasts
---
## Performance
---
Always filter which event types trigger a broadcast by returning an empty array for events that shouldn't broadcast.
---
Model broadcasting fires on every `created`, `updated`, `deleted`, `trashed`, and `restored` event by default, flooding the broadcast system with irrelevant updates.
---
```php
public function broadcastOn(string $event): array {
    return [$this]; // Broadcasts on ALL event types
}
```
---
```php
public function broadcastOn(string $event): array {
    if ($event === 'created') return []; // Don't broadcast on create
    return [$this];
}
```
---
When all event types are intentionally broadcast (e.g., audit trail dashboards).
---
Excessive broadcasts; queue backlog; wasted bandwidth.

## Always Override `broadcastWith()` on Heavy Models
---
## Performance
---
Always define `broadcastWith()` on models with many attributes to control the broadcast payload.
---
By default, the entire model's public attributes are serialized. Heavy models with relationships, descriptions, or binary data produce large payloads that waste bandwidth.
---
```php
// Broadcasts all attributes including loaded relationships
public function broadcastOn(string $event): array { return [$this]; }
```
---
```php
public function broadcastWith(string $event): array {
    return ['id' => $this->id, 'status' => $this->status, 'total' => $this->total];
}
```
---
Models with few attributes where full serialization is acceptable. No common exceptions.
---
Oversized payloads; slow serialization; wasted network bandwidth.

## Always Register Auth Callbacks for Auto-Generated Private Channels
---
## Security
---
Always register authorization callbacks for the auto-generated `App.Models.{ModelName}.{id}` channel pattern.
---
When a model instance is returned from `broadcastOn()`, Laravel creates a private channel with a specific naming pattern. Without a matching auth callback, all subscriptions to that channel are denied with 403.
---
```php
// No auth callback registered — all subscriptions fail silently
```
---
```php
// routes/channels.php
Broadcast::channel('App.Models.Order.{id}', fn($user, $id) => $user->id === (int)$id);
```
---
Public channel broadcasting (returning `new Channel(...)` from `broadcastOn()`). No common exceptions.
---
All model broadcast subscriptions denied; users see no real-time updates.

## Never Assume Returning a Model Creates a Public Channel
---
## Framework Usage
---
Never assume returning a model instance from `broadcastOn()` creates a public channel.
---
Laravel automatically converts Eloquent model instances returned from `broadcastOn()` into `PrivateChannel` instances. This implicit behavior surprises developers expecting public broadcasting.
---
```php
public function broadcastOn(string $event): array {
    return [$this]; // Assumes public — actually creates PrivateChannel
}
```
---
```php
public function broadcastOn(string $event): array {
    return [new Channel('orders.'.$this->id)]; // Explicitly public
}
```
---
When you intentionally want private channel behavior. No common exceptions.
---
Accidental private channels; broken client subscriptions expecting public access.

## Avoid Model Broadcasting During Bulk Data Operations
---
## Reliability
---
Disable or suppress model broadcasting during migrations, seeding, and bulk `Model::update()` calls.
---
Bulk operations fire model events for every affected row, generating thousands of broadcast events. This floods the queue and may dispatch incomplete or incorrect data.
---
```php
Order::where('status', 'pending')->update(['status' => 'processed']); // Fires N broadcasts
```
---
```php
Order::withoutEvents(fn() => Order::where('status', 'pending')->update(['status' => 'processed']));
```
---
When bulk operations must reflect in real-time dashboards. No common exceptions.
---
Broadcast storms; queue overload; phantom updates on clients.

## Never Rely on Model Broadcasting for Complex Conditional Broadcasting
---
## Architecture
---
Avoid using model broadcasting when broadcast logic requires external context, conditional payloads, or multiple channels per event type.
---
The `broadcastOn()` method receives only the event type string. It has no access to who performed the action, why it changed, or other context needed for conditional broadcasting. Use dedicated event classes instead.
---
```php
// Cannot condition on "who updated" or "reason for change"
public function broadcastOn(string $event): array { return [$this]; }
```
---
```php
// Dedicated event with full context
class OrderUpdated implements ShouldBroadcast { /* full control */ }
```
---
Simple CRUD broadcasting scenarios where no external context is needed.
---
Inflexible broadcasting; missed context; workarounds that violate separation of concerns.
