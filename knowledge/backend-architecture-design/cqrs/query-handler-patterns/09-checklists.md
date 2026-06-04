# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** Query handler patterns in PHP/Laravel context
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Each query must return data, never modify state
- [ ] Apply rule: Create specific query objects for complex queries; simple finders need only a repository method
- [ ] Apply rule: Index query handlers for performanceâ€”measure p50/p95/p99 latency
- [ ] Apply rule: Use read models / materialized views for complex queries to keep write model optimized
- [ ] Prevent anti-pattern: Query Handler with Side Effects
- [ ] Prevent anti-pattern: Fat Query Results
- [ ] Prevent anti-pattern: No Query Optimization
- [ ] Query handlers are read-only (no side effects)
- [ ] Queries return DTOs/read models, not ORM entities
- [ ] Complex queries have dedicated query objects
- [ ] Cross-aggregate queries use optimized read models
- [ ] Query monitoring in place (p50/p95/p99)

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Each query must return data, never modify state
- [ ] Create specific query objects for complex queries; simple finders need only a repository method
- [ ] Use read models / materialized views for complex queries to keep write model optimized
- [ ] Apply caching at the query handler level when data is immutable or slowly changing
- [ ] Evaluate: Dedicated query object vs repository method
- [ ] Evaluate: Return DTO vs ORM entity from query handler
- [ ] Evaluate: Cache at query handler level vs HTTP caching layer

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Each query must return data, never modify state
- [ ] Follow rule: Create specific query objects for complex queries; simple finders need only a repository method
- [ ] Follow rule: Index query handlers for performanceâ€”measure p50/p95/p99 latency
- [ ] Follow rule: Use read models / materialized views for complex queries to keep write model optimized
- [ ] Follow rule: Apply caching at the query handler level when data is immutable or slowly changing
- [ ] - [ ] Query handlers are read-only (no side effects)
- [ ] - [ ] Queries return DTOs/read models, not ORM entities
- [ ] - [ ] Complex queries have dedicated query objects
- [ ] - [ ] Cross-aggregate queries use optimized read models

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
- [ ] Ensure: Query handlers encapsulate data retrieval in dedicated classes, separating read ...
- [ ] Verify: Each query must return data, never modify state
- [ ] Verify: Create specific query objects for complex queries; simple finders need only a repository method
- [ ] Verify: Index query handlers for performanceâ€”measure p50/p95/p99 latency
- [ ] Verify: Use read models / materialized views for complex queries to keep write model optimized

# Testing Checklist
- [ ] Query handlers are read-only (no side effects)
- [ ] Queries return DTOs/read models, not ORM entities
- [ ] Complex queries have dedicated query objects
- [ ] Cross-aggregate queries use optimized read models
- [ ] Query monitoring in place (p50/p95/p99)
- [ ] Queries exceeding 500ms at p95 have caching or optimization

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Each query must return data, never modify state
- [ ] Apply: Create specific query objects for complex queries; simple finders need only a repository method
- [ ] Apply: Index query handlers for performanceâ€”measure p50/p95/p99 latency
- [ ] Apply: Use read models / materialized views for complex queries to keep write model optimized

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Query Handler with Side Effects
- [ ] Prevent: Fat Query Results
- [ ] Prevent: No Query Optimization
- [ ] Prevent: Query Handler Coupled to HTTP
- [ ] Prevent: Over-Specific Queries
- [ ] Prevent: Query Handler Doing Authorization

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
- Each query must return data, never modify state
- Create specific query objects for complex queries; simple finders need only a repository method
- Index query handlers for performanceâ€”measure p50/p95/p99 latency
- Use read models / materialized views for complex queries to keep write model optimized
- Apply caching at the query handler level when data is immutable or slowly changing
## Anti-Patterns
- Query Handler with Side Effects
- Fat Query Results
- No Query Optimization
- Query Handler Coupled to HTTP
- Over-Specific Queries
- Query Handler Doing Authorization
## Skills
- Implement Query Handlers


