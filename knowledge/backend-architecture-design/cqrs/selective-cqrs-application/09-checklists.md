# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** When to apply CQRS selectively per bounded context
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Apply CQRS selectively per use caseâ€”not globally across the entire application
- [ ] Apply rule: Use CQS (same model, separated methods) as the default; upgrade to full CQRS only when needed
- [ ] Apply rule: Draw bounded-context boundaries at natural CQRS inflection points
- [ ] Apply rule: Use the same database and same model for simple CRUDâ€”CQRS is not mandatory
- [ ] Prevent anti-pattern: Uniform CQRS Depth
- [ ] Prevent anti-pattern: CQRS Theater
- [ ] Prevent anti-pattern: Context Boundary Pollution
- [ ] Each bounded context has a documented CQRS level decision
- [ ] CRUD-suitable contexts use simple models, not full CQRS
- [ ] CQS used as default before upgrading to full CQRS
- [ ] Read-heavy contexts have read models where justified
- [ ] No context forced into CQRS level that doesn't match its needs

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Apply CQRS selectively per use caseâ€”not globally across the entire application
- [ ] Use CQS (same model, separated methods) as the default; upgrade to full CQRS only when needed
- [ ] Draw bounded-context boundaries at natural CQRS inflection points
- [ ] Use the same database and same model for simple CRUDâ€”CQRS is not mandatory
- [ ] Phase CQRS adoption by starting with one bounded context and expanding
- [ ] Evaluate: CQRS depth per bounded context
- [ ] Evaluate: Which context to pilot CQRS first
- [ ] Evaluate: Mixed CQRS levels coexistence strategy

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Apply CQRS selectively per use caseâ€”not globally across the entire application
- [ ] Follow rule: Use CQS (same model, separated methods) as the default; upgrade to full CQRS only when needed
- [ ] Follow rule: Draw bounded-context boundaries at natural CQRS inflection points
- [ ] Follow rule: Use the same database and same model for simple CRUDâ€”CQRS is not mandatory
- [ ] Follow rule: Phase CQRS adoption by starting with one bounded context and expanding
- [ ] - [ ] Each bounded context has a documented CQRS level decision
- [ ] - [ ] CRUD-suitable contexts use simple models, not full CQRS
- [ ] - [ ] CQS used as default before upgrading to full CQRS
- [ ] - [ ] Read-heavy contexts have read models where justified

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
- [ ] Ensure: CQRS should be applied selectively per bounded context, not as a system-wide arc...
- [ ] Verify: Apply CQRS selectively per use caseâ€”not globally across the entire application
- [ ] Verify: Use CQS (same model, separated methods) as the default; upgrade to full CQRS only when needed
- [ ] Verify: Draw bounded-context boundaries at natural CQRS inflection points
- [ ] Verify: Use the same database and same model for simple CRUDâ€”CQRS is not mandatory

# Testing Checklist
- [ ] Each bounded context has a documented CQRS level decision
- [ ] CRUD-suitable contexts use simple models, not full CQRS
- [ ] CQS used as default before upgrading to full CQRS
- [ ] Read-heavy contexts have read models where justified
- [ ] No context forced into CQRS level that doesn't match its needs
- [ ] Pilot context validated before expanding to others

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Apply CQRS selectively per use caseâ€”not globally across the entire application
- [ ] Apply: Use CQS (same model, separated methods) as the default; upgrade to full CQRS only when needed
- [ ] Apply: Draw bounded-context boundaries at natural CQRS inflection points
- [ ] Apply: Use the same database and same model for simple CRUDâ€”CQRS is not mandatory

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Uniform CQRS Depth
- [ ] Prevent: CQRS Theater
- [ ] Prevent: Context Boundary Pollution
- [ ] Prevent: Analysis Paralysis
- [ ] Prevent: Context Islands Too Small
- [ ] Prevent: Ignoring Operational Cost

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
- Apply CQRS selectively per use caseâ€”not globally across the entire application
- Use CQS (same model, separated methods) as the default; upgrade to full CQRS only when needed
- Draw bounded-context boundaries at natural CQRS inflection points
- Use the same database and same model for simple CRUDâ€”CQRS is not mandatory
- Phase CQRS adoption by starting with one bounded context and expanding
## Anti-Patterns
- Uniform CQRS Depth
- CQRS Theater
- Context Boundary Pollution
- Analysis Paralysis
- Context Islands Too Small
- Ignoring Operational Cost
## Skills
- Apply CQRS Selectively per Bounded Context


