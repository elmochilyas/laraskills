# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Service Decomposition
**Knowledge Unit:** Module boundaries in monoliths
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Each module must have an explicit public API
- [ ] Apply rule: Enforce boundary rules with automated dependency analysis
- [ ] Apply rule: Module boundaries should follow bounded context boundaries
- [ ] Apply rule: Keep module interfaces small and stable
- [ ] Prevent anti-pattern: Shared Schema Coupling**: Modules sharing database tables, preventing independent evolution or extraction
- [ ] Prevent anti-pattern: Eloquent Leakage**: Modules importing each other's models directly instead of through interfaces
- [ ] Prevent anti-pattern: Big Ball of Mud**: No explicit module structure â€” all code in the `app/` directory by technical layer

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Each module must have an explicit public API
- [ ] Enforce boundary rules with automated dependency analysis
- [ ] Module boundaries should follow bounded context boundaries
- [ ] Keep module interfaces small and stable
- [ ] Module-internal code is privateâ€”treat it as an implementation detail
- [ ] Evaluate: Boundary definition â€” event storming vs code analysis vs business capability mapping
- [ ] Evaluate: Module communication pattern â€” sync vs async within monolith
- [ ] Evaluate: Boundary enforcement â€” manual discipline vs automated checks

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Each module must have an explicit public API
- [ ] Follow rule: Enforce boundary rules with automated dependency analysis
- [ ] Follow rule: Module boundaries should follow bounded context boundaries
- [ ] Follow rule: Keep module interfaces small and stable
- [ ] Follow rule: Module-internal code is privateâ€”treat it as an implementation detail

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
- [ ] Ensure: Module boundaries in monoliths define the internal structure before (or instead ...
- [ ] Verify: Each module must have an explicit public API
- [ ] Verify: Enforce boundary rules with automated dependency analysis
- [ ] Verify: Module boundaries should follow bounded context boundaries
- [ ] Verify: Keep module interfaces small and stable

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Each module must have an explicit public API
- [ ] Apply: Enforce boundary rules with automated dependency analysis
- [ ] Apply: Module boundaries should follow bounded context boundaries
- [ ] Apply: Keep module interfaces small and stable

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Shared Schema Coupling**: Modules sharing database tables, preventing independent evolution or extraction
- [ ] Prevent: Eloquent Leakage**: Modules importing each other's models directly instead of through interfaces
- [ ] Prevent: Big Ball of Mud**: No explicit module structure â€” all code in the `app/` directory by technical layer

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
- Each module must have an explicit public API
- Enforce boundary rules with automated dependency analysis
- Module boundaries should follow bounded context boundaries
- Keep module interfaces small and stable
- Module-internal code is privateâ€”treat it as an implementation detail
## Anti-Patterns
- Shared Schema Coupling**: Modules sharing database tables, preventing independent evolution or extraction
- Eloquent Leakage**: Modules importing each other's models directly instead of through interfaces
- Big Ball of Mud**: No explicit module structure â€” all code in the `app/` directory by technical layer
## Skills
- Define Module Boundaries in Monoliths


