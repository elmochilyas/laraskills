# Skill: Classify Service as Application or Domain Service

## Purpose
To correctly categorize every service class as either an application service (orchestrating infrastructure) or a domain service (encapsulating pure business logic), ensuring clear architectural boundaries.

## When To Use
- When creating a new service class
- When reviewing existing services for architectural compliance
- When refactoring a mixed-responsibility service

## When NOT To Use
- Single-method operations destined to be actions (not services)
- CRUD pass-through that delegates directly to Eloquent

## Prerequisites
- Knowledge of service layer purpose
- Understanding of DDD layered architecture
- Existing 04-standardized-knowledge.md and 05-rules.md for this unit

## Inputs
- Service class to classify (code)
- List of its dependencies
- List of its method responsibilities

## Workflow
1. Identify each method's responsibility: does it implement a business rule/calculation, or does it coordinate infrastructure (repositories, DB, mail, queues)?
2. If the method contains domain logic (calculations, business rule enforcement, entity invariants), mark it as domain logic.
3. If the method only calls other services/actions, manages transactions, calls repositories/gateways, or handles HTTP coordination, mark it as orchestration.
4. Classify the service: if ALL methods are orchestration, it is an application service. If ALL methods are pure domain logic with no infrastructure dependencies, it is a domain service.
5. If the service mixes both (Rule 1 violation), extract domain logic into a new domain service and leave orchestration in the application service.
6. Verify domain services have zero dependencies on `Illuminate\*`, Eloquent, cache, mail, queues, or HTTP classes.
7. Verify application services delegate all business rules to domain services, entities, or value objects.

## Validation Checklist
- [ ] Domain services have NO infrastructure dependencies (no DB, Cache, Mail, Queue, Request)
- [ ] Application services contain NO business rules, calculations, or domain validation
- [ ] Domain services accept and return only domain types (entities, value objects, domain primitives)
- [ ] Application services orchestrate: call domain services, manage transactions, coordinate infrastructure
- [ ] Dependency direction is always Controller → Application Service → Domain Service
- [ ] Domain services are testable with `new` keyword — no framework boot required
- [ ] Application services may require framework boot or mocked dependencies for testing

## Common Failures
- Service that calculates domain logic AND calls repositories (mixed responsibility)
- Domain service injecting Eloquent models or Cache facade
- Application service implementing inline tax/discount calculations
- Domain service accepting raw arrays or Eloquent models as parameters

## Decision Points
- Does the logic operate on domain objects and represent a business rule? → Domain service
- Does the logic coordinate infrastructure and manage workflow? → Application service
- Is the service pure delegation with no business logic? → Eliminate it (Rule 6)

## Performance Considerations
- Domain services are lightweight and testable in microseconds
- Application services may need dependency injection container resolution, which adds minimal overhead
- No additional performance concerns when correctly separated

## Security Considerations
- Domain services should not have access to persistence — prevents data leakage
- Application services are the correct layer for authorization checks before domain operations

## Related Rules
- **Rule 1**: Distinguish Service Type by Role — every service must be explicitly categorized
- **Rule 2**: Application Services Must Not Contain Domain Logic
- **Rule 3**: Domain Services Must Not Depend on Infrastructure
- **Rule 4**: Domain Services Must Be Testable Without Framework Boot
- **Rule 5**: Domain Services Must Operate on Domain Objects
- **Rule 6**: Do Not Create Domain Services for CRUD Pass-Through
- **Rule 7**: Application Services Coordinate Infrastructure
- **Rule 8**: Application Services Must Not Be Injected into Domain Services
- **Rule 9**: Domain Services Should Be Stateless and Side-Effect-Free

## Related Skills
- Design Stateless Domain Service
- Refactor Mixed-Responsibility Service

## Success Criteria
- Every service in the codebase is clearly classified as application or domain
- No service mixes orchestration with domain computation
- Domain services are testable via `new` without framework boot
- Application services can be removed/replaced without changing domain logic
