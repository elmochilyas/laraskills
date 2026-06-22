# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** Package Decision Calibration
**Knowledge Unit:** Package Wrapper / Boundary Pattern
**Generated:** 2026-06-22
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Interface defined in `app/Contracts/` in business language
- [ ] Adapter class in `app/Infrastructure/` with vendor name in class name

---

# Architecture Checklist

- [ ] Interface segregation respected (one interface per external concern, not one god-interface)
- [ ] Directory structure follows Infrastructure separation pattern
- [ ] Container binding maps interface to adapter in a service provider
- [ ] Business logic classes depend on the interface, never on the adapter or vendor package

---

# Implementation Checklist

- [ ] Workflow step completed: Interface designed in business language (no vendor names in method signatures)
- [ ] Workflow step completed: Interface has 3-7 methods scoped to what the application actually uses
- [ ] Workflow step completed: Adapter class created in `App\Infrastructure\{Domain}\` with vendor name in class name
- [ ] Workflow step completed: Adapter return types are application DTOs or value objects, not vendor types
- [ ] Workflow step completed: Adapter translates vendor exceptions to application exceptions
- [ ] Workflow step completed: Container binding registered in a service provider
- [ ] Workflow step completed: Wrapper is NOT a 1:1 passthrough of the vendor API (business abstraction exists)

---

# Performance Checklist

- [ ] Wrapper overhead measured (one extra method call, <1μs — negligible)
- [ ] Interface method count kept small (3-7 methods) for easy implementation and testing
- [ ] Singleton binding used for high-throughput queue workers where container resolution cost matters

---

# Security Checklist

- [ ] Exception translation sanitizes vendor error messages (API keys, tokens stripped)
- [ ] Adapter is the only place that touches vendor credentials (API keys, webhook secrets)
- [ ] DTO sanitization at the boundary — never pass raw API responses upstream
- [ ] Business code never sees vendor credentials

---

# Reliability Checklist

- [ ] Failure addressed: Leaky abstraction (vendor types through interface):
- [ ] Failure addressed: Passthrough wrapper with zero abstraction:
- [ ] Failure addressed: Vendor exceptions propagating to business logic:
- [ ] Failure addressed: Retroactive wrapper retrofit crisis:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] Interface is defined in `app/Contracts/` in business language (no vendor names in method signatures)
- [ ] Interface has 3-7 methods scoped to what the application actually uses
- [ ] Adapter class is in `app/Infrastructure/` with vendor name in the class name
- [ ] Adapter return types are application DTOs/value objects, not vendor types
- [ ] Adapter translates vendor exceptions to application exceptions
- [ ] Container binding maps interface to adapter in a service provider
- [ ] Business logic classes depend on the interface, never on the adapter or vendor package
- [ ] Tests mock the interface, not the vendor package
- [ ] Wrapper is NOT a 1:1 passthrough of the vendor API
- [ ] Adapter tests verify vendor integration (HTTP fakes or test mode)

### Success Criteria
- [ ] Zero vendor class imports in business logic (controllers, services, actions)
- [ ] Zero vendor types returned from interface methods
- [ ] Zero vendor exceptions caught in business logic
- [ ] All external integrations wrapped behind application-owned interfaces

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: The universal gateway (one giant interface wrapping everything)
- [ ] Anti-pattern prevented: Wrapper-in-wrapper (wrapping a package that is itself a wrapper)
- [ ] Anti-pattern prevented: Test-only wrappers without architectural value
- [ ] Anti-pattern prevented: Wrapping framework-native features (Eloquent, Blade, routing)

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Vendor API version upgrade:
- [ ] Failure scenario handled: Provider switch (Stripe → Paddle):
- [ ] Failure scenario handled: Vendor outage / degraded mode:

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
