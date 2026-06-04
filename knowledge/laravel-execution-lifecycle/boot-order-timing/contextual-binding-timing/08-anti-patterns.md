# ECC Anti-Patterns — Contextual Binding Timing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Boot Order & Timing |
| **Knowledge Unit** | Contextual Binding Timing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Contextual Binding in `boot()` Instead of `register()`
2. Contextual Binding for Consumers Resolved Outside Container
3. Contextual Binding Instead of Global Binding for Universal Needs
4. Circular Dependency via Contextual Bindings

---

## Repository-Wide Anti-Patterns

- Overengineering — using contextual binding for simple cases that just need a different interface binding.

---

## Anti-Pattern 1: Contextual Binding in `boot()` Instead of `register()`

### Category
Framework Usage

### Description
Registering contextual bindings (`$app->when()->needs()->give()`) in a service provider's `boot()` method instead of `register()`. If the consumer class has already been resolved before `boot()` runs, the contextual binding has no effect.

### Why It Happens
Developers put all provider logic in `boot()` because they know config is available there. They don't realize that contextual bindings have a timing constraint — they must be registered before the consumer is first resolved.

### Warning Signs
- `$app->when(Consumer::class)->needs(Abstract::class)->give(Concrete::class)` called in `boot()`
- Contextual binding appears to have no effect
- Consumer receives the default binding instead of the contextual one

### Why It Is Harmful
If the consumer class is resolved by any provider's `boot()` method before this provider's `boot()` runs, the contextual binding is registered too late. The consumer already has its dependencies resolved and will not re-resolve.

### Real-World Consequences
Provider A's `boot()` resolves `OrderProcessor::class` which depends on `PaymentGateway`. Provider B's `boot()` registers a contextual binding for `OrderProcessor::class` using a different payment gateway. Provider A runs first because of registration order. Provider B's contextual binding is registered too late. `OrderProcessor` continues using the default gateway.

### Preferred Alternative
Register all contextual bindings in `register()` methods. If the contextual binding depends on configuration, use a closure in `give()` that reads config lazily.

### Refactoring Strategy
1. Move contextual bindings from `boot()` to `register()`
2. If config-dependent, use `give(function() { return config('...'); })` for lazy resolution
3. Verify the consumer receives the correct implementation

### Detection Checklist
- [ ] `$app->when()->needs()->give()` in `boot()` method
- [ ] Contextual binding appears to have no effect
- [ ] Consumer resolved before the binding is registered

### Related Rules
Rule 1 (05-rules.md): Register contextual bindings in `register()` — not in `boot()`.

### Related Skills
Implement Contextual Bindings with Correct Timing (06-skills.md).

### Related Decision Trees
Contextual Binding Registration Timing decision (07-decision-trees.md).

---

## Anti-Pattern 2: Contextual Binding for Consumers Resolved Outside Container

### Category
Framework Usage

### Description
Creating a contextual binding for a consumer class that is never resolved by the container — classes instantiated with `new` or created by factories that don't use the container.

### Why It Happens
Developers assume all class resolution goes through the container. They create contextual bindings for classes that are hardcoded with `new ClassName()` in the code.

### Warning Signs
- Consumer class is instantiated with `new` keyword
- Consumer class created by a factory that doesn't call `$app->make()`
- Contextual binding exists but the consumer still gets the wrong implementation

### Why It Is Harmful
Contextual bindings only take effect when the consumer is resolved by the container (`$app->make(Consumer::class)` or constructor injection). If the consumer is `new`'d directly, the container never looks up the contextual binding.

### Real-World Consequences
A developer creates `$app->when(ReportGenerator::class)->needs(PdfDriver::class)->give(MpdfDriver::class)`. But `ReportGenerator` is created with `new ReportGenerator(...)` in the controller. The contextual binding never applies. The controller manually passes the wrong driver.

### Preferred Alternative
Ensure the consumer class is resolved by the container. Use constructor injection or `$app->make()` to create the consumer. For factory-created classes, make the factory container-aware.

