# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Strangler fig pattern for incremental decomposition
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Route new functionality to the new system without modifying the old
- [ ] Apply rule: One route at a timeâ€”never attempt multi-route interception simultaneously
- [ ] Apply rule: Make the interception layer stateless and transparent
- [ ] Apply rule: Keep both old and new systems running until the old is unused
- [ ] Prevent anti-pattern: Big Bang Strangling**: Attempting to replace too many features simultaneously, creating parallel work and coordination overhead
- [ ] Prevent anti-pattern: No Safety Net**: Migrating features without feature flags for rollback
- [ ] Prevent anti-pattern: Tightly Coupled Extraction**: Extracting features that are deeply coupled to legacy code, requiring massive rewrites

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Route new functionality to the new system without modifying the old
- [ ] One route at a timeâ€”never attempt multi-route interception simultaneously
- [ ] Make the interception layer stateless and transparent
- [ ] Evaluate: Extraction candidate selection â€” which feature to strangle first
- [ ] Evaluate: Extraction order â€” business value vs technical readiness
- [ ] Evaluate: Routing strategy â€” proxy routing vs feature flags

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Route new functionality to the new system without modifying the old
- [ ] Follow rule: One route at a timeâ€”never attempt multi-route interception simultaneously
- [ ] Follow rule: Make the interception layer stateless and transparent
- [ ] Follow rule: Keep both old and new systems running until the old is unused
- [ ] Follow rule: Run parallel validations before fully switching to the new system

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
- [ ] Ensure: Strangler Fig pattern incrementally replaces legacy functionality with new servi...
- [ ] Verify: Route new functionality to the new system without modifying the old
- [ ] Verify: One route at a timeâ€”never attempt multi-route interception simultaneously
- [ ] Verify: Make the interception layer stateless and transparent
- [ ] Verify: Keep both old and new systems running until the old is unused

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Route new functionality to the new system without modifying the old
- [ ] Apply: One route at a timeâ€”never attempt multi-route interception simultaneously
- [ ] Apply: Make the interception layer stateless and transparent
- [ ] Apply: Keep both old and new systems running until the old is unused

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Big Bang Strangling**: Attempting to replace too many features simultaneously, creating parallel work and coordination overhead
- [ ] Prevent: No Safety Net**: Migrating features without feature flags for rollback
- [ ] Prevent: Tightly Coupled Extraction**: Extracting features that are deeply coupled to legacy code, requiring massive rewrites

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
- Route new functionality to the new system without modifying the old
- One route at a timeâ€”never attempt multi-route interception simultaneously
- Make the interception layer stateless and transparent
- Keep both old and new systems running until the old is unused
- Run parallel validations before fully switching to the new system
## Anti-Patterns
- Big Bang Strangling**: Attempting to replace too many features simultaneously, creating parallel work and coordination overhead
- No Safety Net**: Migrating features without feature flags for rollback
- Tightly Coupled Extraction**: Extracting features that are deeply coupled to legacy code, requiring massive rewrites
## Skills
- Apply Strangler Fig Pattern for Incremental Decomposition


