# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** DDD Strategic Design
**Knowledge Unit:** Ubiquitous language maintenance practices
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use the same term everywhere in code, database, events, and UI for the same domain concept
- [ ] Apply rule: Evolve the language with domain expertsâ€”it belongs to them, not developers
- [ ] Apply rule: When a term is overloaded, qualify it with the bounded context
- [ ] Apply rule: Rename code when the language changesâ€”do not keep old code names
- [ ] Prevent anti-pattern: Technical Language in Code
- [ ] Prevent anti-pattern: No Glossary
- [ ] Prevent anti-pattern: Homonym Confusion
- [ ] Glossary exists and is accessible to the whole team
- [ ] Code class/method names match glossary terms
- [ ] Domain experts recognize the terminology in code
- [ ] Each term has exactly one meaning (no ambiguity)
- [ ] Terms that differ from common English are documented

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Use the same term everywhere in code, database, events, and UI for the same domain concept
- [ ] Evolve the language with domain expertsâ€”it belongs to them, not developers
- [ ] When a term is overloaded, qualify it with the bounded context
- [ ] Rename code when the language changesâ€”do not keep old code names
- [ ] Use the language in conversations and documentationâ€”not just in code
- [ ] Evaluate: Code-first vs workshop-first language discovery
- [ ] Evaluate: Rename code vs document mapping when language evolves
- [ ] Evaluate: Single language vs per-context qualified terms

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use the same term everywhere in code, database, events, and UI for the same domain concept
- [ ] Follow rule: Evolve the language with domain expertsâ€”it belongs to them, not developers
- [ ] Follow rule: When a term is overloaded, qualify it with the bounded context
- [ ] Follow rule: Rename code when the language changesâ€”do not keep old code names
- [ ] Follow rule: Use the language in conversations and documentationâ€”not just in code
- [ ] - [ ] Glossary exists and is accessible to the whole team
- [ ] - [ ] Code class/method names match glossary terms
- [ ] - [ ] Domain experts recognize the terminology in code
- [ ] - [ ] Each term has exactly one meaning (no ambiguity)

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
- [ ] Ensure: Ubiquitous language is a shared language between developers and domain experts, ...
- [ ] Verify: Use the same term everywhere in code, database, events, and UI for the same domain concept
- [ ] Verify: Evolve the language with domain expertsâ€”it belongs to them, not developers
- [ ] Verify: When a term is overloaded, qualify it with the bounded context
- [ ] Verify: Rename code when the language changesâ€”do not keep old code names

# Testing Checklist
- [ ] Glossary exists and is accessible to the whole team
- [ ] Code class/method names match glossary terms
- [ ] Domain experts recognize the terminology in code
- [ ] Each term has exactly one meaning (no ambiguity)
- [ ] Terms that differ from common English are documented
- [ ] Documentation uses the same language as code

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use the same term everywhere in code, database, events, and UI for the same domain concept
- [ ] Apply: Evolve the language with domain expertsâ€”it belongs to them, not developers
- [ ] Apply: When a term is overloaded, qualify it with the bounded context
- [ ] Apply: Rename code when the language changesâ€”do not keep old code names

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Technical Language in Code
- [ ] Prevent: No Glossary
- [ ] Prevent: Homonym Confusion
- [ ] Prevent: Synonym Confusion
- [ ] Prevent: Expert-Developer Language Gap
- [ ] Prevent: Frozen Language

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
- Use the same term everywhere in code, database, events, and UI for the same domain concept
- Evolve the language with domain expertsâ€”it belongs to them, not developers
- When a term is overloaded, qualify it with the bounded context
- Rename code when the language changesâ€”do not keep old code names
- Use the language in conversations and documentationâ€”not just in code
## Anti-Patterns
- Technical Language in Code
- No Glossary
- Homonym Confusion
- Synonym Confusion
- Expert-Developer Language Gap
- Frozen Language
## Skills
- Establish and Enforce Ubiquitous Language


