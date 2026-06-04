# Contextual Binding Timing

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **Last Updated:** 2026-06-02

## Executive Summary
Contextual binding timing refers to when `$app->when()->needs()->give()` bindings are registered and resolved during the application lifecycle. Unlike global bindings, contextual bindings are consumer-specific — they define which concrete implementation a specific class receives for a given abstract dependency. The timing of their registration (in provider `register()`) and resolution (at class instantiation) has significant implications for how context-aware service resolution works across the bootstrap and request lifecycle.

## Core Concepts
- **Contextual binding registration**: `$app->when(Consumer::class)->needs(Interface::class)->give(Concrete::class)` is registered in `$contextual` array on the container.
- **Registration timing**: Contextual bindings must be registered in `register()` before the consumer class is resolved — ideally in the provider that owns the consumer or before its resolution.
- **Resolution timing**: Contextual bindings are checked at resolution time — when `make(Consumer::class)` is called, the container checks `$contextual[Consumer::class]` for any matching abstracts.
- **Scope**: Contextual bindings are per-abstract, per-consumer — they do not affect resolution of the same abstract for other consumers.
- **Inheritance handling**: Contextual bindings apply to the exact class specified — they do NOT apply to subclasses. Each subclass must have its own contextual binding.
- **Contextual vs global precedence**: Contextual bindings take precedence over global bindings — they are checked first in the resolution chain.

## Mental Models
- **Dependency Injection Router**: Think of contextual binding as a special routing table for dependencies. Normal bindings are default routes; contextual bindings are "if sender = X, route to Y."
- **Custom Tailoring Model**: Global bindings are off-the-rack clothes — one size for everyone. Contextual bindings are tailored — `Consumer::class` gets a specific implementation that no other class sees.
- **Overload Switchboard**: Contextual binding is like a phone switchboard with caller ID — when the call comes from Consumer A, it routes to Extension A; from Consumer B, to Extension B.

## Internal Mechanics
1. `$app->when(Consumer::class)->needs(Abstract::class)->give(Concrete::class)` stores the mapping in `$contextual[Consumer::class][Abstract::class] = Concrete::class` (or a closure).
2. During resolution of `Consumer::class`, the container's `resolve()` method checks `$contextual` for a matching consumer entry before checking global `$bindings`.
3. If a contextual binding matches, the `give()` value (class name or closure) is used to resolve the dependency.
4. The contextual binding is checked once per dependency resolution — there is no caching of contextual resolution results.
5. Contextual bindings can use closures: `->give(function ($app) { return new Concrete($app['config']); })` — closures receive the container as the first argument.

## Patterns
- **Consumer-Specific Resolution Pattern**: Different consumers of the same interface receive different implementations without modifying the consumers.
- **Strategy via Container Pattern**: Replace the strategy pattern with contextual binding — instead of injecting a strategy factory, bind the specific strategy per consumer.
- **Tenant-Specific Resolution Pattern**: In multi-tenant apps, contextual bindings can provide tenant-specific implementations to tenant-aware consumers.

## Architectural Decisions
- **Why contextual over global?** Global bindings apply everywhere, which is problematic when different consumers need different implementations of the same interface. Contextual binding eliminates conditional wiring in consumer classes.
- **Why no subclass inheritance?** Contextual binding is registered against the exact consumer class. PHP doesn't have a reliable way to determine "is this a subclass of" at registration time without Reflection — the container avoids this complexity.
- **Why closures in give()?** Closures allow the concrete implementation to depend on runtime state (config, request data) that isn't available at binding registration time.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates conditional wiring in consumers | Contextual bindings are scattered across provider register() methods | Harder to find all bindings for a given interface |
| No consumer code changes needed for different implementations | No subclass inheritance — each consumer must be explicitly bound | Adding a subclass requires duplicating or adding a new contextual binding |
| Closures in give() enable runtime configuration | Closure complexity can hide unintended dependencies | Closure-based contextual bindings are harder to debug |
| Clearer than factory pattern for simple consumer-specific wiring | Contextual bindings add to container complexity | Developers may not know contextual binding exists and write factories instead |

