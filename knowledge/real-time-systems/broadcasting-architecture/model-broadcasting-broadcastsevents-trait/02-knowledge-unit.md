# Metadata
Domain: Real-Time Systems
Subdomain: Event Broadcasting Architecture
Knowledge Unit: Model Broadcasting (BroadcastsEvents Trait)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Model broadcasting is a convention-over-configuration pattern in Laravel that automatically broadcasts Eloquent model state changes (created, updated, deleted, trashed, restored) to frontend clients. By adding the `BroadcastsEvents` trait to a model and defining a `broadcastOn()` method, Laravel automatically generates broadcast events when model instances change. The broadcast event name follows the convention `{ModelClass}.{event}` (e.g., `Order.created`), and the payload includes the model's public attributes. The trait eliminates the need to create manual event classes for simple CRUD-based broadcasting scenarios. Channel names default to a private channel using the model's class name and primary key.

## Core Concepts
The `BroadcastsEvents` trait intercepts Eloquent model events (via the model's `$dispatchesEvents` property) and maps them to broadcast events. The `broadcastOn()` method receives the event name string (created, updated, deleted, trashed, restored) and returns the channels to broadcast on. If `broadcastOn()` returns Eloquent model instances, Laravel auto-converts them to private channels using the pattern `App.Models.{ClassName}.{id}`. Customization is available via `broadcastAs($event)` and `broadcastWith($event)` methods that receive the event type for per-event customization.

## Mental Models
Think of model broadcasting as automatic "change data capture" (CDC) for real-time clients. When a database row changes, the corresponding frontend component updates automatically. The model acts as both the source of truth and the event originator—no separate event class needed.

## Internal Mechanics
The trait hooks into Eloquent's boot lifecycle. When `created`, `updated`, `deleted`, `trashed`, or `restored` fires on the model, the trait checks if broadcasting is enabled for that event type. It constructs a broadcast payload from the model's broadcastable attributes and dispatches an internal broadcast event. The event name format is `\App\Models\Order` becomes `App.Models.Order` on the client side. The `broadcastOn()` method can return `Channel`, `PrivateChannel`, `PresenceChannel` instances, or Eloquent models (which auto-resolve to private channels).

## Patterns
- **Convention over configuration**: Defaults to private channel with model class+ID naming, no manual event classes
- **Per-event customization**: `broadcastAs($event)` and `broadcastWith($event)` provide event-type-specific overrides
- **Auto-private channels**: Returning Eloquent models from `broadcastOn()` auto-creates private channels
- **Selective broadcasting**: `broadcastOn()` can return empty array to skip broadcasting for specific event types

## Architectural Decisions
- **No separate event files**: Reduces boilerplate for simple CRUD broadcasting scenarios
- **Private by default**: Model channels default to private, requiring authorization
- **Event-parameterized methods**: `broadcastOn($event)` receives the event type, enabling conditional channel selection

## Tradeoffs
- **Less explicit than manual events**: The auto-generated event structure is fixed, limiting complex broadcast logic
- **No per-instance filtering**: `broadcastWhen()` is not available in the trait interface; use model events for conditional logic
- **Payload is model-sourced**: Cannot include external context (e.g., who performed the update) without overriding `broadcastWith()`
- **Model mutates during broadcast**: Serializing models at the event firing time may capture inconsistent state during transactions

## Performance Considerations
- Model broadcasting adds overhead to every Eloquent CRUD operation on the model
- Use `broadcastOn()` to selectively broadcast only specific event types (e.g., only `updated`, not `created`)
- Heavy models with many attributes should override `broadcastWith()` to send minimal payloads
- Queue-backed automatically (like all broadcasting), so the HTTP response is not blocked

## Production Considerations
- Define channel authorization in `routes/channels.php` for auto-generated private channel names
- Ensure model instances returned from `broadcastOn()` do not include loaded relationships unless explicitly needed
- Test that model serialization during broadcast does not cause N+1 queries in the queue worker
- Be aware that model broadcasting fires during bulk operations (`Model::update()`) which may generate unexpected broadcasts

## Common Mistakes
- Forgetting to define `broadcastOn()` on the model, causing no channels to be subscribed
- Returning the model instance from `broadcastOn()` expecting a public channel (it creates a private channel)
- Broadcasting on every event type when only specific events are needed
- Assuming model broadcasting works with `ShouldBroadcastNow` (it uses the standard queue by default)

## Failure Modes
- **Massive broadcast storm**: Updating thousands of models triggers thousands of broadcast events
- **Authorization failure**: Auto-generated private channel names don't match auth callback patterns
- **Stale data**: Model broadcasting within uncommitted transactions delivers incomplete data to clients
- **Missing context**: Frontend receives the model state but not the reason or actor behind the change

## Ecosystem Usage
- Used for real-time dashboards showing latest orders, users, or inventory changes
- Common in admin panels for live-updating tables without manual Event classes
- Useful for activity feeds and audit trail visualization
- Can be combined with Laravel notifications for dual delivery

## Related Knowledge Units
- K01: Laravel Broadcasting Architecture
- K02: ShouldBroadcast Interface & Event Lifecycle
- K11: Public/Private/Presence Channel Patterns
- K12: Channel Authorization (routes/channels.php)

## Research Notes
Model broadcasting was introduced in Laravel 7.x and has remained structurally unchanged. It is a thin convenience layer over the standard `ShouldBroadcast` interface. The `BroadcastsEvents` trait uses Eloquent's `$dispatchesEvents` property internally. Laravel 13.x introduced model boot improvements but did not change the broadcasting trait interface. The main usage caveat remains the implicit private channel creation when returning model instances from `broadcastOn()`.
