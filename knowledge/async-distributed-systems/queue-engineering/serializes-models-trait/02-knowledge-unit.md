# Metadata
Domain: Async & Distributed Systems
Subdomain: Queue Engineering
Knowledge Unit: `SerializesModels` Trait and Model Restoration
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
The `SerializesModels` trait, used on queued job classes and event listeners, replaces Eloquent model and collection properties with a lightweight identifier at serialization time and re-fetches them from the database at deserialization time. This prevents the job payload from containing a stale, memory-heavy copy of the entire model. However, this introduces timing dependencies — the model must still exist in the database when the job processes. The trait's `__sleep` / `__wakeup` magic hook mechanism is the core of this pattern and has specific edge cases with pivot models, relations, and soft-deleted records.

# Core Concepts
- **Serialization mechanism**: `SerializesModels` uses PHP's `__sleep` / `__wakeup` magic methods to intercept serialization. Model properties are replaced with just the class name and the model's key. On wakeup, the model is re-retrieved from DB via `find()`.
- **Collection serialization**: Eloquent collections (e.g., `BelongsToMany` results) are serialized as arrays of model identifiers, then re-hydrated by re-querying each model.
- **Restoration timing**: Models are restored from DB when the job is unserialized by the worker, which happens before `handle()` is called. If the model was deleted, `find()` returns `null`.
- **Pivot data**: Pivot attributes (from many-to-many relationships) are NOT automatically restored. Only the model itself is re-fetched.
- **Loaded relations**: Serialized model does NOT include loaded relations. If you `->load('relationship')` before dispatch, the relation is not available after deserialization.

# Mental Models
- **Claim check pattern**: SerializesModels is the queue equivalent of a coat check — the heavy coat (model) is stored in the DB, and you get a ticket (model class + ID) to retrieve it later.
- **Hydration gap**: Between dispatch and processing, the model in DB may have changed or been deleted. The job always sees the latest DB state, not the state at dispatch.

# Internal Mechanics
- On `serialize()`: The trait's `__sleep()` iterates over job properties. If a property is an Eloquent Model, it's replaced with a `ModelIdentifier` containing `class`, `id`, and `connection`.
- On `unserialize()`: `__wakeup()` iterates over restored properties. `ModelIdentifier` instances are replaced with fresh `Model::find($id)` calls.
- `ModelIdentifier` stores: `$class` (FQCN), `$id` (model key), `$relations` (empty list), `$connection` (database connection name).
- If `find()` returns null (model deleted), the job can continue (with null) or throw `ModelNotFoundException`.
- The trait also handles `EloquentCollection` by serializing each model item into a `ModelIdentifier` array, then re-hydrating with individual `find()` calls.

# Patterns
## Defensive Model Re-fetch
- **Purpose**: Ensure model existence before using it in job logic.
- **Benefit**: Graceful handling of deleted records.
- **Tradeoff**: Extra boilerplate; jobs must handle null model scenarios.

## Explicit ID Passing with Re-fetch
- **Purpose**: Avoid `SerializesModels` magic entirely by passing raw IDs.
- **Benefit**: Full control, smaller payload, no deserialization model-fetch overhead.
- **Tradeoff**: Every job manually re-fetches models; `SerializesModels` was designed to abstract exactly this.

## Soft Delete Handling
- **Purpose**: Re-fetch soft-deleted models via `withTrashed()`.
- **Benefit**: Allows processing jobs for archived records.
- **Tradeoff**: Must implement `ModelNotFoundException` handling or override restore logic.

# Architectural Decisions
- **Use `SerializesModels` for**: Jobs where you need the latest model state at processing time and want to minimize payload size.
- **Avoid `SerializesModels` when**: You need the exact state at dispatch time (use IDs + manual serialization).
- **Avoid `SerializesModels` for**: Jobs with many model properties (each triggers a `find()` query on wakeup). Pass IDs directly.
- **Pivot data requirement**: Do NOT use `SerializesModels` for jobs that need pivot attributes. Manually serialize pivot data.

