# Metadata
Domain: Real-Time Systems
Subdomain: Event Broadcasting Architecture
Knowledge Unit: ShouldBroadcast Interface & Event Lifecycle
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
The `ShouldBroadcast` interface is the contract that transforms a standard Laravel event into a broadcastable one. Implementing it signals the framework to queue the event for WebSocket delivery. The event lifecycle proceeds through five stages: instantiation (constructor receives state), channel resolution (`broadcastOn()`), payload customization (`broadcastWith()`), event naming (`broadcastAs()`), conditional broadcasting (`broadcastWhen()`), and finally queue dispatch. Public event properties are automatically serialized in the broadcast payload unless overridden. The `InteractsWithSockets` trait and `Dispatchable` trait provide the standard composition. The `ShouldBroadcastNow` variant bypasses the queue for synchronous dispatch. The `ShouldDispatchAfterCommit` interface delays broadcasting until database transactions complete.

## Core Concepts
The `ShouldBroadcast` interface (`Illuminate\Contracts\Broadcasting\ShouldBroadcast`) requires a single method: `broadcastOn()` returning channel(s). Events also commonly use `InteractsWithSockets` (provides channel helper methods) and `SerializesModels` (safe Eloquent model serialization in queued jobs). Customization methods are all optional: `broadcastWith()` controls payload data, `broadcastAs()` sets the client-side event name (defaults to fully-qualified class name, dots recommended for readability), `broadcastWhen()` gates whether the event broadcasts at all. Event dispatch can use the `event()` helper, `broadcast()` helper, or `::dispatch()` via the `Dispatchable` trait.

## Mental Models
Each broadcast event is a message envelope. The constructor collects what happened, `broadcastOn()` addresses it to the right rooms, `broadcastWith()` packs the data, and `broadcastAs()` labels the envelope. The queue worker is the postal service that delivers it.

## Internal Mechanics
When dispatch() is called, Laravel's event dispatcher checks if the event implements ShouldBroadcast. If yes, `BroadcastManager::queue()` is invoked, which wraps the event in a `BroadcastEvent` job and pushes it to the queue. The `BroadcastEvent::handle()` method retrieves the broadcast driver and calls `broadcast()` with the event's channels, payload, and name. The `SerializesModels` trait ensures that Eloquent properties are converted to their primary keys during serialization and rehydrated when the job runs. Public properties on the event class are automatically included in the broadcast payload unless `broadcastWith()` is defined. Properties marked `private` or `protected` are excluded.

## Patterns
- **Marker interface pattern**: `ShouldBroadcast` is a marker that triggers queue-based broadcast dispatch
- **Method-based customization**: Each aspect of the broadcast (channels, data, name, condition) has a dedicated override method
- **Fluent dispatch**: `OrderShipped::dispatch($order)` through `Dispatchable` trait
- **Synchronous variant**: `ShouldBroadcastNow` for events that must bypass queue (typing indicators, presence updates)

## Architectural Decisions
- **Separate interface from implementation**: Any event can become broadcastable by implementing `ShouldBroadcast`, no base class required
- **Queue-first approach**: Broadcasting is inherently asynchronous to keep HTTP responses fast
- **Public property convention**: Reduces boilerplate—public properties auto-serialize, but developers can override with `broadcastWith()`
- **Dot-notation naming convention**: `broadcastAs('order.shipped')` enables client-side filtering by event name prefix

## Tradeoffs
- **Queued delivery is eventually consistent**: There is a time gap between event dispatch and client receipt
- **Serialization overhead**: Models must be serializable; loaded relationships may not survive queue serialization
- **Public property exposure**: Accidental inclusion of sensitive data if properties are public by mistake
- **No built-in retry differentiation**: Broadcast job failures use the same retry logic as other queue jobs

## Performance Considerations
- Event payload size: Keep `broadcastWith()` lean—only send data the client needs, not entire models
- Serialization cost: Every public property is serialized; use `broadcastWith()` to select specific attributes
- Queue throughput: High-frequency events (typing indicators) should use `ShouldBroadcastNow` to avoid queue pressure
- `broadcastWhen()` acts as an early filter, preventing unnecessary queue jobs

## Production Considerations
- Define `broadcastQueue()` or `$queue` property to route broadcasts to a dedicated queue
- Use `ShouldDispatchAfterCommit` when broadcasting within database transactions
- Use `ShouldRescue` to prevent broadcast exceptions from propagating to users
- Set explicit queue connection via `$connection` property or `#[Connection]` attribute (Laravel 12+)
- Configure failed job handling for broadcast events in `Horizon` or `queue:failed`

## Common Mistakes
- Marking sensitive model properties as public, causing data leakage in broadcast payloads
- Not implementing `broadcastWith()` and sending entire Eloquent model graphs to clients
- Broadcasting events before database transactions commit, causing clients to see stale data
- Using `ShouldBroadcastNow` for high-frequency events, blocking the HTTP request
- Forgetting to call `parent::__construct()` when overriding the constructor in a base event class

## Failure Modes
- **Serialization failure**: Model relationships or non-serializable objects cause `BroadcastEvent` job to fail
- **Stale data delivery**: Event dispatched before DB transaction commits; client sees data that doesn't exist yet
- **Queue backlog**: High volume of broadcast events overwhelms queue workers, delaying delivery
- **Auth failure on channel resolution**: `broadcastOn()` returns channels the current user isn't authorized for

## Ecosystem Usage
- Laravel Notifications use `ShouldBroadcast` via the broadcast notification channel internally
- Laravel Pulse broadcasts metrics using broadcast events
- Model broadcasting (`BroadcastsEvents` trait) auto-generates broadcast events for create/update/delete
- Third-party packages like `spatie/laravel-model-status` use broadcasting for status change notifications

## Related Knowledge Units
- K01: Laravel Broadcasting Architecture
- K30: Model Broadcasting (BroadcastsEvents Trait)
- K31: Client Events (Whisper, Typing Indicators)
- K19: Real-Time Notifications (Broadcast + Database)

## Research Notes
The `ShouldBroadcast` interface has remained stable since Laravel 5.x. Laravel 11+ introduced `#[Queue]` and `#[Connection]` PHP 8 attributes for configuring queue routing. `ShouldBroadcastNow` and `ShouldDispatchAfterCommit` interfaces provide targeted control. The `ShouldRescue` interface (added in Laravel 11) prevents broadcast exceptions from surfacing to end users. The `broadcastWhen()` method is useful for conditional broadcasting, such as only broadcasting when a certain model attribute has changed.
