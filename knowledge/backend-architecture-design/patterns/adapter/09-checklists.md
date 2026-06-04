# Adapter pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Structural Patterns
- **Knowledge Unit:** Adapter
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Interface Segregation and Dependency Injection
- [ ] Know Laravel's driver architecture (cache, queue, mail, filesystem)
- [ ] Familiar with anti-corruption layer pattern

## Implementation Checklist
- [ ] Adapter implements target interface expected by application
- [ ] Adapter wraps adaptee (third-party SDK, legacy class) via composition
- [ ] Adapter translates adaptee interface to target interface
- [ ] All return types adapted to application domain (not vendor types)
- [ ] Exceptions translated to application exception types
- [ ] Adapter placed in infrastructure layer (not domain)

## Verification Checklist
- [ ] Adapter doesn't leak vendor-specific exceptions
- [ ] Adapter doesn't do more than translation (no validation, logging, caching)
- [ ] Return types fully adapted (caller doesn't depend on vendor types)
- [ ] Adapter interface not modeled after one specific vendor
- [ ] Adapter is in infrastructure layer (not domain)
- [ ] New vendors can conform to same adapter interface

## Security Checklist
- [ ] Adapter doesn't expose vendor credentials
- [ ] Anti-corruption layer prevents third-party vulnerabilities
- [ ] Input validated before passing to adaptee
- [ ] Adapter handles vendor timeout/errors securely

## Performance Checklist
- [ ] Adapter method call overhead: negligible (single delegation)
- [ ] Translation of complex types measurable for bulk operations (100k+)
- [ ] Adapter instance cached (singleton in container) for stateless adapters
- [ ] Avoid creating new adapter instances per request for expensive SDK init

## Production Readiness Checklist
- [ ] Adapter has timeout configuration
- [ ] Adapter has retry strategy for transient failures
- [ ] Adapter covered by unit tests (mock adaptee)
- [ ] Adapter integration tested against real vendor (staging)

## Common Mistakes to Avoid
- [ ] Adapter that leaks vendor-specific exceptions (controller catches Stripe\Error)
- [ ] Adapter doing more than translation (validation, logging, caching — mixes responsibilities)
- [ ] Not adapting return types (caller still depends on vendor types)
- [ ] Adapter interface modeled after one specific vendor (new vendor can't conform)
- [ ] Adapter in domain layer (couples domain to infrastructure concern)