## Performance Considerations
- Contextual binding lookup adds ~0.001ms per resolution — checking `$contextual[Consumer::class]` is an O(1) array lookup.
- Closure-based `give()` adds closure invocation overhead (~0.002ms) compared to class-string give().
- Contextual bindings are resolved fresh each time — they do not leverage the `$instances` cache unless the concrete is itself a singleton.
- A large `$contextual` array (100+ entries) adds negligible memory overhead (~5KB).

## Production Considerations
- Register contextual bindings in the provider that makes sense for the consumer or the abstraction — be consistent.
- Use class strings in `give()` when possible — they are faster and simpler than closures.
- Document contextual bindings — they are implicit dependencies that affect resolution behavior across the application.
- In Octane, contextual bindings persist across requests — ensure closure-based give() does not capture request-scoped state.

## Common Mistakes
- **Registering contextual binding too late**: Binding in `boot()` after the consumer has already been resolved in another provider's `boot()` — the binding has no effect.
- **Expecting subclass inheritance**: Binding `when(Parent::class)` and expecting `Child extends Parent` to inherit the binding — it doesn't.
- **Missing contextual for all consumers**: Binding for one consumer but forgetting others — they get the global binding or auto-resolution, which may be wrong.
- **Overusing contextual for simple polymorphism**: The same implementation could be bound globally — contextual binding adds unnecessary complexity.

## Failure Modes
- **Consumer resolves wrong implementation**: A global binding is used instead of contextual — check that the contextual binding is registered before the consumer is resolved.
- **Closure give() captures stale state**: Under Octane, a closure capturing `$request` in `give()` captures the first request's data for all subsequent requests.
- **Missing contextual for new consumer**: Adding a new consumer class but forgetting to add its contextual binding — it gets the default binding silently.

## Ecosystem Usage
- **Laravel core**: Uses contextual binding in several places — `FilesystemManager` uses contextual to provide different disks to different consumers.
- **Spatie packages**: Use contextual binding for permission checks — different gate guards get different implementations.
- **Multi-tenant packages**: Tenant-aware packages use contextual binding to provide tenant-specific implementations of repositories, caches, and connections.

## Related Knowledge Units

### Prerequisites
- [Container Fundamentals](../../service-container/container-fundamentals/02-knowledge-unit.md) — the `$contextual` array and how it integrates with the resolution chain.

### Related Topics
- [Binding Types](../../service-container/binding-types/02-knowledge-unit.md) — how contextual binding interacts with bind(), singleton(), scoped().
- [Interface Binding Resolution](../../dependency-injection/interface-binding-resolution/02-knowledge-unit.md) — how interfaces in consumers are resolved.

### Advanced Follow-up Topics
- [Contextual Binding via Attributes](../../service-container/contextual-binding/02-knowledge-unit.md) — PHP 8 attribute-based contextual binding in newer Laravel versions.
- [Scoped Instance Management](../../service-container/scoped-instance-management/02-knowledge-unit.md) — flushing contextual binding state between requests.

## Research Notes
- Contextual binding was introduced in Laravel 5.0 and has remained API-stable. The `when()->needs()->give()` fluent API was a later improvement over the original array-based registration.
- The `$contextual` array structure: `$contextual[ConsumerClass][AbstractClass] = ConcreteClass|Closure`.
- Contextual binding is resolved in `Container::resolveDependencies()` and `Container::resolvePrimitive()` — the check happens before global binding lookup.
- In Laravel 12+, attribute-based contextual binding (`#[Context]`) provides an alternative to the fluent API, allowing binding configuration directly on the consumer class.
- Future direction: Framework may migrate more consumer-specific bindings to contextual from global, improving flexibility.
