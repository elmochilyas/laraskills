# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Service boundaries in distributed systems
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: A service should own one complete business capability
- [ ] Apply rule: Each service is independently deployable
- [ ] Apply rule: Services communicate via well-defined APIs (sync) or events (async)
- [ ] Apply rule: Choose synchronous or async communication based on consistency needs
- [ ] Prevent anti-pattern: Shared Database Coupling**: Multiple services reading/writing to the same database, preventing independent deployment
- [ ] Prevent anti-pattern: Synchronous Chain**: Service A calls B calls C calls D, creating latency and cascading failures
- [ ] Prevent anti-pattern: 2PC Across Services**: Distributed transactions crossing service boundaries via two-phase commit

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] A service should own one complete business capability
- [ ] Services communicate via well-defined APIs (sync) or events (async)
- [ ] Choose synchronous or async communication based on consistency needs
- [ ] Evaluate: Boundary definition strategy â€” business capability vs DDD subdomain for services
- [ ] Evaluate: Communication pattern â€” sync (API) vs async (event) for service interactions
- [ ] Evaluate: Data ownership isolation â€” database per service vs shared database

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: A service should own one complete business capability
- [ ] Follow rule: Each service is independently deployable
- [ ] Follow rule: Services communicate via well-defined APIs (sync) or events (async)
- [ ] Follow rule: Choose synchronous or async communication based on consistency needs
- [ ] Follow rule: A service boundary failing should not cascade to other services

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
- [ ] Ensure: Service boundaries in distributed systems define the ownership scope of each ser...
- [ ] Verify: A service should own one complete business capability
- [ ] Verify: Each service is independently deployable
- [ ] Verify: Services communicate via well-defined APIs (sync) or events (async)
- [ ] Verify: Choose synchronous or async communication based on consistency needs

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: A service should own one complete business capability
- [ ] Apply: Each service is independently deployable
- [ ] Apply: Services communicate via well-defined APIs (sync) or events (async)
- [ ] Apply: Choose synchronous or async communication based on consistency needs

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Shared Database Coupling**: Multiple services reading/writing to the same database, preventing independent deployment
- [ ] Prevent: Synchronous Chain**: Service A calls B calls C calls D, creating latency and cascading failures
- [ ] Prevent: 2PC Across Services**: Distributed transactions crossing service boundaries via two-phase commit

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
- A service should own one complete business capability
- Each service is independently deployable
- Services communicate via well-defined APIs (sync) or events (async)
- Choose synchronous or async communication based on consistency needs
- A service boundary failing should not cascade to other services
## Anti-Patterns
- Shared Database Coupling**: Multiple services reading/writing to the same database, preventing independent deployment
- Synchronous Chain**: Service A calls B calls C calls D, creating latency and cascading failures
- 2PC Across Services**: Distributed transactions crossing service boundaries via two-phase commit
## Skills
- Design Service Boundaries in Distributed Systems


