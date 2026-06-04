# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** SOLID Principles
**Knowledge Unit:** SOLID principles in PHP: ISP violations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Keep interfaces focusedâ€”clients should not depend on methods they don't use
- [ ] Apply rule: Split large interfaces into role-specific interfaces
- [ ] Apply rule: Clients should own their interfaces (segregated principle)
- [ ] Apply rule: Use Adapter pattern when you need to consume an interface that is too broad
- [ ] Prevent anti-pattern: Monolithic Repository Interface**: Single interface with find/save/delete/search/export forcing implementors to throw for irrelevant methods
- [ ] Prevent anti-pattern: Method-per-Class Interfaces**: One interface per method creating navigation overhead without value
- [ ] Prevent anti-pattern: Implementation-Named Interfaces**: Interfaces named after implementations rather than client roles

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Keep interfaces focusedâ€”clients should not depend on methods they don't use
- [ ] Split large interfaces into role-specific interfaces
- [ ] Clients should own their interfaces (segregated principle)
- [ ] Use Adapter pattern when you need to consume an interface that is too broad
- [ ] A method parameter that is an interface should require only what the method uses
- [ ] Evaluate: Interface splitting strategy â€” role interfaces vs monolithic contracts
- [ ] Evaluate: Interface granularity â€” fine role interfaces vs coarse contracts
- [ ] Evaluate: Interface ownership â€” where to define and place interfaces

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Keep interfaces focusedâ€”clients should not depend on methods they don't use
- [ ] Follow rule: Split large interfaces into role-specific interfaces
- [ ] Follow rule: Clients should own their interfaces (segregated principle)
- [ ] Follow rule: Use Adapter pattern when you need to consume an interface that is too broad
- [ ] Follow rule: A method parameter that is an interface should require only what the method uses

# Performance Checklist
- Interface method calls: no overhead vs concrete calls
- More interfaces: no runtime cost (PHP compiles interface definitions)
- Interface discovery: tooling improvement (PHPStan) â€” not a runtime concern

# Security Checklist
- **Input validation at boundaries**: Validate all data entering the domain layer, regardless of source (HTTP, queue, CLI)
- **Output sanitization**: Sanitize data leaving the domain for the presentation layer
- **Authentication/Authorization gates**: Apply security checks at architectural boundaries, not inside domain logic
- **Dependency isolation**: Anti-corruption layers prevent security vulnerabilities in third-party code from propagating
- **Event data leakage**: Ensure domain events don't expose sensitive data to unauthorized consumers
- **Command validation**: Validate commands before dispatch to prevent injection attacks
- **Rate limiting at entry points**: Apply throttling at architectural entry points (controllers, queue workers)

# Reliability Checklist
- [ ] Ensure: Interface Segregation Principle states that no client should be forced to depend...
- [ ] Verify: Keep interfaces focusedâ€”clients should not depend on methods they don't use
- [ ] Verify: Split large interfaces into role-specific interfaces
- [ ] Verify: Clients should own their interfaces (segregated principle)
- [ ] Verify: Use Adapter pattern when you need to consume an interface that is too broad

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Keep interfaces focusedâ€”clients should not depend on methods they don't use
- [ ] Apply: Split large interfaces into role-specific interfaces
- [ ] Apply: Clients should own their interfaces (segregated principle)
- [ ] Apply: Use Adapter pattern when you need to consume an interface that is too broad

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Monolithic Repository Interface**: Single interface with find/save/delete/search/export forcing implementors to throw for irrelevant methods
- [ ] Prevent: Method-per-Class Interfaces**: One interface per method creating navigation overhead without value
- [ ] Prevent: Implementation-Named Interfaces**: Interfaces named after implementations rather than client roles

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
- Keep interfaces focusedâ€”clients should not depend on methods they don't use
- Split large interfaces into role-specific interfaces
- Clients should own their interfaces (segregated principle)
- Use Adapter pattern when you need to consume an interface that is too broad
- A method parameter that is an interface should require only what the method uses
## Anti-Patterns
- Monolithic Repository Interface**: Single interface with find/save/delete/search/export forcing implementors to throw for irrelevant methods
- Method-per-Class Interfaces**: One interface per method creating navigation overhead without value
- Implementation-Named Interfaces**: Interfaces named after implementations rather than client roles
## Skills
- Detect and Fix Interface Segregation Principle Violations


