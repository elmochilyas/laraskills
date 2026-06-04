# Metadata
Domain: Async & Distributed Systems
Subdomain: Event-Driven Architecture
Knowledge Unit: Queued Event Listeners
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
An event listener that implements `ShouldQueue` is automatically queued — the event is dispatched, the listener class is serialized (with the event), and pushed to the queue as a `CallQueuedListener` job. This allows listeners to perform I/O operations (API calls, email sending) without blocking the event dispatcher. The queued listener pattern is the bridge between the synchronous event system and the async queue system. All standard queue configuration (connection, queue, delay, tries, backoff, middleware) applies to queued listeners.

# Core Concepts
- **`ShouldQueue` on listeners**: Marking a listener with `ShouldQueue` routes it through the queue system.
- **`CallQueuedListener`**: The internal job class that wraps the listener and event. It calls `$listener->handle($event)` when processed.
- **SerializesModels**: Queued listeners should use `SerializesModels` if the event contains Eloquent models.
- **Queue configuration**: Queued listeners support `$connection`, `$queue`, `$delay`, `$tries`, `$backoff`, `$timeout` properties.
- **Synchronous fallback**: If `ShouldQueue` is not present, the listener runs inline in the event dispatch flow.

# Mental Models
- **Delegated responder**: The listener says "I should handle this, but not right now." It puts the event on a to-do list (queue) and handles it when it gets a turn (worker processes it).
- **Post-it note**: A queued listener is like writing a note (event data) and putting it on a board (queue). The responsible person (worker) reads the note later and takes action.

# Internal Mechanics
- `Illuminate\Events\Dispatcher::dispatch()` iterates registered listeners.
- If a listener class implements `ShouldQueue`, the dispatcher creates a `CallQueuedListener` job using `new CallQueuedListener($listener, $event)`.
- This job is dispatched via `Bus::dispatchToQueue()` — it goes through the full queue pipeline.
- `CallQueuedListener::handle()` calls `$this->listener[$this->method]($this->event)` (typically `$listener->handle($event)`).
- `CallQueuedListener` supports `$connection`, `$queue`, `$delay`, `$tries`, `$backoff`, `$timeout` — these are read from the listener class via reflection.
- The `SerializesModels` trait on `CallQueuedListener` handles model serialization within the event payload.
- Failed queued listeners have a `failed()` method that can be defined on the listener class.

# Patterns
## Selective Queueing
- **Purpose**: Some listeners are queued, some are not, for the same event.
- **Benefit**: Fast critical-path listeners run inline; slow I/O listeners queue.
- **Tradeoff**: Dispatcher processes all listeners synchronously first, then queues the ShouldQueue ones. Synchronous listeners still block the dispatch.

## Listener with Custom Queue
- **Purpose**: Route specific listeners to specific queues.
- **Benefit**: Isolate slow listener processing from fast queue operations.
- **Tradeoff**: Additional queue/worker configuration.

## Failed Listener Handling
- **Purpose**: Define `failed()` on the listener for cleanup on failure.
- **Benefit**: Job-specific compensation on failure.
- **Tradeoff**: Listener class handles both success and failure paths.

# Architectural Decisions
- **Queue listeners that make external calls**: HTTP requests, SMTP connections, SMS gateways. These are network-bound and unpredictable.
- **Keep inline listeners that update local state**: Database writes, cache updates, log writes. These are fast and benefit from immediate execution.
- **Use `event:cache` to include queued listeners**: Cached event mapping includes ShouldQueue checks — queued listeners work correctly with cache.

# Tradeoffs
Queued listener | Non-blocking dispatch, retry capability, async | Eventual consistency; event may not be processed immediately
Inline listener | Immediate processing, zero latency | Blocks event dispatcher; no retry on failure
Mixed (queued + inline) | Fast critical path, reliable I/O | Two processing models; harder to reason about ordering

