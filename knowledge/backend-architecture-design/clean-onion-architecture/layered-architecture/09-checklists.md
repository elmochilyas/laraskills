# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Clean/Onion Architecture
**Knowledge Unit:** Layered architecture comparative analysis
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Enforce strict layer dependency directionâ€”Presentation â†’ Application â†’ Domain â†’ Infrastructure
- [ ] Apply rule: Isolate the Domain layer â€” zero framework or infrastructure imports
- [ ] Apply rule: Never put business logic in the Presentation layer
- [ ] Apply rule: Layer boundaries must be stableâ€”do not cross them with shortcuts or "temporary" bypasses
- [ ] Prevent anti-pattern: Layer Skipping
- [ ] Prevent anti-pattern: Domain Depends on Infrastructure
- [ ] Prevent anti-pattern: God Layer
- [ ] Domain layer has zero framework imports (Eloquent, Request, DB, Cache)
- [ ] Controllers contain no business logic (only HTTP handling)
- [ ] Layer dependencies point strictly inward
- [ ] Cross-cutting concerns use decorator pattern, not domain mixins
- [ ] No layer-skipping shortcuts in the codebase

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Enforce strict layer dependency directionâ€”Presentation â†’ Application â†’ Domain â†’ Infrastructure
- [ ] Isolate the Domain layer â€” zero framework or infrastructure imports
- [ ] Never put business logic in the Presentation layer
- [ ] Layer boundaries must be stableâ€”do not cross them with shortcuts or "temporary" bypasses
- [ ] Handle cross-cutting concerns via infrastructure-layer decorators, not domain mixins
- [ ] Evaluate: Layered vs Vertical Slice vs Hexagonal architecture selection
- [ ] Evaluate: Layer enforcement approach â€” manual review vs automation
- [ ] Evaluate: When to evolve from Layered to Hexagonal/Clean Architecture

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Enforce strict layer dependency directionâ€”Presentation â†’ Application â†’ Domain â†’ Infrastructure
- [ ] Follow rule: Isolate the Domain layer â€” zero framework or infrastructure imports
- [ ] Follow rule: Never put business logic in the Presentation layer
- [ ] Follow rule: Layer boundaries must be stableâ€”do not cross them with shortcuts or "temporary" bypasses
- [ ] Follow rule: Handle cross-cutting concerns via infrastructure-layer decorators, not domain mixins
- [ ] - [ ] Domain layer has zero framework imports (Eloquent, Request, DB, Cache)
- [ ] - [ ] Controllers contain no business logic (only HTTP handling)
- [ ] - [ ] Layer dependencies point strictly inward
- [ ] - [ ] Cross-cutting concerns use decorator pattern, not domain mixins

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
- [ ] Ensure: Layered architecture organizes code into horizontal layers (presentation â†’ app...
- [ ] Verify: Enforce strict layer dependency directionâ€”Presentation â†’ Application â†’ Domain â†’ Infrastructure
- [ ] Verify: Isolate the Domain layer â€” zero framework or infrastructure imports
- [ ] Verify: Never put business logic in the Presentation layer
- [ ] Verify: Layer boundaries must be stableâ€”do not cross them with shortcuts or "temporary" bypasses

# Testing Checklist
- [ ] Domain layer has zero framework imports (Eloquent, Request, DB, Cache)
- [ ] Controllers contain no business logic (only HTTP handling)
- [ ] Layer dependencies point strictly inward
- [ ] Cross-cutting concerns use decorator pattern, not domain mixins
- [ ] No layer-skipping shortcuts in the codebase
- [ ] CI enforces layer boundaries automatically

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Enforce strict layer dependency directionâ€”Presentation â†’ Application â†’ Domain â†’ Infrastructure
- [ ] Apply: Isolate the Domain layer â€” zero framework or infrastructure imports
- [ ] Apply: Never put business logic in the Presentation layer
- [ ] Apply: Layer boundaries must be stableâ€”do not cross them with shortcuts or "temporary" bypasses

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Layer Skipping
- [ ] Prevent: Domain Depends on Infrastructure
- [ ] Prevent: God Layer
- [ ] Prevent: No Clear Boundaries
- [ ] Prevent: Framework Coupling
- [ ] Prevent: Fat Controller

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
- Enforce strict layer dependency directionâ€”Presentation â†’ Application â†’ Domain â†’ Infrastructure
- Isolate the Domain layer â€” zero framework or infrastructure imports
- Never put business logic in the Presentation layer
- Layer boundaries must be stableâ€”do not cross them with shortcuts or "temporary" bypasses
- Handle cross-cutting concerns via infrastructure-layer decorators, not domain mixins
## Anti-Patterns
- Layer Skipping
- Domain Depends on Infrastructure
- God Layer
- No Clear Boundaries
- Framework Coupling
- Fat Controller
## Skills
- Implement a Layered Architecture


