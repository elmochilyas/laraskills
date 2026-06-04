# Data Mapper pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Data Mapper
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand persistence ignorance and Hexagonal Architecture
- [ ] Familiar with Active Record vs Data Mapper distinction
- [ ] Know Doctrine ORM or custom mapping layer basics
- [ ] Understand Identity Map and Unit of Work patterns

## Implementation Checklist
- [ ] Domain objects are pure PHP with no persistence logic
- [ ] Mapper layer handles all DB-to-object mapping
- [ ] Repository interfaces defined in domain layer
- [ ] Repository implementations in infrastructure layer
- [ ] Dependency rule respected: Infrastructure → Application → Domain
- [ ] Identity Map prevents duplicate in-memory objects
- [ ] Lazy loading configured for associations

## Verification Checklist
- [ ] Domain layer has zero framework dependencies
- [ ] PHPStan custom rules enforce layer boundaries
- [ ] Deptrac validates module-level dependency direction
- [ ] Mapping layer is independently testable
- [ ] No Eloquent/Active Record leaked into domain objects
- [ ] ADRs document architectural decisions

## Security Checklist
- [ ] Input validated at domain boundaries regardless of source
- [ ] Output sanitized leaving domain layer
- [ ] Security gates applied at architectural boundaries
- [ ] Domain events don't leak sensitive data

## Performance Checklist
- [ ] Object hydration overhead measured and acceptable
- [ ] Lazy loading vs eager loading decisions documented
- [ ] Batch operations use efficient SQL (not per-row mapping)
- [ ] Identity map memory usage monitored

## Production Readiness Checklist
- [ ] Data Mapper only used where complexity justifies it (not for simple CRUD)
- [ ] Team has dedicated infrastructure for mapping layer maintenance
- [ ] Architecture enforcement automated in CI
- [ ] Metrics (coupling, cohesion) tracked over time

## Common Mistakes to Avoid
- [ ] Data Mapper for every table (overengineering CRUD-only tables)
- [ ] Mapping leaks into domain objects (domain depends on mapping details)
- [ ] Not using Identity Map (duplicate objects for same DB row)
- [ ] Complex mapping for simple cases (unnecessary indirection)
- [ ] Mixing Data Mapper and Active Record in same project (inconsistent)
