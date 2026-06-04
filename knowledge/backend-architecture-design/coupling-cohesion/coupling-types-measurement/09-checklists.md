# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Coupling types and measurement
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Prefer content coupling â†’ stamp coupling â†’ data coupling (lowest to highest coupling)
- [ ] Apply rule: Measure and track efferent coupling (Ce) per class or module; flag values above 10
- [ ] Apply rule: Measure fan-out (Ce) and fan-in (Ca) per module; modules with low fan-in and high fan-out are unstable
- [ ] Apply rule: Break cyclic dependencies between modules immediately
- [ ] Prevent anti-pattern: Static Facade Coupling
- [ ] Prevent anti-pattern: Boolean Parameter Coupling
- [ ] Prevent anti-pattern: Fat DTO Coupling
- [ ] Ce measured per class; values > 10 flagged
- [ ] Instability computed per module
- [ ] Cyclic dependencies detected and resolved
- [ ] Law of Demeter violations identified and fixed
- [ ] Content coupling eliminated (no direct property access across modules)

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Prefer content coupling â†’ stamp coupling â†’ data coupling (lowest to highest coupling)
- [ ] Measure fan-out (Ce) and fan-in (Ca) per module; modules with low fan-in and high fan-out are unstable
- [ ] Break cyclic dependencies between modules immediately
- [ ] Use the Law of Demeter to reduce coupling depth
- [ ] Evaluate: Acceptable coupling level per coupling type taxonomy
- [ ] Evaluate: Interface abstraction vs event-driven decoupling strategy
- [ ] Evaluate: When high efferent coupling (Ce) warrants refactoring

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Prefer content coupling â†’ stamp coupling â†’ data coupling (lowest to highest coupling)
- [ ] Follow rule: Measure and track efferent coupling (Ce) per class or module; flag values above 10
- [ ] Follow rule: Measure fan-out (Ce) and fan-in (Ca) per module; modules with low fan-in and high fan-out are unstable
- [ ] Follow rule: Break cyclic dependencies between modules immediately
- [ ] Follow rule: Use the Law of Demeter to reduce coupling depth
- [ ] - [ ] Ce measured per class; values > 10 flagged
- [ ] - [ ] Instability computed per module
- [ ] - [ ] Cyclic dependencies detected and resolved
- [ ] - [ ] Law of Demeter violations identified and fixed

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
- [ ] Ensure: Coupling measures the degree of interdependence between software modules. Lower ...
- [ ] Verify: Prefer content coupling â†’ stamp coupling â†’ data coupling (lowest to highest coupling)
- [ ] Verify: Measure and track efferent coupling (Ce) per class or module; flag values above 10
- [ ] Verify: Measure fan-out (Ce) and fan-in (Ca) per module; modules with low fan-in and high fan-out are unstable
- [ ] Verify: Break cyclic dependencies between modules immediately

# Testing Checklist
- [ ] Ce measured per class; values > 10 flagged
- [ ] Instability computed per module
- [ ] Cyclic dependencies detected and resolved
- [ ] Law of Demeter violations identified and fixed
- [ ] Content coupling eliminated (no direct property access across modules)
- [ ] Common coupling (static state, globals) minimized

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Prefer content coupling â†’ stamp coupling â†’ data coupling (lowest to highest coupling)
- [ ] Apply: Measure and track efferent coupling (Ce) per class or module; flag values above 10
- [ ] Apply: Measure fan-out (Ce) and fan-in (Ca) per module; modules with low fan-in and high fan-out are unstable
- [ ] Apply: Break cyclic dependencies between modules immediately

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Static Facade Coupling
- [ ] Prevent: Boolean Parameter Coupling
- [ ] Prevent: Fat DTO Coupling
- [ ] Prevent: Content Coupling
- [ ] Prevent: Schema Coupling
- [ ] Prevent: Metric Obsession

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
- Prefer content coupling â†’ stamp coupling â†’ data coupling (lowest to highest coupling)
- Measure and track efferent coupling (Ce) per class or module; flag values above 10
- Measure fan-out (Ce) and fan-in (Ca) per module; modules with low fan-in and high fan-out are unstable
- Break cyclic dependencies between modules immediately
- Use the Law of Demeter to reduce coupling depth
## Anti-Patterns
- Static Facade Coupling
- Boolean Parameter Coupling
- Fat DTO Coupling
- Content Coupling
- Schema Coupling
- Metric Obsession
## Skills
- Measure and Reduce Coupling


