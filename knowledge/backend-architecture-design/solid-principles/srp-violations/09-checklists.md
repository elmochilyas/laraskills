# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** SOLID Principles
**Knowledge Unit:** SOLID principles in PHP: SRP violations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: A class should have only one reason to change
- [ ] Apply rule: Extract unrelated methods into separate classes
- [ ] Apply rule: Infrastructure concerns (logging, caching, persistence) should be separate from business logic
- [ ] Apply rule: Apply SRP at the method level tooâ€”one method, one operation
- [ ] Prevent anti-pattern: God Model**: Eloquent models handling auth, billing, notifications, and reporting alongside persistence
- [ ] Prevent anti-pattern: Micro-Class Proliferation**: 100 tiny classes for 10 responsibilities creating navigation nightmares
- [ ] Prevent anti-pattern: Trait-as-Bandage**: Using traits to extract responsibility while keeping implicit coupling to the model

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] A class should have only one reason to change
- [ ] Extract unrelated methods into separate classes
- [ ] Infrastructure concerns (logging, caching, persistence) should be separate from business logic
- [ ] Use the "describe the class in one sentence" test
- [ ] Evaluate: Responsibility extraction â€” action classes vs service classes
- [ ] Evaluate: Responsibility granularity â€” fine vs coarse splitting
- [ ] Evaluate: SRP enforcement â€” manual discipline vs automated analysis

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: A class should have only one reason to change
- [ ] Follow rule: Extract unrelated methods into separate classes
- [ ] Follow rule: Infrastructure concerns (logging, caching, persistence) should be separate from business logic
- [ ] Follow rule: Apply SRP at the method level tooâ€”one method, one operation
- [ ] Follow rule: Use the "describe the class in one sentence" test

# Performance Checklist
- More classes = more autoloader lookups (negligible with OpCache)
- More constructor injection = more reflection overhead (first call only)
- Action classes: each operation loads only its dependencies
- No significant performance impact from SRP adherence

# Security Checklist
- **Input validation at boundaries**: Validate all data entering the domain layer, regardless of source (HTTP, queue, CLI)
- **Output sanitization**: Sanitize data leaving the domain for the presentation layer
- **Authentication/Authorization gates**: Apply security checks at architectural boundaries, not inside domain logic
- **Dependency isolation**: Anti-corruption layers prevent security vulnerabilities in third-party code from propagating
- **Event data leakage**: Ensure domain events don't expose sensitive data to unauthorized consumers
- **Command validation**: Validate commands before dispatch to prevent injection attacks
- **Rate limiting at entry points**: Apply throttling at architectural entry points (controllers, queue workers)

# Reliability Checklist
- [ ] Ensure: Single Responsibility Principle states a class should have only one reason to ch...
- [ ] Verify: A class should have only one reason to change
- [ ] Verify: Extract unrelated methods into separate classes
- [ ] Verify: Infrastructure concerns (logging, caching, persistence) should be separate from business logic
- [ ] Verify: Apply SRP at the method level tooâ€”one method, one operation

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: A class should have only one reason to change
- [ ] Apply: Extract unrelated methods into separate classes
- [ ] Apply: Infrastructure concerns (logging, caching, persistence) should be separate from business logic
- [ ] Apply: Apply SRP at the method level tooâ€”one method, one operation

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: God Model**: Eloquent models handling auth, billing, notifications, and reporting alongside persistence
- [ ] Prevent: Micro-Class Proliferation**: 100 tiny classes for 10 responsibilities creating navigation nightmares
- [ ] Prevent: Trait-as-Bandage**: Using traits to extract responsibility while keeping implicit coupling to the model

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
- A class should have only one reason to change
- Extract unrelated methods into separate classes
- Infrastructure concerns (logging, caching, persistence) should be separate from business logic
- Apply SRP at the method level tooâ€”one method, one operation
- Use the "describe the class in one sentence" test
## Anti-Patterns
- God Model**: Eloquent models handling auth, billing, notifications, and reporting alongside persistence
- Micro-Class Proliferation**: 100 tiny classes for 10 responsibilities creating navigation nightmares
- Trait-as-Bandage**: Using traits to extract responsibility while keeping implicit coupling to the model
## Skills
- Detect and Fix Single Responsibility Principle Violations


