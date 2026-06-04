# Decomposition: Laravel Broadcasting Architecture

## Topic Overview
Laravel's broadcasting system enables server-side events to be pushed to client-side JavaScript applications via WebSocket connections using a driver-based abstraction. It separates the concerns of event dispatch (Laravel core), transport (broadcast drivers), and client consumption (Laravel Echo). The architecture is queue-native—all broadcast events are pushed through the queue system so that HTTP response times are not impacted by WebSocket delivery. The system supports three channel type...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
event-broadcasting-architecture/K01-laravel-broadcasting-architecture/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Broadcasting Architecture
- **Purpose:** Laravel's broadcasting system enables server-side events to be pushed to client-side JavaScript applications via WebSocket connections using a driver-based abstraction. It separates the concerns of event dispatch (Laravel core), transport (broadcast drivers), and client consumption (Laravel Echo). The architecture is queue-native—all broadcast events are pushed through the queue system so that HTTP response times are not impacted by WebSocket delivery. The system supports three channel type...
- **Difficulty:** Foundation
- **Dependencies:
  - K02: ShouldBroadcast Interface & Event Lifecycle
  - K30: Model Broadcasting (BroadcastsEvents Trait)
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K11: Public/Private/Presence Channel Patterns
  - K12: Channel Authorization (routes/channels.php)

## Dependency Graph
**Depends on:**
  - K02: ShouldBroadcast Interface & Event Lifecycle
  - K30: Model Broadcasting (BroadcastsEvents Trait)
  - K18: WebSocket vs SSE vs Polling Decision Framework
  - K11: Public/Private/Presence Channel Patterns
  - K12: Channel Authorization (routes/channels.php)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Driver abstraction**: All broadcast drivers implement the same contract, making the system pluggable**Queue-backed dispatch**: All broadcasts go through the queue by default (except `ShouldBroadcastNow`)**Event-driven architecture**: Server-side state changes are modeled as events that flow to the client**Channel separation**: Public/Private/Presence channels map to different authorization requirements**Sender exclusion**: The `toOthers()` method combined with `X-Socket-ID` header prevents redundant updates**Queue-backed by default**: Synchronous broadcasting would block HTTP responses; queueing ensures responsiveness**Driver-based abstraction**: Separates application code from WebSocket infrastructure, enabling migration between providers**Pusher protocol as standard**: Reverb and Soketi implement the Pusher protocol, making Echo compatible across all self-hosted options**`BroadcastEvent` job encapsulation**: Wrapping broadcast logic in a queued job provides retry, failure handling, and monitoring**Queue dependency**: Broadcasting requires a running queue worker; if the queue is down, no events are delivered**Serialization overhead**: Models in event properties must be serializable; complex objects may cause issues**Eventually consistent delivery**: Queue delays mean events are not strictly synchronous—acceptable for most real-time use cases**Driver lock-in at config level**: While abstracted, each driver has unique features (e.g., Ably's history) not exposed through the common interfaceQueue worker count must be adequate to handle broadcast dispatch volumeEvent payload size directly impacts serialization and network transfer time`ShouldBroadcastNow` bypasses queue and broadcasts synchronously—use only for events that must reach clients immediatelyUsing `sync` queue driver for broadcasting negates the performance benefit and should only be used in developmentDedicated queue connection for broadcasts prevents other job types from starving broadcast throughputAlways run a queue worker with sufficient capacity for broadcast jobsConfigure `Broadcast::routes()` with proper middleware (auth guards, rate limiting)Set `allowed_origins` in Reverb config to prevent unauthorized domains from connectingMonitor queue backlog for broadcast jobs using Horizon or PulseUse `after_commit` or `ShouldDispatchAfterCommit` for broadcasting within database transactionsImplement `ShouldRescue` on events to prevent broadcast failures from surfacing to usersForgetting to start a queue worker, causing broadcasts to silently never deliverDispatching broadcast events synchronously without queue, degrading HTTP response timeNot implementing `broadcastWith()` and exposing internal objects or sensitive dataBroadcasting on public channels when authorization is requiredUsing `Broadcast::routes()` without auth middleware in production**Silent broadcast failure**: Queue worker dies or queue is full; events never reach WebSocket server**Partial delivery**: Some Reverb instances receive the event, others don't (Redis pub/sub disruption)**Serialization errors**: Model relationships fail to load during queue job processing, causing job failure**Auth endpoint overload**: Reconnection storms overwhelm `/broadcasting/auth` causing cascading failuresUsed by Laravel Notifications (broadcast channel) for real-time notification deliveryUsed by Laravel Pulse for real-time monitoring dashboard updatesFoundation for chat applications, live dashboards, collaborative featuresModel broadcasting via `BroadcastsEvents` trait for Eloquent model state changesThird-party packages like `qruto/laravel-wave` bridge SSE with the broadcasting systemK02: ShouldBroadcast Interface & Event LifecycleK30: Model Broadcasting (BroadcastsEvents Trait)K18: WebSocket vs SSE vs Polling Decision FrameworkK11: Public/Private/Presence Channel PatternsK12: Channel Authorization (routes/channels.php)

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