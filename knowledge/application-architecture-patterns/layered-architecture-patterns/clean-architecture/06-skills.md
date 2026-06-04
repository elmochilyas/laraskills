# Skill: Apply Clean Architecture Layers (Domain, Application, Infrastructure, Presentation)

## Purpose
Organize code into four concentric layers per Clean Architecture: Domain (pure business entities), Application (use cases, DTOs), Infrastructure (Eloquent, external adapters), and Presentation (controllers), with strict inward-only Dependency Rule enforced via architecture tests.

## When To Use
- Business logic is complex enough to warrant framework independence
- Multiple delivery mechanisms exist (HTTP API, CLI, queue workers)
- Application has long expected lifespan (5+ years)
- Need to test business logic without Laravel bootstrapping
- Team size >10 engineers with architectural experience

## When NOT To Use
- Simple CRUD with straightforward business rules
- Small team with limited architectural experience
- Short-lived project (<3 years)
- Framework coupling isn't causing problems
- Team cannot commit to maintaining architectural discipline

## Prerequisites
- Understanding of the Dependency Rule and Port-Adapter pattern
- PHP 8.1+ for typed properties and readonly classes
- Pest for architecture test enforcement
- PSR-4 autoloading for multi-root namespace configuration

## Inputs
- Existing three-layer architecture codebase
- Identified Domain entities and business rules
- List of infrastructure concerns (database, queue, mail, APIs)
- Use case inventory

## Workflow
1. **Create the four-layer directory structure.** Set up `src/Domain/`, `src/Application/`, `src/Infrastructure/`, `src/Presentation/` with separate PSR-4 roots. Each layer has its own namespace and strict dependency rules.

2. **Build the Domain layer with pure PHP.** Create entities with business behavior, value objects with constructor validation, and domain services for multi-entity operations. Zero imports from `Illuminate\*` — use only PHP primitives and domain-defined types.

3. **Define port interfaces in the Application layer.** Create interfaces for repositories, event buses, and mailers that the Application layer needs. Infrastructure implements these interfaces.

4. **Implement use cases as single-method classes.** Each use case (`CreateInvoice`, `CancelInvoice`) has one public `execute()` method receiving a DTO. Use cases orchestrate domain objects, manage transactions, and return results.

5. **Create Infrastructure adapters.** Implement port interfaces using Eloquent, Laravel Mail, Queue, etc. Build explicit mappers to convert between Domain entities and Eloquent models.

6. **Bind ports to adapters in Service Providers.** Use Laravel's service container to wire `Interface::class` to `Concrete::class` in service providers — this is the composition root.

7. **Write architecture tests enforcing the Dependency Rule.** Domain allows zero external imports. Application imports only Domain. Infrastructure imports Application and Domain. Presentation imports Application and Domain.

## Validation Checklist
- [ ] Domain layer has zero imports from `Illuminate\` or other frameworks
- [ ] No Eloquent models exist in Domain or Application directories
- [ ] Application layer only depends on Domain (not Infrastructure or Presentation)
- [ ] Every Infrastructure class implements a port interface from Application
- [ ] Architecture tests enforce the Dependency Rule in CI
- [ ] Use case classes have single public method
- [ ] No framework helpers or Facades in Application layer
- [ ] Mappers exist for aggregate root entity conversion

## Common Failures
- **Eloquent models in Domain layer.** Keep Eloquent models in Infrastructure; map to/from domain entities.
- **Breaking the Dependency Rule.** Application imports `Illuminate\Http\Request` or `DB::`. Pass primitives or DTOs.
- **Over-mapping.** Domain entities identical to Eloquent models — reconsider if Clean Architecture is justified.
- **Architecture paralysis.** Spending excessive time on correct abstractions. Start with three-layer, migrate incrementally.

## Decision Points
- **Full independence vs Partial independence?** Full independence for fintech/healthcare; partial independence (Laravel DDD) for most apps.
- **Mapping layer yes/no?** Use explicit mappers only when domain entities significantly differ from database schema.

## Performance Considerations
- Method call overhead for interface dispatch, entity mapping, and DTO construction is negligible.
- High-throughput endpoints may see measurable overhead from mapping layers — profile before optimizing.
- Octane compatibility: all injected dependencies must be stateless.

## Security Considerations
- Domain layer should not handle authentication or authorization — those are infrastructure concerns.
- Application layer can check authorization via a port interface to an authorization service.

## Related Rules
- Rule: Domain Layer Must Be Pure PHP (LAP-02/05-rules.md)
- Rule: Apply Port-Adapter Pattern at Boundaries (LAP-02/05-rules.md)
- Rule: Bind Ports to Adapters in Service Providers (LAP-02/05-rules.md)
- Rule: Use Mappers for Domain-to-Eloquent Conversion (LAP-02/05-rules.md)
- Rule: Architecture Tests Enforce Dependency Rule (LAP-02/05-rules.md)
- Rule: Use Case Has Single Public Method (LAP-02/05-rules.md)
- Rule: Application Depends Only on Domain (LAP-02/05-rules.md)
- Rule: No Eloquent Models in Domain or Application (LAP-02/05-rules.md)
- Rule: No Framework Helpers in Application (LAP-02/05-rules.md)

## Related Skills
- Implement Three-Layer Architecture (LAP-01/06-skills.md)
- Apply Hexagonal Architecture Ports and Adapters (LAP-03/06-skills.md)
- Enforce the Dependency Rule (LAP-04/06-skills.md)
- Map Domain Entities to Eloquent Models (LAP-10/06-skills.md)
- Write Architecture Tests for Layer Boundaries (LAP-13/06-skills.md)

## Success Criteria
- Domain layer has zero framework dependencies and is testable without Laravel bootstrapping.
- Application use cases orchestrate domain objects without containing business rules.
- Infrastructure contains all framework-specific code behind port interfaces.
- Architecture tests fail if any layer violates the Dependency Rule.
