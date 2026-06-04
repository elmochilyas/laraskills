# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** GRASP Patterns
**Knowledge Unit:** GRASP: Creator, Controller, Low Coupling, High Cohesion
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: A Controller handles system events (UI input, external API calls) and delegates to the appropriate use case
- [ ] Apply rule: A Controller does not create the objects it delegates to â€” receive them via DI
- [ ] Apply rule: Keep Controllers thinâ€”less than 15 lines of logic excluding DI and validation
- [ ] Apply rule: One Controller per aggregate or use-case groupâ€”not per entity
- [ ] Prevent anti-pattern: Fat Controller
- [ ] Prevent anti-pattern: Controller as Only Entry Point
- [ ] Prevent anti-pattern: Controller Doing Multiple Use Cases

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] A Controller handles system events (UI input, external API calls) and delegates to the appropriate use case
- [ ] A Controller does not create the objects it delegates to â€” receive them via DI
- [ ] Keep Controllers thinâ€”less than 15 lines of logic excluding DI and validation
- [ ] One Controller per aggregate or use-case groupâ€”not per entity
- [ ] Evaluate: Thin vs fat controller for request handling
- [ ] Evaluate: One controller per aggregate vs per use case
- [ ] Evaluate: Depth of delegation â€” controller to service vs controller to command bus

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: A Controller handles system events (UI input, external API calls) and delegates to the appropriate use case
- [ ] Follow rule: A Controller does not create the objects it delegates to â€” receive them via DI
- [ ] Follow rule: Keep Controllers thinâ€”less than 15 lines of logic excluding DI and validation
- [ ] Follow rule: One Controller per aggregate or use-case groupâ€”not per entity

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
- [ ] Ensure: GRASP Creator, Controller, Low Coupling, and High Cohesion are responsibility as...
- [ ] Verify: A Controller handles system events (UI input, external API calls) and delegates to the appropriate use case
- [ ] Verify: A Controller does not create the objects it delegates to â€” receive them via DI
- [ ] Verify: Keep Controllers thinâ€”less than 15 lines of logic excluding DI and validation
- [ ] Verify: One Controller per aggregate or use-case groupâ€”not per entity

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: A Controller handles system events (UI input, external API calls) and delegates to the appropriate use case
- [ ] Apply: A Controller does not create the objects it delegates to â€” receive them via DI
- [ ] Apply: Keep Controllers thinâ€”less than 15 lines of logic excluding DI and validation
- [ ] Apply: One Controller per aggregate or use-case groupâ€”not per entity

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Fat Controller
- [ ] Prevent: Controller as Only Entry Point
- [ ] Prevent: Controller Doing Multiple Use Cases
- [ ] Prevent: Controller Coupled to Infrastructure
- [ ] Prevent: No Controller (Logic in Routes)
- [ ] Prevent: Controller View Logic

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
- A Controller handles system events (UI input, external API calls) and delegates to the appropriate use case
- A Controller does not create the objects it delegates to â€” receive them via DI
- Keep Controllers thinâ€”less than 15 lines of logic excluding DI and validation
- One Controller per aggregate or use-case groupâ€”not per entity
## Anti-Patterns
- Fat Controller
- Controller as Only Entry Point
- Controller Doing Multiple Use Cases
- Controller Coupled to Infrastructure
- No Controller (Logic in Routes)
- Controller View Logic
## Skills
- Apply the Controller GRASP Pattern


