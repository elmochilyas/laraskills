# Abstract Factory pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Creational Patterns
- **Knowledge Unit:** Abstract Factory
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Factory pattern and Interface Segregation Principle
- [ ] Familiar with Laravel Manager classes (Cache, Queue, Mail, Filesystem)
- [ ] Know driver-based architecture in Laravel

## Implementation Checklist
- [ ] Abstract Factory interface defined for creating families of related objects
- [ ] Each concrete factory creates objects for one family (e.g., StripeFactory, PayPalFactory)
- [ ] Factory selection logic uses configuration (not hard-coded class names)
- [ ] Concrete factories are stateless (no shared state across family creation)
- [ ] Factory interface follows ISP (doesn't grow with every new product)
- [ ] Resolved drivers cached per request to avoid repeated factory invocation

## Verification Checklist
- [ ] Factory interface doesn't violate ISP (not too many methods)
- [ ] Concrete factories have no shared state (no side effects)
- [ ] Factory selection path is tested (not just individual factories)
- [ ] Factory can be mocked in tests
- [ ] New product families can be added without changing existing code

## Security Checklist
- [ ] Factory selection doesn't accept user input directly
- [ ] Anti-corruption layers prevent third-party vulnerabilities
- [ ] Credentials managed securely (not hard-coded in factories)
- [ ] Rate limiting at factory entry points for driver creation

## Performance Checklist
- [ ] Factory resolution overhead negligible (array lookup + closure call)
- [ ] Driver creation cost depends on type (DB expensive, filesystem cheap)
- [ ] Cache resolved drivers per request
- [ ] Long-running processes: factory closures in memory; avoid capturing large scopes

## Production Readiness Checklist
- [ ] Abstract Factory only used for multiple product families
- [ ] Driver configuration documented for operations team
- [ ] Factory selection tested in CI
- [ ] Monitoring on driver creation frequency

## Common Mistakes to Avoid
- [ ] Abstract Factory interface that grows with every new product (violates ISP)
- [ ] Concrete factories with shared state (side effects across family creation)
- [ ] Factory selection logic with hard-coded class names (not config-driven)
- [ ] Not testing the factory selection path (wrong driver used in production)
