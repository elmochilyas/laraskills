# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Aggregate boundaries as decomposition units
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: An aggregate root is the only entry point for modifying its members
- [ ] Apply rule: Keep aggregates smallâ€”reference other aggregates by identity, not by object reference
- [ ] Apply rule: One transaction per aggregateâ€”never modify multiple aggregates in one transaction
- [ ] Apply rule: Define aggregate boundaries by consistency requirements, not by data relationships
- [ ] Prevent anti-pattern: Monolithic Aggregate**: Single aggregate containing many entities, creating performance bottlenecks and transaction conflicts
- [ ] Prevent anti-pattern: Distributed Aggregate Transaction**: Operations spanning multiple aggregates wrapped in distributed transactions
- [ ] Prevent anti-pattern: Entity References Across Aggregates**: Aggregates referencing other aggregates by object reference instead of by ID

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] An aggregate root is the only entry point for modifying its members
- [ ] Keep aggregates smallâ€”reference other aggregates by identity, not by object reference
- [ ] One transaction per aggregateâ€”never modify multiple aggregates in one transaction
- [ ] Define aggregate boundaries by consistency requirements, not by data relationships
- [ ] Publish domain events from aggregate roots for side effects
- [ ] Evaluate: Aggregate size â€” small vs large aggregates
- [ ] Evaluate: Cross-aggregate reference â€” by ID vs by object
- [ ] Evaluate: Cross-aggregate consistency â€” eventual vs distributed transaction

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: An aggregate root is the only entry point for modifying its members
- [ ] Follow rule: Keep aggregates smallâ€”reference other aggregates by identity, not by object reference
- [ ] Follow rule: One transaction per aggregateâ€”never modify multiple aggregates in one transaction
- [ ] Follow rule: Define aggregate boundaries by consistency requirements, not by data relationships
- [ ] Follow rule: Publish domain events from aggregate roots for side effects

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
- [ ] Ensure: Aggregates (from DDD tactical design) are consistency boundaries that group rela...
- [ ] Verify: An aggregate root is the only entry point for modifying its members
- [ ] Verify: Keep aggregates smallâ€”reference other aggregates by identity, not by object reference
- [ ] Verify: One transaction per aggregateâ€”never modify multiple aggregates in one transaction
- [ ] Verify: Define aggregate boundaries by consistency requirements, not by data relationships

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: An aggregate root is the only entry point for modifying its members
- [ ] Apply: Keep aggregates smallâ€”reference other aggregates by identity, not by object reference
- [ ] Apply: One transaction per aggregateâ€”never modify multiple aggregates in one transaction
- [ ] Apply: Define aggregate boundaries by consistency requirements, not by data relationships

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Monolithic Aggregate**: Single aggregate containing many entities, creating performance bottlenecks and transaction conflicts
- [ ] Prevent: Distributed Aggregate Transaction**: Operations spanning multiple aggregates wrapped in distributed transactions
- [ ] Prevent: Entity References Across Aggregates**: Aggregates referencing other aggregates by object reference instead of by ID

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
- An aggregate root is the only entry point for modifying its members
- Keep aggregates smallâ€”reference other aggregates by identity, not by object reference
- One transaction per aggregateâ€”never modify multiple aggregates in one transaction
- Define aggregate boundaries by consistency requirements, not by data relationships
- Publish domain events from aggregate roots for side effects
## Anti-Patterns
- Monolithic Aggregate**: Single aggregate containing many entities, creating performance bottlenecks and transaction conflicts
- Distributed Aggregate Transaction**: Operations spanning multiple aggregates wrapped in distributed transactions
- Entity References Across Aggregates**: Aggregates referencing other aggregates by object reference instead of by ID
## Skills
- Decompose Services Using Aggregate Boundaries


