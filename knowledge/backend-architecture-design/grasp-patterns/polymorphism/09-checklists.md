# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** GRASP Patterns
**Knowledge Unit:** GRASP: Polymorphism, Pure Fabrication, Indirection, Protected Variations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use polymorphism to handle behavioral variations, not conditionals
- [ ] Apply rule: Define interfaces with behavior, not type markers
- [ ] Apply rule: Favor Strategy pattern over inheritance for polymorphic behavior
- [ ] Apply rule: Test behavior through the interface, not implementation details
- [ ] Prevent anti-pattern: Switch/Case Over Polymorphism
- [ ] Prevent anti-pattern: Premature Polymorphism
- [ ] Prevent anti-pattern: Polymorphism Without Behavior Variation

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Use polymorphism to handle behavioral variations, not conditionals
- [ ] Define interfaces with behavior, not type markers
- [ ] Favor Strategy pattern over inheritance for polymorphic behavior
- [ ] Evaluate: Polymorphism vs conditional logic for behavioral variation
- [ ] Evaluate: Strategy pattern via interface vs inheritance
- [ ] Evaluate: Runtime polymorphism vs compile-time generics

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use polymorphism to handle behavioral variations, not conditionals
- [ ] Follow rule: Define interfaces with behavior, not type markers
- [ ] Follow rule: Favor Strategy pattern over inheritance for polymorphic behavior
- [ ] Follow rule: Test behavior through the interface, not implementation details

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
- [ ] Ensure: These four GRASP patterns handle variation and indirection in object design. Pol...
- [ ] Verify: Use polymorphism to handle behavioral variations, not conditionals
- [ ] Verify: Define interfaces with behavior, not type markers
- [ ] Verify: Favor Strategy pattern over inheritance for polymorphic behavior
- [ ] Verify: Test behavior through the interface, not implementation details

# Testing Checklist
- [ ] Test behavior through the interface, not implementation details

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use polymorphism to handle behavioral variations, not conditionals
- [ ] Apply: Define interfaces with behavior, not type markers
- [ ] Apply: Favor Strategy pattern over inheritance for polymorphic behavior
- [ ] Apply: Test behavior through the interface, not implementation details

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Switch/Case Over Polymorphism
- [ ] Prevent: Premature Polymorphism
- [ ] Prevent: Polymorphism Without Behavior Variation
- [ ] Prevent: Deep Inheritance Hierarchies
- [ ] Prevent: Type Testing
- [ ] Prevent: God Interface

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
- Use polymorphism to handle behavioral variations, not conditionals
- Define interfaces with behavior, not type markers
- Favor Strategy pattern over inheritance for polymorphic behavior
- Test behavior through the interface, not implementation details
## Anti-Patterns
- Switch/Case Over Polymorphism
- Premature Polymorphism
- Polymorphism Without Behavior Variation
- Deep Inheritance Hierarchies
- Type Testing
- God Interface
## Skills
- Apply the Polymorphism GRASP Pattern


