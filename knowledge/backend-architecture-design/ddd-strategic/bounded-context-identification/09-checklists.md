# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** DDD Strategic Design
**Knowledge Unit:** Bounded context identification heuristics
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Identify bounded contexts through language boundaries, not technical boundaries
- [ ] Apply rule: Each bounded context gets its own module with its own models and logic
- [ ] Apply rule: Map context relationships explicitly with Context Mapping
- [ ] Apply rule: Respect bounded context autonomyâ€”no shared databases across contexts
- [ ] Prevent anti-pattern: Technical Boundaries
- [ ] Prevent anti-pattern: Wrong Granularity
- [ ] Prevent anti-pattern: Ignoring Ubiquitous Language Divergence
- [ ] Domain experts participated in boundary identification
- [ ] Bounded contexts align with business subdomains
- [ ] Each context has a consistent ubiquitous language
- [ ] Context boundaries are where terminology or actor changes
- [ ] Context mapping relationships documented

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Identify bounded contexts through language boundaries, not technical boundaries
- [ ] Each bounded context gets its own module with its own models and logic
- [ ] Map context relationships explicitly with Context Mapping
- [ ] Respect bounded context autonomyâ€”no shared databases across contexts
- [ ] Align team structure with bounded contexts (Conway's Law)
- [ ] Evaluate: Merge vs split bounded contexts
- [ ] Evaluate: Bounded context per team vs per subdomain
- [ ] Evaluate: Language-based vs technical boundary identification

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Identify bounded contexts through language boundaries, not technical boundaries
- [ ] Follow rule: Each bounded context gets its own module with its own models and logic
- [ ] Follow rule: Map context relationships explicitly with Context Mapping
- [ ] Follow rule: Respect bounded context autonomyâ€”no shared databases across contexts
- [ ] Follow rule: Align team structure with bounded contexts (Conway's Law)
- [ ] - [ ] Domain experts participated in boundary identification
- [ ] - [ ] Bounded contexts align with business subdomains
- [ ] - [ ] Each context has a consistent ubiquitous language
- [ ] - [ ] Context boundaries are where terminology or actor changes

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
- [ ] Ensure: Bounded contexts are explicit boundaries within which a domain model applies. Id...
- [ ] Verify: Identify bounded contexts through language boundaries, not technical boundaries
- [ ] Verify: Each bounded context gets its own module with its own models and logic
- [ ] Verify: Map context relationships explicitly with Context Mapping
- [ ] Verify: Respect bounded context autonomyâ€”no shared databases across contexts

# Testing Checklist
- [ ] Domain experts participated in boundary identification
- [ ] Bounded contexts align with business subdomains
- [ ] Each context has a consistent ubiquitous language
- [ ] Context boundaries are where terminology or actor changes
- [ ] Context mapping relationships documented
- [ ] Each context can theoretically be assigned to a different team

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Identify bounded contexts through language boundaries, not technical boundaries
- [ ] Apply: Each bounded context gets its own module with its own models and logic
- [ ] Apply: Map context relationships explicitly with Context Mapping
- [ ] Apply: Respect bounded context autonomyâ€”no shared databases across contexts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Technical Boundaries
- [ ] Prevent: Wrong Granularity
- [ ] Prevent: Ignoring Ubiquitous Language Divergence
- [ ] Prevent: No Context Mapping
- [ ] Prevent: Data Ownership Confusion
- [ ] Prevent: Premature Context Splitting
- [ ] Prevent: Ignoring Language Divergence

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
- Identify bounded contexts through language boundaries, not technical boundaries
- Each bounded context gets its own module with its own models and logic
- Map context relationships explicitly with Context Mapping
- Respect bounded context autonomyâ€”no shared databases across contexts
- Align team structure with bounded contexts (Conway's Law)
## Anti-Patterns
- Technical Boundaries
- Wrong Granularity
- Ignoring Ubiquitous Language Divergence
- No Context Mapping
- Data Ownership Confusion
- Premature Context Splitting
- Ignoring Language Divergence
## Skills
- Identify Bounded Contexts


