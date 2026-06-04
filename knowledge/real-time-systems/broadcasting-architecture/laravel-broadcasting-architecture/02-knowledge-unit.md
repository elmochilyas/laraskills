# Metadata
Domain: Real-Time Systems
Subdomain: Event Broadcasting Architecture
Knowledge Unit: Laravel Broadcasting Architecture
Difficulty Level: Foundation
Last Updated: 2026-06-02

## Executive Summary
Laravel's broadcasting system enables server-side events to be pushed to client-side JavaScript applications via WebSocket connections using a driver-based abstraction. It separates the concerns of event dispatch (Laravel core), transport (broadcast drivers), and client consumption (Laravel Echo). The architecture is queue-native—all broadcast events are pushed through the queue system so that HTTP response times are not impacted by WebSocket delivery. The system supports three channel types (public, private, presence) and multiple backend drivers: Laravel Reverb (first-party), Pusher Channels (managed), Ably (enterprise managed), Log (debugging), and Null (testing). Configuration lives in `config/broadcasting.php` with driver selection via the `BROADCAST_CONNECTION` environment variable.

## Core Concepts
The broadcasting architecture is layered: Application → Event Dispatch → Queue → Broadcast Driver → WebSocket Server → Echo Client. Events are standard Laravel event classes that implement the `ShouldBroadcast` interface, which signals the framework to queue them for broadcast. The `BroadcastManager` (under `Illuminate\Broadcasting\`) resolves the configured driver and handles event serialization and publishing. The `BroadcastServiceProvider` bootstraps the necessary routes and authorization logic. Drivers abstract the underlying WebSocket protocol—Reverb uses the Pusher protocol natively, Pusher Channels uses its HTTP API, and Ably uses its own SDK. The `PendingBroadcast` class provides a fluent API for dispatching broadcasts, including the `toOthers()` method that excludes the sender via the `X-Socket-ID` header.

## Mental Models
Think of broadcasting as a three-stage pipeline: **Emit** (Laravel dispatches an event), **Transport** (queue + driver send it to the WebSocket server), **Deliver** (WebSocket server pushes to subscribed Echo clients). The broadcast driver is a facade over the WebSocket infrastructure—switching from Reverb to Pusher requires only changing a config value. The queue acts as a shock absorber, decoupling HTTP request lifecycle from WebSocket message delivery.

## Internal Mechanics
When an event implementing `ShouldBroadcast` is dispatched, the `BroadcastManager::queue()` method serializes the event into a `BroadcastEvent` queued job. The job is pushed onto the configured queue connection. A queue worker picks up the job and calls the driver's `broadcast()` method with the event's channel list and serialized payload. The driver then communicates with its respective WebSocket server (Reverb listens on a TCP port, Pusher calls REST API, Ably uses its SDK). The `config/broadcasting.php` file defines connections, each with a `driver` key and driver-specific options. The `BroadcastEvent` job uses `SerializesModels` trait, so Eloquent models in event properties are dehydrated to their primary keys and rehydrated when the job processes.

## Patterns
- **Driver abstraction**: All broadcast drivers implement the same contract, making the system pluggable
- **Queue-backed dispatch**: All broadcasts go through the queue by default (except `ShouldBroadcastNow`)
- **Event-driven architecture**: Server-side state changes are modeled as events that flow to the client
- **Channel separation**: Public/Private/Presence channels map to different authorization requirements
- **Sender exclusion**: The `toOthers()` method combined with `X-Socket-ID` header prevents redundant updates

## Architectural Decisions
- **Queue-backed by default**: Synchronous broadcasting would block HTTP responses; queueing ensures responsiveness
- **Driver-based abstraction**: Separates application code from WebSocket infrastructure, enabling migration between providers
- **Pusher protocol as standard**: Reverb and Soketi implement the Pusher protocol, making Echo compatible across all self-hosted options
- **`BroadcastEvent` job encapsulation**: Wrapping broadcast logic in a queued job provides retry, failure handling, and monitoring

## Tradeoffs
- **Queue dependency**: Broadcasting requires a running queue worker; if the queue is down, no events are delivered
- **Serialization overhead**: Models in event properties must be serializable; complex objects may cause issues
- **Eventually consistent delivery**: Queue delays mean events are not strictly synchronous—acceptable for most real-time use cases
- **Driver lock-in at config level**: While abstracted, each driver has unique features (e.g., Ably's history) not exposed through the common interface

## Performance Considerations
- Queue worker count must be adequate to handle broadcast dispatch volume
- Event payload size directly impacts serialization and network transfer time
- `ShouldBroadcastNow` bypasses queue and broadcasts synchronously—use only for events that must reach clients immediately
- Using `sync` queue driver for broadcasting negates the performance benefit and should only be used in development
- Dedicated queue connection for broadcasts prevents other job types from starving broadcast throughput

## Production Considerations
- Always run a queue worker with sufficient capacity for broadcast jobs
- Configure `Broadcast::routes()` with proper middleware (auth guards, rate limiting)
- Set `allowed_origins` in Reverb config to prevent unauthorized domains from connecting
- Monitor queue backlog for broadcast jobs using Horizon or Pulse
- Use `after_commit` or `ShouldDispatchAfterCommit` for broadcasting within database transactions
- Implement `ShouldRescue` on events to prevent broadcast failures from surfacing to users

## Common Mistakes
- Forgetting to start a queue worker, causing broadcasts to silently never deliver
- Dispatching broadcast events synchronously without queue, degrading HTTP response time
- Not implementing `broadcastWith()` and exposing internal objects or sensitive data
- Broadcasting on public channels when authorization is required
- Using `Broadcast::routes()` without auth middleware in production

## Failure Modes
- **Silent broadcast failure**: Queue worker dies or queue is full; events never reach WebSocket server
- **Partial delivery**: Some Reverb instances receive the event, others don't (Redis pub/sub disruption)
- **Serialization errors**: Model relationships fail to load during queue job processing, causing job failure
- **Auth endpoint overload**: Reconnection storms overwhelm `/broadcasting/auth` causing cascading failures

## Ecosystem Usage
- Used by Laravel Notifications (broadcast channel) for real-time notification delivery
- Used by Laravel Pulse for real-time monitoring dashboard updates
- Foundation for chat applications, live dashboards, collaborative features
- Model broadcasting via `BroadcastsEvents` trait for Eloquent model state changes
- Third-party packages like `qruto/laravel-wave` bridge SSE with the broadcasting system

## Related Knowledge Units
- K02: ShouldBroadcast Interface & Event Lifecycle
- K30: Model Broadcasting (BroadcastsEvents Trait)
- K18: WebSocket vs SSE vs Polling Decision Framework
- K11: Public/Private/Presence Channel Patterns
- K12: Channel Authorization (routes/channels.php)

## Research Notes
The broadcasting architecture has remained stable across Laravel 11.x, 12.x, and 13.x. The primary evolution has been in the server-side drivers (Reverb becoming default) rather than the broadcasting abstraction itself. Laravel 13 introduced the Reverb database scaling driver, but this is transparent to the broadcasting layer—only the Reverb config changes. The `BroadcastEvent` job and `BroadcastManager` have seen minor optimizations but no architectural changes.
