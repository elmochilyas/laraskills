# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Cohesion types and measurement
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Keep LCOM4 at 1 (cohesive) for non-infrastructure classes; investigate values > 2
- [ ] Apply rule: Prefer high-cohesion (functional cohesion) over sequential or communicational cohesion
- [ ] Apply rule: Use the "Single Responsibility Prompt" test to evaluate class cohesion
- [ ] Apply rule: Extract methods or classes when they use different subsets of fields
- [ ] Prevent anti-pattern: Utility/Helper Classes
- [ ] Prevent anti-pattern: God Class
- [ ] Prevent anti-pattern: "Manager" Classes
- [ ] LCOM4 measured and flagged per class
- [ ] Classes with LCOM4 > 2 have refactoring plans
- [ ] Single Responsibility Prompt test applied
- [ ] Disjoint field usage identified and extracted
- [ ] Coupling not sacrificed for cohesion

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Prefer high-cohesion (functional cohesion) over sequential or communicational cohesion
- [ ] Use the "Single Responsibility Prompt" test to evaluate class cohesion
- [ ] Extract methods or classes when they use different subsets of fields
- [ ] Do not sacrifice coupling quality to improve cohesion artificially
- [ ] Evaluate: When to split a class based on cohesion measurement
- [ ] Evaluate: Appropriate cohesion level per class type
- [ ] Evaluate: Balancing cohesion vs coupling when splitting classes

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Keep LCOM4 at 1 (cohesive) for non-infrastructure classes; investigate values > 2
- [ ] Follow rule: Prefer high-cohesion (functional cohesion) over sequential or communicational cohesion
- [ ] Follow rule: Use the "Single Responsibility Prompt" test to evaluate class cohesion
- [ ] Follow rule: Extract methods or classes when they use different subsets of fields
- [ ] Follow rule: Do not sacrifice coupling quality to improve cohesion artificially
- [ ] - [ ] LCOM4 measured and flagged per class
- [ ] - [ ] Classes with LCOM4 > 2 have refactoring plans
- [ ] - [ ] Single Responsibility Prompt test applied
- [ ] - [ ] Disjoint field usage identified and extracted

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
- [ ] Ensure: Cohesion measures how closely the responsibilities of a module are related. High...
- [ ] Verify: Keep LCOM4 at 1 (cohesive) for non-infrastructure classes; investigate values > 2
- [ ] Verify: Prefer high-cohesion (functional cohesion) over sequential or communicational cohesion
- [ ] Verify: Use the "Single Responsibility Prompt" test to evaluate class cohesion
- [ ] Verify: Extract methods or classes when they use different subsets of fields

# Testing Checklist
- [ ] LCOM4 measured and flagged per class
- [ ] Classes with LCOM4 > 2 have refactoring plans
- [ ] Single Responsibility Prompt test applied
- [ ] Disjoint field usage identified and extracted
- [ ] Coupling not sacrificed for cohesion
- [ ] Utility classes with coincidental cohesion are eliminated

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Keep LCOM4 at 1 (cohesive) for non-infrastructure classes; investigate values > 2
- [ ] Apply: Prefer high-cohesion (functional cohesion) over sequential or communicational cohesion
- [ ] Apply: Use the "Single Responsibility Prompt" test to evaluate class cohesion
- [ ] Apply: Extract methods or classes when they use different subsets of fields

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Utility/Helper Classes
- [ ] Prevent: God Class
- [ ] Prevent: "Manager" Classes
- [ ] Prevent: Only Measuring Coupling
- [ ] Prevent: False High Cohesion
- [ ] Prevent: Siloed Classes

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
- Keep LCOM4 at 1 (cohesive) for non-infrastructure classes; investigate values > 2
- Prefer high-cohesion (functional cohesion) over sequential or communicational cohesion
- Use the "Single Responsibility Prompt" test to evaluate class cohesion
- Extract methods or classes when they use different subsets of fields
- Do not sacrifice coupling quality to improve cohesion artificially
## Anti-Patterns
- Utility/Helper Classes
- God Class
- "Manager" Classes
- Only Measuring Coupling
- False High Cohesion
- Siloed Classes
## Skills
- Measure and Improve Cohesion


