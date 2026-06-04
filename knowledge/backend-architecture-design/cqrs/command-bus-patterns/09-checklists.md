# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** CQRS
**Knowledge Unit:** Command bus patterns in PHP/Laravel context
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Every command must be a named object representing a user's intent
- [ ] Apply rule: Each command must have exactly one handler
- [ ] Apply rule: Handlers must be synchronous, stateless, and return void
- [ ] Apply rule: Route commands to handlers via a single command bus abstraction
- [ ] Prevent anti-pattern: Command as CRUD Wrapper
- [ ] Prevent anti-pattern: Command Returning Data
- [ ] Prevent anti-pattern: Fat Commands
- [ ] Each command is an immutable named object representing user intent
- [ ] One-to-one mapping: one command -> one handler
- [ ] No conditional dispatch inside handlers based on command fields
- [ ] Handlers synchronous and stateless
- [ ] Transactional middleware wraps all command dispatches

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Every command must be a named object representing a user's intent
- [ ] Each command must have exactly one handler
- [ ] Handlers must be synchronous, stateless, and return void
- [ ] Route commands to handlers via a single command bus abstraction
- [ ] Evaluate: Sync vs async command dispatch
- [ ] Evaluate: Global vs per-command middleware selection
- [ ] Evaluate: Return aggregate ID vs void from command handlers

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Every command must be a named object representing a user's intent
- [ ] Follow rule: Each command must have exactly one handler
- [ ] Follow rule: Handlers must be synchronous, stateless, and return void
- [ ] Follow rule: Route commands to handlers via a single command bus abstraction
- [ ] Follow rule: Wrap every command dispatch with transactional middleware
- [ ] - [ ] Each command is an immutable named object representing user intent
- [ ] - [ ] One-to-one mapping: one command -> one handler
- [ ] - [ ] No conditional dispatch inside handlers based on command fields
- [ ] - [ ] Handlers synchronous and stateless

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
- [ ] Ensure: Command bus dispatches command objects to their handlers, optionally through mid...
- [ ] Verify: Every command must be a named object representing a user's intent
- [ ] Verify: Each command must have exactly one handler
- [ ] Verify: Handlers must be synchronous, stateless, and return void
- [ ] Verify: Route commands to handlers via a single command bus abstraction

# Testing Checklist
- [ ] Each command is an immutable named object representing user intent
- [ ] One-to-one mapping: one command -> one handler
- [ ] No conditional dispatch inside handlers based on command fields
- [ ] Handlers synchronous and stateless
- [ ] Transactional middleware wraps all command dispatches
- [ ] Controllers dispatch to bus, not directly to handlers

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Every command must be a named object representing a user's intent
- [ ] Apply: Each command must have exactly one handler
- [ ] Apply: Handlers must be synchronous, stateless, and return void
- [ ] Apply: Route commands to handlers via a single command bus abstraction

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Command as CRUD Wrapper
- [ ] Prevent: Command Returning Data
- [ ] Prevent: Fat Commands
- [ ] Prevent: No Middleware
- [ ] Prevent: Self-Handling Command Coupling
- [ ] Prevent: Mixed Bus

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
- Every command must be a named object representing a user's intent
- Each command must have exactly one handler
- Handlers must be synchronous, stateless, and return void
- Route commands to handlers via a single command bus abstraction
- Wrap every command dispatch with transactional middleware
## Anti-Patterns
- Command as CRUD Wrapper
- Command Returning Data
- Fat Commands
- No Middleware
- Self-Handling Command Coupling
- Mixed Bus
## Skills
- Implement a Command Bus


