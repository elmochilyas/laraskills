# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: SOLID principles in PHP: SRP violations
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Single Responsibility Principle states a class should have only one reason to change. In Laravel, the most common SRP violation is the "God Model" — Eloquent models that handle authentication, authorization, billing, notifications, and reporting in addition to persistence. The correction involves splitting responsibilities into dedicated classes (action classes, value objects, services) while keeping the model focused on persistence and core relationships.

---

# Core Concepts

- One reason to change: class should be responsible to one actor/stakeholder
- Responsibility axis: changes should stem from a single source
- Symptom: class with multiple unrelated methods
- Correction: extract responsibilities into separate classes
- Not about small classes — about cohesion

---

# Mental Models

- **Swiss Army Knife**: Does many things but none well — versus dedicated tools
- **Department Store**: One store that sells everything, versus specialized shops
- **Job Description**: "Handles everything" vs focused role

---

# Common Laravel SRP Violations

- God Eloquent model: `User` has auth, profile, billing, notifications, roles, settings
- Fat controller: handles validation, business logic, DB operations, response formatting
- Mega service class: `OrderService` with create, cancel, refund, export, notify, sync
- All-in-one event listener: handles logging, email, cache invalidation, API call
- Validation in model: model validates its own data beyond persistence rules

---

# Detection

- Class >300 lines → likely SRP violation
- Class with "and" in description (User manages auth AND profile AND billing)
- Method names from different domains (auth methods + billing methods + reporting methods)
- Constructor with 7+ dependencies → class depends on too many collaborations
- Class changes for different reasons → ask "when does this class change?"

---

# Correction Strategies

- Extract action classes: each use case gets its own class
- Separate domain roles: `AuthenticatedUser` vs `Customer` vs `BillingUser`
- Use traits with caution: traits can hide SRP violations
- Dedicated value objects: `Email`, `Money`, `Address` carry their own validation
- Observer/Listener per concern: one listener per side effect
- Form Request for validation: separate validation from controller

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Each class has clear purpose | More classes to navigate | Higher cognitive load for navigation |
| Changes isolated to one class | More files | Build/load time increases (negligible) |
| Easier to test (fewer dependencies) | More test files | Higher total test count |
| Independent evolution | More complex wiring | More dependency injection |

---

# Performance Considerations

- More classes = more autoloader lookups (negligible with OpCache)
- More constructor injection = more reflection overhead (first call only)
- Action classes: each operation loads only its dependencies
- No significant performance impact from SRP adherence

---

# Production Considerations

- Start with violation detection in CI (PHPStan custom rules, class length limits)
- Refactor incrementally — extract one responsibility at a time
- Don't over-split: action class for single use case is fine; action class per sub-operation is overengineering
- Accept some pragmatism: Eloquent model with a few scopes and accessors is acceptable

---

# Common Mistakes

- Over-splitting: 100 tiny classes for 10 responsibilities → navigation nightmare
- Extracting responsibility but keeping coupling → extracted class still depends on model
- Trait-based separation that hides dependencies → trait uses model methods implicitly
- Abandoning SRP entirely because "Laravel doesn't enforce it"

---

# Related Knowledge Units

**Prerequisites**: Cohesion, Class design | **Related**: God class anti-pattern, Action Domain pattern, Service Layer (organizes responsibilities) | **Advanced**: Responsibility-driven design, Role interfaces (ISP), Feature-based vs class-based organization

---

# Internal Mechanics

The internal mechanics of srp-violations involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other � whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified � through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate � synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to srp-violations:

| Pattern | Purpose | Application in design-patterns-principles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust srp-violations solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying srp-violations:

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Boundary granularity | Fine-grained | Coarse-grained | Start coarse, refine with evidence |
| Communication style | Synchronous | Asynchronous | Prefer async for cross-boundary communication |
| State ownership | Shared state | Isolated state | Isolated state per boundary |
| Enforcement mechanism | Convention | Automation (CI, static analysis) | Automate what matters, document the rest |
| Abstraction depth | Shallow (direct) | Deep (multi-layer) | Shallow until complexity demands depth |

---

# Failure Modes

Common failure modes when applying srp-violations:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for srp-violations concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave � state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for srp-violations implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

