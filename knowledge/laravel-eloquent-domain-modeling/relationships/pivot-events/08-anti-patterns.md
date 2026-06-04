# Anti-Patterns: Pivot Events

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships
- **Knowledge Unit:** Pivot Events

## Anti-Patterns

### Heavy Synchronous Listeners
Running expensive operations (API calls, complex computations, email sending) in pivot event listeners. Pivot events dispatch synchronously during the request — heavy listeners block the response.

**Problem:** Slow response times; synchronous execution of expensive operations during request lifecycle.

**Solution:** Keep listeners fast and synchronous; dispatch queued jobs for heavy side effects.

### Expecting Model Events from attach/detach
Registering model observers on pivot models expecting them to fire on `attach()`/`detach()`. Pivot model lifecycle events (saving, saved, etc.) do NOT fire during `attach()` or `detach()`.

**Problem:** Observers silently never fire; pivot model logic is never executed.

**Solution:** Use pivot events (`Attached`, `Detached`, `Updated`) for attach/detach side effects. Custom pivot model `save()` must be called explicitly to fire model events.

### Per-Row sync Without Batching
Calling `sync()` in a loop for each ID individually when a single `sync()` with all IDs achieves the same result. Each loop iteration fires separate events and queries.

**Problem:** Multiple database round trips; multiple event dispatches instead of one batch event.

**Solution:** Use a single `sync()` call with all IDs — `sync()` fires one event per operation type, not per row.

### Unvalidated Attach
Performing `attach()` without pre-write validation using the `attaching` event. Invalid relationships reach the database before any check is performed.

**Problem:** Invalid relationships created before the error is detected.

**Solution:** Use the `attaching` (pre-event) listener for validation — throw an exception to abort the attach.

### Using Only After-Events
Registering listeners only on `attached`/`detached` (post-events) when pre-write validation is needed. Post-events cannot prevent the operation — the invalid data is already written.

**Problem:** Cannot abort invalid attach/detach operations because pre-event listeners are missing.

**Solution:** Use `attaching`/`detaching` (pre-events) for validation/authorization; use post-events for side effects.

### Forgotten Event Registration
Writing event listeners for pivot events but forgetting to register them in `EventServiceProvider`. The listener silently never fires.

**Problem:** Pivot event listeners defined but never executed; side effects never happen.

**Solution:** Register all pivot event listeners in `EventServiceProvider` using the full `Illuminate\Database\Events\Pivot\*` namespace.
