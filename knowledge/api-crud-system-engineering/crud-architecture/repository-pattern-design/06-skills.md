# Skill: Design Repository Pattern

## Purpose
Implement the repository pattern as a data access abstraction that encapsulates Eloquent query logic behind an interface, providing centralized query handling, test seams, and optional caching.

## When To Use
- Complex query logic that should be centralized and reused
- Multi-tenancy requiring automatic query scoping
- Caching at the data access layer (decorator pattern)
- Applications where test seams at data access boundary are valuable
- Enterprise applications >100k LOC with strict data access governance

## When NOT To Use
- Simple CRUD entities with trivial query logic (find, create, update, delete only)
- Lookup tables and join tables with no query complexity
- Small applications where ceremony outweighs benefits
- When repository would just mirror Eloquent's API without adding value

## Prerequisites
- Eloquent query building
- Interface and dependency injection patterns

## Inputs
- Entity query specifications
- Data access requirements (caching, scoping, filtering)

## Workflow
1. Define repository interface with typed method signatures — never return QueryBuilders
2. Implement repository — encapsulate query logic, filtering, sorting, pagination, eager loading
3. Use criteria objects for complex queries instead of too-fine methods
4. Keep repositories pure data access — no business rules, event dispatching, or cross-entity orchestration
5. Register interface bindings in service provider
6. Only create interfaces when polymorphism is needed (multiple implementations, decorators, test stubs)
7. Test repository implementations against a real database (SQLite in-memory)
8. Mock repository interfaces in service tests
9. Consider CQRS-light separation for different query/command optimization needs

## Validation Checklist
- [ ] Repository methods do not return QueryBuilders
- [ ] Repository does not contain business rules or event dispatching
- [ ] Repository interface exists when multiple implementations needed
- [ ] Binding registered in service provider
- [ ] Criteria objects used instead of too-fine query methods
- [ ] Repository tested against real database
- [ ] Service tests mock the repository interface

## Common Failures
- Interface for every entity with single implementation — unnecessary ceremony
- Repository returning QueryBuilder — callers bypass scoping
- Repository performing business logic — email uniqueness checks in repository
- Repository method explosion — too-fine methods for every query

## Decision Points
- Interface vs concrete — interface for polymorphism, concrete for single implementation
- Criteria object vs dedicated methods — criteria for complex, dedicated for primary lookups
- Single repository vs read/write split — CQRS-light for different optimization needs

## Performance Considerations
- Repository method call ~0.001ms overhead; interface resolution ~0.005ms
- Compared to database queries (1-50ms), overhead irrelevant
- Repository-level caching dramatically reduces database load for reads
- Decorator pattern adds no measurable overhead

## Security Considerations
- Returning QueryBuilders allows unscoped queries — breaks tenant isolation
- Repository caching must respect data authorization — scope cache keys by user/tenant
- Write repositories should not expose soft-deleted records
- Multi-tenant scoping at repository ensures isolation always applied

## Related Rules
- Never Return QueryBuilders from Repository Methods
- Use Criteria Objects Instead of Too-Fine Repository Methods
- Only Add Interfaces When Polymorphism Is Needed
- Keep Repositories Pure Data Access — No Business Logic
- Test Repository Implementations Against a Real Database
- Mock Repository Interfaces in Service Tests

## Related Skills
- Controller-Service-Repository Flow — the full abstraction stack
- Repository vs Eloquent Decision — when to use this pattern
- Criteria/Query Object Pattern — advanced query encapsulation

## Success Criteria
- Repositories centralize all query logic for each entity
- No business logic lives inside repositories
- QueryBuilders never returned from repository methods
- Interface exists when polymorphism benefits the codebase
- Repository tests verify query logic against real database