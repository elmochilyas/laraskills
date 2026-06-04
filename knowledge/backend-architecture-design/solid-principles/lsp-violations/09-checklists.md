# Metadata
**Domain:** Backend Architecture & Design
**Subdomain:** SOLID Principles
**Knowledge Unit:** SOLID principles in PHP: LSP violations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Subtypes must be substitutable for their base types without altering correctness
- [ ] Apply rule: Preconditions cannot be strengthened in subtypes
- [ ] Apply rule: Postconditions cannot be weakened in subtypes
- [ ] Apply rule: Use composition over inheritance to avoid LSP violations
- [ ] Prevent anti-pattern: Reuse-Without-Substitutability**: Inheriting purely for code reuse without ensuring behavioral substitutability
- [ ] Prevent anti-pattern: Design-by-Contract Ignorance**: Adding stronger validation in subtypes or returning weaker results without documentation
- [ ] Prevent anti-pattern: Exception Contract Leakage**: Throwing exceptions in subtypes that the base contract does not declare

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware
- [ ] Subtypes must be substitutable for their base types without altering correctness
- [ ] Preconditions cannot be strengthened in subtypes
- [ ] Postconditions cannot be weakened in subtypes
- [ ] Use composition over inheritance to avoid LSP violations
- [ ] Document the base type's contract explicitly (are there invariants?)
- [ ] Evaluate: Fix strategy â€” composition vs fixing the inheritance hierarchy
- [ ] Evaluate: Contract enforcement â€” PHPStan types vs runtime assertions
- [ ] Evaluate: Base class design â€” sealed hierarchy vs open extension

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Subtypes must be substitutable for their base types without altering correctness
- [ ] Follow rule: Preconditions cannot be strengthened in subtypes
- [ ] Follow rule: Postconditions cannot be weakened in subtypes
- [ ] Follow rule: Use composition over inheritance to avoid LSP violations
- [ ] Follow rule: Document the base type's contract explicitly (are there invariants?)

# Performance Checklist
- LSP violations: zero performance cost (they're design errors, not runtime inefficiencies)
- Composition over inheritance: one extra method call for delegation â€” negligible
- Interface contracts: PHP 8+ intersection/union types add no overhead

# Security Checklist
- **Input validation at boundaries**: Validate all data entering the domain layer, regardless of source (HTTP, queue, CLI)
- **Output sanitization**: Sanitize data leaving the domain for the presentation layer
- **Authentication/Authorization gates**: Apply security checks at architectural boundaries, not inside domain logic
- **Dependency isolation**: Anti-corruption layers prevent security vulnerabilities in third-party code from propagating
- **Event data leakage**: Ensure domain events don't expose sensitive data to unauthorized consumers
- **Command validation**: Validate commands before dispatch to prevent injection attacks
- **Rate limiting at entry points**: Apply throttling at architectural entry points (controllers, queue workers)

# Reliability Checklist
- [ ] Ensure: Liskov Substitution Principle states that subtypes must be substitutable for the...
- [ ] Verify: Subtypes must be substitutable for their base types without altering correctness
- [ ] Verify: Preconditions cannot be strengthened in subtypes
- [ ] Verify: Postconditions cannot be weakened in subtypes
- [ ] Verify: Use composition over inheritance to avoid LSP violations

# Testing Checklist
- [ ] Core logic covered by unit tests
- [ ] Boundary conditions tested
- [ ] Test doubles used appropriately

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Subtypes must be substitutable for their base types without altering correctness
- [ ] Apply: Preconditions cannot be strengthened in subtypes
- [ ] Apply: Postconditions cannot be weakened in subtypes
- [ ] Apply: Use composition over inheritance to avoid LSP violations

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Reuse-Without-Substitutability**: Inheriting purely for code reuse without ensuring behavioral substitutability
- [ ] Prevent: Design-by-Contract Ignorance**: Adding stronger validation in subtypes or returning weaker results without documentation
- [ ] Prevent: Exception Contract Leakage**: Throwing exceptions in subtypes that the base contract does not declare

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
- Subtypes must be substitutable for their base types without altering correctness
- Preconditions cannot be strengthened in subtypes
- Postconditions cannot be weakened in subtypes
- Use composition over inheritance to avoid LSP violations
- Document the base type's contract explicitly (are there invariants?)
## Anti-Patterns
- Reuse-Without-Substitutability**: Inheriting purely for code reuse without ensuring behavioral substitutability
- Design-by-Contract Ignorance**: Adding stronger validation in subtypes or returning weaker results without documentation
- Exception Contract Leakage**: Throwing exceptions in subtypes that the base contract does not declare
## Skills
- Detect and Fix Liskov Substitution Principle Violations


