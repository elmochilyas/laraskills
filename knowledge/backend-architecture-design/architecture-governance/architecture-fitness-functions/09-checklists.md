# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** Architecture Governance
**Knowledge Unit:** Architecture fitness functions via static analysis
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Enforce every critical architectural rule as an automated fitness function in CI
- [ ] Apply rule: Start with 3â€“5 high-value fitness functions before adding more
- [ ] Apply rule: Keep fitness functions in sync with the actual architecture
- [ ] Apply rule: Include positive guidance rules, not only negative constraints
- [ ] Prevent anti-pattern: False Positives Overload
- [ ] Prevent anti-pattern: No Baseline
- [ ] Prevent anti-pattern: Brittle Rules
- [ ] Critical architectural rules are enforced in CI, not just locally
- [ ] No false positives from outdated rules
- [ ] Fitness functions include positive guidance, not only prohibitions
- [ ] Rules incrementally introduced (start with 3-5)
- [ ] CI blocks pull requests on fitness function failure

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Enforce every critical architectural rule as an automated fitness function in CI
- [ ] Start with 3â€“5 high-value fitness functions before adding more
- [ ] Include positive guidance rules, not only negative constraints
- [ ] Evaluate: Which fitness functions to implement first
- [ ] Evaluate: PHPStan custom rules vs Deptrac vs PHPArkitect selection
- [ ] Evaluate: Fast (per-commit) vs thorough (nightly) CI pipeline separation

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Enforce every critical architectural rule as an automated fitness function in CI
- [ ] Follow rule: Start with 3â€“5 high-value fitness functions before adding more
- [ ] Follow rule: Keep fitness functions in sync with the actual architecture
- [ ] Follow rule: Include positive guidance rules, not only negative constraints
- [ ] Follow rule: Run fitness functions in CI, not just locally or on-demand
- [ ] - [ ] Critical architectural rules are enforced in CI, not just locally
- [ ] - [ ] No false positives from outdated rules
- [ ] - [ ] Fitness functions include positive guidance, not only prohibitions
- [ ] - [ ] Rules incrementally introduced (start with 3-5)

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
- [ ] Ensure: Architecture fitness functions are automated mechanisms that continuously verify...
- [ ] Verify: Enforce every critical architectural rule as an automated fitness function in CI
- [ ] Verify: Start with 3â€“5 high-value fitness functions before adding more
- [ ] Verify: Keep fitness functions in sync with the actual architecture
- [ ] Verify: Include positive guidance rules, not only negative constraints

# Testing Checklist
- [ ] Critical architectural rules are enforced in CI, not just locally
- [ ] No false positives from outdated rules
- [ ] Fitness functions include positive guidance, not only prohibitions
- [ ] Rules incrementally introduced (start with 3-5)
- [ ] CI blocks pull requests on fitness function failure
- [ ] Fitness functions updated when architecture changes

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Enforce every critical architectural rule as an automated fitness function in CI
- [ ] Apply: Start with 3â€“5 high-value fitness functions before adding more
- [ ] Apply: Keep fitness functions in sync with the actual architecture
- [ ] Apply: Include positive guidance rules, not only negative constraints

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: False Positives Overload
- [ ] Prevent: No Baseline
- [ ] Prevent: Brittle Rules
- [ ] Prevent: Only Negative Rules
- [ ] Prevent: Hidden Rules
- [ ] Prevent: No Governance Feedback

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
- Enforce every critical architectural rule as an automated fitness function in CI
- Start with 3â€“5 high-value fitness functions before adding more
- Keep fitness functions in sync with the actual architecture
- Include positive guidance rules, not only negative constraints
- Run fitness functions in CI, not just locally or on-demand
## Anti-Patterns
- False Positives Overload
- No Baseline
- Brittle Rules
- Only Negative Rules
- Hidden Rules
- No Governance Feedback
## Skills
- Implement Architecture Fitness Functions