# Tradeoffs
SerializesModels | Small payload, fresh model state | Extra DB queries per job on wakeup, deleted model risk
ID passing | Full control, zero wakeup overhead | Manual re-fetch in handle, more code
Full serialization (no trait) | Exact dispatch-time state | Large payload, stale data

# Performance Considerations
- Each model property triggers one `find()` query on deserialization — 10 models = 10 queries before `handle()` starts.
- Collections trigger one `find()` per item. A collection of 1000 items triggers 1000 individual queries — use chunked IDs instead.
- The `find()` calls use the model's connection, which may be different from the default. This adds connection resolution overhead.
- For high-throughput jobs, minimize model properties to reduce deserialization cost.

# Production Considerations
- If a model is deleted, the job proceeds with `null` instead of the model. Subsequent code that calls methods on the model (`$model->update(...)`) throws a null-call error.
- The `ShouldBeUnique` contract combined with `SerializesModels`: the unique lock is acquired before deserialization, so it does not protect against deserialization failures.
- Jobs using `SerializesModels` cannot be retried from failed_jobs if the referenced model has been permanently deleted.
- Monitor `ModelNotFoundException` in failed jobs — it's a leading indicator of serialization-vs-deletion timing issues.

# Common Mistakes
- **Using `SerializesModels` with models that have loaded relations**: Loaded relations are serialized as `ModelIdentifier` too, triggering cascading `find()` queries. The job payload stays small, but execution cost multiplies.
- **Assuming property modification in `handle()` persists**: Modifying a restored model property in `handle()` and calling `save()` works fine. But the modified property is in-memory only — the serialized model in the queue payload is never updated.
- **Not accounting for deserialization in the constructor**: Constructor runs BEFORE deserialization. Model properties are `ModelIdentifier` objects, not actual models, in the constructor context.

# Failure Modes
- **ModelNotFoundException**: The model was deleted between dispatch and processing. The deserialization silently sets the property to `null`. Any method call on it crashes.
- **Missing pivot data**: A `BelongsToMany->pivot` attribute is serialized as part of the model but May not be present after deserialization. The model is re-fetched without the pivot context.
- **Database connection mismatch**: The model's connection in `ModelIdentifier` may reference a connection that doesn't exist in the processing environment, causing a crash.
- **Stale `ModelIdentifier`**: If the model class is renamed or moved, deserialization tries to instantiate the old class name — class not found error.

# Ecosystem Usage
- **Laravel framework**: Applied automatically by `Dispatchable` trait on queued jobs. Explicitly included on event listener classes via `ShouldQueue`.
- **Laravel Horizon**: Tag-related models follow the same serialization path — model tags use `ModelIdentifier` for their payload.
- **Laravel Nova**: Nova actions queued via `dispatch()` use `SerializesModels` for the action's models.

# Related Knowledge Units
- K004 Job Serialization and Payload Envelope (envelope structure) | K078 Closures as Queued Jobs (alternative serialization) | K087 Ignoring Missing Models (failed job handling)

## Research Notes
- The Queue::route() method introduced in Laravel 11 allows mapping job classes to specific connection/queue combinations at dispatch time, evaluated lazily — this changes the mental model from dispatch-time resolution to routing-time resolution.
- Laravel 12 introduced the ailover connection driver for queue HA, but automatic failback is not supported — the primary connection must be manually restored after it recovers.
- The fter_commit option has different behavior across drivers: Redis queues honor it via transaction callbacks; SQS queues rely on the fter_commit config key at the connection level.
- Octane compatibility for queue dispatching is an ongoing concern — the QueueManager is resolved from the container and may hold stale references between requests in persistent application contexts.
- Serializing models for queued jobs uses ModelIdentifier under the hood — the trait SerializesModels handles this by converting model instances to identifiers before serialization and rehydrating them after unserialization.
- Community benchmarks show Redis queue throughput of 10,000+ jobs/second with Horizon, while SQS throughput is limited by API rate limits (3,000 messages/second per account per region initially).
