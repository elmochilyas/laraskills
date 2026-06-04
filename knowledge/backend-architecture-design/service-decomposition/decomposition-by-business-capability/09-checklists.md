# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Decomposition by business capability vs subdomain
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Decompose by business capability, not by technical function
- [ ] Apply rule: Each business capability owns its full vertical stack
- [ ] Apply rule: Align team boundaries with capability boundaries (Conway's Law)
- [ ] Apply rule: Start with coarse-grained capabilities and split as they grow
- [ ] Prevent anti-pattern: Everything Is Core**: Treating all subdomains with equal investment, overspending on commodity features
- [ ] Prevent anti-pattern: Technical Decomposition**: Splitting services by technical layers (frontend, backend, DB) instead of business capabilities
- [ ] Prevent anti-pattern: Over-Decomposition Syndrome**: Creating too many services that become a distributed monolith

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Decompose by business capability, not by technical function
- [ ] Each business capability owns its full vertical stack
- [ ] Align team boundaries with capability boundaries (Conway's Law)
- [ ] Start with coarse-grained capabilities and split as they grow
- [ ] Define explicit capability interfaces (ports) for cross-capability communication
- [ ] Evaluate: Decomposition strategy â€” business capability vs DDD subdomain
- [ ] Evaluate: Service granularity â€” coarse vs fine decomposition
- [ ] Evaluate: Hybrid approach â€” core vs supporting/generic treatment

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Decompose by business capability, not by technical function
- [ ] Follow rule: Each business capability owns its full vertical stack
- [ ] Follow rule: Align team boundaries with capability boundaries (Conway's Law)
- [ ] Follow rule: Start with coarse-grained capabilities and split as they grow
- [ ] Follow rule: Define explicit capability interfaces (ports) for cross-capability communication

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
- [ ] Ensure: Two primary strategies drive service decomposition: business capabilities (what ...
- [ ] Verify: Decompose by business capability, not by technical function
- [ ] Verify: Each business capability owns its full vertical stack
- [ ] Verify: Align team boundaries with capability boundaries (Conway's Law)
- [ ] Verify: Start with coarse-grained capabilities and split as they grow

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Decompose by business capability, not by technical function
- [ ] Apply: Each business capability owns its full vertical stack
- [ ] Apply: Align team boundaries with capability boundaries (Conway's Law)
- [ ] Apply: Start with coarse-grained capabilities and split as they grow

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Everything Is Core**: Treating all subdomains with equal investment, overspending on commodity features
- [ ] Prevent: Technical Decomposition**: Splitting services by technical layers (frontend, backend, DB) instead of business capabilities
- [ ] Prevent: Over-Decomposition Syndrome**: Creating too many services that become a distributed monolith

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
- Decompose by business capability, not by technical function
- Each business capability owns its full vertical stack
- Align team boundaries with capability boundaries (Conway's Law)
- Start with coarse-grained capabilities and split as they grow
- Define explicit capability interfaces (ports) for cross-capability communication
## Anti-Patterns
- Everything Is Core**: Treating all subdomains with equal investment, overspending on commodity features
- Technical Decomposition**: Splitting services by technical layers (frontend, backend, DB) instead of business capabilities
- Over-Decomposition Syndrome**: Creating too many services that become a distributed monolith
## Skills
- Decompose by Business Capability or Subdomain


