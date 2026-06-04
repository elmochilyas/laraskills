# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Clean/Onion Architecture
**Knowledge Unit:** Vertical Slice Architecture as emerging alternative
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Each vertical slice is autonomousâ€”no cross-slice sharing of models or services
- [ ] Apply rule: Slice by business capability, not by technical layer
- [ ] Apply rule: Use lightweight in-process messages (commands/queries) as slice boundaries
- [ ] Apply rule: Duplication within a slice is acceptable; duplication across slices requires shared infrastructure
- [ ] Prevent anti-pattern: Premature Abstraction
- [ ] Prevent anti-pattern: Slices Too Large
- [ ] Prevent anti-pattern: Cross-Slice Coupling
- [ ] Directories organized by feature, not by technical layer
- [ ] No slice imports models or services from another slice
- [ ] Each slice has its own tables or schema namespace
- [ ] Commands/queries used as explicit slice boundaries
- [ ] Inter-slice communication via events, not shared models

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Each vertical slice is autonomousâ€”no cross-slice sharing of models or services
- [ ] Slice by business capability, not by technical layer
- [ ] Use lightweight in-process messages (commands/queries) as slice boundaries
- [ ] Duplication within a slice is acceptable; duplication across slices requires shared infrastructure
- [ ] Each slice must have its own database tables or schema namespace
- [ ] Evaluate: Vertical Slices vs Layered Architecture choice per project
- [ ] Evaluate: What goes in Shared Kernel vs duplicated per slice
- [ ] Evaluate: Slice granularity â€” feature vs sub-feature vs operation

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Each vertical slice is autonomousâ€”no cross-slice sharing of models or services
- [ ] Follow rule: Slice by business capability, not by technical layer
- [ ] Follow rule: Use lightweight in-process messages (commands/queries) as slice boundaries
- [ ] Follow rule: Duplication within a slice is acceptable; duplication across slices requires shared infrastructure
- [ ] Follow rule: Each slice must have its own database tables or schema namespace
- [ ] - [ ] Directories organized by feature, not by technical layer
- [ ] - [ ] No slice imports models or services from another slice
- [ ] - [ ] Each slice has its own tables or schema namespace
- [ ] - [ ] Commands/queries used as explicit slice boundaries

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
- [ ] Ensure: Vertical Slice Architecture organizes code by feature/use case rather than by te...
- [ ] Verify: Each vertical slice is autonomousâ€”no cross-slice sharing of models or services
- [ ] Verify: Slice by business capability, not by technical layer
- [ ] Verify: Use lightweight in-process messages (commands/queries) as slice boundaries
- [ ] Verify: Duplication within a slice is acceptable; duplication across slices requires shared infrastructure

# Testing Checklist
- [ ] Directories organized by feature, not by technical layer
- [ ] No slice imports models or services from another slice
- [ ] Each slice has its own tables or schema namespace
- [ ] Commands/queries used as explicit slice boundaries
- [ ] Inter-slice communication via events, not shared models
- [ ] Shared Kernel is minimal and changes rarely

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Each vertical slice is autonomousâ€”no cross-slice sharing of models or services
- [ ] Apply: Slice by business capability, not by technical layer
- [ ] Apply: Use lightweight in-process messages (commands/queries) as slice boundaries
- [ ] Apply: Duplication within a slice is acceptable; duplication across slices requires shared infrastructure

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Premature Abstraction
- [ ] Prevent: Slices Too Large
- [ ] Prevent: Cross-Slice Coupling
- [ ] Prevent: No Shared Kernel
- [ ] Prevent: Anemic Slices
- [ ] Prevent: Inconsistent Slice Structure

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
- Each vertical slice is autonomousâ€”no cross-slice sharing of models or services
- Slice by business capability, not by technical layer
- Use lightweight in-process messages (commands/queries) as slice boundaries
- Duplication within a slice is acceptable; duplication across slices requires shared infrastructure
- Each slice must have its own database tables or schema namespace
## Anti-Patterns
- Premature Abstraction
- Slices Too Large
- Cross-Slice Coupling
- No Shared Kernel
- Anemic Slices
- Inconsistent Slice Structure
## Skills
- Implement Vertical Slice Architecture


