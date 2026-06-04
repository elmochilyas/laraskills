# Domain Model (Fowler) — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** Enterprise Patterns
- **Knowledge Unit:** Domain Model
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand OOP principles and DDD tactical patterns
- [ ] Know the distinction between Rich Domain Model and Anemic Domain Model
- [ ] Familiar with the Eloquent ActiveRecord vs clean domain model tradeoff

## Implementation Checklist
- [ ] Domain objects contain both data AND behavior (not just getters/setters)
- [ ] Business logic lives in domain model, not scattered in services
- [ ] Ubiquitous language used — code reflects business concepts
- [ ] Domain model is framework-agnostic (no extends Eloquent)
- [ ] Aggregate boundaries are correctly sized (not too large/small)
- [ ] Value objects used for immutable concepts
- [ ] Domain events capture meaningful business occurrences

## Verification Checklist
- [ ] No anemic domain model (services stealing all logic)
- [ ] Eloquent model is NOT the domain model (separate concerns)
- [ ] Domain layer has zero framework dependencies
- [ ] Repository interfaces defined in domain, implementations in infrastructure
- [ ] PHPStan layer enforcement rules active

## Security Checklist
- [ ] Input validation at domain boundaries
- [ ] Authorization gates at architectural boundaries
- [ ] Domain events don't leak sensitive data
- [ ] Anti-corruption layers isolate third-party vulnerabilities

## Performance Checklist
- [ ] More objects = more memory per request — measured and acceptable
- [ ] Object hydration from DB uses efficient mapping
- [ ] Lazy loading vs eager loading decisions documented
- [ ] Aggregate boundaries affect transaction size and locking

## Production Readiness Checklist
- [ ] Team understands and buys into Domain Model complexity
- [ ] Architecture Decision Records document key choices
- [ ] Automated architecture enforcement in CI
- [ ] Transition from Transaction Script planned incrementally

## Common Mistakes to Avoid
- [ ] Anemic Domain Model (getters/setters only, logic in services)
- [ ] Eloquent model as domain model AND persistence model (SRP violation)
- [ ] Domain model depending on framework (violates dependency rule)
- [ ] Overly complex aggregate boundaries (performance issues)
- [ ] No ubiquitous language (code doesn't reflect business concepts)
