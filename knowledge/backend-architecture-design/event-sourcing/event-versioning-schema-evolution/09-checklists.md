# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Event Sourcing
**Knowledge Unit:** Event versioning and schema evolution
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Event schemas are immutable once storedâ€”never modify published events
- [ ] Apply rule: Use upcasters to handle old event versions during read/replay
- [ ] Apply rule: Integration events must be backward-compatible and versioned in the event name
- [ ] Apply rule: Add fields as optional with defaults to maintain backward compatibility
- [ ] Prevent anti-pattern: Breaking Changes
- [ ] Prevent anti-pattern: No Backward Compatibility
- [ ] Prevent anti-pattern: Upcaster Neglect
- [ ] All events have a version field
- [ ] Additive changes preferred over breaking changes
- [ ] Breaking changes create new event versions
- [ ] Old and new handlers coexist during migration
- [ ] Upcasters/transformers handle old event versions

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Event schemas are immutable once storedâ€”never modify published events
- [ ] Use upcasters to handle old event versions during read/replay
- [ ] Integration events must be backward-compatible and versioned in the event name
- [ ] Add fields as optional with defaults to maintain backward compatibility
- [ ] Evaluate: Additive change vs new event version for a schema change
- [ ] Evaluate: Upcasting vs in-consumer version handling
- [ ] Evaluate: Integration event versioning strategy
- [ ] Evaluate: Testing strategy for schema evolution

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Event schemas are immutable once storedâ€”never modify published events
- [ ] Follow rule: Use upcasters to handle old event versions during read/replay
- [ ] Follow rule: Integration events must be backward-compatible and versioned in the event name
- [ ] Follow rule: Add fields as optional with defaults to maintain backward compatibility
- [ ] Follow rule: Test event schema evolution with consumer contract tests
- [ ] - [ ] All events have a version field
- [ ] - [ ] Additive changes preferred over breaking changes
- [ ] - [ ] Breaking changes create new event versions
- [ ] - [ ] Old and new handlers coexist during migration

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
- [ ] Ensure: Events are persistent contracts â€” once written to an event store or published ...
- [ ] Verify: Event schemas are immutable once storedâ€”never modify published events
- [ ] Verify: Use upcasters to handle old event versions during read/replay
- [ ] Verify: Integration events must be backward-compatible and versioned in the event name
- [ ] Verify: Add fields as optional with defaults to maintain backward compatibility

# Testing Checklist
- [ ] All events have a version field
- [ ] Additive changes preferred over breaking changes
- [ ] Breaking changes create new event versions
- [ ] Old and new handlers coexist during migration
- [ ] Upcasters/transformers handle old event versions
- [ ] Event evolution log maintained
- [ ] Test event schema evolution with consumer contract tests

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Event schemas are immutable once storedâ€”never modify published events
- [ ] Apply: Use upcasters to handle old event versions during read/replay
- [ ] Apply: Integration events must be backward-compatible and versioned in the event name
- [ ] Apply: Add fields as optional with defaults to maintain backward compatibility

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Breaking Changes
- [ ] Prevent: No Backward Compatibility
- [ ] Prevent: Upcaster Neglect
- [ ] Prevent: Schema Registry Avoidance
- [ ] Prevent: Event Class Deletion
- [ ] Prevent: Over-Versioning

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
- Event schemas are immutable once storedâ€”never modify published events
- Use upcasters to handle old event versions during read/replay
- Integration events must be backward-compatible and versioned in the event name
- Add fields as optional with defaults to maintain backward compatibility
- Test event schema evolution with consumer contract tests
## Anti-Patterns
- Breaking Changes
- No Backward Compatibility
- Upcaster Neglect
- Schema Registry Avoidance
- Event Class Deletion
- Over-Versioning
## Skills
- Implement Event Versioning and Schema Evolution


