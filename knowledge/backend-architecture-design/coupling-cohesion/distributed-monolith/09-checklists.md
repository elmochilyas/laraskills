# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Distributed monolith anti-pattern
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Services must not share a single database â€” each service owns its data
- [ ] Apply rule: No synchronous calls across service boundaries for data that could be eventually consistent
- [ ] Apply rule: Orchestrate sagas, not distributed transactions â€” no 2PC
- [ ] Apply rule: Each service must be independently deployable without coordinated deployments
- [ ] Prevent anti-pattern: Shared Database
- [ ] Prevent anti-pattern: Synchronous Call Chains
- [ ] Prevent anti-pattern: Coordinated Deployments
- [ ] Each service owns its database schema exclusively
- [ ] Zero synchronous calls across service boundaries for eventually consistent data
- [ ] Sagas replace distributed transactions (no 2PC)
- [ ] Services can deploy independently without coordination
- [ ] Service boundaries follow bounded contexts

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Services must not share a single database â€” each service owns its data
- [ ] No synchronous calls across service boundaries for data that could be eventually consistent
- [ ] Orchestrate sagas, not distributed transactions â€” no 2PC
- [ ] Service boundaries must follow bounded contexts â€” never cut services by technical layer
- [ ] Evaluate: Microservices vs Modular Monolith vs Distributed Monolith path
- [ ] Evaluate: Synchronous vs async communication across service boundaries
- [ ] Evaluate: Shared database vs database-per-service data ownership

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Services must not share a single database â€” each service owns its data
- [ ] Follow rule: No synchronous calls across service boundaries for data that could be eventually consistent
- [ ] Follow rule: Orchestrate sagas, not distributed transactions â€” no 2PC
- [ ] Follow rule: Each service must be independently deployable without coordinated deployments
- [ ] Follow rule: Service boundaries must follow bounded contexts â€” never cut services by technical layer
- [ ] - [ ] Each service owns its database schema exclusively
- [ ] - [ ] Zero synchronous calls across service boundaries for eventually consistent data
- [ ] - [ ] Sagas replace distributed transactions (no 2PC)
- [ ] - [ ] Services can deploy independently without coordination

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
- [ ] Ensure: Distributed monolith is a system deployed as multiple services but tightly coupl...
- [ ] Verify: Services must not share a single database â€” each service owns its data
- [ ] Verify: No synchronous calls across service boundaries for data that could be eventually consistent
- [ ] Verify: Orchestrate sagas, not distributed transactions â€” no 2PC
- [ ] Verify: Each service must be independently deployable without coordinated deployments

# Testing Checklist
- [ ] Each service owns its database schema exclusively
- [ ] Zero synchronous calls across service boundaries for eventually consistent data
- [ ] Sagas replace distributed transactions (no 2PC)
- [ ] Services can deploy independently without coordination
- [ ] Service boundaries follow bounded contexts
- [ ] No shared database tables between services

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Services must not share a single database â€” each service owns its data
- [ ] Apply: No synchronous calls across service boundaries for data that could be eventually consistent
- [ ] Apply: Orchestrate sagas, not distributed transactions â€” no 2PC
- [ ] Apply: Each service must be independently deployable without coordinated deployments

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Shared Database
- [ ] Prevent: Synchronous Call Chains
- [ ] Prevent: Coordinated Deployments
- [ ] Prevent: Cross-Service Transactions
- [ ] Prevent: Technical-Split Services
- [ ] Prevent: Premature Decomposition

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
- Services must not share a single database â€” each service owns its data
- No synchronous calls across service boundaries for data that could be eventually consistent
- Orchestrate sagas, not distributed transactions â€” no 2PC
- Each service must be independently deployable without coordinated deployments
- Service boundaries must follow bounded contexts â€” never cut services by technical layer
## Anti-Patterns
- Shared Database
- Synchronous Call Chains
- Coordinated Deployments
- Cross-Service Transactions
- Technical-Split Services
- Premature Decomposition
## Skills
- Detect and Resolve a Distributed Monolith


