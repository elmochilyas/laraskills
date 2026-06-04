# Skill: Define Cross-Feature Communication Contracts

## Purpose

Establish stable, decoupled interfaces between features so they can exchange data without tight coupling. This enables independent refactoring, testing, and eventual extraction of features.

## When To Use

- A feature needs data owned by another feature
- A new cross-feature data dependency is introduced
- Reviewing existing direct model access across features for refactoring

## When NOT To Use

- Within a single feature (use internal service calls)
- For simple CRUD that doesn't cross feature boundaries
- When no second consumer exists yet (start concrete, extract later)

## Prerequisites

- Shared kernel directory exists: `app/Kernel/Contracts/` and `app/Kernel/DTOs/`
- Feature service providers are set up for container binding
- PHPStan or Psalm is configured for static analysis

## Inputs

- Source feature that owns the data
- Consuming feature that needs the data
- Data contract (what methods, what return types)

## Workflow

1. Identify the data need in the consuming feature
2. Define an interface in `app/Kernel/Contracts/` with only the required methods
3. Implement the interface in the owning feature's service class
4. Bind the interface to the implementation in the owning feature's service provider
5. Inject the interface (not concrete class) into the consuming feature's constructor
6. Write a contract test that exercises the interface through the container
7. Add the consuming feature to the dependency documentation

## Validation Checklist

- [ ] Interface lives in `app/Kernel/Contracts/` (not inside a feature)
- [ ] Consuming feature injects the interface, never the concrete class
- [ ] Owning feature's service provider binds interface to implementation
- [ ] No direct model imports across feature boundaries exist
- [ ] Contract test verifies interface behavior through container
- [ ] Dependency direction is documented and acyclic
- [ ] Interface is consumed by at least 2 features (YAGNI applies)

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|------------|
| Interface drift | Implementation changes without updating contract | Contract tests in CI |
| Over-engineering | Interface for single consumer | Start concrete, extract when 2nd consumer |
| Circular dependency | A depends on B, B depends on A | Enforce DAG with static analysis |
| Bloated kernel | Too many interfaces "just in case" | Prune quarterly, keep lean |

## Decision Points

- **Interface vs Event**: Use interface for data retrieval (synchronous, return value needed). Use event for fire-and-forget side effects (notifications, analytics).
- **Interface vs Direct model**: If only one feature needs the data, keep it concrete. Extract to interface only when a second consumer emerges.
- **DTO vs array**: Use DTOs when passing 3+ related values across boundaries. Scalars are fine without DTOs.

## Performance Considerations

No measurable overhead. PHP resolves the concrete class at container resolution time — zero-cost abstraction. Event dispatch adds ~0.1ms.

## Security Considerations

Cross-feature communication does not bypass auth. Each feature's service layer must still check permissions. Events carry data already authorized by the dispatching context.

## Related Rules

- Never Direct Model Access Across Features (05-rules.md)
- Use Service Interfaces For Data Retrieval (05-rules.md)
- Use Events For Cross-Cutting Side Effects (05-rules.md)
- Use DTOs For Cross-Boundary Data (05-rules.md)
- Wire Cross-Feature Dependencies In Providers (05-rules.md)
- Use Contract Tests For Interfaces (05-rules.md)
- Keep Shared Kernel Lean (05-rules.md)

## Related Skills

- Create Feature Service Provider
- Implement Event-Based Cross-Feature Communication
- Evaluate Organizational Structure (feature-vs-layer)

## Success Criteria

- Consuming feature can retrieve data from owning feature with zero direct model imports
- Interface contract test passes in CI
- Dependency graph remains acyclic
- Owning feature can refactor internals without breaking consumers

---

# Skill: Implement Event-Based Cross-Feature Communication

## Purpose

Decouple features by using Laravel events for fire-and-forget side effects across feature boundaries. The dispatching feature does not need to know about consumers.

## When To Use

- Side effects triggered by one feature need handling by another (notifications, analytics, audit logging)
- Adding new cross-cutting behavior without modifying existing code
- Async processing of cross-feature work via queued listeners

## When NOT To Use

- Synchronous data retrieval (use service interfaces instead)
- Side effects that must be transactional with the main operation
- Simple logging that can happen inside the same feature

## Prerequisites

- Dispatching feature exists and has event classes in its `Events/` directory
- Consuming feature has listener classes
- Event caching is enabled in production (`php artisan event:cache`)

## Inputs

- Event class: defines the data payload
- Listener classes: handle the side effect in consuming features
- Optional queue configuration for async processing

## Workflow

1. Create the event class in the dispatching feature's `Events/` directory with readonly DTO data
2. Create listener classes in each consuming feature's `Listeners/` directory
3. Register the listener in the consuming feature's service provider or a dedicated event subscriber
4. Dispatch the event from the dispatching feature's service layer
5. Verify listeners are registered: `php artisan event:list`
6. Keep listeners per event at 5 or fewer; split if exceeded
7. Run `php artisan event:cache` in production

