# Factory pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Creational Patterns
- **Knowledge Unit:** Factory
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Dependency Injection and Interface Segregation
- [ ] Know when the Service Container's auto-resolution is sufficient
- [ ] Familiar with the difference between Simple Factory and Factory Method

## Implementation Checklist
- [ ] Factory encapsulates object creation logic (no `new` in application code)
- [ ] Factory is single-responsibility (creates objects, doesn't validate/log/notify)
- [ ] Factory doesn't depend on HTTP request state (framework-agnostic)
- [ ] Factory returns interfaces/abstract types, not concrete classes
- [ ] Factory uses container for dependency resolution where appropriate

## Verification Checklist
- [ ] Factory does more than just `new ConcreteClass()` with no args (not unnecessary indirection)
- [ ] Factory doesn't do too much (validate, log, send notifications — SRP violation)
- [ ] Factory doesn't depend on request state (hidden coupling to HTTP)
- [ ] Factory is tested (doesn't break when dependencies change)
- [ ] Factory can be substituted for testing

## Security Checklist
- [ ] Factory doesn't create objects with unvalidated input
- [ ] Factory selection logic safe (not directly user-controllable)
- [ ] Created objects properly initialized (no security-relevant default values)

## Performance Checklist
- [ ] Factory construction overhead negligible compared to I/O
- [ ] Reflection-based factory (container auto-resolve): ~0.1-1ms first-call cost
- [ ] Explicit Factory (hard-coded `new`): zero reflection overhead
- [ ] For hot-path (1000+ req/s), prefer explicit Factory over reflection

## Production Readiness Checklist
- [ ] Factory used where construction requires runtime configuration
- [ ] Factory not overused (container auto-resolution works for most cases)
- [ ] Factory covered by unit tests
- [ ] Factory pattern consistent across the codebase

## Common Mistakes to Avoid
- [ ] Factory that just calls `new` on concrete class with no args (unnecessary indirection)
- [ ] Factory that does too much (validates input, logs, sends notifications — SRP violation)
- [ ] Factory that depends on request state (hidden coupling to HTTP context)
- [ ] Not testing the Factory (breaks when dependencies change)
