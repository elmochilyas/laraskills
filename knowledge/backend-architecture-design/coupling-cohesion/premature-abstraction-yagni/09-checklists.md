# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Premature abstraction and YAGNI violations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Add abstraction only when a clear, concrete need for the second implementation exists
- [ ] Apply rule: Prove an abstraction's value by showing concrete before/after metrics
- [ ] Apply rule: Prefer duplication over the wrong abstraction
- [ ] Apply rule: Wait for the third occurrence before extracting a generic solution
- [ ] Prevent anti-pattern: Interface for Single Implementation
- [ ] Prevent anti-pattern: Repository for Every Model
- [ ] Prevent anti-pattern: Factory for Every Object
- [ ] Abstraction solves a current, not future, problem
- [ ] At least two implementations exist (or one confirmed upcoming)
- [ ] Before/after metrics demonstrate improvement
- [ ] Rule of three applied: third occurrence confirmed the pattern
- [ ] Single-implementation abstractions have a removal plan

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Add abstraction only when a clear, concrete need for the second implementation exists
- [ ] Prove an abstraction's value by showing concrete before/after metrics
- [ ] Prefer duplication over the wrong abstraction
- [ ] Wait for the third occurrence before extracting a generic solution
- [ ] Evaluate: Abstract now vs wait for second implementation
- [ ] Evaluate: Accept duplication vs extract shared abstraction
- [ ] Evaluate: Repository pattern for every model vs selective application

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Add abstraction only when a clear, concrete need for the second implementation exists
- [ ] Follow rule: Prove an abstraction's value by showing concrete before/after metrics
- [ ] Follow rule: Prefer duplication over the wrong abstraction
- [ ] Follow rule: Wait for the third occurrence before extracting a generic solution
- [ ] Follow rule: Remove an abstraction that is no longer pulling its weight
- [ ] - [ ] Abstraction solves a current, not future, problem
- [ ] - [ ] At least two implementations exist (or one confirmed upcoming)
- [ ] - [ ] Before/after metrics demonstrate improvement
- [ ] - [ ] Rule of three applied: third occurrence confirmed the pattern

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
- [ ] Ensure: Premature abstraction creates interfaces, patterns, and indirection layers befor...
- [ ] Verify: Add abstraction only when a clear, concrete need for the second implementation exists
- [ ] Verify: Prove an abstraction's value by showing concrete before/after metrics
- [ ] Verify: Prefer duplication over the wrong abstraction
- [ ] Verify: Wait for the third occurrence before extracting a generic solution

# Testing Checklist
- [ ] Abstraction solves a current, not future, problem
- [ ] At least two implementations exist (or one confirmed upcoming)
- [ ] Before/after metrics demonstrate improvement
- [ ] Rule of three applied: third occurrence confirmed the pattern
- [ ] Single-implementation abstractions have a removal plan
- [ ] Duplication accepted when abstraction would be incorrect

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Add abstraction only when a clear, concrete need for the second implementation exists
- [ ] Apply: Prove an abstraction's value by showing concrete before/after metrics
- [ ] Apply: Prefer duplication over the wrong abstraction
- [ ] Apply: Wait for the third occurrence before extracting a generic solution

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Interface for Single Implementation
- [ ] Prevent: Repository for Every Model
- [ ] Prevent: Factory for Every Object
- [ ] Prevent: Strategy Pattern for One Strategy
- [ ] Prevent: Adapter Wrapping Nothing
- [ ] Prevent: Event for Everything
- [ ] Prevent: Strategy for One Strategy

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
- Add abstraction only when a clear, concrete need for the second implementation exists
- Prove an abstraction's value by showing concrete before/after metrics
- Prefer duplication over the wrong abstraction
- Wait for the third occurrence before extracting a generic solution
- Remove an abstraction that is no longer pulling its weight
## Anti-Patterns
- Interface for Single Implementation
- Repository for Every Model
- Factory for Every Object
- Strategy Pattern for One Strategy
- Adapter Wrapping Nothing
- Event for Everything
- Strategy for One Strategy
## Skills
- Avoid Premature Abstraction and YAGNI Violations


