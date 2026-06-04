# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Modular monolith as starting architecture
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Modules must have clear, documented boundaries with controlled communication
- [ ] Apply rule: Enforce module boundaries with automated dependency analysis
- [ ] Apply rule: Modules should be extractable to microservices with minimal changes
- [ ] Apply rule: Use events for cross-module communication when eventual consistency is acceptable
- [ ] Prevent anti-pattern: Data-Level Coupling**: Modules sharing database tables, coupling at the persistence level
- [ ] Prevent anti-pattern: Model Leakage**: Modules importing each other's Eloquent models directly instead of using interfaces
- [ ] Prevent anti-pattern: Shared Kernel Sprawl**: The shared kernel growing to contain business logic, not just infrastructure utilities

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Modules must have clear, documented boundaries with controlled communication
- [ ] Enforce module boundaries with automated dependency analysis
- [ ] Modules should be extractable to microservices with minimal changes
- [ ] Use events for cross-module communication when eventual consistency is acceptable
- [ ] Start with a monolith and add modular boundaries as the system grows
- [ ] Evaluate: Module organization â€” domain-based vs layer-based structure
- [ ] Evaluate: Module communication â€” interface vs direct model access
- [ ] Evaluate: Module granularity â€” feature module vs domain module

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Modules must have clear, documented boundaries with controlled communication
- [ ] Follow rule: Enforce module boundaries with automated dependency analysis
- [ ] Follow rule: Modules should be extractable to microservices with minimal changes
- [ ] Follow rule: Use events for cross-module communication when eventual consistency is acceptable
- [ ] Follow rule: Start with a monolith and add modular boundaries as the system grows

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
- [ ] Ensure: Modular monolith starts as a single deployment unit but with clear module bounda...
- [ ] Verify: Modules must have clear, documented boundaries with controlled communication
- [ ] Verify: Enforce module boundaries with automated dependency analysis
- [ ] Verify: Modules should be extractable to microservices with minimal changes
- [ ] Verify: Use events for cross-module communication when eventual consistency is acceptable

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Modules must have clear, documented boundaries with controlled communication
- [ ] Apply: Enforce module boundaries with automated dependency analysis
- [ ] Apply: Modules should be extractable to microservices with minimal changes
- [ ] Apply: Use events for cross-module communication when eventual consistency is acceptable

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Data-Level Coupling**: Modules sharing database tables, coupling at the persistence level
- [ ] Prevent: Model Leakage**: Modules importing each other's Eloquent models directly instead of using interfaces
- [ ] Prevent: Shared Kernel Sprawl**: The shared kernel growing to contain business logic, not just infrastructure utilities

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
- Modules must have clear, documented boundaries with controlled communication
- Enforce module boundaries with automated dependency analysis
- Modules should be extractable to microservices with minimal changes
- Use events for cross-module communication when eventual consistency is acceptable
- Start with a monolith and add modular boundaries as the system grows
## Anti-Patterns
- Data-Level Coupling**: Modules sharing database tables, coupling at the persistence level
- Model Leakage**: Modules importing each other's Eloquent models directly instead of using interfaces
- Shared Kernel Sprawl**: The shared kernel growing to contain business logic, not just infrastructure utilities
## Skills
- Design a Modular Monolith as Starting Architecture


