# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Architectural Decision Records
**Knowledge Unit:** Architecture review and RFC processes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Write the RFC before writing the implementation code for any significant change
- [ ] Apply rule: Decide by merit of argument, not seniority
- [ ] Apply rule: Provide a lightweight option for trivial decisions
- [ ] Apply rule: Make all RFCs searchable in a centralized, accessible location
- [ ] Prevent anti-pattern: RFC After Implementation
- [ ] Prevent anti-pattern: RFC Overload
- [ ] Prevent anti-pattern: Stalled RFCs
- [ ] RFC written before implementation begins
- [ ] At least two alternatives evaluated with tradeoffs
- [ ] Review period has a clear deadline
- [ ] Decision based on evidence, not seniority
- [ ] RFC is searchable in a centralized location

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Write the RFC before writing the implementation code for any significant change
- [ ] Decide by merit of argument, not seniority
- [ ] Provide a lightweight option for trivial decisions
- [ ] Conduct lightweight retrospectives on past architectural decisions
- [ ] Evaluate: Full RFC vs ADR-lite for a given decision
- [ ] Evaluate: RFC review group composition
- [ ] Evaluate: Which decisions merit formal evaluation vs lightweight approval

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Write the RFC before writing the implementation code for any significant change
- [ ] Follow rule: Decide by merit of argument, not seniority
- [ ] Follow rule: Provide a lightweight option for trivial decisions
- [ ] Follow rule: Make all RFCs searchable in a centralized, accessible location
- [ ] Follow rule: Conduct lightweight retrospectives on past architectural decisions
- [ ] - [ ] RFC written before implementation begins
- [ ] - [ ] At least two alternatives evaluated with tradeoffs
- [ ] - [ ] Review period has a clear deadline
- [ ] - [ ] Decision based on evidence, not seniority

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
- [ ] Ensure: Architecture reviews and RFC processes provide structured mechanisms for proposi...
- [ ] Verify: Write the RFC before writing the implementation code for any significant change
- [ ] Verify: Decide by merit of argument, not seniority
- [ ] Verify: Provide a lightweight option for trivial decisions
- [ ] Verify: Make all RFCs searchable in a centralized, accessible location

# Testing Checklist
- [ ] RFC written before implementation begins
- [ ] At least two alternatives evaluated with tradeoffs
- [ ] Review period has a clear deadline
- [ ] Decision based on evidence, not seniority
- [ ] RFC is searchable in a centralized location
- [ ] ADR created from the accepted RFC

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Write the RFC before writing the implementation code for any significant change
- [ ] Apply: Decide by merit of argument, not seniority
- [ ] Apply: Provide a lightweight option for trivial decisions
- [ ] Apply: Make all RFCs searchable in a centralized, accessible location

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: RFC After Implementation
- [ ] Prevent: RFC Overload
- [ ] Prevent: Stalled RFCs
- [ ] Prevent: Decision by Seniority
- [ ] Prevent: No Lightweight Option
- [ ] Prevent: No Retrospective

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
- Write the RFC before writing the implementation code for any significant change
- Decide by merit of argument, not seniority
- Provide a lightweight option for trivial decisions
- Make all RFCs searchable in a centralized, accessible location
- Conduct lightweight retrospectives on past architectural decisions
## Anti-Patterns
- RFC After Implementation
- RFC Overload
- Stalled RFCs
- Decision by Seniority
- No Lightweight Option
- No Retrospective
## Skills
- Run an Architecture RFC Review Process


