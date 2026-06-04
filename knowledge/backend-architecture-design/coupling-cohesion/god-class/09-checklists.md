# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** God class detection (Eloquent models as god objects)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Split any class whose single-responsibility description requires "and"
- [ ] Apply rule: Extract data groups from god classes into dedicated value objects or models
- [ ] Apply rule: Use the "why would this change?" test to identify god class boundaries
- [ ] Apply rule: Break god classes incrementally â€” Tease Apart Inheritance pattern
- [ ] Prevent anti-pattern: Eloquent God Model
- [ ] Prevent anti-pattern: Service God Class
- [ ] Prevent anti-pattern: Trait Accumulation
- [ ] God class identified by size, method count, or LCOM4
- [ ] Multiple change reasons documented
- [ ] Disjoint field groups extracted to separate classes
- [ ] Each extraction step preserves passing tests
- [ ] Delegation used instead of inheritance from god class

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Split any class whose single-responsibility description requires "and"
- [ ] Extract data groups from god classes into dedicated value objects or models
- [ ] Use the "why would this change?" test to identify god class boundaries
- [ ] Prefer delegation over inheritance when extracting from a god class
- [ ] Evaluate: God class detection triggers
- [ ] Evaluate: Extract method vs extract class refactoring approach
- [ ] Evaluate: Which responsibility to extract first from a god class

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Split any class whose single-responsibility description requires "and"
- [ ] Follow rule: Extract data groups from god classes into dedicated value objects or models
- [ ] Follow rule: Use the "why would this change?" test to identify god class boundaries
- [ ] Follow rule: Break god classes incrementally â€” Tease Apart Inheritance pattern
- [ ] Follow rule: Prefer delegation over inheritance when extracting from a god class
- [ ] - [ ] God class identified by size, method count, or LCOM4
- [ ] - [ ] Multiple change reasons documented
- [ ] - [ ] Disjoint field groups extracted to separate classes
- [ ] - [ ] Each extraction step preserves passing tests

# Performance Checklist
- **Overhead of abstraction**: Each layer of indirection adds method call overhead. In hot paths, minimize layer crossings.
- **Memory footprint**: Each architectural component (service, repository, interface) adds object graph size. Use lazy resolution where possible.
- **Initialization cost**: First-resolution overhead for container-managed components. Cache aggressively for production.
- **Serialization cost**: Cross-boundary communication requires serialization. Choose efficient formats (JSON vs binary) based on throughput needs.
- **Connection pooling**: Services communicating externally should reuse connections to avoid TCP handshake overhead.
- **Profiling**: Always measure before optimizing. Use Laravel Debugbar, Telescope, or Xdebug to identify real bottlenecks.

# Security Checklist
- **Input validation at boundaries**: Validate all data entering the domain layer, regardless of source (HTTP, queue, CLI)
- **Output sanitization**: Sanitize data leaving the domain for the presentation layer
- **Authentication/Authorization gates**: Apply security checks at architectural boundaries, not inside domain logic
- **Dependency isolation**: Anti-corruption layers prevent security vulnerabilities in third-party code from propagating
- **Event data leakage**: Ensure domain events don't expose sensitive data to unauthorized consumers
- **Command validation**: Validate commands before dispatch to prevent injection attacks
- **Rate limiting at entry points**: Apply throttling at architectural entry points (controllers, queue workers)

# Reliability Checklist
- [ ] Ensure: God class is a class that knows too much or does too much â€” accumulating respo...
- [ ] Verify: Split any class whose single-responsibility description requires "and"
- [ ] Verify: Extract data groups from god classes into dedicated value objects or models
- [ ] Verify: Use the "why would this change?" test to identify god class boundaries
- [ ] Verify: Break god classes incrementally â€” Tease Apart Inheritance pattern

# Testing Checklist
- [ ] God class identified by size, method count, or LCOM4
- [ ] Multiple change reasons documented
- [ ] Disjoint field groups extracted to separate classes
- [ ] Each extraction step preserves passing tests
- [ ] Delegation used instead of inheritance from god class
- [ ] Post-refactoring LCOM4 is 1 for each extracted class

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Split any class whose single-responsibility description requires "and"
- [ ] Apply: Extract data groups from god classes into dedicated value objects or models
- [ ] Apply: Use the "why would this change?" test to identify god class boundaries
- [ ] Apply: Break god classes incrementally â€” Tease Apart Inheritance pattern

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Eloquent God Model
- [ ] Prevent: Service God Class
- [ ] Prevent: Trait Accumulation
- [ ] Prevent: Accessor/Mutator Proliferation
- [ ] Prevent: Model Event Overload
- [ ] Prevent: Controller God Class

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Split any class whose single-responsibility description requires "and"
- Extract data groups from god classes into dedicated value objects or models
- Use the "why would this change?" test to identify god class boundaries
- Break god classes incrementally â€” Tease Apart Inheritance pattern
- Prefer delegation over inheritance when extracting from a god class
## Anti-Patterns
- Eloquent God Model
- Service God Class
- Trait Accumulation
- Accessor/Mutator Proliferation
- Model Event Overload
- Controller God Class
## Skills
- Detect and Refactor God Classes


