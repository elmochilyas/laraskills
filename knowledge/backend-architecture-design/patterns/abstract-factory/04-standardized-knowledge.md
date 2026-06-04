# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Abstract Factory pattern in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02
Status: Standardized

---

# Overview

Abstract Factory provides an interface for creating families of related or dependent objects without specifying their concrete classes. In Laravel, Manager classes (Cache, Queue, Mail, Filesystem) are practical implementations of Abstract Factory â€” they create driver-specific families of objects based on configuration. The pattern excels when a system must support multiple product families (database drivers, payment gateways, notification channels) with consistent creation across each family.

---

# Core Concepts
This knowledge unit addresses key concerns related to Abstract Factory pattern in PHP/Laravel context in the context of backend architecture and design for PHP/Laravel applications.


---

# When To Use
- Use when: multiple interchangeable driver families (cache, queue, mail, storage)
- Use when: payment gateway abstraction (StripeFactory, PayPalFactory)
- Use when: notification channel families (each channel needs its own formatter + transport)


---

# When NOT To Use
- Avoid for: single-product families â€” regular Factory is sufficient


---

# Best Practices

1. **Start Simple, Refactor Later**
   WHY: Premature abstraction is a primary source of architectural debt. Apply patterns only when concrete variation points emerge, not from theoretical future needs. The YAGNI principle applies strongly to architecture.

2. **Enforce Boundaries via Automation**
   WHY: Manual discipline degrades over time, especially as teams grow and turnover occurs. Automated checks (PHPStan rules, Deptrac) encode architecture into executable tests that run in CI, catching violations before they merge.

3. **Prefer Composition Over Inheritance**
   WHY: Composition provides runtime flexibility, reduces coupling to base class hierarchies, and avoids the fragile base class problem. Each component can be tested independently and substituted without affecting siblings.

4. **Keep the Domain Layer Framework-Agnostic**
   WHY: Framework coupling in domain logic makes upgrades painful and reduces portability. The domain should depend on interfaces defined by the application, not on framework base classes.

5. **Document Architecture Decisions**
   WHY: ADRs capture the context, alternatives, and rationale behind architectural choices. This prevents repeated debates, helps onboarding, and provides historical traceability for why the architecture is the way it is.

6. **Measure Coupling and Cohesion**
   WHY: Objective metrics (afferent/efferent coupling, instability, abstractness) provide early warning of architectural decay. Trending these metrics over time reveals when refactoring is needed before the code becomes unmanageable.

7. **Design for Change Containment**
   WHY: The best architectures make the most common changes easy and the most dangerous changes difficult. Organize code so that business rule changes affect only the domain layer, infrastructure changes affect only the adapter layer, etc.

---

# Architecture Guidelines

## Layer Organization

- Domain core: entities, value objects, domain services, domain events, repository interfaces
- Application: use cases, DTOs, command/query handlers, application services
- Infrastructure: repository implementations, HTTP clients, mail drivers, queue adapters
- UI/Framework: controllers, CLI commands, scheduled tasks, middleware

## Dependency Rule

Dependencies must point inward: Infrastructure → Application → Domain. The domain layer must have zero dependencies on frameworks or infrastructure.

## Boundary Enforcement

- Use PHPStan custom rules to prevent layer violations
- Use Deptrac for module-level dependency analysis
- Use PHPArkitect for architecture-level assertions
- Run these checks in CI, not just locally

## Communication Patterns

- Favor async communication (events, queues) across module/service boundaries
- Use sync only within the same module or when transactional consistency is required
- Document all cross-boundary communication contracts

---

# Performance Considerations

- Factory resolution overhead negligible (array lookup + closure call)
- Driver creation cost depends on driver (DB connection expensive, file system cheap)
- Cache resolved drivers per request to avoid repeated factory invocation
- Long-running processes: factory closures captured in memory; avoid capturing large scopes

---

---

# Security Considerations

- **Input validation at boundaries**: Validate all data entering the domain layer, regardless of source (HTTP, queue, CLI)
- **Output sanitization**: Sanitize data leaving the domain for the presentation layer
- **Authentication/Authorization gates**: Apply security checks at architectural boundaries, not inside domain logic
- **Dependency isolation**: Anti-corruption layers prevent security vulnerabilities in third-party code from propagating
- **Event data leakage**: Ensure domain events don't expose sensitive data to unauthorized consumers
- **Command validation**: Validate commands before dispatch to prevent injection attacks
- **Rate limiting at entry points**: Apply throttling at architectural entry points (controllers, queue workers)

