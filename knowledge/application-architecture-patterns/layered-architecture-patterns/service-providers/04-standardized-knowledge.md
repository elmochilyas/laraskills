# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: Service Providers for Interface Binding
Knowledge Unit ID: LAP-09-service-providers
Difficulty Level: Intermediate
Category: Architecture | Dependency Injection
Last Updated: 2026-06-04

---

# Overview

Service Providers are Laravel's mechanism for registering bindings in the service container. In layered architecture — particularly Clean Architecture or Hexagonal — Service Providers bridge the gap between interfaces (ports defined in the Domain/Application layer) and implementations (adapters in the Infrastructure layer).

The core architectural pattern is Port-Adapter: the Domain defines what it needs (RepositoryInterface, PaymentGatewayInterface) and Infrastructure provides concrete implementations. Service Providers register the mapping so the container resolves interfaces to their implementations automatically.

This KU focuses on the architectural role of Service Providers in layer bridging, not on generic provider mechanics. The key insight: Service Providers are the composition root where layer boundaries are crossed through dependency injection, keeping Domain and Application layers free of infrastructure references.

---

# Core Concepts

**Port (Interface)**: A contract defined in the Domain or Application layer that specifies what the layer needs from outside. Examples: `InvoiceRepositoryInterface`, `PaymentGatewayInterface`.

**Adapter (Implementation)**: A concrete class in Infrastructure that implements a Port. Examples: `EloquentInvoiceRepository`, `StripePaymentGateway`.

**Composition Root**: The single location in an application where dependencies are wired together. In Laravel, this is Service Providers. The composition root ensures that no class creates its own dependencies.

**Binding**: The registration of an Interface-to-Implementation mapping in the container. `$this->app->bind(Interface::class, Implementation::class)`.

**Contextual Binding**: A binding that applies only to a specific class. Used when a class needs a different implementation than the default. `$this->app->when(ReportController::class)->needs(ReportGenerator::class)->give(PdfReportGenerator::class)`.

**Tagged Bindings**: Grouping multiple bindings with a tag for collective resolution. Used for event handlers, notification channels, etc.

---

# When To Use

- Port-Adapter pattern in Hexagonal/Clean Architecture where interfaces define layer boundaries
- Application code depends on interfaces rather than concrete classes — the container resolves the implementation
- Multiple implementations exist for the same interface (caching decorator, test mock, environment-specific adapter)
- Need centralized dependency registration in a single auditable location
- Conditional bindings based on environment (different payment gateways for dev/production)

---

# When NOT To Use

- Interface has only one implementation and no foreseeable alternative — the abstraction may be premature
- Flat MVC codebase with no Port-Adapter pattern — auto-discovery is simpler
- Simple facades or helper functions suffice — container binding adds ceremony without benefit
- Prototyping where speed is the priority — concrete classes are faster

---

# Best Practices

**Create a dedicated InfrastructureServiceProvider.** Keep all interface-to-implementation bindings in one place for auditability. Name it explicitly to communicate its purpose. Register it in `config/app.php`.

**Bind in `register()`, not `boot()`.** The `register()` method is for container bindings. The `boot()` method is for operations that run after all providers are registered (event listeners, routes, middleware). Binding in `boot()` is too late for some consumers.

**Use `singleton()` for stateless services.** Repositories, gateways, and services with no mutable state should be singletons to reduce object allocation. Use `bind()` for services that hold per-request state.

**Use contextual binding for class-specific implementations.** When `ReportController` needs `PdfReportGenerator` but `ReportCommand` needs `CsvReportGenerator`, use contextual binding rather than creating separate interfaces.

**Keep providers free of business logic.** The `register()` method should contain only binding declarations. No configuration reading, no logging initialization, no event registration, no business logic.

**Test binding correctness.** Write a test that verifies each Port interface resolves to its expected Adapter. This catches missing bindings before runtime.

---

# Architecture Guidelines

- Service Providers are Infrastructure-layer components. They reference Infrastructure implementations and register them for Domain/Application interfaces.
- The Domain and Application layers should never reference Service Providers or know about binding configuration.
- One binding per Port-Adapter pair. Use tagging only for grouped resolution.
- Environment-specific bindings (e.g., `StripePaymentGateway` in production, `FakePaymentGateway` in development) should be conditional in the provider.
- Auto-discovery is acceptable for simple Laravel-specific bindings (controllers, commands, events) but not for Domain port bindings — those should be explicit.

