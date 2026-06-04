# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Event Sourcing
**Knowledge Unit:** Choreography vs orchestration in event-driven systems
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Prefer choreography for simple workflows; switch to orchestration when complexity requires visibility
- [ ] Apply rule: Orchestrators must be stateless event handlers, not stateful services
- [ ] Apply rule: Use orchestrators for sagas that require compensating transactions
- [ ] Apply rule: Choreography services must not assume order of event delivery
- [ ] Prevent anti-pattern: Choreographed Circular Dependencies
- [ ] Prevent anti-pattern: Orchestrator as God Service
- [ ] Prevent anti-pattern: Wrong Abstraction Chosen
- [ ] All process steps identified with compensating actions
- [ ] Choreography chosen for simple, linear processes
- [ ] Orchestration chosen for complex/branching processes
- [ ] Orchestrator is stateless and idempotent
- [ ] Failure recovery path defined for each step

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Prefer choreography for simple workflows; switch to orchestration when complexity requires visibility
- [ ] Orchestrators must be stateless event handlers, not stateful services
- [ ] Use orchestrators for sagas that require compensating transactions
- [ ] Choreography services must not assume order of event delivery
- [ ] Evaluate: Choreography vs orchestration for a workflow
- [ ] Evaluate: Stateful vs stateless orchestrator
- [ ] Evaluate: Saga compensation handling strategy
- [ ] Evaluate: Ordered vs unordered event delivery assumptions

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Prefer choreography for simple workflows; switch to orchestration when complexity requires visibility
- [ ] Follow rule: Orchestrators must be stateless event handlers, not stateful services
- [ ] Follow rule: Use orchestrators for sagas that require compensating transactions
- [ ] Follow rule: Choreography services must not assume order of event delivery
- [ ] Follow rule: Monitor choreographed workflows with end-to-end distributed tracing
- [ ] - [ ] All process steps identified with compensating actions
- [ ] - [ ] Choreography chosen for simple, linear processes
- [ ] - [ ] Orchestration chosen for complex/branching processes
- [ ] - [ ] Orchestrator is stateless and idempotent

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
- [ ] Ensure: Choreography and orchestration are two patterns for coordinating distributed tra...
- [ ] Verify: Prefer choreography for simple workflows; switch to orchestration when complexity requires visibility
- [ ] Verify: Orchestrators must be stateless event handlers, not stateful services
- [ ] Verify: Use orchestrators for sagas that require compensating transactions
- [ ] Verify: Choreography services must not assume order of event delivery

# Testing Checklist
- [ ] All process steps identified with compensating actions
- [ ] Choreography chosen for simple, linear processes
- [ ] Orchestration chosen for complex/branching processes
- [ ] Orchestrator is stateless and idempotent
- [ ] Failure recovery path defined for each step
- [ ] Chosen pattern documented in an ADR

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Prefer choreography for simple workflows; switch to orchestration when complexity requires visibility
- [ ] Apply: Orchestrators must be stateless event handlers, not stateful services
- [ ] Apply: Use orchestrators for sagas that require compensating transactions
- [ ] Apply: Choreography services must not assume order of event delivery

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Choreographed Circular Dependencies
- [ ] Prevent: Orchestrator as God Service
- [ ] Prevent: Wrong Abstraction Chosen
- [ ] Prevent: No Observability in Choreography
- [ ] Prevent: Orchestrator Single Point of Failure
- [ ] Prevent: Mixed Coordination Style

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
- Prefer choreography for simple workflows; switch to orchestration when complexity requires visibility
- Orchestrators must be stateless event handlers, not stateful services
- Use orchestrators for sagas that require compensating transactions
- Choreography services must not assume order of event delivery
- Monitor choreographed workflows with end-to-end distributed tracing
## Anti-Patterns
- Choreographed Circular Dependencies
- Orchestrator as God Service
- Wrong Abstraction Chosen
- No Observability in Choreography
- Orchestrator Single Point of Failure
- Mixed Coordination Style
## Skills
- Choose Between Choreography and Orchestration for Event Flows


