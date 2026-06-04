# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** Read model strategies (denormalized tables, materialized views, in-memory)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Build read models via projectors listening to domain events, never via dual writes
- [ ] Apply rule: Denormalize aggressivelyâ€”read models should be query-optimized, not normalized
- [ ] Apply rule: Choose read-model storage based on query patterns, not write-model technology
- [ ] Apply rule: Keep read models eventually consistent and communicate staleness to users
- [ ] Prevent anti-pattern: Denormalization Without Need
- [ ] Prevent anti-pattern: Event-Sourced Projection for Simple Reads
- [ ] Prevent anti-pattern: Stale Read Models
- [ ] Read models built from domain events, not dual writes
- [ ] Read models are denormalized for query performance
- [ ] Storage chosen per query pattern, not defaulting to write model technology
- [ ] Staleness communicated to users when eventual consistency applies
- [ ] Projectors are idempotent (safe to replay events)

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Build read models via projectors listening to domain events, never via dual writes
- [ ] Denormalize aggressivelyâ€”read models should be query-optimized, not normalized
- [ ] Choose read-model storage based on query patterns, not write-model technology
- [ ] Keep read models eventually consistent and communicate staleness to users
- [ ] Evaluate: In-memory transformation vs denormalized table vs materialized view
- [ ] Evaluate: Read model storage technology selection (SQL vs Elasticsearch vs Redis)
- [ ] Evaluate: Acceptable staleness window per read model

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Build read models via projectors listening to domain events, never via dual writes
- [ ] Follow rule: Denormalize aggressivelyâ€”read models should be query-optimized, not normalized
- [ ] Follow rule: Choose read-model storage based on query patterns, not write-model technology
- [ ] Follow rule: Keep read models eventually consistent and communicate staleness to users
- [ ] Follow rule: Implement idempotent projectors that can replay events without duplicating data
- [ ] - [ ] Read models built from domain events, not dual writes
- [ ] - [ ] Read models are denormalized for query performance
- [ ] - [ ] Storage chosen per query pattern, not defaulting to write model technology
- [ ] - [ ] Staleness communicated to users when eventual consistency applies

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
- [ ] Ensure: Read models are data structures optimized for specific query patterns, separate ...
- [ ] Verify: Build read models via projectors listening to domain events, never via dual writes
- [ ] Verify: Denormalize aggressivelyâ€”read models should be query-optimized, not normalized
- [ ] Verify: Choose read-model storage based on query patterns, not write-model technology
- [ ] Verify: Keep read models eventually consistent and communicate staleness to users

# Testing Checklist
- [ ] Read models built from domain events, not dual writes
- [ ] Read models are denormalized for query performance
- [ ] Storage chosen per query pattern, not defaulting to write model technology
- [ ] Staleness communicated to users when eventual consistency applies
- [ ] Projectors are idempotent (safe to replay events)
- [ ] Projection lag monitored and alerted

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Build read models via projectors listening to domain events, never via dual writes
- [ ] Apply: Denormalize aggressivelyâ€”read models should be query-optimized, not normalized
- [ ] Apply: Choose read-model storage based on query patterns, not write-model technology
- [ ] Apply: Keep read models eventually consistent and communicate staleness to users

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Denormalization Without Need
- [ ] Prevent: Event-Sourced Projection for Simple Reads
- [ ] Prevent: Stale Read Models
- [ ] Prevent: No Read Model at All
- [ ] Prevent: Read Model Coupled to Write Model Schema
- [ ] Prevent: Multiple Inconsistent Read Models

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
- Build read models via projectors listening to domain events, never via dual writes
- Denormalize aggressivelyâ€”read models should be query-optimized, not normalized
- Choose read-model storage based on query patterns, not write-model technology
- Keep read models eventually consistent and communicate staleness to users
- Implement idempotent projectors that can replay events without duplicating data
## Anti-Patterns
- Denormalization Without Need
- Event-Sourced Projection for Simple Reads
- Stale Read Models
- No Read Model at All
- Read Model Coupled to Write Model Schema
- Multiple Inconsistent Read Models
## Skills
- Implement Read Model Strategies


