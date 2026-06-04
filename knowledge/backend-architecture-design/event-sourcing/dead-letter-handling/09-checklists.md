# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Event Sourcing
**Knowledge Unit:** Dead letter handling for failed projections
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Every event consumer must route unprocessable events to a dead letter queue
- [ ] Apply rule: Implement automated alerts and a recovery dashboard for DLQ events
- [ ] Apply rule: Include all metadata needed for diagnosis in the dead letter event
- [ ] Apply rule: Replay DLQ events in order after the root cause is fixed
- [ ] Prevent anti-pattern: No Dead Letter Queue
- [ ] Prevent anti-pattern: Infinite Retry Loop
- [ ] Prevent anti-pattern: DLQ Without Monitoring
- [ ] Failed events go to dead letter queue after retries exhausted
- [ ] Original event payload preserved in dead letter storage
- [ ] Error details (exception, stack trace, timestamp) captured
- [ ] Retry policy defined (count, backoff, timeout)
- [ ] Alerting configured for dead letter queue threshold

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Evaluate: Retry strategy for failed events (retry-before-DLQ vs immediate DLQ)
- [ ] Evaluate: Storage and management approach for dead letters
- [ ] Evaluate: Replay strategy after root cause fix
- [ ] Evaluate: Monitoring and alerting thresholds for DLQ

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Every event consumer must route unprocessable events to a dead letter queue
- [ ] Follow rule: Implement automated alerts and a recovery dashboard for DLQ events
- [ ] Follow rule: Include all metadata needed for diagnosis in the dead letter event
- [ ] Follow rule: Replay DLQ events in order after the root cause is fixed
- [ ] Follow rule: Distinguish between transient failures (retry) and permanent failures (DLQ)
- [ ] - [ ] Failed events go to dead letter queue after retries exhausted
- [ ] - [ ] Original event payload preserved in dead letter storage
- [ ] - [ ] Error details (exception, stack trace, timestamp) captured
- [ ] - [ ] Retry policy defined (count, backoff, timeout)

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
- [ ] Ensure: Dead letter queue (DLQ) stores events that consumers/projections failed to proce...
- [ ] Verify: Every event consumer must route unprocessable events to a dead letter queue
- [ ] Verify: Implement automated alerts and a recovery dashboard for DLQ events
- [ ] Verify: Include all metadata needed for diagnosis in the dead letter event
- [ ] Verify: Replay DLQ events in order after the root cause is fixed

# Testing Checklist
- [ ] Failed events go to dead letter queue after retries exhausted
- [ ] Original event payload preserved in dead letter storage
- [ ] Error details (exception, stack trace, timestamp) captured
- [ ] Retry policy defined (count, backoff, timeout)
- [ ] Alerting configured for dead letter queue threshold
- [ ] Manual replay capability implemented

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Every event consumer must route unprocessable events to a dead letter queue
- [ ] Apply: Implement automated alerts and a recovery dashboard for DLQ events
- [ ] Apply: Include all metadata needed for diagnosis in the dead letter event
- [ ] Apply: Replay DLQ events in order after the root cause is fixed

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Dead Letter Queue
- [ ] Prevent: Infinite Retry Loop
- [ ] Prevent: DLQ Without Monitoring
- [ ] Prevent: Manual Only Recovery
- [ ] Prevent: DLQ as Black Hole
- [ ] Prevent: No Projection Rebuild

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
- Every event consumer must route unprocessable events to a dead letter queue
- Implement automated alerts and a recovery dashboard for DLQ events
- Include all metadata needed for diagnosis in the dead letter event
- Replay DLQ events in order after the root cause is fixed
- Distinguish between transient failures (retry) and permanent failures (DLQ)
## Anti-Patterns
- No Dead Letter Queue
- Infinite Retry Loop
- DLQ Without Monitoring
- Manual Only Recovery
- DLQ as Black Hole
- No Projection Rebuild
## Skills
- Implement Dead Letter Handling for Events