---

# Performance Considerations

- Container resolution overhead is negligible for most applications (sub-millisecond per resolution).
- Singleton binding reduces object allocation for stateless services and improves performance under load.
- The container caches resolved singletons — no repeated construction cost.
- Contextual binding resolution is slightly slower than direct binding but negligible in practice.
- Service Provider registration runs once at application bootstrap; no per-request cost.

---

# Security Considerations

- Service Providers run at container boot, before middleware. Avoid loading sensitive configuration in `register()` that could be accessed before security middleware executes.
- Do not register third-party bindings based on untrusted input in Service Providers.
- Environment-specific bindings should not expose internal implementations to external callers.
- Verify that binding overrides (e.g., test environment bindings) cannot be exploited in production.

---

# Common Mistakes

1. **Binding not registered.** The classic `Target [Interface] is not instantiable` error. Always add bindings to the Provider. Write tests that verify resolution.

2. **Logic in `register()`.** Registering event listeners, config, logging, or business logic in `register()`. This method is for bindings only. Use `boot()` for post-registration operations.

3. **Binding in `boot()` instead of `register()`.** Bindings in `boot()` may not be available to providers that run earlier. Use `register()` for bindings; `boot()` for after-all-providers operations.

4. **Over-binding.** Creating interface abstractions for every class, even when there is only one implementation and no swap expectation. Bindings should exist to provide value — testability, swappability, or abstraction.

5. **Forgotten provider registration.** Creating a Service Provider class but not adding it to `config/app.php`. The provider silently never runs, and bindings are never registered.

6. **Auto-discovery assumptions.** Assuming a provider is auto-discovered when it is not a package provider. Application providers must be explicitly registered.

---

# Anti-Patterns

- **God Provider**: A single provider that registers everything — bindings, events, routes, middleware, config. Split into focused providers by concern.
- **Binding in Boot**: Registering container bindings in `boot()` method instead of `register()` — causes ordering issues and unexpected behavior.
- **Interface Explosion**: Creating an interface for every class regardless of abstraction value — unnecessary ceremony.
- **Provider as Service Locator**: Using `app()->make()` in application code instead of constructor injection. Providers manage the container; application code should just inject.

---

# Examples

**InfrastructureServiceProvider:**
```php
class InfrastructureServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Repository bindings
        $this->app->singleton(
            InvoiceRepositoryInterface::class,
            EloquentInvoiceRepository::class,
        );
        $this->app->singleton(
            CustomerRepositoryInterface::class,
            EloquentCustomerRepository::class,
        );

        // Gateway bindings
        $this->app->singleton(
            PaymentGatewayInterface::class,
            StripePaymentGateway::class,
        );

        // Conditional binding based on environment
        if ($this->app->environment('local', 'testing')) {
            $this->app->singleton(
                PaymentGatewayInterface::class,
                FakePaymentGateway::class,
            );
        }

        // Contextual binding
        $this->app->when(InvoiceController::class)
            ->needs(ReportGeneratorInterface::class)
            ->give(PdfReportGenerator::class);
    }
}
```

**Binding Verification Test:**
```php
class ServiceProviderTest extends TestCase
{
    public function test_invoice_repository_resolves(): void
    {
        $repository = app(InvoiceRepositoryInterface::class);
        $this->assertInstanceOf(EloquentInvoiceRepository::class, $repository);
    }

    public function test_payment_gateway_resolves(): void
    {
        $gateway = app(PaymentGatewayInterface::class);
        $this->assertInstanceOf(StripePaymentGateway::class, $gateway);
    }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| LAP-04 Dependency Rule | LAP-03 Hexagonal Architecture | SLP-12 Service Binding Strategies |
| Laravel Service Container | LAP-02 Clean Architecture | Auto-discovery mechanics |
| Interface contracts | SLP-13 Interface Contracts | Package development providers |

---

# AI Agent Notes

- Generate a dedicated `InfrastructureServiceProvider` for all Port-Adapter bindings.
- Always bind in `register()`, not `boot()`.
- Use `singleton()` for stateless services; use `bind()` for stateful services.
- Generate binding verification tests for each port interface.
- Use contextual binding when a class needs a specific implementation different from the default.
- Keep `register()` methods pure — no business logic, no IO, no configuration.
