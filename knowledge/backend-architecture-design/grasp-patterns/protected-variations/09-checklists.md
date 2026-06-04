# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** GRASP Patterns
**Knowledge Unit:** GRASP: Protected Variations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Shield stable core from volatile external dependencies via interfaces
- [ ] Apply rule: Encapsulate variation behind stable interfacesâ€”interfaces change less than implementations
- [ ] Apply rule: Use configuration/adapter pattern for hardware or infrastructure dependencies
- [ ] Apply rule: Use data mappers to protect the domain from schema changes
- [ ] Prevent anti-pattern: No Protection at Variation Points
- [ ] Prevent anti-pattern: Over-Protection
- [ ] Prevent anti-pattern: Wrong Protection Mechanism

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Shield stable core from volatile external dependencies via interfaces
- [ ] Encapsulate variation behind stable interfacesâ€”interfaces change less than implementations
- [ ] Use configuration/adapter pattern for hardware or infrastructure dependencies
- [ ] Use data mappers to protect the domain from schema changes
- [ ] Identify and document all protected variation points in an ADR
- [ ] Evaluate: Identify which variation points need protection
- [ ] Evaluate: Protection mechanism (interface, adapter, ACL, data mapper)
- [ ] Evaluate: Protection level (complete vs partial shielding)

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Shield stable core from volatile external dependencies via interfaces
- [ ] Follow rule: Encapsulate variation behind stable interfacesâ€”interfaces change less than implementations
- [ ] Follow rule: Use configuration/adapter pattern for hardware or infrastructure dependencies
- [ ] Follow rule: Use data mappers to protect the domain from schema changes
- [ ] Follow rule: Identify and document all protected variation points in an ADR

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
- [ ] Ensure: Protected Variations shields elements from the impact of variation in other elem...
- [ ] Verify: Shield stable core from volatile external dependencies via interfaces
- [ ] Verify: Encapsulate variation behind stable interfacesâ€”interfaces change less than implementations
- [ ] Verify: Use configuration/adapter pattern for hardware or infrastructure dependencies
- [ ] Verify: Use data mappers to protect the domain from schema changes

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Shield stable core from volatile external dependencies via interfaces
- [ ] Apply: Encapsulate variation behind stable interfacesâ€”interfaces change less than implementations
- [ ] Apply: Use configuration/adapter pattern for hardware or infrastructure dependencies
- [ ] Apply: Use data mappers to protect the domain from schema changes

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Protection at Variation Points
- [ ] Prevent: Over-Protection
- [ ] Prevent: Wrong Protection Mechanism
- [ ] Prevent: Leaky Abstraction
- [ ] Prevent: Protection Without Testing
- [ ] Prevent: Static Protection

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
- Shield stable core from volatile external dependencies via interfaces
- Encapsulate variation behind stable interfacesâ€”interfaces change less than implementations
- Use configuration/adapter pattern for hardware or infrastructure dependencies
- Use data mappers to protect the domain from schema changes
- Identify and document all protected variation points in an ADR
## Anti-Patterns
- No Protection at Variation Points
- Over-Protection
- Wrong Protection Mechanism
- Leaky Abstraction
- Protection Without Testing
- Static Protection
## Skills
- Apply the Protected Variations GRASP Pattern


