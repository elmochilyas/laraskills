# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Architectural Decision Records
**Knowledge Unit:** ADR formats (Nygard, MADR, Y-Statement)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Write an ADR before or during implementationâ€”never as a post-hoc exercise
- [ ] Apply rule: Clearly supersede old ADRs when a decision changes
- [ ] Apply rule: Reserve ADRs for decisions with significant, lasting impact
- [ ] Apply rule: Store ADRs in the same repository as the code they govern
- [ ] Prevent anti-pattern: Post-Hoc ADR
- [ ] Prevent anti-pattern: No Supersession Management
- [ ] Prevent anti-pattern: ADR Fatigue
- [ ] ADR written before code merge (not retroactive)
- [ ] Context explains why the decision was needed
- [ ] At least two alternatives evaluated
- [ ] Decision rationale is clear
- [ ] Consequences (positive and negative) documented

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Write an ADR before or during implementationâ€”never as a post-hoc exercise
- [ ] Reserve ADRs for decisions with significant, lasting impact
- [ ] Store ADRs in the same repository as the code they govern
- [ ] Enforce a mandatory review period and deadline for open RFCs/ADRs
- [ ] Evaluate: ADR format selection â€” Nygard vs MADR vs Y-Statement
- [ ] Evaluate: When to supersede vs deprecate an ADR
- [ ] Evaluate: ADR storage location â€” code repo vs wiki vs dedicated tool

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Write an ADR before or during implementationâ€”never as a post-hoc exercise
- [ ] Follow rule: Clearly supersede old ADRs when a decision changes
- [ ] Follow rule: Reserve ADRs for decisions with significant, lasting impact
- [ ] Follow rule: Store ADRs in the same repository as the code they govern
- [ ] Follow rule: Enforce a mandatory review period and deadline for open RFCs/ADRs
- [ ] - [ ] ADR written before code merge (not retroactive)
- [ ] - [ ] Context explains why the decision was needed
- [ ] - [ ] At least two alternatives evaluated
- [ ] - [ ] Decision rationale is clear

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
- [ ] Ensure: Architecture Decision Records (ADRs) capture architectural decisions with contex...
- [ ] Verify: Write an ADR before or during implementationâ€”never as a post-hoc exercise
- [ ] Verify: Clearly supersede old ADRs when a decision changes
- [ ] Verify: Reserve ADRs for decisions with significant, lasting impact
- [ ] Verify: Store ADRs in the same repository as the code they govern

# Testing Checklist
- [ ] ADR written before code merge (not retroactive)
- [ ] Context explains why the decision was needed
- [ ] At least two alternatives evaluated
- [ ] Decision rationale is clear
- [ ] Consequences (positive and negative) documented
- [ ] Stored in code repository, not external wiki

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Write an ADR before or during implementationâ€”never as a post-hoc exercise
- [ ] Apply: Clearly supersede old ADRs when a decision changes
- [ ] Apply: Reserve ADRs for decisions with significant, lasting impact
- [ ] Apply: Store ADRs in the same repository as the code they govern

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Post-Hoc ADR
- [ ] Prevent: No Supersession Management
- [ ] Prevent: ADR Fatigue
- [ ] Prevent: Too Few ADRs
- [ ] Prevent: Hidden ADRs
- [ ] Prevent: No Template

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
- Write an ADR before or during implementationâ€”never as a post-hoc exercise
- Clearly supersede old ADRs when a decision changes
- Reserve ADRs for decisions with significant, lasting impact
- Store ADRs in the same repository as the code they govern
- Enforce a mandatory review period and deadline for open RFCs/ADRs
## Anti-Patterns
- Post-Hoc ADR
- No Supersession Management
- ADR Fatigue
- Too Few ADRs
- Hidden ADRs
- No Template
## Skills
- Write an Architecture Decision Record


