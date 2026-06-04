# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** SOLID Principles
**Knowledge Unit:** SOLID principles in PHP: DIP violations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: High-level modules must not depend on low-level modules; both depend on abstractions
- [ ] Apply rule: Inject dependencies through constructorsâ€”never instantiate or resolve inside the class
- [ ] Apply rule: Define abstractions in the domain/application layer, not in infrastructure
- [ ] Apply rule: Use composition root to wire abstractions to concretions
- [ ] Prevent anti-pattern: Eloquent in Domain**: Eloquent model dependencies in domain services and business logic
- [ ] Prevent anti-pattern: Wrong-Ownership Interface**: Interfaces defined in infrastructure layer that domain code depends on
- [ ] Prevent anti-pattern: Illuminate Coupling**: Domain layer depending on Laravel's `Illuminate\Contracts` or facades

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] High-level modules must not depend on low-level modules; both depend on abstractions
- [ ] Inject dependencies through constructorsâ€”never instantiate or resolve inside the class
- [ ] Define abstractions in the domain/application layer, not in infrastructure
- [ ] Use composition root to wire abstractions to concretions
- [ ] Do not depend on concrete classes that are volatile
- [ ] Evaluate: Abstraction timing â€” extract interface before vs after concrete implementation
- [ ] Evaluate: Interface ownership â€” domain/application layer vs infrastructure layer
- [ ] Evaluate: Dependency injection â€” constructor injection vs method injection vs service locator

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: High-level modules must not depend on low-level modules; both depend on abstractions
- [ ] Follow rule: Inject dependencies through constructorsâ€”never instantiate or resolve inside the class
- [ ] Follow rule: Define abstractions in the domain/application layer, not in infrastructure
- [ ] Follow rule: Use composition root to wire abstractions to concretions
- [ ] Follow rule: Do not depend on concrete classes that are volatile

# Performance Checklist
- DIP adds interface method dispatch (negligible)
- Repository pattern adds mapping overhead between domain and ORM
- Anti-corruption layer adds translation cost
- Dependency injection container adds resolution overhead (first call)
- No significant performance penalty when amortized across request

# Security Checklist
- **Input validation at boundaries**: Validate all data entering the domain layer, regardless of source (HTTP, queue, CLI)
- **Output sanitization**: Sanitize data leaving the domain for the presentation layer
- **Authentication/Authorization gates**: Apply security checks at architectural boundaries, not inside domain logic
- **Dependency isolation**: Anti-corruption layers prevent security vulnerabilities in third-party code from propagating
- **Event data leakage**: Ensure domain events don't expose sensitive data to unauthorized consumers
- **Command validation**: Validate commands before dispatch to prevent injection attacks
- **Rate limiting at entry points**: Apply throttling at architectural entry points (controllers, queue workers)

# Reliability Checklist
- [ ] Ensure: Dependency Inversion Principle states that high-level modules should not depend ...
- [ ] Verify: High-level modules must not depend on low-level modules; both depend on abstractions
- [ ] Verify: Inject dependencies through constructorsâ€”never instantiate or resolve inside the class
- [ ] Verify: Define abstractions in the domain/application layer, not in infrastructure
- [ ] Verify: Use composition root to wire abstractions to concretions

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: High-level modules must not depend on low-level modules; both depend on abstractions
- [ ] Apply: Inject dependencies through constructorsâ€”never instantiate or resolve inside the class
- [ ] Apply: Define abstractions in the domain/application layer, not in infrastructure
- [ ] Apply: Use composition root to wire abstractions to concretions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Eloquent in Domain**: Eloquent model dependencies in domain services and business logic
- [ ] Prevent: Wrong-Ownership Interface**: Interfaces defined in infrastructure layer that domain code depends on
- [ ] Prevent: Illuminate Coupling**: Domain layer depending on Laravel's `Illuminate\Contracts` or facades

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
- High-level modules must not depend on low-level modules; both depend on abstractions
- Inject dependencies through constructorsâ€”never instantiate or resolve inside the class
- Define abstractions in the domain/application layer, not in infrastructure
- Use composition root to wire abstractions to concretions
- Do not depend on concrete classes that are volatile
## Anti-Patterns
- Eloquent in Domain**: Eloquent model dependencies in domain services and business logic
- Wrong-Ownership Interface**: Interfaces defined in infrastructure layer that domain code depends on
- Illuminate Coupling**: Domain layer depending on Laravel's `Illuminate\Contracts` or facades
## Skills
- Detect and Fix Dependency Inversion Principle Violations


