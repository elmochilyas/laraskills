# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** GRASP Patterns
**Knowledge Unit:** GRASP: Creator
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Assign creation responsibility to the class that has the data needed to create
- [ ] Apply rule: Use Factory (not Creator) when creation logic is complex or requires configuration
- [ ] Apply rule: Aggregate roots create their own child entities
- [ ] Apply rule: Prefer static factory methods over `new` for domain object construction
- [ ] Prevent anti-pattern: Creator Scattered
- [ ] Prevent anti-pattern: Wrong Creator Assignment
- [ ] Prevent anti-pattern: No Factory for Complex Creation

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Assign creation responsibility to the class that has the data needed to create
- [ ] Use Factory (not Creator) when creation logic is complex or requires configuration
- [ ] Aggregate roots create their own child entities
- [ ] Prefer static factory methods over `new` for domain object construction
- [ ] Evaluate: Creator vs Factory for object creation
- [ ] Evaluate: Aggregate root vs external service for child entity creation
- [ ] Evaluate: Static factory method vs constructor for domain object construction

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Assign creation responsibility to the class that has the data needed to create
- [ ] Follow rule: Use Factory (not Creator) when creation logic is complex or requires configuration
- [ ] Follow rule: Aggregate roots create their own child entities
- [ ] Follow rule: Prefer static factory methods over `new` for domain object construction

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
- [ ] Ensure: Creator assigns responsibility for creating instances of class A to class B that...
- [ ] Verify: Assign creation responsibility to the class that has the data needed to create
- [ ] Verify: Use Factory (not Creator) when creation logic is complex or requires configuration
- [ ] Verify: Aggregate roots create their own child entities
- [ ] Verify: Prefer static factory methods over `new` for domain object construction

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Assign creation responsibility to the class that has the data needed to create
- [ ] Apply: Use Factory (not Creator) when creation logic is complex or requires configuration
- [ ] Apply: Aggregate roots create their own child entities
- [ ] Apply: Prefer static factory methods over `new` for domain object construction

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Creator Scattered
- [ ] Prevent: Wrong Creator Assignment
- [ ] Prevent: No Factory for Complex Creation
- [ ] Prevent: Factory for Simple Creation
- [ ] Prevent: Creator Coupling
- [ ] Prevent: Constructor Doing Too Much

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
- Assign creation responsibility to the class that has the data needed to create
- Use Factory (not Creator) when creation logic is complex or requires configuration
- Aggregate roots create their own child entities
- Prefer static factory methods over `new` for domain object construction
## Anti-Patterns
- Creator Scattered
- Wrong Creator Assignment
- No Factory for Complex Creation
- Factory for Simple Creation
- Creator Coupling
- Constructor Doing Too Much
## Skills
- Apply the Creator GRASP Pattern


