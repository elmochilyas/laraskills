# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** Interface explosion vs interface starvation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Create interfaces only when there are or will be at least two implementations
- [ ] Apply rule: When you have too many small interfaces, consider merging them
- [ ] Apply rule: Replace interfaces with callables/closures for single-method contracts
- [ ] Apply rule: Provide a default implementation so consumers don't have to implement every interface
- [ ] Prevent anti-pattern: Interface Per Class
- [ ] Prevent anti-pattern: Mirror Interfaces
- [ ] Prevent anti-pattern: Interface Starvation
- [ ] All interfaces have at least two implementations (or are hexagonal ports)
- [ ] No interface exists for value objects or DTOs
- [ ] Single-method contracts use callable where possible
- [ ] Classes implementing 5+ interfaces from same context are merged
- [ ] Default/base implementations exist for multi-method interfaces

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Create interfaces only when there are or will be at least two implementations
- [ ] When you have too many small interfaces, consider merging them
- [ ] Replace interfaces with callables/closures for single-method contracts
- [ ] Don't create interfaces for value objects or DTOs
- [ ] Evaluate: Create interface vs use concrete class
- [ ] Evaluate: Merge small interfaces vs keep segregated
- [ ] Evaluate: Interface vs callable/Closure for single-method contracts

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Create interfaces only when there are or will be at least two implementations
- [ ] Follow rule: When you have too many small interfaces, consider merging them
- [ ] Follow rule: Replace interfaces with callables/closures for single-method contracts
- [ ] Follow rule: Provide a default implementation so consumers don't have to implement every interface
- [ ] Follow rule: Don't create interfaces for value objects or DTOs
- [ ] - [ ] All interfaces have at least two implementations (or are hexagonal ports)
- [ ] - [ ] No interface exists for value objects or DTOs
- [ ] - [ ] Single-method contracts use callable where possible
- [ ] - [ ] Classes implementing 5+ interfaces from same context are merged

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
- [ ] Ensure: Interface explosion creates too many fine-grained interfaces, making code hard t...
- [ ] Verify: Create interfaces only when there are or will be at least two implementations
- [ ] Verify: When you have too many small interfaces, consider merging them
- [ ] Verify: Replace interfaces with callables/closures for single-method contracts
- [ ] Verify: Provide a default implementation so consumers don't have to implement every interface

# Testing Checklist
- [ ] All interfaces have at least two implementations (or are hexagonal ports)
- [ ] No interface exists for value objects or DTOs
- [ ] Single-method contracts use callable where possible
- [ ] Classes implementing 5+ interfaces from same context are merged
- [ ] Default/base implementations exist for multi-method interfaces
- [ ] No interface uses "I" prefix (PHP convention)

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Create interfaces only when there are or will be at least two implementations
- [ ] Apply: When you have too many small interfaces, consider merging them
- [ ] Apply: Replace interfaces with callables/closures for single-method contracts
- [ ] Apply: Provide a default implementation so consumers don't have to implement every interface

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Interface Per Class
- [ ] Prevent: Mirror Interfaces
- [ ] Prevent: Interface Starvation
- [ ] Prevent: Framework Interface Dependency
- [ ] Prevent: Developer Can't Find Implementations
- [ ] Prevent: Changing SDK Breaks Everywhere
- [ ] Prevent: Can't Find Implementations
- [ ] Prevent: SDK Change Breaks Everything

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
- Create interfaces only when there are or will be at least two implementations
- When you have too many small interfaces, consider merging them
- Replace interfaces with callables/closures for single-method contracts
- Provide a default implementation so consumers don't have to implement every interface
- Don't create interfaces for value objects or DTOs
## Anti-Patterns
- Interface Per Class
- Mirror Interfaces
- Interface Starvation
- Framework Interface Dependency
- Developer Can't Find Implementations
- Changing SDK Breaks Everywhere
- Can't Find Implementations
- SDK Change Breaks Everything
## Skills
- Balance Interface Granularity