---

# Common Mistakes
Each entry includes: Description, Cause, Consequence, and Better Approach.
- **Description**: Abstract Factory interface that grows with every new product â†’ violates ISP
- **Cause**: Lack of awareness or discipline in applying the pattern correctly
- **Consequence**: Reduced code quality, maintainability issues, or system fragility
- **Better**: Follow established patterns and practices documented in this knowledge unit

- **Description**: Concrete factories with shared state â†’ side effects across family creation
- **Cause**: Lack of awareness or discipline in applying the pattern correctly
- **Consequence**: Reduced code quality, maintainability issues, or system fragility
- **Better**: Follow established patterns and practices documented in this knowledge unit

- **Description**: Factory selection logic with hard-coded class names instead of config
- **Cause**: Lack of awareness or discipline in applying the pattern correctly
- **Consequence**: Reduced code quality, maintainability issues, or system fragility
- **Better**: Follow established patterns and practices documented in this knowledge unit

- **Description**: Not testing the factory selection path â†’ wrong driver used in production despite correct tests per driver
- **Cause**: Lack of awareness or discipline in applying the pattern correctly
- **Consequence**: Reduced code quality, maintainability issues, or system fragility
- **Better**: Follow established patterns and practices documented in this knowledge unit




---

# Anti-Patterns

- **Golden Hammer**: Applying the same architectural pattern to every problem regardless of context
- **Premature Distribution**: Decomposing into services before understanding domain boundaries
- **Anemic Domain Model**: Domain objects with no behavior, only getters/setters
- **Big Ball of Mud**: No coherent architecture, arbitrary dependencies
- **Lava Flow**: Dead code and abandoned experiments left in the codebase
- **Architecture by Implication**: Assuming architecture exists without explicit documentation or enforcement
- **Analysis Paralysis**: Over-analyzing architectural options without making decisions
- **Death Star**: Over-centralized architecture that creates a single point of failure
- **Distributed Monolith**: Microservices that are tightly coupled, requiring coordinated deployments

---

# Examples

## PHP/Laravel Implementation
Refer to the ecosystem usage section for implementation examples in Laravel context.


## Real-World Application

This knowledge unit applies to systems where backend architecture decisions impact maintainability, testability, and scalability. Common scenarios include:
- Enterprise Laravel applications with complex business logic
- Systems requiring long-term maintainability across multiple teams
- Applications transitioning from monolithic to modular architecture
- Greenfield projects where architectural foundation decisions are being made

---

# Related Topics

Prerequisites: Factory pattern, Interface Segregation Principle
Related: Strategy pattern (single object variation vs family variation), Service Container binding


---

# AI Agent Notes

When assisting with architecture decisions related to Abstract Factory pattern in PHP/Laravel context:

1. **Always assess context first** - Understand the application's scale, team size, and business domain before recommending architectural patterns
2. **Prefer incremental improvement** - Recommend refactoring toward better architecture rather than rewrites
3. **Highlight tradeoffs** - Every architectural decision involves tradeoffs; present both benefits and costs
4. **Reference concrete patterns** - Point to specific design patterns with code examples
5. **Consider team maturity** - Advanced patterns require team understanding and buy-in
6. **Enforce with automation** - Recommend automated architectural enforcement (PHPStan rules, CI checks)
7. **Document decisions** - Suggest ADR creation for significant architectural decisions
8. **Avoid over-engineering** - Be conservative about adding abstraction layers; YAGNI applies strongly

---

# Verification

## Automated Checks

- PHPStan level max with custom rules for layer enforcement
- Deptrac for dependency analysis and cycle detection
- PHPArkitect for architectural rule verification
- CI pipeline integration with architecture fitness functions

## Manual Review

- Architecture Decision Records (ADRs) reviewed for consistency
- Periodic architecture reviews with cross-team participation
- Code review checklists that include architectural concerns

## Metrics

- Track afferent/efferent coupling per module
- Monitor abstractness vs instability (main sequence distance)
- Measure cyclomatic complexity per architectural layer
- Trend analysis of coupling and cohesion over time
- Module dependency graphs reviewed quarterly

