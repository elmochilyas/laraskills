# Skill: Implement Full Controller-Service-Repository Flow

## Purpose
Build the full abstraction stack — controller delegates to service, service delegates to repository interface, repository encapsulates data access — for complex enterprise applications requiring centralized query logic, caching, and multi-tenancy.

## When To Use
- Multi-tenancy requiring automatic query scoping across all data access
- Data access needing centralized caching (decorator pattern at repository level)
- Applications planning to swap databases (Eloquent → MongoDB)
- Complex query logic warranting isolation from business logic
- Enterprise applications >100k LOC with strict data access governance

## When NOT To Use
- Simple CRUD applications — ceremony not justified
- When no realistic path to swapping data sources
- Small teams where overhead slows iteration
- For lookup tables, join tables, entities with no business logic

## Prerequisites
- Service class design
- Repository pattern understanding

## Inputs
- Entity query specifications
- Data access interface contracts

## Workflow
1. Create repository interface per entity defining data access contract — never return QueryBuilders
2. Implement repository interface with Eloquent — models, collections, or DTOs returned
3. Register interface bindings in dedicated service provider
4. Controllers must never call Eloquent directly — always through service
5. Services must never call Eloquent directly when repository exists — always through repository
6. Repositories must not contain business logic — pure data access only
7. Use criteria/query objects instead of too-fine repository methods
8. Test repository implementations against real database (SQLite in-memory)
9. Mock repository interfaces in service tests
10. Add repository abstractions only where they add value — not for every entity

## Validation Checklist
- [ ] Controllers never call Eloquent models directly
- [ ] Services never run raw queries or call Eloquent directly
- [ ] All data access mediated through repository interfaces
- [ ] Repository methods do not return QueryBuilders
- [ ] Repository interfaces registered in service provider
- [ ] Each layer has single, clear responsibility
- [ ] Ceremony justified by application complexity

## Common Failures
- Repository interface without multiple implementations — unnecessary ceremony
- Service using Eloquent directly — bypasses repository caching/scoping
- Repository returning QueryBuilder — lets callers add unscoped queries
- Repository method explosion — too-fine methods for every query variation

## Decision Points
- Interface vs concrete repository — interface for polymorphism, concrete for simplicity
- Full stack vs simplified — full for core domain entities, simplified for lookups
- Read/write separation — CQRS-light for different optimization needs
- Criteria object vs too-fine methods — criteria for complex, dedicated for primary lookups

## Performance Considerations
- Repository layer adds ~0.001ms per method call
- Interface resolution adds ~0.005ms container lookup
- Compared to database queries (1-50ms), overhead irrelevant
- Caching at repository level dramatically reduces database load

## Security Considerations
- Repository-level query scoping critical for multi-tenant data isolation
- Never return QueryBuilders — callers can add unscoped queries
- Repository caching must respect authorization — scope cache keys by user/tenant
- Write repositories should not expose soft-deleted records

## Related Rules
- Controllers Must Never Bypass The Service Layer
- Repository Methods Must Not Return QueryBuilders
- Services Must Never Call Eloquent Directly When Repositories Exist
- Register Repository Interface Bindings In A Service Provider
- Repositories Must Not Contain Business Logic
- Add Repository Abstractions Only Where They Add Value

## Related Skills
- Controller-DTO-Service Flow — the simpler flow this extends
- Repository Pattern Design — repository conventions
- Service Class Design — service patterns
- Repository vs Eloquent Decision — when to use this full stack

## Success Criteria
- Full abstraction stack followed for core domain entities
- No Eloquent calls in controllers or services
- Repository interfaces exist with proper bindings
- QueryBuilders never returned from repositories
- Criteria objects used instead of method explosion