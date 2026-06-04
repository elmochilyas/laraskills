# Facade pattern — Checklist

## Metadata
- **Domain:** Backend Architecture Design
- **Subdomain:** GoF Structural Patterns
- **Knowledge Unit:** Facade
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Understand Dependency Injection and Service Layer pattern
- [ ] Know the difference between GoF Facade and Laravel Facades
- [ ] Familiar with subsystem decomposition principles

## Implementation Checklist
- [ ] Facade provides simplified interface to complex subsystem
- [ ] Facade coordinates subsystem components (not just delegates all methods)
- [ ] Facade doesn't expose all subsystem methods (no simplification if it does)
- [ ] Single facade per subsystem (not multiple inconsistent access points)
- [ ] Facade is stateless (no mutable state causing side effects)
- [ ] Laravel Facades used judiciously (not scattered through business logic)

## Verification Checklist
- [ ] GoF Facade vs Laravel Facade distinction understood by team
- [ ] Facade doesn't expose all subsystem methods (just delegation, no simplification)
- [ ] Multiple facades don't exist for same subsystem (inconsistent)
- [ ] Facade has no mutable state (no side effect unpredictability)
- [ ] Facade not created for every class (no over-facading)

## Security Checklist
- [ ] Facade applies security checks at subsystem boundary
- [ ] Laravel Facades used for framework services (not custom domain services)
- [ ] Facade doesn't bypass security controls in subsystem

## Performance Checklist
- [ ] Single facade call vs N direct subsystem calls: negligible difference
- [ ] Laravel Facade: resolves service from container each call (unless singleton)
- [ ] Use `Facade::shouldReceive()` in tests — swaps underlying service
- [ ] No performance penalty for GoF Facade over direct subsystem calls

## Production Readiness Checklist
- [ ] Facade documented with clear responsibility
- [ ] Subsystem can be used without facade (facade is convenience, not requirement)
- [ ] Laravel Facade aliases configured correctly
- [ ] Facade covered by integration tests

## Common Mistakes to Avoid
- [ ] Confusing Laravel Facades with GoF Facade (they solve different problems)
- [ ] Facade that exposes all subsystem methods (no simplification, just delegation)
- [ ] Multiple facades for same subsystem (inconsistent access patterns)
- [ ] Facade with mutable state (side effect unpredictability)
- [ ] Over-facading: facade for every class (unnecessary indirection)
