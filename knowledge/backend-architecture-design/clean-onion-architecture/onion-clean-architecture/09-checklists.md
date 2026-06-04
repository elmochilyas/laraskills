# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Clean/Onion Architecture
**Knowledge Unit:** Onion Architecture / Clean Architecture dependency rule
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Dependencies point inward â€” domain core must never reference outer layers
- [ ] Apply rule: Define repository interfaces in the domain, implement them in infrastructure
- [ ] Apply rule: Outer circles must communicate via ports and adapters, not direct instantiation
- [ ] Apply rule: Keep domain entities pure and use application services for use-case orchestration
- [ ] Prevent anti-pattern: Inner Ring Depends on Framework
- [ ] Prevent anti-pattern: Use Case Calls Eloquent
- [ ] Prevent anti-pattern: Reversed Dependency Direction
- [ ] Domain core has zero imports from Laravel or any framework
- [ ] Repository interfaces defined in Domain, implementations in Infrastructure
- [ ] Application services depend only on ports, not concrete adapters
- [ ] All wiring happens in composition root (ServiceProvider)
- [ ] Domain tests run without database or HTTP

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Dependencies point inward â€” domain core must never reference outer layers
- [ ] Define repository interfaces in the domain, implement them in infrastructure
- [ ] Outer circles must communicate via ports and adapters, not direct instantiation
- [ ] Keep domain entities pure and use application services for use-case orchestration
- [ ] Place all DI container configuration in a single composition root
- [ ] Evaluate: Three rings vs four rings in Clean Architecture
- [ ] Evaluate: Where DTOs and request/response objects live
- [ ] Evaluate: Clean Architecture vs Hexagonal Architecture choice

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Dependencies point inward â€” domain core must never reference outer layers
- [ ] Follow rule: Define repository interfaces in the domain, implement them in infrastructure
- [ ] Follow rule: Outer circles must communicate via ports and adapters, not direct instantiation
- [ ] Follow rule: Keep domain entities pure and use application services for use-case orchestration
- [ ] Follow rule: Place all DI container configuration in a single composition root
- [ ] - [ ] Domain core has zero imports from Laravel or any framework
- [ ] - [ ] Repository interfaces defined in Domain, implementations in Infrastructure
- [ ] - [ ] Application services depend only on ports, not concrete adapters
- [ ] - [ ] All wiring happens in composition root (ServiceProvider)

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
- [ ] Ensure: Clean Architecture (and its precursor Onion Architecture) organizes code into co...
- [ ] Verify: Dependencies point inward â€” domain core must never reference outer layers
- [ ] Verify: Define repository interfaces in the domain, implement them in infrastructure
- [ ] Verify: Outer circles must communicate via ports and adapters, not direct instantiation
- [ ] Verify: Keep domain entities pure and use application services for use-case orchestration

# Testing Checklist
- [ ] Domain core has zero imports from Laravel or any framework
- [ ] Repository interfaces defined in Domain, implementations in Infrastructure
- [ ] Application services depend only on ports, not concrete adapters
- [ ] All wiring happens in composition root (ServiceProvider)
- [ ] Domain tests run without database or HTTP
- [ ] No `new` or `resolve` for adapters outside composition root

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Dependencies point inward â€” domain core must never reference outer layers
- [ ] Apply: Define repository interfaces in the domain, implement them in infrastructure
- [ ] Apply: Outer circles must communicate via ports and adapters, not direct instantiation
- [ ] Apply: Keep domain entities pure and use application services for use-case orchestration

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Inner Ring Depends on Framework
- [ ] Prevent: Use Case Calls Eloquent
- [ ] Prevent: Reversed Dependency Direction
- [ ] Prevent: Boundary Objects Coupled to Framework
- [ ] Prevent: Over-Compartmentalizing
- [ ] Prevent: Anemic Entities

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
- Dependencies point inward â€” domain core must never reference outer layers
- Define repository interfaces in the domain, implement them in infrastructure
- Outer circles must communicate via ports and adapters, not direct instantiation
- Keep domain entities pure and use application services for use-case orchestration
- Place all DI container configuration in a single composition root
## Anti-Patterns
- Inner Ring Depends on Framework
- Use Case Calls Eloquent
- Reversed Dependency Direction
- Boundary Objects Coupled to Framework
- Over-Compartmentalizing
- Anemic Entities
## Skills
- Design a Clean Architecture Application


