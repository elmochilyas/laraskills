# Decomposition: Shouldbroadcast Interface Event Lifecycle

## Topic Overview
The `ShouldBroadcast` interface is the contract that transforms a standard Laravel event into a broadcastable one. Implementing it signals the framework to queue the event for WebSocket delivery. The event lifecycle proceeds through five stages: instantiation (constructor receives state), channel resolution (`broadcastOn()`), payload customization (`broadcastWith()`), event naming (`broadcastAs()`), conditional broadcasting (`broadcastWhen()`), and finally queue dispatch. Public event propert...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
event-broadcasting-architecture/K02-shouldbroadcast-interface-event-lifecycle/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Shouldbroadcast Interface Event Lifecycle
- **Purpose:** The `ShouldBroadcast` interface is the contract that transforms a standard Laravel event into a broadcastable one. Implementing it signals the framework to queue the event for WebSocket delivery. The event lifecycle proceeds through five stages: instantiation (constructor receives state), channel resolution (`broadcastOn()`), payload customization (`broadcastWith()`), event naming (`broadcastAs()`), conditional broadcasting (`broadcastWhen()`), and finally queue dispatch. Public event propert...
- **Difficulty:** Intermediate
- **Dependencies:
  - K01: Laravel Broadcasting Architecture
  - K30: Model Broadcasting (BroadcastsEvents Trait)
  - K31: Client Events (Whisper, Typing Indicators)
  - K19: Real-Time Notifications (Broadcast + Database)

## Dependency Graph
**Depends on:**
  - K01: Laravel Broadcasting Architecture
  - K30: Model Broadcasting (BroadcastsEvents Trait)
  - K31: Client Events (Whisper, Typing Indicators)
  - K19: Real-Time Notifications (Broadcast + Database)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Marker interface pattern**: `ShouldBroadcast` is a marker that triggers queue-based broadcast dispatch**Method-based customization**: Each aspect of the broadcast (channels, data, name, condition) has a dedicated override method**Fluent dispatch**: `OrderShipped::dispatch($order)` through `Dispatchable` trait**Synchronous variant**: `ShouldBroadcastNow` for events that must bypass queue (typing indicators, presence updates)**Separate interface from implementation**: Any event can become broadcastable by implementing `ShouldBroadcast`, no base class required**Queue-first approach**: Broadcasting is inherently asynchronous to keep HTTP responses fast**Public property convention**: Reduces boilerplate—public properties auto-serialize, but developers can override with `broadcastWith()`**Dot-notation naming convention**: `broadcastAs('order.shipped')` enables client-side filtering by event name prefix**Queued delivery is eventually consistent**: There is a time gap between event dispatch and client receipt**Serialization overhead**: Models must be serializable; loaded relationships may not survive queue serialization**Public property exposure**: Accidental inclusion of sensitive data if properties are public by mistake**No built-in retry differentiation**: Broadcast job failures use the same retry logic as other queue jobsEvent payload size: Keep `broadcastWith()` lean—only send data the client needs, not entire modelsSerialization cost: Every public property is serialized; use `broadcastWith()` to select specific attributesQueue throughput: High-frequency events (typing indicators) should use `ShouldBroadcastNow` to avoid queue pressure`broadcastWhen()` acts as an early filter, preventing unnecessary queue jobsDefine `broadcastQueue()` or `$queue` property to route broadcasts to a dedicated queueUse `ShouldDispatchAfterCommit` when broadcasting within database transactionsUse `ShouldRescue` to prevent broadcast exceptions from propagating to usersSet explicit queue connection via `$connection` property or `#[Connection]` attribute (Laravel 12+)Configure failed job handling for broadcast events in `Horizon` or `queue:failed`Marking sensitive model properties as public, causing data leakage in broadcast payloadsNot implementing `broadcastWith()` and sending entire Eloquent model graphs to clientsBroadcasting events before database transactions commit, causing clients to see stale dataUsing `ShouldBroadcastNow` for high-frequency events, blocking the HTTP requestForgetting to call `parent::__construct()` when overriding the constructor in a base event class**Serialization failure**: Model relationships or non-serializable objects cause `BroadcastEvent` job to fail**Stale data delivery**: Event dispatched before DB transaction commits; client sees data that doesn't exist yet**Queue backlog**: High volume of broadcast events overwhelms queue workers, delaying delivery**Auth failure on channel resolution**: `broadcastOn()` returns channels the current user isn't authorized forLaravel Notifications use `ShouldBroadcast` via the broadcast notification channel internallyLaravel Pulse broadcasts metrics using broadcast eventsModel broadcasting (`BroadcastsEvents` trait) auto-generates broadcast events for create/update/deleteThird-party packages like `spatie/laravel-model-status` use broadcasting for status change notificationsK01: Laravel Broadcasting ArchitectureK30: Model Broadcasting (BroadcastsEvents Trait)K31: Client Events (Whisper, Typing Indicators)K19: Real-Time Notifications (Broadcast + Database)

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