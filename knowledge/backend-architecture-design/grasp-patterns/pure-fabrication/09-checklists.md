# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** GRASP Patterns
**Knowledge Unit:** GRASP: Pure Fabrication
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Introduce pure-fabrication classes to avoid low cohesion or high coupling in domain classes
- [ ] Apply rule: Name pure-fabrication classes by their role, not by the domain concept they serve
- [ ] Apply rule: Use Factories pure fabrications to handle complex object creation
- [ ] Apply rule: Pure-fabrication classes should not contain domain logic
- [ ] Prevent anti-pattern: No Pure Fabrication
- [ ] Prevent anti-pattern: Fabrication Overuse
- [ ] Prevent anti-pattern: Anemic Domain + Fat Services

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Introduce pure-fabrication classes to avoid low cohesion or high coupling in domain classes
- [ ] Name pure-fabrication classes by their role, not by the domain concept they serve
- [ ] Use Factories pure fabrications to handle complex object creation
- [ ] Pure-fabrication classes should not contain domain logic
- [ ] Don't fabricate unnecessarilyâ€”only introduce when cohesion/coupling demands it
- [ ] Evaluate: Domain class vs Pure Fabrication for a responsibility
- [ ] Evaluate: Naming strategy for fabricated classes
- [ ] Evaluate: Factory vs Repository vs Service for fabricated classes

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Introduce pure-fabrication classes to avoid low cohesion or high coupling in domain classes
- [ ] Follow rule: Name pure-fabrication classes by their role, not by the domain concept they serve
- [ ] Follow rule: Use Factories pure fabrications to handle complex object creation
- [ ] Follow rule: Pure-fabrication classes should not contain domain logic
- [ ] Follow rule: Don't fabricate unnecessarilyâ€”only introduce when cohesion/coupling demands it

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
- [ ] Ensure: Pure Fabrication assigns responsibility to a class that does NOT represent a dom...
- [ ] Verify: Introduce pure-fabrication classes to avoid low cohesion or high coupling in domain classes
- [ ] Verify: Name pure-fabrication classes by their role, not by the domain concept they serve
- [ ] Verify: Use Factories pure fabrications to handle complex object creation
- [ ] Verify: Pure-fabrication classes should not contain domain logic

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Introduce pure-fabrication classes to avoid low cohesion or high coupling in domain classes
- [ ] Apply: Name pure-fabrication classes by their role, not by the domain concept they serve
- [ ] Apply: Use Factories pure fabrications to handle complex object creation
- [ ] Apply: Pure-fabrication classes should not contain domain logic

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Pure Fabrication
- [ ] Prevent: Fabrication Overuse
- [ ] Prevent: Anemic Domain + Fat Services
- [ ] Prevent: Fabrication Naming
- [ ] Prevent: Fabrication with Too Many Responsibilities
- [ ] Prevent: Domain Logic in Fabrication

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
- Introduce pure-fabrication classes to avoid low cohesion or high coupling in domain classes
- Name pure-fabrication classes by their role, not by the domain concept they serve
- Use Factories pure fabrications to handle complex object creation
- Pure-fabrication classes should not contain domain logic
- Don't fabricate unnecessarilyâ€”only introduce when cohesion/coupling demands it
## Anti-Patterns
- No Pure Fabrication
- Fabrication Overuse
- Anemic Domain + Fat Services
- Fabrication Naming
- Fabrication with Too Many Responsibilities
- Domain Logic in Fabrication
## Skills
- Apply the Pure Fabrication GRASP Pattern


