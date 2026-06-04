# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Anemic domain model vs rich domain model
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Never allow domain entities to be property bags with zero behavior
- [ ] Apply rule: Keep domain logic inside the model, not in application services
- [ ] Apply rule: Expose intent-revealing interfaces, not property getters
- [ ] Apply rule: A rich model does not mean every object must be complexâ€”start small and enrich deliberately
- [ ] Prevent anti-pattern: Anemic Everywhere
- [ ] Prevent anti-pattern: Rich Model with Persistence
- [ ] Prevent anti-pattern: Overcorrection
- [ ] Every entity has at least one meaningful business method
- [ ] Getters are read-only; setters are replaced by behavior methods
- [ ] Business rules involving single aggregate data live on that aggregate
- [ ] Persistence logic is not inside domain entities
- [ ] Tests verify state transitions and invariant enforcement, not property values

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Never allow domain entities to be property bags with zero behavior
- [ ] Keep domain logic inside the model, not in application services
- [ ] Expose intent-revealing interfaces, not property getters
- [ ] A rich model does not mean every object must be complexâ€”start small and enrich deliberately
- [ ] Evaluate: Anemic vs Rich domain model per context
- [ ] Evaluate: Where behavior belongs â€” entity vs domain service vs application service
- [ ] Evaluate: Eloquent's dual role â€” domain object vs persistence object

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Never allow domain entities to be property bags with zero behavior
- [ ] Follow rule: Keep domain logic inside the model, not in application services
- [ ] Follow rule: Expose intent-revealing interfaces, not property getters
- [ ] Follow rule: A rich model does not mean every object must be complexâ€”start small and enrich deliberately
- [ ] Follow rule: Write unit tests against domain behavior, not against getter values
- [ ] - [ ] Every entity has at least one meaningful business method
- [ ] - [ ] Getters are read-only; setters are replaced by behavior methods
- [ ] - [ ] Business rules involving single aggregate data live on that aggregate
- [ ] - [ ] Persistence logic is not inside domain entities

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
- [ ] Ensure: Anemic domain model is a domain object with public getters/setters but no busine...
- [ ] Verify: Never allow domain entities to be property bags with zero behavior
- [ ] Verify: Keep domain logic inside the model, not in application services
- [ ] Verify: Expose intent-revealing interfaces, not property getters
- [ ] Verify: A rich model does not mean every object must be complexâ€”start small and enrich deliberately

# Testing Checklist
- [ ] Every entity has at least one meaningful business method
- [ ] Getters are read-only; setters are replaced by behavior methods
- [ ] Business rules involving single aggregate data live on that aggregate
- [ ] Persistence logic is not inside domain entities
- [ ] Tests verify state transitions and invariant enforcement, not property values
- [ ] Intent-revealing interfaces (canBeCancelled(), markAsShipped()) replace raw property checks
- [ ] Write unit tests against domain behavior, not against getter values

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Never allow domain entities to be property bags with zero behavior
- [ ] Apply: Keep domain logic inside the model, not in application services
- [ ] Apply: Expose intent-revealing interfaces, not property getters
- [ ] Apply: A rich model does not mean every object must be complexâ€”start small and enrich deliberately

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Anemic Everywhere
- [ ] Prevent: Rich Model with Persistence
- [ ] Prevent: Overcorrection
- [ ] Prevent: All-or-Nothing Thinking
- [ ] Prevent: Ignoring Eloquent's Dual Role
- [ ] Prevent: Fat Rich Models

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
- Never allow domain entities to be property bags with zero behavior
- Keep domain logic inside the model, not in application services
- Expose intent-revealing interfaces, not property getters
- A rich model does not mean every object must be complexâ€”start small and enrich deliberately
- Write unit tests against domain behavior, not against getter values
## Anti-Patterns
- Anemic Everywhere
- Rich Model with Persistence
- Overcorrection
- All-or-Nothing Thinking
- Ignoring Eloquent's Dual Role
- Fat Rich Models
## Skills
- Design a Rich Domain Model


