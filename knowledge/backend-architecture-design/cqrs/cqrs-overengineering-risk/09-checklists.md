# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** CQRS overengineering risk assessment
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Apply CQRS only where justified by query complexity or throughput requirements
- [ ] Apply rule: Separate commands and queries at the method/controller level first (CQS) before adding infrastructure
- [ ] Apply rule: Keep write and read models in the same repository until separation is proven necessary
- [ ] Apply rule: Abstract projections behind simple interfacesâ€”don't couple to a specific event store
- [ ] Prevent anti-pattern: Full CQRS for CRUD-Only Domain
- [ ] Prevent anti-pattern: Read/Write Separation Without Asymmetry
- [ ] Prevent anti-pattern: Early Event Sourcing
- [ ] Read/write asymmetry measured before CQRS adoption
- [ ] CQS tried first (same model, separated methods)
- [ ] Read models introduced only for cross-aggregate queries
- [ ] Separate databases only if performance data justifies it
- [ ] Projections use simple interfaces, not coupled to specific event stores

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Apply CQRS only where justified by query complexity or throughput requirements
- [ ] Separate commands and queries at the method/controller level first (CQS) before adding infrastructure
- [ ] Keep write and read models in the same repository until separation is proven necessary
- [ ] Abstract projections behind simple interfacesâ€”don't couple to a specific event store
- [ ] Validate CQRS adoption with a 6-month retrospective
- [ ] Evaluate: CQRS vs CQS for a bounded context
- [ ] Evaluate: Same repository vs separate read/write repositories
- [ ] Evaluate: Event sourcing vs CQRS without event sourcing

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Apply CQRS only where justified by query complexity or throughput requirements
- [ ] Follow rule: Separate commands and queries at the method/controller level first (CQS) before adding infrastructure
- [ ] Follow rule: Keep write and read models in the same repository until separation is proven necessary
- [ ] Follow rule: Abstract projections behind simple interfacesâ€”don't couple to a specific event store
- [ ] Follow rule: Validate CQRS adoption with a 6-month retrospective
- [ ] - [ ] Read/write asymmetry measured before CQRS adoption
- [ ] - [ ] CQS tried first (same model, separated methods)
- [ ] - [ ] Read models introduced only for cross-aggregate queries
- [ ] - [ ] Separate databases only if performance data justifies it

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
- [ ] Ensure: CQRS overengineering is the most common failure mode for teams adopting the patt...
- [ ] Verify: Apply CQRS only where justified by query complexity or throughput requirements
- [ ] Verify: Separate commands and queries at the method/controller level first (CQS) before adding infrastructure
- [ ] Verify: Keep write and read models in the same repository until separation is proven necessary
- [ ] Verify: Abstract projections behind simple interfacesâ€”don't couple to a specific event store

# Testing Checklist
- [ ] Read/write asymmetry measured before CQRS adoption
- [ ] CQS tried first (same model, separated methods)
- [ ] Read models introduced only for cross-aggregate queries
- [ ] Separate databases only if performance data justifies it
- [ ] Projections use simple interfaces, not coupled to specific event stores
- [ ] 6-month retrospective scheduled to validate adoption

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Apply CQRS only where justified by query complexity or throughput requirements
- [ ] Apply: Separate commands and queries at the method/controller level first (CQS) before adding infrastructure
- [ ] Apply: Keep write and read models in the same repository until separation is proven necessary
- [ ] Apply: Abstract projections behind simple interfacesâ€”don't couple to a specific event store

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Full CQRS for CRUD-Only Domain
- [ ] Prevent: Read/Write Separation Without Asymmetry
- [ ] Prevent: Early Event Sourcing
- [ ] Prevent: Single-Developer CQRS
- [ ] Prevent: CQRS as Default Architecture
- [ ] Prevent: No Migration Path

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
- Apply CQRS only where justified by query complexity or throughput requirements
- Separate commands and queries at the method/controller level first (CQS) before adding infrastructure
- Keep write and read models in the same repository until separation is proven necessary
- Abstract projections behind simple interfacesâ€”don't couple to a specific event store
- Validate CQRS adoption with a 6-month retrospective
## Anti-Patterns
- Full CQRS for CRUD-Only Domain
- Read/Write Separation Without Asymmetry
- Early Event Sourcing
- Single-Developer CQRS
- CQRS as Default Architecture
- No Migration Path
## Skills
- Assess CQRS Overengineering Risk


