# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** CQRS maturity levels (0-4)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Start at Level 1 (same model, separate command/query methods) before progressing
- [ ] Apply rule: Enforce command and query segregation at the API/controller level even at Level 1
- [ ] Apply rule: Introduce separate read models (Level 2) when queries require reshaping or aggregating data across aggregates
- [ ] Apply rule: Move to separate databases (Level 3) only when justified by scalability data
- [ ] Prevent anti-pattern: Jumping to Level 4
- [ ] Prevent anti-pattern: Level 0 Denial
- [ ] Prevent anti-pattern: Label Obsession
- [ ] Current level justified by actual needs, not theoretical future
- [ ] CQS enforced at controller level (no side effects in GET)
- [ ] Read models introduced only when queries span aggregates
- [ ] Separate databases only when performance data justifies it
- [ ] Event sourcing only when temporal queries or audit is required

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Start at Level 1 (same model, separate command/query methods) before progressing
- [ ] Enforce command and query segregation at the API/controller level even at Level 1
- [ ] Introduce separate read models (Level 2) when queries require reshaping or aggregating data across aggregates
- [ ] Move to separate databases (Level 3) only when justified by scalability data
- [ ] Progress through maturity levels incrementally, not in one change
- [ ] Evaluate: CQRS maturity level per bounded context
- [ ] Evaluate: When to introduce separate read models (Level 2)
- [ ] Evaluate: When to progress to separate databases (Level 3)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Start at Level 1 (same model, separate command/query methods) before progressing
- [ ] Follow rule: Enforce command and query segregation at the API/controller level even at Level 1
- [ ] Follow rule: Introduce separate read models (Level 2) when queries require reshaping or aggregating data across aggregates
- [ ] Follow rule: Move to separate databases (Level 3) only when justified by scalability data
- [ ] Follow rule: Progress through maturity levels incrementally, not in one change
- [ ] - [ ] Current level justified by actual needs, not theoretical future
- [ ] - [ ] CQS enforced at controller level (no side effects in GET)
- [ ] - [ ] Read models introduced only when queries span aggregates
- [ ] - [ ] Separate databases only when performance data justifies it

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
- [ ] Ensure: CQRS maturity levels describe the spectrum from simple method separation to full...
- [ ] Verify: Start at Level 1 (same model, separate command/query methods) before progressing
- [ ] Verify: Enforce command and query segregation at the API/controller level even at Level 1
- [ ] Verify: Introduce separate read models (Level 2) when queries require reshaping or aggregating data across aggregates
- [ ] Verify: Move to separate databases (Level 3) only when justified by scalability data

# Testing Checklist
- [ ] Current level justified by actual needs, not theoretical future
- [ ] CQS enforced at controller level (no side effects in GET)
- [ ] Read models introduced only when queries span aggregates
- [ ] Separate databases only when performance data justifies it
- [ ] Event sourcing only when temporal queries or audit is required
- [ ] Levels applied consistently within each bounded context

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Start at Level 1 (same model, separate command/query methods) before progressing
- [ ] Apply: Enforce command and query segregation at the API/controller level even at Level 1
- [ ] Apply: Introduce separate read models (Level 2) when queries require reshaping or aggregating data across aggregates
- [ ] Apply: Move to separate databases (Level 3) only when justified by scalability data

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Jumping to Level 4
- [ ] Prevent: Level 0 Denial
- [ ] Prevent: Label Obsession
- [ ] Prevent: Storage Separation Without Need
- [ ] Prevent: Event Sourcing for CRUD
- [ ] Prevent: Level Lock-In

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
- Start at Level 1 (same model, separate command/query methods) before progressing
- Enforce command and query segregation at the API/controller level even at Level 1
- Introduce separate read models (Level 2) when queries require reshaping or aggregating data across aggregates
- Move to separate databases (Level 3) only when justified by scalability data
- Progress through maturity levels incrementally, not in one change
## Anti-Patterns
- Jumping to Level 4
- Level 0 Denial
- Label Obsession
- Storage Separation Without Need
- Event Sourcing for CRUD
- Level Lock-In
## Skills
- Assess and Progress Through CQRS Maturity Levels