## Validation Checklist

- [ ] Event class has readonly typed properties (no Eloquent models passed directly)
- [ ] Listeners are in consuming features, not in the dispatching feature
- [ ] Event dispatched from service layer, not from controller
- [ ] Each event has 5 or fewer listeners
- [ ] `php artisan event:list` shows all expected listeners
- [ ] Queued listeners for non-critical side effects
- [ ] Contract tests verify event dispatch triggers expected side effects

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|------------|
| Event overload | 15+ listeners on one event | Split into specific events |
| Passing Eloquent models | Convenience in event constructor | Use DTOs or scalar values |
| Listener in wrong feature | Listener co-located with event | Listener belongs in consuming feature |
| Silent listener failure | Listener exception not caught | Wrap in try-catch, log failures |

## Decision Points

- **Sync vs Queue**: Use sync for critical behavior. Use queue for optional side effects (analytics, notifications).
- **Event vs Job**: Use event when multiple unrelated features need to react. Use job for a single unit of async work.
- **Event vs Service Interface**: Event = fire-and-forget, no return value. Interface = synchronous data retrieval.

## Performance Considerations

Synchronous dispatch adds ~0.1ms per event. Queued dispatch moves cost to worker. Event caching eliminates per-request registration overhead.

## Security Considerations

Events carry data that was already authorized by the dispatching context. Listeners should not re-authorize but must not trust event payloads blindly.

## Related Rules

- Use Events For Cross-Cutting Side Effects (05-rules.md)
- Prevent Event Overload (05-rules.md)
- Run CI Checks For Cross-Feature Model Imports (05-rules.md)

## Related Skills

- Define Cross-Feature Communication Contracts
- Create Feature Service Provider
- Create Feature Test Structure

## Success Criteria

- New side effect added without modifying dispatching feature
- Listeners in consuming features handle the event correctly
- Event list shows expected registrations
- Event listener count per event stays at 5 or fewer

---

# Skill: Wire Cross-Feature Dependencies In Service Providers

## Purpose

Centralize the wiring of cross-feature interfaces to implementations inside service providers, enabling swapping implementations without changing consuming code.

## When To Use

- After a cross-feature interface is defined in the shared kernel
- Adding a new binding between an interface and implementation
- Swapping implementations for testing, staging, or feature flags

## When NOT To Use

- Single-feature bindings that never cross boundaries
- Bindings that can be handled by Laravel's auto-resolution

## Prerequisites

- Interface defined in `app/Kernel/Contracts/`
- Implementation class exists in the owning feature
- Feature's service provider exists

## Inputs

- Interface fully qualified class name
- Implementation fully qualified class name
- Owning feature's service provider

## Workflow

1. Open the owning feature's service provider
2. In the `register()` method, add `$this->app->bind(Interface::class, Implementation::class)`
3. For singletons, use `$this->app->singleton()` instead
4. In the consuming feature's constructor, type-hint the interface
5. Verify resolution: `app(Interface::class)` returns the correct instance
6. Document the binding in the feature's README

## Validation Checklist

- [ ] Binding is in `register()`, not `boot()`
- [ ] Consuming feature type-hints interface, not concrete class
- [ ] `app()->make(Interface::class)` resolves the correct implementation
- [ ] Test mocks can be swapped via container in `setUp()`
- [ ] Binding documented in feature README provider section
- [ ] No circular binding chains

## Common Failures

| Failure | Cause | Prevention |
|---------|-------|------------|
| Binding in boot | Misunderstanding lifecycle | Always use `register()` for bindings |
| Concrete class injection | Forgetting the interface | Type-hint interface in consumers |
| Circular resolution | A depends on B, B depends on A | Check dependency graph before binding |
| Missing binding | Provider not registered in config | Verify in php artisan route:list |

## Decision Points

- **bind vs singleton**: Use `bind` for services that should be new instances. Use `singleton` for stateless services.
- **Feature provider vs AppServiceProvider**: Wire cross-feature interfaces in the owning feature's provider. Use AppServiceProvider only for global concerns.

## Performance Considerations

Container resolution is negligible. Deferred providers can be used for features with only bindings to reduce boot time by 1-5ms per feature.

## Security Considerations

None. Container bindings do not affect security boundaries. Auth/permissions still apply at the controller/service level.

## Related Rules

- Wire Cross-Feature Dependencies In Providers (05-rules.md)
- Keep `register()` For Container Bindings Only (05-rules.md)
- Defer Rarely-Used Feature Providers (05-rules.md)

## Related Skills

- Define Cross-Feature Communication Contracts
- Create Feature Service Provider
- Evaluate Organizational Structure (feature-vs-layer)

## Success Criteria

- Consuming feature successfully resolves the interface through the container
- Implementation can be swapped by changing provider binding
- Test cases override bindings via `$this->app->instance()` without modifying source
