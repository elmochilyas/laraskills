# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: Closures as Queued Jobs
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Laravel allows dispatching closures directly to the queue: `dispatch(function () { ... })`. Behind the scenes, the closure is serialized using the `Opis\Closure` library (or Laravel's own serialization in recent versions), captured as a `CallQueuedClosure` job. This enables lightweight inline async tasks without creating a dedicated job class. However, closure serialization has significant constraints: `$this` cannot be used, captured variables must be serializable, and the `catch()` callback does not receive the original closure's `$this` context.

# Core Concepts
- **Closure serialization**: PHP closures cannot be serialized natively. Laravel uses `Opis\Closure` to analyze the closure's AST, extract scope, bound variables, and context, then rebuild it on deserialization.
- **`CallQueuedClosure`**: An internal job class that wraps the serialized closure and executes it in `handle()`.
- **Variable capture**: Variables in `use (...)` clauses are serialized with the closure. Passed by value (not by reference).
- **`catch()` callbacks**: Closures support a `catch()` method for failure handling, but `$this` is explicitly not supported in catch callbacks.

# Mental Models
- **Anonymous letter**: A closure dispatched to the queue is like writing instructions on a piece of paper, sealing it in an envelope, and mailing it. The recipient (worker) reads the instruction and executes it. The letter cannot reference anything not written on it.
- **Time-shifted callable**: You're defining what to call and when, but the caller context no longer exists.

# Internal Mechanics
- `dispatch(function() { ... })` implicitly calls `new PendingDispatch(new CallQueuedClosure(...))`.
- `CallQueuedClosure` uses `Laravel\SerializableClosure\Serializers\Native` or `Opis\Closure` to serialize the closure.
- The serialization process:
  1. Analyzes the closure using PHP's `ReflectionFunction`.
  2. Extracts static variables, bound variables, and `use` variables.
  3. Serializes the closure's source code and context.
  4. Stores as a `SerializableClosure` wrapper.
- On deserialization:
  1. Rebuilds the closure from serialized context.
  2. The closure is reconstructed as a new Closure instance with same scope and variables.
- The `catch()` callback is stored separately in the payload and invoked if the closure throws an exception.
- `$this` is not supported in `catch()` because the catch callback cannot bind to the original object context.

# Patterns
## Quick Async Tasks
- **Purpose**: Dispatch simple, one-off async work without creating a job class.
- **Benefit**: Zero boilerplate. Closure and dispatch in one expression.
- **Tradeoff**: Not reusable, harder to test, serialization constraints.

## Catch-Enabled Closures
- **Purpose**: Handle failures inline without a separate `failed()` method.
- **Benefit**: Failure logic lives with the closure, not in a separate class.
- **Tradeoff**: `$this` not available in catch; must use captured variables.

## Batch Closures
- **Purpose**: Use closures within `Bus::batch([])` for lightweight batch operations.
- **Benefit**: Avoid creating multiple job classes for batch steps.
- **Tradeoff**: Closure serialization constraints apply to each item in the batch.

# Architectural Decisions
- **Use class jobs** for: complex logic, multiple method dependencies, need for testing isolation, reusability across dispatch points.
- **Use closure jobs for**: simple tasks (notification dispatch, cache warm, log cleanup), or when prototyping and you'll refactor to a class later.
- **Avoid closures for**: Any job that needs `$this` context, needs to call `$this->release()` or `$this->delete()`, or needs explicit failed-method logic.

# Tradeoffs
Closure job | No class boilerplate, inline definition | No `$this`, fragile serialization, hard to test
Class job | Stable serialization, testable, reusable, catch/failed support | More files, more ceremony
Closure with catch | Inline failure handling | No `$this` in catch, limited failure logic

# Performance Considerations
- Closure serialization is ~5-10x slower than class job serialization due to AST analysis and source extraction.
- Payload size for closures is generally larger than equivalent class jobs because serialized scope must be included.
- Deserialization cost is also higher — closure reconstruction is CPU-intensive compared to simple `unserialize()`.
- For high-throughput jobs, prefer class jobs.

# Production Considerations
- Deployment changes can break serialization of in-flight closures. Class jobs are more resilient to code changes.
- Closure jobs in batches: the serialization size may exceed SQS 256KB limit more easily.
- Avoid closures in notification channels — some notification types don't support closure serialization.
- The `SerializableClosure` library version must match across all application instances (important for deployments).

# Common Mistakes
- **Using `$this` in closure body**: The closure captures the surrounding scope, but `$this` may not serialize correctly or may reference an unexpected context.
- **Assuming variable references work**: `use (&$variable)` suggests pass-by-reference, but during serialization, the reference is lost. The deserialized closure uses the value at serialization time.
- **Not importing necessary classes**: The closure body references classes not `use`-imported. The serialized closure code is executed in the worker's scope with different auto-imports.

# Failure Modes
- **Deserialization failure for complex closures**: Closures that depend on specific object instances, resources (file handles, DB connections), or global state fail to deserialize.
- **`SerializableClosure` version mismatch**: If closure serialization format changes between library versions, an in-flight closure fails to deserialize on deploy.
- **Memory leak via serialized scope**: Large variables captured via `use ()` are serialized into the payload, potentially exceeding queue limits.

# Ecosystem Usage
- **Laravel framework**: `Bus::dispatch()` handles closures transparently. Used internally in testing and batch helper methods.
- **Laravel Horizon**: Displays closure jobs as `CallQueuedClosure` in the dashboard. Tags are not automatically applied.
- **Spatie packages**: Do not use closure jobs — they always use explicit job classes for reliability.

# Related Knowledge Units
- K004 Job Serialization and Payload Envelope (serialization mechanics) | K005 `SerializesModels` Model Trait (contrast with class job approach)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
