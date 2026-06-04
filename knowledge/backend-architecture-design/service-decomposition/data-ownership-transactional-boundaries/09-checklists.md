# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Data ownership and transactional boundaries
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Each bounded context owns its data schema and persistence entirely
- [ ] Apply rule: One transactional boundary per aggregate
- [ ] Apply rule: Use sagas for multi-aggregate workflows
- [ ] Apply rule: Prefer data duplication over cross-context queries
- [ ] Prevent anti-pattern: 2PC Across Services**: Distributed two-phase commit transactions crossing service boundaries
- [ ] Prevent anti-pattern: Shared Data Ownership**: Multiple services writing to the same table, causing data corruption
- [ ] Prevent anti-pattern: Query-Level Coupling**: Joining across service databases for performance convenience

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Each bounded context owns its data schema and persistence entirely
- [ ] One transactional boundary per aggregate
- [ ] Use sagas for multi-aggregate workflows
- [ ] Prefer data duplication over cross-context queries
- [ ] Document all cross-context data flows and ownership
- [ ] Evaluate: Data ownership â€” exclusive write vs shared database
- [ ] Evaluate: Cross-service consistency â€” saga vs distributed transaction
- [ ] Evaluate: Data duplication â€” eventual consistency cache vs live query

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Each bounded context owns its data schema and persistence entirely
- [ ] Follow rule: One transactional boundary per aggregate
- [ ] Follow rule: Use sagas for multi-aggregate workflows
- [ ] Follow rule: Prefer data duplication over cross-context queries
- [ ] Follow rule: Document all cross-context data flows and ownership

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
- [ ] Ensure: Data ownership defines which service has exclusive write access to specific data...
- [ ] Verify: Each bounded context owns its data schema and persistence entirely
- [ ] Verify: One transactional boundary per aggregate
- [ ] Verify: Use sagas for multi-aggregate workflows
- [ ] Verify: Prefer data duplication over cross-context queries

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Each bounded context owns its data schema and persistence entirely
- [ ] Apply: One transactional boundary per aggregate
- [ ] Apply: Use sagas for multi-aggregate workflows
- [ ] Apply: Prefer data duplication over cross-context queries

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: 2PC Across Services**: Distributed two-phase commit transactions crossing service boundaries
- [ ] Prevent: Shared Data Ownership**: Multiple services writing to the same table, causing data corruption
- [ ] Prevent: Query-Level Coupling**: Joining across service databases for performance convenience

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
- Each bounded context owns its data schema and persistence entirely
- One transactional boundary per aggregate
- Use sagas for multi-aggregate workflows
- Prefer data duplication over cross-context queries
- Document all cross-context data flows and ownership
## Anti-Patterns
- 2PC Across Services**: Distributed two-phase commit transactions crossing service boundaries
- Shared Data Ownership**: Multiple services writing to the same table, causing data corruption
- Query-Level Coupling**: Joining across service databases for performance convenience
## Skills
- Design Data Ownership and Transactional Boundaries


