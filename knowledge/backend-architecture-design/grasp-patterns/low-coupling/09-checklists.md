# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** GRASP Patterns
**Knowledge Unit:** GRASP: Low Coupling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Depend on abstractions (interfaces), not concrete classes
- [ ] Apply rule: Keep the number of dependencies per class low (â‰¤ 5 for services)
- [ ] Apply rule: Couple to stable, well-tested interfacesâ€”not volatile ones
- [ ] Apply rule: Use events to decouple components that don't need synchronous responses
- [ ] Prevent anti-pattern: Coupling via Global State
- [ ] Prevent anti-pattern: Content Coupling
- [ ] Prevent anti-pattern: High Efferent Coupling

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Depend on abstractions (interfaces), not concrete classes
- [ ] Keep the number of dependencies per class low (â‰¤ 5 for services)
- [ ] Couple to stable, well-tested interfacesâ€”not volatile ones
- [ ] Use events to decouple components that don't need synchronous responses
- [ ] Avoid circular dependencies at all costs
- [ ] Evaluate: Concrete class vs interface dependency
- [ ] Evaluate: Event-based decoupling vs direct call
- [ ] Evaluate: Acceptable dependency count per class

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Depend on abstractions (interfaces), not concrete classes
- [ ] Follow rule: Keep the number of dependencies per class low (â‰¤ 5 for services)
- [ ] Follow rule: Couple to stable, well-tested interfacesâ€”not volatile ones
- [ ] Follow rule: Use events to decouple components that don't need synchronous responses
- [ ] Follow rule: Avoid circular dependencies at all costs

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
- [ ] Ensure: Low Coupling assigns responsibilities to minimize the number and strength of dep...
- [ ] Verify: Depend on abstractions (interfaces), not concrete classes
- [ ] Verify: Keep the number of dependencies per class low (â‰¤ 5 for services)
- [ ] Verify: Couple to stable, well-tested interfacesâ€”not volatile ones
- [ ] Verify: Use events to decouple components that don't need synchronous responses

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Depend on abstractions (interfaces), not concrete classes
- [ ] Apply: Keep the number of dependencies per class low (â‰¤ 5 for services)
- [ ] Apply: Couple to stable, well-tested interfacesâ€”not volatile ones
- [ ] Apply: Use events to decouple components that don't need synchronous responses

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Coupling via Global State
- [ ] Prevent: Content Coupling
- [ ] Prevent: High Efferent Coupling
- [ ] Prevent: No Interface Boundaries
- [ ] Prevent: Circular Dependencies
- [ ] Prevent: Data Coupling Ignored

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
- Depend on abstractions (interfaces), not concrete classes
- Keep the number of dependencies per class low (â‰¤ 5 for services)
- Couple to stable, well-tested interfacesâ€”not volatile ones
- Use events to decouple components that don't need synchronous responses
- Avoid circular dependencies at all costs
## Anti-Patterns
- Coupling via Global State
- Content Coupling
- High Efferent Coupling
- No Interface Boundaries
- Circular Dependencies
- Data Coupling Ignored
## Skills
- Apply the Low Coupling GRASP Pattern


