# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Architecture Governance
**Knowledge Unit:** Dependency analysis and modularity metrics
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Track dependency metrics quarterly and act on negative trends
- [ ] Apply rule: Break dependency cycles immediately on detection
- [ ] Apply rule: Set explicit coupling thresholds per module and fail CI when exceeded
- [ ] Apply rule: Analyze at the module/package level, not only at the class level
- [ ] Prevent anti-pattern: Metrics Without Context
- [ ] Prevent anti-pattern: Hub Module
- [ ] Prevent anti-pattern: Dependency Cycle
- [ ] Analysis runs at module level, not just class level
- [ ] Instability and Abstractness computed per module
- [ ] Circular dependencies detected and documented
- [ ] Modules with distance > 0.3 flagged for review
- [ ] Metrics trended quarterly (not one-time)

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Break dependency cycles immediately on detection
- [ ] Set explicit coupling thresholds per module and fail CI when exceeded
- [ ] Analyze at the module/package level, not only at the class level
- [ ] Do not use metrics as rigid gates without contextual review
- [ ] Evaluate: Module-level vs class-level dependency analysis
- [ ] Evaluate: Which coupling thresholds trigger investigation vs action
- [ ] Evaluate: Which modules to refactor first based on distance from main sequence

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Track dependency metrics quarterly and act on negative trends
- [ ] Follow rule: Break dependency cycles immediately on detection
- [ ] Follow rule: Set explicit coupling thresholds per module and fail CI when exceeded
- [ ] Follow rule: Analyze at the module/package level, not only at the class level
- [ ] Follow rule: Do not use metrics as rigid gates without contextual review
- [ ] - [ ] Analysis runs at module level, not just class level
- [ ] - [ ] Instability and Abstractness computed per module
- [ ] - [ ] Circular dependencies detected and documented
- [ ] - [ ] Modules with distance > 0.3 flagged for review

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
- [ ] Ensure: Dependency analysis measures the relationships between code modules to assess co...
- [ ] Verify: Track dependency metrics quarterly and act on negative trends
- [ ] Verify: Break dependency cycles immediately on detection
- [ ] Verify: Set explicit coupling thresholds per module and fail CI when exceeded
- [ ] Verify: Analyze at the module/package level, not only at the class level

# Testing Checklist
- [ ] Analysis runs at module level, not just class level
- [ ] Instability and Abstractness computed per module
- [ ] Circular dependencies detected and documented
- [ ] Modules with distance > 0.3 flagged for review
- [ ] Metrics trended quarterly (not one-time)
- [ ] Thresholds defined per module type

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Track dependency metrics quarterly and act on negative trends
- [ ] Apply: Break dependency cycles immediately on detection
- [ ] Apply: Set explicit coupling thresholds per module and fail CI when exceeded
- [ ] Apply: Analyze at the module/package level, not only at the class level

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Metrics Without Context
- [ ] Prevent: Hub Module
- [ ] Prevent: Dependency Cycle
- [ ] Prevent: Stable Dependency
- [ ] Prevent: Ignoring Distance Metric
- [ ] Prevent: Tool Metrics Only

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
- Track dependency metrics quarterly and act on negative trends
- Break dependency cycles immediately on detection
- Set explicit coupling thresholds per module and fail CI when exceeded
- Analyze at the module/package level, not only at the class level
- Do not use metrics as rigid gates without contextual review
## Anti-Patterns
- Metrics Without Context
- Hub Module
- Dependency Cycle
- Stable Dependency
- Ignoring Distance Metric
- Tool Metrics Only
## Skills
- Perform Dependency Analysis on a Codebase


