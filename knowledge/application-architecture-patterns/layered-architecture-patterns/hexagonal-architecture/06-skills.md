# Skill: Apply Hexagonal Architecture (Ports and Adapters)

## Purpose
Protect the core business logic from external concerns by defining port interfaces inside the core and implementing adapters outside, with all dependencies pointing inward through the interface boundary.

## When To Use
- Application has multiple external integrations (database, APIs, queues, file storage)
- Need to swap infrastructure without touching business logic
- External dependencies are unstable or change frequently
- Business logic must be testable in isolation from infrastructure

## When NOT To Use
- Simple application with one database and no external services
- Team size is small and codebase lifespan is short
- Port-Adapter indirection introduces unacceptable cognitive load for the team

## Prerequisites
- Understanding of interfaces, dependency injection, and PSR-4 namespacing
- Laravel service container for binding ports to adapters
- Pest for architecture boundary enforcement

## Inputs
- Identified ports (interfaces the core needs from the outside world)
- List of external/IO operations (repositories, gateways, buses, clients)
- Current inline external calls in business logic

## Workflow
1. **Identify external dependencies in current code.** Use grep for `DB::`, `Http::`, `Mail::`, `Queue::`, `Storage::`, and `new Client()` in business logic. Each external interaction is a candidate for a port interface.

2. **Define ports in the Application/Domain boundary layer.** Create interface definitions for each external concern (e.g., `InvoiceRepositoryInterface`, `PaymentGatewayInterface`). Ports are contracts declared by the core, owned by the core.

3. **Implement adapters in Infrastructure.** Build concrete adapter classes that implement each port interface using Laravel's implementation (Eloquent for repositories, Guzzle for HTTP APIs, etc.).

4. **Inject ports, not implementations.** Use constructor injection with interface type hints throughout business logic. Never reference concrete adapter classes in core code.

5. **Bind ports to adapters in Service Providers.** Register `Port::class => Adapter::class` bindings in a dedicated InfrastructureServiceProvider. This is the composition root.

6. **Abstract IO side effects for testability.** Wrap system calls (time, random, UUID) in interfaces with `SystemClockInterface`, `UuidGeneratorInterface`. This enables deterministic testing.

7. **Write architecture tests to prevent port bypass.** Use Pest architecture assertions: verify no concrete adapter classes are imported in Application or Domain, and no Facades/`DB::` calls exist in core layers.

## Validation Checklist
- [ ] Every external/IO operation has a corresponding port interface
- [ ] Business logic never references concrete adapter classes
- [ ] Adapter classes exist only in Infrastructure namespace
- [ ] Port interfaces are defined in/alongside Application or Domain
- [ ] Service Providers are the only place binding occurs
- [ ] Ports are logically owned by the core (not defined in Infrastructure)
- [ ] Core logic is testable with mocked adapters

## Common Failures
- **Ports defined in Infrastructure.** Port interfaces must be defined in or alongside the core code — adapters depend on ports, not the reverse.
- **Leaking adapter concerns into ports.** Port interfaces referencing Laravel-specific types or assuming implementation details.
- **Bypassing ports for convenience.** Calling `Model::find()` from core because writing a port seems like "too much boilerplate."
- **Anemic ports.** Port interfaces that mirror every Eloquent method instead of exposing domain-meaningful operations.

## Decision Points
- **Slim port vs Rich port?** Prefer domain-meaningful methods (`findInvoiceForPayment`) over generic CRUD (`find`, `save`, `delete`).
- **One port per adapter vs One port for many?** One port per adapter for clarity; merge only when adapters vary together.

## Performance Considerations
- Interface dispatch is a single PHP opcode — no performance difference.
- Adapter swapping may change performance characteristics (e.g., file vs cloud storage).
- Caching adapters can be wrapped in decorators following the same port interface.

## Security Considerations
- Authentication and authorization adapters follow the same Port-Adapter pattern.
- Input validation is a port concern; validate at the adapter boundary before passing to core.
- Secrets and credentials stay in adapter implementations, never referenced in port definitions.

## Related Rules
- Rule: Ports Are Defined in the Core Boundary (LAP-03/05-rules.md)
- Rule: Inject Ports, Not Implementations (LAP-03/05-rules.md)
- Rule: Bind Ports to Adapters in Service Providers (LAP-03/05-rules.md)
- Rule: Adapters Wrap External Dependencies (LAP-03/05-rules.md)
- Rule: Abstract IO Side Effects at Ports (LAP-03/05-rules.md)
- Rule: Architecture Tests Prevent Port Bypass (LAP-03/05-rules.md)
- Rule: One Port Per Adapter (LAP-03/05-rules.md)
- Rule: Port Must Not Leak Infrastructure Details (LAP-03/05-rules.md)
- Rule: Security Adapters Follow Port-Adapter (LAP-03/05-rules.md)

## Related Skills
- Apply Clean Architecture Layers (LAP-02/06-skills.md)
- Enforce the Dependency Rule (LAP-04/06-skills.md)
- Bind Interfaces to Implementations in Service Providers (LAP-09/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)

## Success Criteria
- All external dependencies are accessed through port interfaces defined in the core.
- No concrete adapter classes are imported in Application or Domain code.
- Architecture tests fail if any core code bypasses a port.
- Business logic is fully testable with mocked adapters without Laravel bootstrap.