### Refactoring Strategy
1. Identify consumers created outside the container
2. Convert to container resolution: inject or use `$app->make()`
3. Or remove the contextual binding and pass the dependency explicitly

### Detection Checklist
- [ ] Consumer class created with `new` instead of resolved by container
- [ ] Contextual binding exists but has no observable effect
- [ ] Factory creates consumer without container

### Related Rules
Rule 2 (05-rules.md): Contextual bindings only work for container-resolved consumers.

### Related Skills
Implement Contextual Bindings with Correct Timing (06-skills.md).

---

## Anti-Pattern 3: Contextual Binding Instead of Global Binding for Universal Needs

### Category
Maintainability

### Description
Using contextual bindings when all consumers should receive the same implementation. This duplicates the same contextual binding across multiple consumer classes instead of using a single global binding.

### Why It Happens
Developers discover contextual bindings and overuse them, applying the pattern even when a global binding would suffice.

### Warning Signs
- Same `needs()->give()` repeated for multiple consumers
- No consumer actually needs a different implementation
- Contextual bindings proliferate across providers

### Why It Is Harmful
Contextual bindings add complexity to the container configuration. Each binding must be maintained and understood. A global binding is simpler, clearer, and easier to override in tests.

### Real-World Consequences
An application has 15 contextual bindings all giving the same `StripePaymentGateway::class` to `PaymentGateway::class`. Adding a new consumer requires adding a 16th contextual binding. Changing to a different gateway requires updating 16 bindings instead of 1.

### Preferred Alternative
Use a global `bind()` or `singleton()` when all consumers should receive the same implementation. Reserve contextual bindings for cases where consumers genuinely need different implementations.

### Refactoring Strategy
1. Identify contextual bindings that all give the same implementation
2. Replace with a single global `$app->bind(Abstract::class, Concrete::class)`
3. Remove the redundant contextual bindings

### Detection Checklist
- [ ] Same `needs()->give()` pattern repeated across consumers
- [ ] No consumer needs a different implementation
- [ ] Adding a new consumer requires duplicating the contextual binding

### Related Rules
Rule 3 (05-rules.md): Use global bindings when all consumers need the same implementation.

### Related Skills
Implement Contextual Bindings with Correct Timing (06-skills.md).

### Related Decision Trees
Contextual vs Global Binding decision (07-decision-trees.md).

---

## Anti-Pattern 4: Circular Dependency via Contextual Bindings

### Category
Architecture

### Description
Creating contextual bindings that form a circular dependency chain — Consumer A needs Concrete B, but Concrete B's constructor (directly or indirectly) requires an instance of Consumer A.

### Why It Happens
Complex domain models with bidirectional relationships are incorrectly wired through the container instead of using proper separation patterns.

### Warning Signs
- `BindingResolutionException` about circular dependencies
- Contextual binding chain involves classes that reference each other
- Stack trace shows recursive resolution

### Why It Is Harmful
Circular dependencies between container-managed classes cause infinite resolution loops or `BindingResolutionException`. The framework cannot resolve the chain and the request fails.

### Real-World Consequences
A `OrderProcessor` needs `InvoiceGenerator` via contextual binding. `InvoiceGenerator`'s constructor requires `OrderProcessor` (the same instance). The container enters an infinite resolution loop and throws `BindingResolutionException`. Every order processing request fails.

### Preferred Alternative
Break circular dependencies by introducing a third abstraction or using the event system to decouple the classes. Consider lazy initialization, setter injection, or the observer pattern.

### Refactoring Strategy
1. Identify the circular dependency chain
2. Extract shared dependency into a separate service
3. Use events to decouple the classes
4. Consider using `Container::afterResolving()` to break the circle

### Detection Checklist
- [ ] `BindingResolutionException` for circular dependency
- [ ] Two classes reference each other in their constructors
- [ ] Contextual binding chain forms a loop

### Related Rules
Rule 4 (05-rules.md): Avoid circular dependencies in contextual binding chains.

### Related Skills
Debug Contextual Binding Resolution Failures (06-skills.md).

### Related Decision Trees
Circular Dependency Break decision (07-decision-trees.md).
