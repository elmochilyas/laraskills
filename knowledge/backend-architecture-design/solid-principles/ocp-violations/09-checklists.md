# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** SOLID Principles
**Knowledge Unit:** SOLID principles in PHP: OCP violations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Open for extension, closed for modificationâ€”use polymorphism for new behavior
- [ ] Apply rule: Replace switch/if-else chains with Strategy pattern
- [ ] Apply rule: Use Template Method for algorithms with varying steps but fixed structure
- [ ] Apply rule: Use events to extend behavior without modifying existing code
- [ ] Prevent anti-pattern: Conditional Type Dispatch**: Switch/if-else chains on type fields that grow with each new variant
- [ ] Prevent anti-pattern: Premature Polymorphism**: Creating strategy interfaces and factories before a second implementation exists
- [ ] Prevent anti-pattern: Fragile Strategy Contracts**: Strategy interfaces that require modification when new variants are added

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Open for extension, closed for modificationâ€”use polymorphism for new behavior
- [ ] Replace switch/if-else chains with Strategy pattern
- [ ] Use Template Method for algorithms with varying steps but fixed structure
- [ ] Use events to extend behavior without modifying existing code
- [ ] Make extension points explicit and documented
- [ ] Evaluate: Conditional replacement strategy â€” strategy pattern vs pipeline vs events
- [ ] Evaluate: Abstraction timing â€” when to introduce OCP-compliant abstractions
- [ ] Evaluate: Strategy selection and registration â€” tagged services vs factory vs registry

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Open for extension, closed for modificationâ€”use polymorphism for new behavior
- [ ] Follow rule: Replace switch/if-else chains with Strategy pattern
- [ ] Follow rule: Use Template Method for algorithms with varying steps but fixed structure
- [ ] Follow rule: Use events to extend behavior without modifying existing code
- [ ] Follow rule: Make extension points explicit and documented

# Performance Checklist
- Strategy pattern: method call overhead â€” negligible
- Service container tag resolution: array iteration over tagged services
- Pipeline: additional method calls per pipe
- No significant performance difference from OCP-compliant code

# Security Checklist
- **Input validation at boundaries**: Validate all data entering the domain layer, regardless of source (HTTP, queue, CLI)
- **Output sanitization**: Sanitize data leaving the domain for the presentation layer
- **Authentication/Authorization gates**: Apply security checks at architectural boundaries, not inside domain logic
- **Dependency isolation**: Anti-corruption layers prevent security vulnerabilities in third-party code from propagating
- **Event data leakage**: Ensure domain events don't expose sensitive data to unauthorized consumers
- **Command validation**: Validate commands before dispatch to prevent injection attacks
- **Rate limiting at entry points**: Apply throttling at architectural entry points (controllers, queue workers)

# Reliability Checklist
- [ ] Ensure: Open-Closed Principle states classes should be open for extension but closed for...
- [ ] Verify: Open for extension, closed for modificationâ€”use polymorphism for new behavior
- [ ] Verify: Replace switch/if-else chains with Strategy pattern
- [ ] Verify: Use Template Method for algorithms with varying steps but fixed structure
- [ ] Verify: Use events to extend behavior without modifying existing code

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Open for extension, closed for modificationâ€”use polymorphism for new behavior
- [ ] Apply: Replace switch/if-else chains with Strategy pattern
- [ ] Apply: Use Template Method for algorithms with varying steps but fixed structure
- [ ] Apply: Use events to extend behavior without modifying existing code

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Conditional Type Dispatch**: Switch/if-else chains on type fields that grow with each new variant
- [ ] Prevent: Premature Polymorphism**: Creating strategy interfaces and factories before a second implementation exists
- [ ] Prevent: Fragile Strategy Contracts**: Strategy interfaces that require modification when new variants are added

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
- Open for extension, closed for modificationâ€”use polymorphism for new behavior
- Replace switch/if-else chains with Strategy pattern
- Use Template Method for algorithms with varying steps but fixed structure
- Use events to extend behavior without modifying existing code
- Make extension points explicit and documented
## Anti-Patterns
- Conditional Type Dispatch**: Switch/if-else chains on type fields that grow with each new variant
- Premature Polymorphism**: Creating strategy interfaces and factories before a second implementation exists
- Fragile Strategy Contracts**: Strategy interfaces that require modification when new variants are added
## Skills
- Detect and Fix Open-Closed Principle Violations


