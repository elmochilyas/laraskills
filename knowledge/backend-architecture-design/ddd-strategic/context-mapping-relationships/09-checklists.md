# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** DDD Strategic Design
**Knowledge Unit:** Context mapping relationship patterns (Partnership, Shared Kernel, etc.)
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Document every context relationship using one of the 7 standard patterns
- [ ] Apply rule: Use ACL downstream when the upstream context's language cannot be adopted
- [ ] Apply rule: Establish a Customer-Supplier relationship when the upstream controls the schedule
- [ ] Apply rule: Avoid Shared Kernel unless the shared part is small, stable, and agreed
- [ ] Prevent anti-pattern: No Context Map
- [ ] Prevent anti-pattern: Wrong Relationship Pattern
- [ ] Prevent anti-pattern: Conformist for Innovation
- [ ] Every pair of interacting contexts has a documented mapping
- [ ] Cooperation level reflects actual team relationship
- [ ] Downstream contexts have ACLs where languages diverge
- [ ] Upstream contexts use OHS for multi-consumer APIs
- [ ] Partnership pattern used for equal, collaborative teams

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Document every context relationship using one of the 7 standard patterns
- [ ] Use ACL downstream when the upstream context's language cannot be adopted
- [ ] Establish a Customer-Supplier relationship when the upstream controls the schedule
- [ ] Avoid Shared Kernel unless the shared part is small, stable, and agreed
- [ ] Use Separate Ways when integration cost outweighs benefit
- [ ] Evaluate: Which context mapping pattern to choose
- [ ] Evaluate: ACL vs Conformist downstream integration
- [ ] Evaluate: Partnership vs Shared Kernel vs Customer-Supplier

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Document every context relationship using one of the 7 standard patterns
- [ ] Follow rule: Use ACL downstream when the upstream context's language cannot be adopted
- [ ] Follow rule: Establish a Customer-Supplier relationship when the upstream controls the schedule
- [ ] Follow rule: Avoid Shared Kernel unless the shared part is small, stable, and agreed
- [ ] Follow rule: Use Separate Ways when integration cost outweighs benefit
- [ ] - [ ] Every pair of interacting contexts has a documented mapping
- [ ] - [ ] Cooperation level reflects actual team relationship
- [ ] - [ ] Downstream contexts have ACLs where languages diverge
- [ ] - [ ] Upstream contexts use OHS for multi-consumer APIs

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
- [ ] Ensure: Context maps describe relationships between bounded contexts, defining how they ...
- [ ] Verify: Document every context relationship using one of the 7 standard patterns
- [ ] Verify: Use ACL downstream when the upstream context's language cannot be adopted
- [ ] Verify: Establish a Customer-Supplier relationship when the upstream controls the schedule
- [ ] Verify: Avoid Shared Kernel unless the shared part is small, stable, and agreed

# Testing Checklist
- [ ] Every pair of interacting contexts has a documented mapping
- [ ] Cooperation level reflects actual team relationship
- [ ] Downstream contexts have ACLs where languages diverge
- [ ] Upstream contexts use OHS for multi-consumer APIs
- [ ] Partnership pattern used for equal, collaborative teams
- [ ] Shared Kernel minimized to stable, commonly-used concepts

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Document every context relationship using one of the 7 standard patterns
- [ ] Apply: Use ACL downstream when the upstream context's language cannot be adopted
- [ ] Apply: Establish a Customer-Supplier relationship when the upstream controls the schedule
- [ ] Apply: Avoid Shared Kernel unless the shared part is small, stable, and agreed

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No Context Map
- [ ] Prevent: Wrong Relationship Pattern
- [ ] Prevent: Conformist for Innovation
- [ ] Prevent: Anti-Corruption Layer Overuse
- [ ] Prevent: Partnership Without Structure
- [ ] Prevent: Separate Ways When Integration Needed

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
- Document every context relationship using one of the 7 standard patterns
- Use ACL downstream when the upstream context's language cannot be adopted
- Establish a Customer-Supplier relationship when the upstream controls the schedule
- Avoid Shared Kernel unless the shared part is small, stable, and agreed
- Use Separate Ways when integration cost outweighs benefit
## Anti-Patterns
- No Context Map
- Wrong Relationship Pattern
- Conformist for Innovation
- Anti-Corruption Layer Overuse
- Partnership Without Structure
- Separate Ways When Integration Needed
## Skills
- Define Context Mapping Relationships


