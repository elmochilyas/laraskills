# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Big Ball of Mud detection and remediation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Break the monolith at stable domain boundaries, not randomly
- [ ] Apply rule: Add a dependency analysis CI gate to prevent further mud growth
- [ ] Apply rule: Extract one module at a timeâ€”never attempt a big-bang rewrite
- [ ] Apply rule: First, stop the bleedingâ€”capstone the mess before cleaning it
- [ ] Prevent anti-pattern: Full Rewrite Attempt
- [ ] Prevent anti-pattern: Big Bang Refactoring
- [ ] Prevent anti-pattern: No Boundary Enforcement
- [ ] Dependency analysis identifies all circular dependencies
- [ ] Tangled code wrapped behind facade before refactoring
- [ ] CI gate prevents new cross-boundary violations
- [ ] Modules extracted one at a time, not big-bang
- [ ] Extraction follows domain boundaries, not technical layers

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Break the monolith at stable domain boundaries, not randomly
- [ ] Add a dependency analysis CI gate to prevent further mud growth
- [ ] Extract one module at a timeâ€”never attempt a big-bang rewrite
- [ ] First, stop the bleedingâ€”capstone the mess before cleaning it
- [ ] Maintain a clear and current visual map of the key dependencies
- [ ] Evaluate: Big Bang rewrite vs incremental extraction remediation strategy
- [ ] Evaluate: Which module to extract first from a Big Ball of Mud
- [ ] Evaluate: Facade wrapping vs full extraction for first remediation step

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Break the monolith at stable domain boundaries, not randomly
- [ ] Follow rule: Add a dependency analysis CI gate to prevent further mud growth
- [ ] Follow rule: Extract one module at a timeâ€”never attempt a big-bang rewrite
- [ ] Follow rule: First, stop the bleedingâ€”capstone the mess before cleaning it
- [ ] Follow rule: Maintain a clear and current visual map of the key dependencies
- [ ] - [ ] Dependency analysis identifies all circular dependencies
- [ ] - [ ] Tangled code wrapped behind facade before refactoring
- [ ] - [ ] CI gate prevents new cross-boundary violations
- [ ] - [ ] Modules extracted one at a time, not big-bang

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
- [ ] Ensure: Big Ball of Mud is a system with no recognizable architecture: tangled dependenc...
- [ ] Verify: Break the monolith at stable domain boundaries, not randomly
- [ ] Verify: Add a dependency analysis CI gate to prevent further mud growth
- [ ] Verify: Extract one module at a timeâ€”never attempt a big-bang rewrite
- [ ] Verify: First, stop the bleedingâ€”capstone the mess before cleaning it

# Testing Checklist
- [ ] Dependency analysis identifies all circular dependencies
- [ ] Tangled code wrapped behind facade before refactoring
- [ ] CI gate prevents new cross-boundary violations
- [ ] Modules extracted one at a time, not big-bang
- [ ] Extraction follows domain boundaries, not technical layers
- [ ] C4 diagram updated with each extraction

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Break the monolith at stable domain boundaries, not randomly
- [ ] Apply: Add a dependency analysis CI gate to prevent further mud growth
- [ ] Apply: Extract one module at a timeâ€”never attempt a big-bang rewrite
- [ ] Apply: First, stop the bleedingâ€”capstone the mess before cleaning it

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Full Rewrite Attempt
- [ ] Prevent: Big Bang Refactoring
- [ ] Prevent: No Boundary Enforcement
- [ ] Prevent: Perfectionism
- [ ] Prevent: No Metrics
- [ ] Prevent: Leadership Disinvestment

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
- Break the monolith at stable domain boundaries, not randomly
- Add a dependency analysis CI gate to prevent further mud growth
- Extract one module at a timeâ€”never attempt a big-bang rewrite
- First, stop the bleedingâ€”capstone the mess before cleaning it
- Maintain a clear and current visual map of the key dependencies
## Anti-Patterns
- Full Rewrite Attempt
- Big Bang Refactoring
- No Boundary Enforcement
- Perfectionism
- No Metrics
- Leadership Disinvestment
## Skills
- Detect and Remediate a Big Ball of Mud


