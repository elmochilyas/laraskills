# Skill: Bind Interfaces to Implementations in Service Providers

## Purpose
Register interface-to-implementation bindings in dedicated Service Providers so that Laravel's container resolves dependencies by contract, enabling adapter swapping and testability without changing business logic.

## When To Use
- Port-Adapter pattern in Hexagonal/Clean Architecture
- Application code depends on interfaces rather than concrete classes
- Multiple implementations exist for the same interface (caching decorator, test mock)
- Need centralized dependency registration

## When NOT To Use
- Interface has only one implementation and no foreseeable alternative
- Flat MVC codebase with no Port-Adapter pattern
- Simple facades or helper functions suffice

## Prerequisites
- Defined interfaces (ports) and implementations (adapters)
- Understanding of Laravel service container
- Application/Infrastructure layer separation

## Inputs
- List of Interface → Implementation pairs
- Binding context (singleton, scoped, tagged)
- Conditional binding requirements (environment-specific)

## Workflow
1. **Create a dedicated InfrastructureServiceProvider.** Generate with `php artisan make:provider InfrastructureServiceProvider`. Keep all interface-to-implementation bindings in one place for auditability.

2. **Register bindings in `register()` method.** Use `$this->app->bind(Interface::class, Concrete::class)` for instance-per-request or `$this->app->singleton(...)` for shared instances. Add tagged bindings where grouping is needed with `$this->app->tag(...)`.

3. **Bind with context where appropriate.** Use contextual binding for specific classes needing different implementations. Example: `$this->app->when(ReportController::class)->needs(ReportGenerator::class)->give(PdfReportGenerator::class)`.

4. **Register the provider in `config/app.php`.** Add the Service Provider to the `'providers'` array. Order matters when providers depend on each other.

5. **Use interfaces in constructor injection.** Application code should type-hint the interface, not the concrete class. The container resolves through the binding.

6. **Implement conditional bindings for environments.** Use `$this->app->environment()` checks in `register()` for environment-specific bindings (e.g., mail driver, queue driver).

7. **Avoid registration of complex logic in service providers.** Keep `register()` as simple assignment — no bootstrapping, no configuration reading, no IO. Use `boot()` only for event listeners and routes.

## Validation Checklist
- [ ] Each port interface has a corresponding adapter binding
- [ ] Bindings are registered in `register()`, not `boot()`
- [ ] No constructor injection of interfaces without bindings
- [ ] Contextual bindings are used where appropriate
- [ ] Provider is registered in `config/app.php`
- [ ] Singletons are used only for stateless services
- [ ] No business logic exists in Provider methods

## Common Failures
- **Binding not registered.** `Target [Interface] is not instantiable` — always add bindings to the Provider.
- **Logic in service providers.** Registering event listeners, config, or logging in `register()`. Keep `register()` for bindings only.
- **Binding in `boot()` instead of `register()`.** Use `register()` for container bindings; `boot()` for after-all-providers-are-loaded operations.
- **Over-binding.** Binding every interface even when there's only one implementation and no swap expectation. Bind only where abstraction provides value.
- **Forgotten provider registration.** Creating a provider but not adding it to `config/app.php`. Provider silently doesn't run.

## Decision Points
- **bind vs singleton?** Use `singleton()` for stateless services (repositories, gateways, services with no mutable state). Use `bind()` for stateful services.
- **Tagged vs individual bindings?** Tags for grouping (collecting all event handlers); individual for direct resolution.
- **Automatic vs Manual binding?** Use auto-discovery for common patterns; manual binding for explicit control over resolution.

## Performance Considerations
- Container resolution overhead is negligible for most applications.
- Using `singleton()` reduces object allocation for stateless services.
- The container caches resolved singletons — no repeated construction cost.

## Security Considerations
- Service Providers run at container boot — avoid loading sensitive configuration that triggers before security middleware.
- Do NOT register third-party bindings based on untrusted input.
- Environment-specific bindings should not expose internal implementations to external callers.

## Related Rules
- Rule: Bind in register(), Not boot() (LAP-09/05-rules.md)
- Rule: Dedicated InfrastructureServiceProvider (LAP-09/05-rules.md)
- Rule: Use Contextual Binding for Specific Classes (LAP-09/05-rules.md)
- Rule: Interface Type Hints in Constructors (LAP-09/05-rules.md)
- Rule: No Business Logic in Providers (LAP-09/05-rules.md)
- Rule: Automatic Binding for Common Patterns (LAP-09/05-rules.md)

## Related Skills
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)
- Configure PSR-4 Autoloading for Multi-Layer Projects (LAP-05/06-skills.md)

## Success Criteria
- All port interfaces have corresponding adapter bindings in a central Service Provider.
- `Target is not instantiable` errors no longer occur for port interfaces.
- Application code depends on interfaces only, resolved by the container.
- Provider `register()` method contains only binding declarations, no business logic.
