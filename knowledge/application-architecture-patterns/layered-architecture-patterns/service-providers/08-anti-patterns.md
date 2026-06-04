# ECC Anti-Patterns — Service Providers for Interface Binding

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | Service Providers for Interface Binding |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. God Provider
2. Binding in Boot
3. Business Logic in Providers
4. Over-binding (Interface Explosion)
5. Forgotten Provider Registration
6. Provider as Service Locator

---

## Repository-Wide Anti-Patterns

- God Service Providers
- Business logic in providers
- Missing binding configuration
- Interface explosion
- Container usage as service locator

---

## Anti-Pattern 1: God Provider

### Category
Architecture | Code Organization

### Description
A single Service Provider (usually `AppServiceProvider`) that registers container bindings, configures event listeners, loads routes, registers middleware, publishes config, and performs bootstrap logic — all concerns mixed together.

### Why It Happens
The default `AppServiceProvider` is the first place developers put registration code. Over time, every concern ends up in this one provider. No one takes the time to split it.

### Warning Signs
- `AppServiceProvider` exceeds 200 lines
- Provider registers bindings AND events AND routes AND middleware
- Multiple developers edit the same provider
- Finding specific bindings requires scanning the entire file

### Preferred Alternative
Create focused providers per concern: `InfrastructureServiceProvider` for bindings, `EventServiceProvider` for events, `RouteServiceProvider` for routes, etc.

### Refactoring Strategy
1. Extract binding registrations to `InfrastructureServiceProvider`
2. Extract event registrations to `EventServiceProvider`
3. Extract middleware/routes to existing route providers
4. Register new providers in `config/app.php`
5. Remove extracted code from `AppServiceProvider`

### Related Rules
- Rule: Dedicated InfrastructureServiceProvider (LAP-09/05-rules.md)

---

## Anti-Pattern 2: Binding in Boot

### Category
Architecture | Service Container

### Description
Registering container bindings in the `boot()` method instead of `register()`. Bindings may not be available to all consumers, and the binding ordering becomes unpredictable.

### Why It Happens
Developers may not understand the difference between `register()` and `boot()`, or they need to access services or configuration that are only available in `boot()` and decide to register bindings there.

### Warning Signs
- `$this->app->bind(...)` or `$this->app->singleton(...)` calls in `boot()` method
- `Target [Interface] is not instantiable` errors that resolve when provider registration order changes
- Bindings that depend on other providers' registrations

### Preferred Alternative
All container bindings belong in `register()`. If a binding depends on configuration or services that are only available in `boot()`, use a factory closure in `register()` that defers resolution.

### Refactoring Strategy
1. Move all `bind()` and `singleton()` calls from `boot()` to `register()`
2. Replace environment-dependent configuration with factory closures in `register()`
3. Test that bindings resolve correctly

### Related Rules
- Rule: Bind in register(), Not boot() (LAP-09/05-rules.md)

---

## Anti-Pattern 3: Business Logic in Providers

### Category
Architecture | Bootstrap

### Description
Service Provider `register()` or `boot()` methods containing business logic, configuration validation, logging, database queries, or API calls.

### Why It Happens
Convenience — the provider is called during bootstrap, so it feels like a natural place to initialize services, validate configuration, or set up infrastructure.

### Warning Signs
- `Log::info()`, `Log::error()` calls in provider methods
- `Config::get()` with complex validation and fallback logic
- Database queries or API calls in provider methods
- Provider tests that require database or HTTP mocks

### Preferred Alternative
Providers should contain only wiring (bindings, event registrations). Initialization logic belongs in dedicated service classes called lazily when first needed, not eagerly during bootstrap.

### Refactoring Strategy
1. Identify business logic in provider methods
2. Extract initialization to dedicated service classes
3. Use deferred service providers for expensive initialization
4. Remove business logic from providers

### Related Rules
- Rule: No Business Logic in Providers (LAP-09/05-rules.md)

---

## Anti-Pattern 4: Over-binding (Interface Explosion)

### Category
Architecture | Abstraction

### Description
Creating an interface for every class and binding every interface in a Service Provider, regardless of whether the abstraction provides value. Every class has both an interface and a binding registration.

### Why It Happens
Dogmatic application of "program to an interface" without considering cost. Belief that every class must have an interface for testability, even when mocking concrete classes is simpler.

### Warning Signs
- Every service/class has a corresponding interface file
- Interface files contain no additional contracts beyond the implementation's public methods
- Bindings for interfaces that have exactly one implementation and no foreseeable alternative
- Developers create interface + implementation + binding as a ritual for every new class

### Preferred Alternative
Create interfaces only where the abstraction provides value: multiple implementations, testability benefit, or layer boundary enforcement. For simple classes, use concrete classes with auto-resolution.

### Refactoring Strategy
1. Identify interfaces with a single implementation and no abstraction value
2. Remove the interface
3. Remove the binding — use concrete class type hints
4. Update callers to use concrete class type hints

### Related Rules
- Rule: Automatic Binding for Common Patterns (LAP-09/05-rules.md)

---

## Anti-Pattern 5: Forgotten Provider Registration

### Category
Development Workflow

### Description
Creating a new Service Provider class but forgetting to register it in `config/app.php`. The provider is never loaded, bindings are never registered, and classes fail to resolve at runtime.

### Why It Happens
Easy to overlook the registration step. Laravel does not warn about unregistered providers. The error only appears when a binding is needed, often in production.

### Warning Signs
- `Target [Interface] is not instantiable` error for interfaces that should be bound
- New provider files exist but are not in `config/app.php`
- CI tests do not verify binding resolution

### Preferred Alternative
Add the provider to `config/app.php` immediately after creating it. Write a binding verification test that fails if a required binding is missing. Use a CI step that scans for unregistered providers.

### Refactoring Strategy
1. Add the provider class to `config/app.php` `providers` array
2. Write a test that resolves each port interface
3. Add CI validation for provider registration

### Related Rules
- Rule: Dedicated InfrastructureServiceProvider (LAP-09/05-rules.md)
