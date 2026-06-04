# Service Providers for Interface Binding

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-09-service-providers
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Service Providers bridge the gap between interfaces (ports defined in the Domain/Application layer) and implementations (adapters in the Infrastructure layer) in layered architecture. The core architectural pattern is Port-Adapter: the Domain defines what it needs (`InvoiceRepositoryInterface`, `PaymentGatewayInterface`) and Infrastructure provides concrete implementations. Service Providers register the Interface-to-Implementation mapping so the container resolves dependencies automatically — keeping Domain and Application layers free of infrastructure references.

---

## Core Concepts
- **Port (Interface)**: A contract defined in the Domain or Application layer specifying what the layer needs from outside — `InvoiceRepositoryInterface`, `PaymentGatewayInterface`
- **Adapter (Implementation)**: A concrete class in Infrastructure that implements a Port — `EloquentInvoiceRepository`, `StripePaymentGateway`
- **Composition Root**: The single location where dependencies are wired together — in Laravel, this is Service Providers
- **Binding**: Registration of an Interface-to-Implementation mapping in the container — `$this->app->bind(Interface::class, Implementation::class)`
- **Contextual Binding**: A binding that applies only to a specific class when a class needs a different implementation than the default
- **Tagged Bindings**: Grouping multiple bindings with a tag for collective resolution

---

## Mental Models
1. **Composition Root as Power Plant**: The Service Provider is the power plant of the application — it wires all electrical connections (dependencies) so that every component receives the power (implementation) it needs without knowing where it comes from. No class creates its own dependencies; the composition root handles everything.
2. **Port-Adapter as USB-C**: The Domain defines the port shape (interface). Infrastructure provides the adapter (implementation). The same port can accept different adapters — Stripe, Braintree, or a fake for testing — and the Domain never knows which one is plugged in.

---

## Internal Mechanics
During Laravel's bootstrapping, all Service Providers' `register()` methods are called in order. The `register()` method should contain only binding declarations — no business logic, no configuration reading, no event registration. After all providers are registered, the `boot()` method runs for operations that depend on all providers being available. When a class requests an interface through the constructor, the container looks up the binding, instantiates the implementation, and injects it. Singleton bindings store the resolved instance for reuse. Contextual bindings are checked when the consuming class is being resolved.

---

## Patterns
### Dedicated InfrastructureServiceProvider Pattern
- **Purpose**: Centralize all Port-Adapter bindings in one auditable location
- **Mechanism**: Create a single `InfrastructureServiceProvider` with all interface-to-implementation bindings
- **Benefits**: Single location to audit all dependency wiring, clear separation of concerns
- **Tradeoffs**: Can grow large in applications with many interfaces — split by bounded context if needed

### Environment-Specific Binding Pattern
- **Purpose**: Different implementations for different environments (Stripe in production, Fake in development)
- **Mechanism**: Conditional bindings in `register()` based on environment detection
- **Benefits**: No code changes required to switch implementations between environments
- **Tradeoffs**: Must test that conditional logic works correctly in deployment pipeline

---

## Architectural Decisions
- **Choose explicit binding when**: Following Port-Adapter pattern, multiple implementations exist for the same interface, or centralized dependency registration is needed for auditability
- **Choose auto-discovery when**: Simple bindings with single implementations and no swap expectation
- **Key decision**: Bind in `register()`, not `boot()` — bindings in `boot()` may not be available to providers that run earlier

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Layer boundaries maintained via interface injection | More interfaces and binding configuration | One binding per Port-Adapter pair is the right granularity |
| Environment-specific implementations without code changes | Conditional logic in providers | Keep conditional logic simple — test all branches |
| Singleton reduces object allocation for stateless services | Memory retained for lifetime of worker process | Correct for stateless services; wrong for stateful ones |
| Binding verification tests catch missing bindings | Additional test maintenance | Writing tests prevents "Target not instantiable" errors |

---

## Performance Considerations
Container resolution overhead is negligible for most applications (sub-millisecond per resolution). Singleton binding reduces object allocation for stateless services and improves performance under load. The container caches resolved singletons — no repeated construction cost. Contextual binding resolution is slightly slower than direct binding but negligible in practice. Service Provider registration runs once at application bootstrap — no per-request cost.

---

## Production Considerations
Service Providers run at container boot, before middleware — avoid loading sensitive configuration in `register()` that could be accessed before security middleware executes. Do not register third-party bindings based on untrusted input. Environment-specific bindings should not expose internal implementations to external callers. Verify that binding overrides (e.g., test environment bindings) cannot be exploited in production. Write binding verification tests for each port interface.

---

## Common Mistakes
1. **Binding not registered**: The classic "Target [Interface] is not instantiable" error — always add bindings to the Provider and write tests that verify resolution.
2. **Logic in `register()`**: Registering event listeners, config, or business logic in `register()` — this method is for bindings only.
3. **Binding in `boot()` instead of `register()`**: Bindings in `boot()` may not be available to providers that run earlier.
4. **Over-binding**: Creating interface abstractions for every class even when there is only one implementation and no swap expectation.
5. **Forgotten provider registration**: Creating a Service Provider class but not adding it to `config/app.php` — the provider silently never runs.

---

## Failure Modes
- **Missing binding**: Container throws `Target [Interface] is not instantiable` at runtime — only caught by integration tests or runtime errors
- **Wrong binding order**: Contextual bindings registered after the consuming class is already resolved — the binding has no effect
- **Singleton state leak**: Registering a stateful service as singleton causes cross-request state contamination in Octane
- **Environment mismatch**: Conditional binding that works in development but fails in production due to different environment detection

---

## Ecosystem Usage
Laravel's Service Container is the foundation — all framework services are registered via Service Providers. The `laravel-common` package provides base Service Provider patterns. Enterprise Laravel projects commonly create dedicated `DomainServiceProvider`, `InfrastructureServiceProvider`, and `ApplicationServiceProvider` to organize bindings by layer.

---

## Related Knowledge Units
### Prerequisites
- LAP-04 Dependency Rule
- Laravel Service Container
- Interface contracts

### Related Topics
- LAP-03 Hexagonal Architecture
- LAP-02 Clean Architecture
- SLP-13 Interface Contracts

### Advanced Follow-up Topics
- SLP-12 Service Binding Strategies
- Auto-discovery mechanics
- Package development providers

---

## Research Notes
Generate a dedicated `InfrastructureServiceProvider` for all Port-Adapter bindings. Always bind in `register()`, not `boot()`. Use `singleton()` for stateless services; use `bind()` for stateful services. Generate binding verification tests for each port interface. Keep `register()` methods pure — no business logic, no IO, no configuration.
