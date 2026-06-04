# Pivot Events Skills

## Skill: Handle pivot events for attach/detach side effects

### Purpose
Register pivot event listeners for `attached`/`detached`/`updated` events to trigger side effects (cache invalidation, logging, notifications) when many-to-many relationship rows change.

### When To Use
- Audit logging: record when relationships are created or destroyed
- Cache invalidation: clear caches when pivot data changes
- Side-effect triggering: dispatch jobs on relationship changes
- Keeping external systems in sync with relationship changes

### When NOT To Use
- For side effects that should happen on model lifecycle events (use model events)
- When you need per-row granularity with `sync()` (events are batched per operation type)
- When the overhead of event dispatch is unacceptable in hot paths

### Prerequisites
- `BelongsToMany` relationship defined
- Event listener class or closure

### Inputs
- Event class: `Illuminate\Database\Events\Pivot\Attached`
- Listener class or closure
- Side effect logic

### Workflow
1. Create a listener class for the pivot event
2. Register the listener in `EventServiceProvider::$listen` array
3. Use the event payload — `$event->parent`, `$event->pivotIds`, `$event->related` class name
4. For heavy side effects, dispatch a queued job from the listener
5. For cache invalidation, always use post-events (`attached`, not `attaching`)
6. Test with `Event::fake()` to assert events fire without executing handlers

### Validation Checklist
- [ ] Listeners are registered in `EventServiceProvider::$listen`
- [ ] Post-events (`attached`/`detached`/`updated`) are used for side effects
- [ ] Heavy operations dispatch queued jobs from listeners
- [ ] `Event::fake()` is used in tests to assert event dispatch
- [ ] No expectation that custom pivot model observers fire on `attach()`/`detach()`

### Common Failures
- Using pre-events (`attaching`) for side effects — fires before DB write succeeds
- Heavy synchronous listeners blocking HTTP requests
- Not registering listeners in service provider — silent failures
- Assuming `sync()` fires per-row events — events are batched per operation type

### Decision Points
- **attaching vs attached?** — Use `attaching` for validation (throw to abort); use `attached` for side effects (after successful write)
- **Sync or per-row events?** — Use `sync()` for batched events; iterate `attach()`/`detach()` for per-row granularity

### Performance Considerations
- Event dispatch is a single method call per operation — minimal overhead
- `sync()` fires one event per operation type, not per row
- Custom pivot model `$pivot->save()` triggers full model event chain — more expensive
- Event payload includes parent model and IDs — no full model hydration

### Security Considerations
- Event listeners should not leak sensitive info in their payloads
- `attaching` can throw to authorize or reject relationship changes

### Related Rules
- [PivotEvent-Post-For-Side-Effects](../pivot-events/05-rules.md)
- [PivotEvent-Queue-Heavy-Listeners](../pivot-events/05-rules.md)
- [PivotEvent-Sync-Is-Batched](../pivot-events/05-rules.md)
- [PivotEvent-Register-In-ServiceProvider](../pivot-events/05-rules.md)
- [PivotEvent-Model-Observers-Dont-Fire](../pivot-events/05-rules.md)
- [PivotEvent-Test-With-Event-Fake](../pivot-events/05-rules.md)

### Related Skills
- Validate pivot operations with attaching pre-events

### Success Criteria
- Side effects fire correctly after attach/detach/update
- Heavy operations are queued, not synchronous
- Tests assert pivot events dispatching
- No assumption that pivot model observers fire on attach/detach

---

## Skill: Validate pivot operations with attaching pre-events

### Purpose
Use the `attaching` pre-event to validate or authorize pivot operations before the database write, throwing exceptions to abort invalid operations.

### When To Use
- Preventing duplicate assignments beyond simple unique constraints
- Limiting the number of related records per parent
- Authorization checks before allowing relationship creation
- Business rule validation on the relationship

### When NOT To Use
- Simple existence validation (handle at the controller/service layer)
- When post-operation side effects are needed (use `attached`/`detached`)

### Prerequisites
- `BelongsToMany` relationship defined

### Inputs
- `Illuminate\Database\Events\Pivot\Attaching` event class
- Validation/authorization logic
- Exception to throw if validation fails

### Workflow
1. Register a listener for `Illuminate\Database\Events\Pivot\Attaching`
2. Access `$event->parent`, `$event->pivotIds`, and `$event->related` in the handler
3. Perform validation or authorization checks
4. Throw an exception to abort the attach operation
5. The exception propagates up to the caller of `attach()` or `sync()`

### Validation Checklist
- [ ] `attaching` event is used for validation (not `attached`)
- [ ] Exception is thrown to abort the operation
- [ ] Validation logic is correct and handles all edge cases
- [ ] Tests verify that invalid operations are aborted

### Common Failures
- Using `attached` for validation — too late, DB write already happened
- Not throwing an exception — pre-event listener can't abort without it
- Heavy validation logic in the event listener blocking the request

### Performance Considerations
- Pre-event adds minimal overhead (single method call)
- Validation logic should be fast — avoid database queries if possible

### Security Considerations
- `attaching` is a clean mechanism for authorization — throw to reject unauthorized changes
- Ensure the exception doesn't leak sensitive information

### Related Rules
- [PivotEvent-Attaching-For-Validation](../pivot-events/05-rules.md)

### Related Skills
- Handle pivot events for attach/detach side effects

### Success Criteria
- Invalid attach operations are aborted with an exception
- Valid attach operations proceed normally
- Validation logic is centralized and testable
- Authorization checks prevent unauthorized relationship changes
