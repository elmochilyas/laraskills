# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** GRASP Patterns
**Knowledge Unit:** GRASP: Information Expert
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Assign responsibility to the class that has the information needed to fulfill it
- [ ] Apply rule: Avoid "get-then-operate" patternsâ€”move the operation to the data holder
- [ ] Apply rule: Information Expert often conflicts with Low Couplingâ€”privilege the latter
- [ ] Apply rule: Disjoint experts for different operationsâ€”each operation has its own expert
- [ ] Prevent anti-pattern: Anemic Domain Model
- [ ] Prevent anti-pattern: Fat Model
- [ ] Prevent anti-pattern: Wrong Expert

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Assign responsibility to the class that has the information needed to fulfill it
- [ ] Avoid "get-then-operate" patternsâ€”move the operation to the data holder
- [ ] Information Expert often conflicts with Low Couplingâ€”privilege the latter
- [ ] Disjoint experts for different operationsâ€”each operation has its own expert
- [ ] Evaluate: Method on domain model vs domain service
- [ ] Evaluate: Information Expert vs Low Coupling when they conflict
- [ ] Evaluate: Anemic domain model vs rich domain model

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Assign responsibility to the class that has the information needed to fulfill it
- [ ] Follow rule: Avoid "get-then-operate" patternsâ€”move the operation to the data holder
- [ ] Follow rule: Information Expert often conflicts with Low Couplingâ€”privilege the latter
- [ ] Follow rule: Disjoint experts for different operationsâ€”each operation has its own expert

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
- [ ] Ensure: Information Expert assigns responsibility to the class that has the information ...
- [ ] Verify: Assign responsibility to the class that has the information needed to fulfill it
- [ ] Verify: Avoid "get-then-operate" patternsâ€”move the operation to the data holder
- [ ] Verify: Information Expert often conflicts with Low Couplingâ€”privilege the latter
- [ ] Verify: Disjoint experts for different operationsâ€”each operation has its own expert

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Assign responsibility to the class that has the information needed to fulfill it
- [ ] Apply: Avoid "get-then-operate" patternsâ€”move the operation to the data holder
- [ ] Apply: Information Expert often conflicts with Low Couplingâ€”privilege the latter
- [ ] Apply: Disjoint experts for different operationsâ€”each operation has its own expert

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Anemic Domain Model
- [ ] Prevent: Fat Model
- [ ] Prevent: Wrong Expert
- [ ] Prevent: Cross-Object Logic in Service
- [ ] Prevent: Data Class
- [ ] Prevent: Logic Duplication

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
- Assign responsibility to the class that has the information needed to fulfill it
- Avoid "get-then-operate" patternsâ€”move the operation to the data holder
- Information Expert often conflicts with Low Couplingâ€”privilege the latter
- Disjoint experts for different operationsâ€”each operation has its own expert
## Anti-Patterns
- Anemic Domain Model
- Fat Model
- Wrong Expert
- Cross-Object Logic in Service
- Data Class
- Logic Duplication
## Skills
- Apply the Information Expert GRASP Pattern