# Performance Considerations
- Queued listener dispatch adds: serialization + queue push + later worker pop + deserialization.
- The event dispatcher still blocks until all INLINE listeners complete. Queued listeners are pushed but not executed at dispatch time.
- Each queued listener creates one job. An event with 5 queued listeners creates 5 separate jobs.
- Slow inline listeners delay the event dispatch. Move slow listeners to ShouldQueue.

# Production Considerations
- Monitor queued listener execution time — they show up as `CallQueuedListener` jobs in Horizon.
- Queued listeners that fail appear in `failed_jobs`. The `failed()` method on the listener class is called for cleanup.
- The event payload is serialized into the listener job. Keep events serializable-friendly (avoid non-serializable objects).
- If the listener has high `$tries`, it may retry for a long time after the event context is stale.

# Common Mistakes
- **Not adding `SerializesModels` to queued listeners that handle models**: Eloquent models in the event payload are fully serialized into the job. The `CallQueuedListener` job should use `SerializesModels` if the event contains models.
- **Adding `ShouldQueue` but not `$tries`**: Listener retries indefinitely by default. Always set `$tries`.
- **Not checking if listener is queued in tests**: `Event::fake()` captures dispatched events, but queued listener jobs are not processed. Test the listener's `handle()` directly.
- **Slow inline listeners mixed with queued ones**: If one inline listener takes 5 seconds, the entire event dispatch (including queueing other listeners) is delayed. Move all slow listeners to ShouldQueue.

# Failure Modes
- **Event payload serialization failure**: If the event contains a non-serializable object, the `CallQueuedListener` job fails at dispatch time. The event never reaches queued listeners.
- **Queued listener runs after event context is stale**: A queued listener processed 10 minutes after dispatch may find the database state has changed, causing logic errors.
- **Listener retry causes duplicate side effects**: If the listener sends an email and the job retries, the email is sent twice. Ensure idempotency.
- **$tries not set → infinite retries**: A queued listener without `$tries` set retries forever until `retryUntil()` stops it. Without either, it's infinite.

# Ecosystem Usage
- **Laravel framework**: `Illuminate\Events\CallQueuedListener` is the internal job class. Used whenever a listener implements `ShouldQueue`.
- **Laravel Horizon**: Queued listeners appear as `CallQueuedListener` jobs with the event and listener class in the display name.
- **Spatie packages**: Some Spatie package listeners use `ShouldQueue` for async handling (e.g., spatie/laravel-webhook-client processes incoming webhooks via queued listener).

# Related Knowledge Units
- K006 `ShouldQueue` Contract (contract mechanics) | K025 Event Auto-Discovery (listener discovery)

## Research Notes
- Laravel's event auto-discovery (Laravel 8+) scans the Listeners directory and maps listeners to events by method type-hints — this eliminates manual Event::listen() registration for convention-based setups.
- The ShouldBeDiscoverable interface (Laravel 11+) provides fine-grained control over which listeners are auto-discovered — only listeners implementing this interface are included in auto-discovery scans.
- Event subscribers (implementing ShouldQueue on listeners) register multiple listeners in a single class via the subscribe() method — this pattern is useful for grouping related event handling logic.
- Queued event listeners use the same job serialization mechanism as queued jobs — the event object is serialized, dispatched to the queue, then unserialized and passed to the listener's handle() method.
- Wildcard event listeners (Event::listen('event.*')) can match multiple events using * as a wildcard character — these receive the event object and event name as arguments.
- Custom listener directories (Laravel 12+) can be configured in EventServiceProvider via the $listen property with directory paths — this supports modular monolith and package-based event architectures.
- Event discovery caching (event:cache and event:clear) improves performance in production by avoiding file scans — the cache must be rebuilt when new listeners are added or existing ones are modified.
- Community patterns for event-driven Laravel applications favor domain events over generic Laravel events, using dedicated event classes per domain concept rather than generic "model.saved" patterns.
