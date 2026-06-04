# ECC Anti-Patterns — Queued Actions

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Queued Actions |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Hardcoded Async Dispatch Inside Action
2. Constructor Mixed Dependencies (Serializable + Non-Serializable)
3. Queued Action with Mutable State
4. Queued Action Bound as Singleton
5. Queue Routing Hardcoded in Action Class

---

## Repository-Wide Anti-Patterns

- Queue Abuse (dispatching everything to queue unnecessarily)
- Premature Optimization (queuing before confirming latency need)
- Hidden Database Queries (serialized model IDs causing N+1 on worker)

---

## Anti-Pattern 1: Hardcoded Async Dispatch Inside Action

### Category
Architecture | Testing

### Description
An action class calls `dispatch()` or `onQueue()->execute()` inside its own method body, forcing async execution even when the caller needs synchronous execution (e.g., during testing or when the result is needed for the response).

### Why It Happens
Developers assume the action should always be async. They hardcode the dispatch call for convenience, not realizing they've removed the caller's choice.

### Warning Signs
- `dispatch()` called inside an action's `handle()` or `execute()` method
- Action method returns `void` but produces side effects that could be sync
- Tests must use `Queue::fake()` to test the action
- No synchronous code path exists

### Why It Is Harmful
Callers cannot execute synchronously when needed — during testing, for immediate workflows, or when the result is required. Tests must fake the queue, adding complexity. The action's execution mode is dictated by the action, not the use case.

### Real-World Consequences
A developer needs the action's result for the HTTP response. But the action always dispatches to the queue. The developer must either create a separate synchronous action or refactor the action to support both modes — defeating the purpose.

### Preferred Alternative
Let the caller decide: `$action->execute($data)` for sync; `$action->onQueue()->execute($data)` for async. The action must never hardcode dispatch.

### Refactoring Strategy
1. Remove `dispatch()` calls from the action method.
2. Remove `QueueableAction` trait if async is no longer needed.
3. Update callers who need async to call `$action->onQueue()->execute($data)`.
4. Update callers who need sync to call `$action->execute($data)`.
5. Update tests to test the action synchronously (no Queue fake needed).
6. Add a single orchestration test for async dispatch.

### Detection Checklist
- [ ] Grep for `dispatch(` in `App\Actions\` files
- [ ] Check if actions have both sync and async code paths
- [ ] Verify callers can choose execution mode

### Related Rules
- Rule: Let the Caller Decide Sync vs Async Execution

### Related Skills
- Skill: Make an Action Queueable with Spatie QueueableAction

### Related Decision Trees
- Decision: Synchronous vs Asynchronous Execution

---

## Anti-Pattern 2: Constructor Mixed Dependencies

### Category
Architecture | Reliability

### Description
An action's constructor mixes service dependencies (resolved by container) with serializable data (model instances, IDs, arrays), breaking the serialization boundary between constructor and method parameters.

### Why It Happens
Developers treat the constructor as "all the things the action needs" without distinguishing between container-resolved services and per-invocation data.

### Warning Signs
- Constructor has both `Repository` type-hints and `Model` or `int` parameters
- `QueueableAction` throws serialization errors on the worker
- Action works in HTTP context but fails silently on queue workers
- `SerializesModels` trait is used on the action class

### Why It Is Harmful
In queued actions, the constructor is NOT serialized — it is resolved fresh from the container on the worker. Constructor parameters that are non-serializable service instances (not container-resolved) will be missing on the worker.

### Real-World Consequences
An `Order` model instance is passed in the constructor. On the worker, it is serialized/deserialized and may be stale or missing. The action processes outdated data silently.

### Preferred Alternative
Constructor = container-resolved dependencies only. Method parameters = per-invocation data (serialized for the queue). Never mix the two.

### Refactoring Strategy
1. Move all serializable data (Model, IDs, arrays) from constructor to method parameters.
2. Ensure constructor only has service/interface type-hints that the container can resolve.
3. Verify `QueueableAction` works on the worker by testing with an actual queue.

### Detection Checklist
- [ ] Does the constructor mix service type-hints with data type-hints?
- [ ] Does the action work in HTTP but fail on queue workers?

### Related Rules
- Rule: Constructor Is for Dependencies; Method Is for Operational Data

### Related Skills
- Skill: Make an Action Queueable with Spatie QueueableAction

### Related Decision Trees
- Decision: Queued Action vs Job Wrapper Class
