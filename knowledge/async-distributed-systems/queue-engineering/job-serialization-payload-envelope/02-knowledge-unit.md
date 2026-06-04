# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: Job Serialization and Payload Envelope Structure
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary
Every queued job is serialized into a structured payload envelope before being stored in the queue backend. This envelope contains not just the job class and data, but also metadata: connection details, middleware, tags, chained jobs, batch IDs, and retry configuration. Understanding the envelope structure is critical for debugging serialization failures, optimizing payload size, and working with queue backends that have payload size limits (SQS 256KB). The serialization mechanism relies on PHP's `serialize()` and `unserialize()` — Eloquent models are specially handled via `SerializesModels`.

# Core Concepts
- **Payload envelope**: The JSON structure stored in the queue backend. Contains `uuid`, `displayName`, `job` (serialized class), `data`, `maxTries`, `maxExceptions`, `backoff`, `timeout`, `tags`, `chained`, `delay`, and connection metadata.
- **Serialization**: PHP `serialize()` is called on the job object. The serialized string is base64-encoded and stored as the `job` field in the envelope.
- **De-serialization**: On `pop()`, the worker base64-decodes and `unserialize()`s the `job` field to reconstruct the job object.
- **Model serialization**: Properties containing Eloquent models are serialized to just the model class name and key (via `SerializesModels` trait), not the entire model state.
- **Closure jobs**: Jobs created from closures are serialized using `Opis\Closure` library, which serializes the closure's scope and bound variables.

# Mental Models
- **Shipping container**: The envelope is the outer crate with handling instructions (fragile = maxTries, special handling = middleware), containing the actual item (serialized job).
- **Recursive Russian doll**: Job object → serialized string → base64 → envelope JSON → backend storage. Each layer adds structure.
- **Time capsule**: The envelope preserves the job's state at dispatch time. By the time a worker processes it, the original context (request, DB state) may have changed entirely.

# Internal Mechanics
- `Illuminate\Queue\Jobs\Job::payload()` constructs the envelope with:
  - `uuid` — generated UUID v4
  - `displayName` — class name (or closure description)
  - `job` — `serialize($this->job)` of the underlying job object
  - `data` — array of job public properties (serialized as part of the object)
  - `maxTries` — from `$tries` property
  - `maxExceptions` — from `$maxExceptions` property
  - `backoff` — from `$backoff` property
  - `timeout` — from `$timeout` property
  - `tags` — from `tags()` method
  - `chained` — serialized array of chained jobs
  - `delay` — no longer stored (was removed in Laravel 10)
- `Illuminate\Queue\Jobs\RedisJob::fire()` calls `unserialize($this->payload()['job'])` to reconstruct the job.
- The envelope approach means the queue backend never inspects job content — it only stores and retrieves opaque blobs.

# Patterns
## Minimal Payload Design
- **Purpose**: Keep job payloads small to maximize queue throughput and stay within backend limits.
- **Benefit**: Faster serialization, lower storage cost, fewer SQS 256KB overflows.
- **Tradeoff**: More DB queries on job execution re-fetching data; trade storage for compute.

## SQS Overflow Handling (Laravel 11+)
- **Purpose**: Handle jobs with payloads exceeding SQS's 256KB limit.
- **Benefit**: Large payloads (file metadata, extensive model data) still work with SQS.
- **Tradeoff**: Additional cache lookup on job execution; cache store must be as durable as the queue.

## Explicit Property Declaration
- **Purpose**: Control what gets serialized into the payload.
- **Benefit**: Avoid accidentally serializing large objects or sensitive data.
- **Tradeoff**: Manual maintenance of property lists; can miss new dependencies.

# Architectural Decisions
- **Pass IDs, not models**: Always pass model IDs and re-fetch in `handle()`. This reduces payload size and avoids stale model data.
- **Avoid closures for complex jobs**: Closure serialization is fragile — class jobs are more predictable and debuggable.
- **Use enum properties**: Use string-backed enums instead of class-string constants for better serialization stability.

# Tradeoffs
Pass IDs + re-fetch in handle | Small payload, fresh data | Extra query per job execution
Serialize full models | Zero DB queries in handle | Large payloads, stale data, SQS overflow risk
Class job | Stable serialization, testable | Boilerplate class per job
Closure job | Inline convenience | Fragile serialization, unsupported `catch()` with `$this`

# Performance Considerations
- Serialization time scales with object complexity. A job with 10 large Eloquent models serializes ~10x slower than one with IDs.
- Payload size directly impacts Redis memory and SQS network transfer time.
- On Redis, each job payload is an element in a list. Large payloads increase Redis memory usage and `BRPOP` transfer time.
- Base64 encoding adds ~33% overhead to the serialized job size.

# Production Considerations
- Monitor payload sizes in your queue backend. Set up alerts if average payload size increases significantly.
- SQS overflow storage falls back to cache — ensure the cache store is durable (not `array` which loses data on worker restart).
- Payload structure changes across Laravel versions. The `delay` field was removed from the envelope in Laravel 10; handle was changed for batch payloads.
- `SerializesModels` restores models from DB on deserialization — if the model was deleted between dispatch and processing, the job fails.

# Common Mistakes
- **Storing Eloquent models with all relations loaded**: Serializing a model with loaded relations serializes the entire object graph. Always use `->withoutRelations()` or pass only IDs.
- **Closures referencing `$this` in catch callbacks**: `$this` is explicitly unsupported in closure catch callbacks. The closure cannot restore `$this` because it was bound to a now-gone context.
- **Modifying job class properties after constructor**: Job properties are captured at construction. Any changes before dispatch are included; changes after are not.

# Failure Modes
- **Serialization failure**: If a property contains a non-serializable object (e.g., a raw PDO connection, an open file handle), the job fails at dispatch time before it's queued.
- **Deserialization failure**: If the job class changes (renamed, moved namespace) between dispatch and processing, the worker cannot reconstruct the job. The job ends up in `failed_jobs`.
- **Stale serialization**: A model serialized before it was saved generates an ID of `null`. On deserialization, the worker tries to `find(null)` which returns `null`, causing confusing errors.

# Ecosystem Usage
- **Laravel Horizon**: Enhanced tags are stored in the envelope for dashboard filtering and monitoring.
- **Spatie webhook-server**: Webhook call payloads are stored as job properties. Uses the standard Laravel serialization pipeline.
- **Laravel Pulse**: Tracks job execution time from the payload's `uuid` matching to worker timing.

# Related Knowledge Units
- K005 `SerializesModels` Trait (model serialization specifics) | K078 Closures as Queued Jobs (closure serialization) | K035 Reverb Scaling (broadcast event payload serialization)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
