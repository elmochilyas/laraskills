# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Event Sourcing
**Knowledge Unit:** Event sourcing components (event store, aggregates, projections, snapshots)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: An event-sourced aggregate records domain events, not state snapshots
- [ ] Apply rule: Store the event stream in an append-only storeâ€”never update or delete past events
- [ ] Apply rule: Separate event store from read models â€” store once, project many times
- [ ] Apply rule: Use upcasters for event schema evolution, not migrations
- [ ] Prevent anti-pattern: Event Store as Audit Log Only
- [ ] Prevent anti-pattern: Aggregate Too Large
- [ ] Prevent anti-pattern: Snapshot Neglect
- [ ] Event store schema captures all required metadata
- [ ] Aggregates produce and apply events correctly
- [ ] Event streams are sequential with version tracking
- [ ] Projectors update read models from events
- [ ] Snapshot strategy defined (frequency, criteria)

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] An event-sourced aggregate records domain events, not state snapshots
- [ ] Store the event stream in an append-only storeâ€”never update or delete past events
- [ ] Separate event store from read models â€” store once, project many times
- [ ] Use upcasters for event schema evolution, not migrations
- [ ] Evaluate: Event sourcing vs traditional persistence for an aggregate
- [ ] Evaluate: Event store technology (purpose-built vs relational)
- [ ] Evaluate: Projection strategy (synchronous vs asynchronous)
- [ ] Evaluate: Snapshot frequency and trigger strategy

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: An event-sourced aggregate records domain events, not state snapshots
- [ ] Follow rule: Store the event stream in an append-only storeâ€”never update or delete past events
- [ ] Follow rule: Separate event store from read models â€” store once, project many times
- [ ] Follow rule: Use upcasters for event schema evolution, not migrations
- [ ] Follow rule: Implement snapshots for aggregates with long event streams (> 100 events)
- [ ] - [ ] Event store schema captures all required metadata
- [ ] - [ ] Aggregates produce and apply events correctly
- [ ] - [ ] Event streams are sequential with version tracking
- [ ] - [ ] Projectors update read models from events

# Performance Checklist
- Append-only writes: sequential, fast (one table, no locking)
- Aggregate rebuild: O(number of events) â€” snapshot every 50-100 events for performance
- Projection catch-up: can lag behind event production
- Event store as bottleneck: single table writes can contend at high throughput
- Event size: large events increase storage and serialization cost

# Security Checklist
- **Input validation at boundaries**: Validate all data entering the domain layer, regardless of source (HTTP, queue, CLI)
- **Output sanitization**: Sanitize data leaving the domain for the presentation layer
- **Authentication/Authorization gates**: Apply security checks at architectural boundaries, not inside domain logic
- **Dependency isolation**: Anti-corruption layers prevent security vulnerabilities in third-party code from propagating
- **Event data leakage**: Ensure domain events don't expose sensitive data to unauthorized consumers
- **Command validation**: Validate commands before dispatch to prevent injection attacks
- **Rate limiting at entry points**: Apply throttling at architectural entry points (controllers, queue workers)

# Reliability Checklist
- [ ] Ensure: Event sourcing captures all state changes as an append-only sequence of events, ...
- [ ] Verify: An event-sourced aggregate records domain events, not state snapshots
- [ ] Verify: Store the event stream in an append-only storeâ€”never update or delete past events
- [ ] Verify: Separate event store from read models â€” store once, project many times
- [ ] Verify: Use upcasters for event schema evolution, not migrations

# Testing Checklist
- [ ] Event store schema captures all required metadata
- [ ] Aggregates produce and apply events correctly
- [ ] Event streams are sequential with version tracking
- [ ] Projectors update read models from events
- [ ] Snapshot strategy defined (frequency, criteria)
- [ ] Event replay can rebuild read models from scratch

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: An event-sourced aggregate records domain events, not state snapshots
- [ ] Apply: Store the event stream in an append-only storeâ€”never update or delete past events
- [ ] Apply: Separate event store from read models â€” store once, project many times
- [ ] Apply: Use upcasters for event schema evolution, not migrations

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Event Store as Audit Log Only
- [ ] Prevent: Aggregate Too Large
- [ ] Prevent: Snapshot Neglect
- [ ] Prevent: Projection Divergence
- [ ] Prevent: No Upcasters
- [ ] Prevent: Event Store Coupling

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
- An event-sourced aggregate records domain events, not state snapshots
- Store the event stream in an append-only storeâ€”never update or delete past events
- Separate event store from read models â€” store once, project many times
- Use upcasters for event schema evolution, not migrations
- Implement snapshots for aggregates with long event streams (> 100 events)
## Anti-Patterns
- Event Store as Audit Log Only
- Aggregate Too Large
- Snapshot Neglect
- Projection Divergence
- No Upcasters
- Event Store Coupling
## Skills
- Design Event Sourcing Components


