# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** GRASP Patterns
**Knowledge Unit:** GRASP: High Cohesion
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Each class must have a single, well-defined responsibility
- [ ] Apply rule: Methods within a class should operate on the same set of fields
- [ ] Apply rule: Keep class size manageableâ€”fewer than 200 lines for domain objects
- [ ] Apply rule: Extract a class when you notice a group of methods operating on a subset of data
- [ ] Prevent anti-pattern: God Class / Low Cohesion
- [ ] Prevent anti-pattern: Utility Classes
- [ ] Prevent anti-pattern: False High Cohesion

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Each class must have a single, well-defined responsibility
- [ ] Methods within a class should operate on the same set of fields
- [ ] Extract a class when you notice a group of methods operating on a subset of data
- [ ] Evaluate: Merge vs split classes based on cohesion analysis
- [ ] Evaluate: Class size threshold for extraction
- [ ] Evaluate: Cohesion vs coupling tradeoff when splitting

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Each class must have a single, well-defined responsibility
- [ ] Follow rule: Methods within a class should operate on the same set of fields
- [ ] Follow rule: Keep class size manageableâ€”fewer than 200 lines for domain objects
- [ ] Follow rule: Extract a class when you notice a group of methods operating on a subset of data

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
- [ ] Ensure: High Cohesion keeps related responsibilities together within a class or module. ...
- [ ] Verify: Each class must have a single, well-defined responsibility
- [ ] Verify: Methods within a class should operate on the same set of fields
- [ ] Verify: Keep class size manageableâ€”fewer than 200 lines for domain objects
- [ ] Verify: Extract a class when you notice a group of methods operating on a subset of data

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Each class must have a single, well-defined responsibility
- [ ] Apply: Methods within a class should operate on the same set of fields
- [ ] Apply: Keep class size manageableâ€”fewer than 200 lines for domain objects
- [ ] Apply: Extract a class when you notice a group of methods operating on a subset of data

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: God Class / Low Cohesion
- [ ] Prevent: Utility Classes
- [ ] Prevent: False High Cohesion
- [ ] Prevent: Over-Splitting
- [ ] Prevent: Mixed Responsibility Model
- [ ] Prevent: No Cohesion Awareness

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
- Each class must have a single, well-defined responsibility
- Methods within a class should operate on the same set of fields
- Keep class size manageableâ€”fewer than 200 lines for domain objects
- Extract a class when you notice a group of methods operating on a subset of data
## Anti-Patterns
- God Class / Low Cohesion
- Utility Classes
- False High Cohesion
- Over-Splitting
- Mixed Responsibility Model
- No Cohesion Awareness
## Skills
- Apply the High Cohesion GRASP Pattern


