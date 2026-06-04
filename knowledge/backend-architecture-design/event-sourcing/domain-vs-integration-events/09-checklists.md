# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Event Sourcing
**Knowledge Unit:** Domain events vs integration events distinction
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Domain events are recorded as part of the aggregate's state; integration events are published for external consumption
- [ ] Apply rule: Integration events must be versioned independently from domain events
- [ ] Apply rule: Translate domain events to integration events in a projector or publisher
- [ ] Apply rule: Integration events must be backward-compatible; use extended fields for additions
- [ ] Prevent anti-pattern: Mixing Event Types
- [ ] Prevent anti-pattern: Integration Events Too Detailed
- [ ] Prevent anti-pattern: Domain Events Across Buses
- [ ] Each event classified as domain or integration
- [ ] Domain events not published outside their context
- [ ] Integration events transformed from domain events (not raw domain events)
- [ ] Integration events have explicit versioning
- [ ] Integration event schemas are stable and consumer-compatible

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Domain events are recorded as part of the aggregate's state; integration events are published for external consumption
- [ ] Integration events must be versioned independently from domain events
- [ ] Translate domain events to integration events in a projector or publisher
- [ ] Integration events must be backward-compatible; use extended fields for additions
- [ ] Evaluate: Domain event vs integration event classification
- [ ] Evaluate: Separate event classes vs shared class for domain and integration
- [ ] Evaluate: Translation strategy from domain to integration events
- [ ] Evaluate: Integration event schema evolution and versioning approach

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Domain events are recorded as part of the aggregate's state; integration events are published for external consumption
- [ ] Follow rule: Integration events must be versioned independently from domain events
- [ ] Follow rule: Translate domain events to integration events in a projector or publisher
- [ ] Follow rule: Integration events must be backward-compatible; use extended fields for additions
- [ ] Follow rule: Store integration events in the outbox before publishing (guaranteed delivery)
- [ ] - [ ] Each event classified as domain or integration
- [ ] - [ ] Domain events not published outside their context
- [ ] - [ ] Integration events transformed from domain events (not raw domain events)
- [ ] - [ ] Integration events have explicit versioning

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
- [ ] Ensure: Domain events record something meaningful that happened in the domain (within a ...
- [ ] Verify: Domain events are recorded as part of the aggregate's state; integration events are published for external consumption
- [ ] Verify: Integration events must be versioned independently from domain events
- [ ] Verify: Translate domain events to integration events in a projector or publisher
- [ ] Verify: Integration events must be backward-compatible; use extended fields for additions

# Testing Checklist
- [ ] Each event classified as domain or integration
- [ ] Domain events not published outside their context
- [ ] Integration events transformed from domain events (not raw domain events)
- [ ] Integration events have explicit versioning
- [ ] Integration event schemas are stable and consumer-compatible
- [ ] Domain events can evolve independently within their context

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Domain events are recorded as part of the aggregate's state; integration events are published for external consumption
- [ ] Apply: Integration events must be versioned independently from domain events
- [ ] Apply: Translate domain events to integration events in a projector or publisher
- [ ] Apply: Integration events must be backward-compatible; use extended fields for additions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Mixing Event Types
- [ ] Prevent: Integration Events Too Detailed
- [ ] Prevent: Domain Events Across Buses
- [ ] Prevent: Integration Events Domains
- [ ] Prevent: No Versioning on Integration Events
- [ ] Prevent: Event Proliferation
- [ ] Prevent: Integration Events Domain Coupling

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
- Domain events are recorded as part of the aggregate's state; integration events are published for external consumption
- Integration events must be versioned independently from domain events
- Translate domain events to integration events in a projector or publisher
- Integration events must be backward-compatible; use extended fields for additions
- Store integration events in the outbox before publishing (guaranteed delivery)
## Anti-Patterns
- Mixing Event Types
- Integration Events Too Detailed
- Domain Events Across Buses
- Integration Events Domains
- No Versioning on Integration Events
- Event Proliferation
- Integration Events Domain Coupling
## Skills
- Distinguish Between Domain and Integration Events


