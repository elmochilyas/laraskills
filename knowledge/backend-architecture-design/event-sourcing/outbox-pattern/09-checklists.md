# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Event Sourcing
**Knowledge Unit:** Outbox pattern for reliable event publishing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always write events to the outbox in the same database transaction as the aggregate change
- [ ] Apply rule: Do not send events synchronouslyâ€”pick up from outbox with a separate publisher
- [ ] Apply rule: Process outbox messages in order within the same aggregate stream
- [ ] Apply rule: Implement idempotent outbox processingâ€”at-least-once delivery with dedup
- [ ] Prevent anti-pattern: No Outbox
- [ ] Prevent anti-pattern: Outbox Without Idempotency
- [ ] Prevent anti-pattern: Polling Too Slow
- [ ] Outbox_messages table created with required columns
- [ ] Event inserted into outbox in same transaction as state change
- [ ] Background worker polls and publishes unpublished events
- [ ] Events marked as published after broker acknowledgment
- [ ] Retry mechanism for failed publications

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Evaluate: Outbox pattern vs direct publishing for event delivery
- [ ] Evaluate: Outbox polling strategy (scheduled vs continuous)
- [ ] Evaluate: Outbox cleanup strategy (delete vs mark vs archive)
- [ ] Evaluate: Dual-write consistency approach

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always write events to the outbox in the same database transaction as the aggregate change
- [ ] Follow rule: Do not send events synchronouslyâ€”pick up from outbox with a separate publisher
- [ ] Follow rule: Process outbox messages in order within the same aggregate stream
- [ ] Follow rule: Implement idempotent outbox processingâ€”at-least-once delivery with dedup
- [ ] Follow rule: Monitor outbox backlog and alert on growing delays
- [ ] - [ ] Outbox_messages table created with required columns
- [ ] - [ ] Event inserted into outbox in same transaction as state change
- [ ] - [ ] Background worker polls and publishes unpublished events
- [ ] - [ ] Events marked as published after broker acknowledgment

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
- [ ] Ensure: The Outbox pattern ensures reliable event publishing by first storing events in ...
- [ ] Verify: Always write events to the outbox in the same database transaction as the aggregate change
- [ ] Verify: Do not send events synchronouslyâ€”pick up from outbox with a separate publisher
- [ ] Verify: Process outbox messages in order within the same aggregate stream
- [ ] Verify: Implement idempotent outbox processingâ€”at-least-once delivery with dedup

# Testing Checklist
- [ ] Outbox_messages table created with required columns
- [ ] Event inserted into outbox in same transaction as state change
- [ ] Background worker polls and publishes unpublished events
- [ ] Events marked as published after broker acknowledgment
- [ ] Retry mechanism for failed publications
- [ ] Cleanup job for old published records

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always write events to the outbox in the same database transaction as the aggregate change
- [ ] Apply: Do not send events synchronouslyâ€”pick up from outbox with a separate publisher
- [ ] Apply: Process outbox messages in order within the same aggregate stream
- [ ] Apply: Implement idempotent outbox processingâ€”at-least-once delivery with dedup

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Outbox
- [ ] Prevent: Outbox Without Idempotency
- [ ] Prevent: Polling Too Slow
- [ ] Prevent: No Outbox Cleanup
- [ ] Prevent: Transactional Outbox Without Transaction
- [ ] Prevent: Outbox as Only Event Mechanism

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
- Always write events to the outbox in the same database transaction as the aggregate change
- Do not send events synchronouslyâ€”pick up from outbox with a separate publisher
- Process outbox messages in order within the same aggregate stream
- Implement idempotent outbox processingâ€”at-least-once delivery with dedup
- Monitor outbox backlog and alert on growing delays
## Anti-Patterns
- No Outbox
- Outbox Without Idempotency
- Polling Too Slow
- No Outbox Cleanup
- Transactional Outbox Without Transaction
- Outbox as Only Event Mechanism
## Skills
- Implement the Outbox Pattern


