# Repository (Fowler) — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Repository
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Dependency Inversion Principle
- [ ] Know Interface Segregation Principle
- [ ] Familiar with the Eloquent ActiveRecord vs Repository debate in Laravel
- [ ] Know the difference between Repository and Data Mapper

## Implementation Checklist
- [ ] Repository interface defined in domain layer
- [ ] Repository implementation in infrastructure layer
- [ ] Repository methods return domain objects (not Eloquent models)
- [ ] Repository provides collection-style access (not query builder passthrough)
- [ ] Repository adds value beyond Eloquent wrapping (hides query complexity)
- [ ] Read-heavy operations consider separate read repository (CQRS)

## Verification Checklist
- [ ] Repository doesn't mirror Eloquent methods exactly (no unnecessary wrapping)
- [ ] Repository returns domain objects, not Eloquent models
- [ ] Not every model gets a repository (only where abstraction adds value)
- [ ] Repository return types are consistent (not conditional)
- [ ] Repository can be mocked for domain layer tests

## Security Checklist
- [ ] Repository methods apply authorization/scope filtering
- [ ] Repository doesn't expose unfiltered data access
- [ ] Input validation before repository calls

## Performance Checklist
- [ ] Repository adds mapping overhead — measured and acceptable
- [ ] Eloquent Repository evaluated (unnecessary if domain model IS Eloquent)
- [ ] Query optimization hidden by repository is documented
- [ ] Eager loading strategy exposed or sensible default provided

## Production Readiness Checklist
- [ ] Repository only used where abstraction justifies added complexity
- [ ] Team understands Repository pattern tradeoffs
- [ ] ADRs document the decision to use (or not use) Repository
- [ ] Performance impact assessed for read/write operations

## Common Mistakes to Avoid
- [ ] Repository that mirrors Eloquent methods exactly (no abstraction benefit)
- [ ] Repository returning Eloquent models (domain layer still coupled to Eloquent)
- [ ] Generic repository interface (PHP generics limitations)
- [ ] Repository for every model (unnecessary abstraction for every table)
- [ ] Repository methods returning different types conditionally (unpredictable)
