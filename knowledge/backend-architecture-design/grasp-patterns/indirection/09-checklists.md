# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** GRASP Patterns
**Knowledge Unit:** GRASP: Indirection
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Introduce an intermediary when direct coupling between components is undesirable
- [ ] Apply rule: Use indirection where direct access would violate encapsulation or increase complexity
- [ ] Apply rule: Prefer interface-based indirection over class inheritance
- [ ] Apply rule: Don't over-indirectâ€”add intermediaries only when there's a proven need
- [ ] Prevent anti-pattern: Over-Indirection
- [ ] Prevent anti-pattern: Incomplete Indirection
- [ ] Prevent anti-pattern: Indirection Without Abstraction

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Introduce an intermediary when direct coupling between components is undesirable
- [ ] Use indirection where direct access would violate encapsulation or increase complexity
- [ ] Prefer interface-based indirection over class inheritance
- [ ] Don't over-indirectâ€”add intermediaries only when there's a proven need
- [ ] Evaluate: Direct coupling vs indirection via interface
- [ ] Evaluate: Indirection mechanism (interface, facade, adapter, mediator)
- [ ] Evaluate: Pre-emptive indirection vs refactor-to-indirection

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Introduce an intermediary when direct coupling between components is undesirable
- [ ] Follow rule: Use indirection where direct access would violate encapsulation or increase complexity
- [ ] Follow rule: Prefer interface-based indirection over class inheritance
- [ ] Follow rule: Don't over-indirectâ€”add intermediaries only when there's a proven need

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
- [ ] Ensure: Indirection assigns responsibility to an intermediate object to mediate between ...
- [ ] Verify: Introduce an intermediary when direct coupling between components is undesirable
- [ ] Verify: Use indirection where direct access would violate encapsulation or increase complexity
- [ ] Verify: Prefer interface-based indirection over class inheritance
- [ ] Verify: Don't over-indirectâ€”add intermediaries only when there's a proven need

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Introduce an intermediary when direct coupling between components is undesirable
- [ ] Apply: Use indirection where direct access would violate encapsulation or increase complexity
- [ ] Apply: Prefer interface-based indirection over class inheritance
- [ ] Apply: Don't over-indirectâ€”add intermediaries only when there's a proven need

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Over-Indirection
- [ ] Prevent: Incomplete Indirection
- [ ] Prevent: Indirection Without Abstraction
- [ ] Prevent: Performance Penalty
- [ ] Prevent: Hidden Indirection
- [ ] Prevent: Circular Indirection

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
- Introduce an intermediary when direct coupling between components is undesirable
- Use indirection where direct access would violate encapsulation or increase complexity
- Prefer interface-based indirection over class inheritance
- Don't over-indirectâ€”add intermediaries only when there's a proven need
## Anti-Patterns
- Over-Indirection
- Incomplete Indirection
- Indirection Without Abstraction
- Performance Penalty
- Hidden Indirection
- Circular Indirection
## Skills
- Apply the Indirection GRASP Pattern


