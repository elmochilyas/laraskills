# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: `ShouldQueue` Contract and Queueable Types
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
`ShouldQueue` is the marker interface that tells Laravel the job/listener/mail/notification should be processed asynchronously. It's an empty contract — no methods to implement. The presence of `ShouldQueue` signals the framework to serialize the object and push it to the queue instead of executing immediately. This contract is the entry point for all async processing in Laravel and is implemented across five queueable types: jobs, mail, notifications, broadcast events, and event listeners. Understanding the contract hierarchy reveals which components participate in the queue pipeline and how.

# Core Concepts
- **`ShouldQueue` interface**: An empty marker interface in `Illuminate\Contracts\Queue`. Its presence alone changes behavior from synchronous to async.
- **Queueable types**: Objects that can be dispatched to a queue:
  - **Jobs** (`ShouldQueue` on the job class) — most common, via `dispatch()`
  - **Mail** (`ShouldQueue` via `Mail::queue()`) — mailer queues via `$this->afterCommit()`
  - **Notifications** (`ShouldQueue` via `Notification::send()`) — channel-dependent
  - **Broadcast events** — `ShouldBroadcast` extends `ShouldQueue`
  - **Event listeners** (`ShouldQueue` on listener class) — queued listeners
- **`Dispatchable` trait**: Used on job classes. Provides `dispatch()`, `dispatchSync()`, `dispatchAfterResponse()`, `dispatchIf()`, `dispatchUnless()`. Adds `PendingDispatch` chaining.
- **`InteractsWithQueue` trait**: Provides `job` instance, `release()`, `delete()`, `attempts()`, `bail()` methods within the job.
- **`Queueable` trait**: Used on mail and notifications. Provides `onConnection()`, `onQueue()`, `delay()`, `afterCommit()` methods.

# Mental Models
- **Union station**: Different types of trains (jobs, mail, notifications, events) all arrive at the same station (queue system). `ShouldQueue` is the ticket that says "this goes by train."
- **Marker pattern**: Like `Serializable` in Java or `JsonSerializable` in PHP — the interface has no methods but changes runtime behavior through reflection checks.

# Internal Mechanics
- `Illuminate\Events\Dispatcher` checks if a listener class implements `ShouldQueue`. If yes, it serializes the event and dispatches it as a `CallQueuedListener` job.
- `Mailer::queue()` wraps the mailable in `SendMail` job, which implements `ShouldQueue`.
- `NotificationSender` checks each channel driver — if the channel should queue, it dispatches a `SendQueuedNotifications` job.
- `ShouldBroadcast` implements `ShouldQueue` indirectly — broadcast events are queued jobs that serialize the event payload.
- The check is `$object instanceof ShouldQueue` — no reflection, no method calls. Runtime cost is negligible.

# Patterns
## Conditional Queueing
- **Purpose**: Decide at runtime whether a job should be queued or run synchronously.
- **Benefit**: Flexibility for development, testing, or based on current load.
- **Tradeoff**: Must handle both sync and async code paths; order-of-operations differs.

## Queueable Listener Check
- **Purpose**: Decide per-channel whether a notification should be queued.
- **Benefit**: Some channels (like SMS) always dispatch; others (like database) run inline.
- **Tradeoff**: Queueing decision is channel-level, not notification-level.

## Querying Queueable Status
- **Purpose**: Inspect dispatched objects to determine if they were queued or not.
- **Benefit**: Useful for testing with `Queue::fake()` — assert count based on `ShouldQueue` status.
- **Tradeoff**: Relies on contract check, which can be overridden.

# Architectural Decisions
- **ShouldQueue on jobs**: Always implement `ShouldQueue` on job classes. Use `dispatchSync()` when you want synchronous execution — don't conditionally remove the interface.
- **ShouldQueue on listeners**: Use for listeners that perform I/O operations (API calls, notifications). Keep lightweight updates (DB writes, cache clears) synchronous.
- **ShouldQueue on mail/notifications**: Use automatically via `queue()` method on mailables. For notifications, each channel decides independently.

# Tradeoffs
ShouldQueue (async) | Non-blocking request, retry capability | Eventual consistency, serialization overhead
No ShouldQueue (sync) | Immediate execution, no serialization | Blocks request, no retry, not distributed
Conditional queueing | Flexible per-call behavior | Mixed execution context, harder to test

# Performance Considerations
- The `instanceof ShouldQueue` check is a single bitwise operation — immeasurably fast.
- The overhead comes from serialization and queue transport, not from the contract check.
- A sync listener processes in the same HTTP request — it adds to response time but costs zero infrastructure.

# Production Considerations
- All queueable types share the same queue configuration (default connection/queue). Use `onConnection()` / `onQueue()` to route specific types to specific workers.
- Mailables queued via `Mail::queue()` use the mailable's `$connection` and `$queue` properties.
- Notifications dispatched via `Notification::route()` that implement `ShouldQueue` create one job per notification, not per channel.
- Broadcasting events are queued by default via `ShouldBroadcast`. Use `ShouldBroadcastNow` for synchronous broadcasting.

# Common Mistakes
- **Implementing `ShouldQueue` on listeners without `SerializesModels`**: Queued listeners need `SerializesModels` if the event contains models. Without it, the entire event payload is serialized, potentially failing.
- **Not implementing `ShouldQueue` on listeners that queue other jobs**: If a listener dispatches jobs, running it synchronously means the jobs are dispatched during the request, not after.
- **Confusing `ShouldQueue` with `Dispatchable`**: `ShouldQueue` is the marker interface. `Dispatchable` is the trait that provides the `dispatch()` convenience method. They are independent.

# Failure Modes
- **Listener without `ShouldQueue` processes in request-time**: Long-running listeners that should be async are processed in the request, blocking the response.
- **ShouldQueue on non-serializable listeners**: If the listener contains non-serializable dependencies (e.g., a framework service), the job fails on dispatch.
- **Missing `ShouldQueue` on mail when using `send()` instead of `queue()`**: `Mail::send()` always processes immediately, ignoring any queue configuration.

# Ecosystem Usage
- **Laravel Horizon**: Displays queued jobs, mail, notifications, and broadcast events — all unified under the job dashboard because they all implement `ShouldQueue`.
- **Laravel Pulse**: Tracks throughput across all queueable types. The `SlowJobs` recorder measures execution time regardless of type.
- **Spatie packages**: Webhooks implement `ShouldQueue` to dispatch HTTP calls asynchronously. The webhook job class extends `Job` and implements `ShouldQueue`.

# Related Knowledge Units
- K085 Queueable Mail, Notifications, and Broadcast Events (type-specific behavior) | K028 Queued Event Listeners (listener-specific queueing)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
