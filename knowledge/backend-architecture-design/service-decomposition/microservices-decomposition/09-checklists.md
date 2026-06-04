# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Microservices decomposition threshold assessment
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Decompose into microservices by bounded context, not by technical layer
- [ ] Apply rule: Start with a monolith; extract microservices only when justified
- [ ] Apply rule: Each microservice must have its own database
- [ ] Apply rule: Prefer asynchronous communication between microservices
- [ ] Prevent anti-pattern: Microservices-First Fallacy**: Starting a new project with microservices before proving the monolith is insufficient
- [ ] Prevent anti-pattern: Distributed Monolith**: Services deployed separately but tightly coupled through shared database or synchronous call chains
- [ ] Prevent anti-pattern: Organizational Mismatch**: Service boundaries that don't align with team structures (Conway's Law violation)

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Decompose into microservices by bounded context, not by technical layer
- [ ] Start with a monolith; extract microservices only when justified
- [ ] Each microservice must have its own database
- [ ] Prefer asynchronous communication between microservices
- [ ] Evaluate: Monolith first vs start with microservices
- [ ] Evaluate: Extraction candidate â€” which module to extract first
- [ ] Evaluate: Extraction order â€” business value vs technical dependency

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Decompose into microservices by bounded context, not by technical layer
- [ ] Follow rule: Start with a monolith; extract microservices only when justified
- [ ] Follow rule: Each microservice must have its own database
- [ ] Follow rule: Prefer asynchronous communication between microservices
- [ ] Follow rule: Implement observability (logging, metrics, tracing) from day one

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
- [ ] Ensure: Microservices decomposition threshold identifies when a monolith should be split...
- [ ] Verify: Decompose into microservices by bounded context, not by technical layer
- [ ] Verify: Start with a monolith; extract microservices only when justified
- [ ] Verify: Each microservice must have its own database
- [ ] Verify: Prefer asynchronous communication between microservices

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Decompose into microservices by bounded context, not by technical layer
- [ ] Apply: Start with a monolith; extract microservices only when justified
- [ ] Apply: Each microservice must have its own database
- [ ] Apply: Prefer asynchronous communication between microservices

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Microservices-First Fallacy**: Starting a new project with microservices before proving the monolith is insufficient
- [ ] Prevent: Distributed Monolith**: Services deployed separately but tightly coupled through shared database or synchronous call chains
- [ ] Prevent: Organizational Mismatch**: Service boundaries that don't align with team structures (Conway's Law violation)

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
- Decompose into microservices by bounded context, not by technical layer
- Start with a monolith; extract microservices only when justified
- Each microservice must have its own database
- Prefer asynchronous communication between microservices
- Implement observability (logging, metrics, tracing) from day one
## Anti-Patterns
- Microservices-First Fallacy**: Starting a new project with microservices before proving the monolith is insufficient
- Distributed Monolith**: Services deployed separately but tightly coupled through shared database or synchronous call chains
- Organizational Mismatch**: Service boundaries that don't align with team structures (Conway's Law violation)
## Skills
- Assess Microservices Decomposition Threshold


