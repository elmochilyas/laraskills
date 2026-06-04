# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Event Sourcing
**Knowledge Unit:** Event bus patterns (in-process vs message broker)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Use queues (message broker) for async integration events; use in-memory dispatch for domain events
- [ ] Apply rule: Choose event bus topology (topic exchange vs. direct exchange) based on consumer types
- [ ] Apply rule: Implement at-least-once delivery with idempotent consumers
- [ ] Apply rule: Monitor event bus latency and backlog as key health metrics
- [ ] Prevent anti-pattern: Wrong Bus Choice
- [ ] Prevent anti-pattern: No Transactional Guarantee
- [ ] Prevent anti-pattern: In-Process for Long Operations
- [ ] Event bus interface abstracts transport details
- [ ] Publishers don't know about subscribers (decoupled)
- [ ] Subscribers are idempotent where possible
- [ ] Delivery guarantee configured (at-least-once)
- [ ] Dead letter handling in place

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Use queues (message broker) for async integration events; use in-memory dispatch for domain events
- [ ] Choose event bus topology (topic exchange vs. direct exchange) based on consumer types
- [ ] Never couple event bus topology to domain classes
- [ ] Evaluate: In-process vs message broker for event dispatch
- [ ] Evaluate: Event bus topology (topic exchange vs direct exchange)
- [ ] Evaluate: Delivery guarantee (at-most-once vs at-least-once vs exactly-once)
- [ ] Evaluate: Event bus abstraction strategy

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Use queues (message broker) for async integration events; use in-memory dispatch for domain events
- [ ] Follow rule: Choose event bus topology (topic exchange vs. direct exchange) based on consumer types
- [ ] Follow rule: Implement at-least-once delivery with idempotent consumers
- [ ] Follow rule: Monitor event bus latency and backlog as key health metrics
- [ ] Follow rule: Never couple event bus topology to domain classes
- [ ] - [ ] Event bus interface abstracts transport details
- [ ] - [ ] Publishers don't know about subscribers (decoupled)
- [ ] - [ ] Subscribers are idempotent where possible
- [ ] - [ ] Delivery guarantee configured (at-least-once)

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
- [ ] Ensure: Event bus distributes events from producers to consumers. Two fundamental patter...
- [ ] Verify: Use queues (message broker) for async integration events; use in-memory dispatch for domain events
- [ ] Verify: Choose event bus topology (topic exchange vs. direct exchange) based on consumer types
- [ ] Verify: Implement at-least-once delivery with idempotent consumers
- [ ] Verify: Monitor event bus latency and backlog as key health metrics

# Testing Checklist
- [ ] Event bus interface abstracts transport details
- [ ] Publishers don't know about subscribers (decoupled)
- [ ] Subscribers are idempotent where possible
- [ ] Delivery guarantee configured (at-least-once)
- [ ] Dead letter handling in place
- [ ] Event bus health monitoring configured

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Use queues (message broker) for async integration events; use in-memory dispatch for domain events
- [ ] Apply: Choose event bus topology (topic exchange vs. direct exchange) based on consumer types
- [ ] Apply: Implement at-least-once delivery with idempotent consumers
- [ ] Apply: Monitor event bus latency and backlog as key health metrics

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Wrong Bus Choice
- [ ] Prevent: No Transactional Guarantee
- [ ] Prevent: In-Process for Long Operations
- [ ] Prevent: Message Broker for Everything
- [ ] Prevent: No Dead Letter on Broker
- [ ] Prevent: Event Ordering Assumptions

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
- Use queues (message broker) for async integration events; use in-memory dispatch for domain events
- Choose event bus topology (topic exchange vs. direct exchange) based on consumer types
- Implement at-least-once delivery with idempotent consumers
- Monitor event bus latency and backlog as key health metrics
- Never couple event bus topology to domain classes
## Anti-Patterns
- Wrong Bus Choice
- No Transactional Guarantee
- In-Process for Long Operations
- Message Broker for Everything
- No Dead Letter on Broker
- Event Ordering Assumptions
## Skills
- Implement Event Bus Patterns


