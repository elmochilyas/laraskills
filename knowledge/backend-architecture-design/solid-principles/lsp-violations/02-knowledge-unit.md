# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: SOLID principles in PHP: LSP violations
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Liskov Substitution Principle states that subtypes must be substitutable for their base types without altering the correctness of the program. In PHP, common violations include overriding methods with more restrictive preconditions (type narrowing), weaker postconditions (returning less), throwing new exceptions not thrown by base, and violating base class invariants. PHP's lack of compile-time contract enforcement means LSP violations surface at runtime, making design-by-contract thinking essential.

---

# Core Concepts

- Behavioral subtyping: subtype must satisfy base type's contract
- Preconditions cannot be strengthened: subtype cannot require more than base
- Postconditions cannot be weakened: subtype cannot guarantee less than base
- Invariants must be preserved: subtype must maintain base class invariants
- History constraint: subtype cannot allow state changes that base prohibits

---

# Mental Models

- **Square vs Rectangle**: Square extends Rectangle, but square requires equal sides while rectangle doesn't â†’ LSP violation
- **Driver's License**: Any license should work for "identify yourself" â€” but restricted licenses limit what you can do
- **Contract Law**: Subclass cannot change the terms of the contract defined by base class

---

# Common PHP/Laravel LSP Violations

- Overriding method with narrower parameter types (PHP 7.2+ strict types help detect this)
- Child class throwing exceptions parent doesn't declare
- Child class returning more specific type (covariance is OK in PHP 7.4+, contravariance is not)
- Child class violating parent's invariants (e.g., `setWidth` on Square also changes height)
- Overridden method does nothing (no-op violates "you said you'd do X")
- Eloquent model subclass that overrides base behavior incorrectly
- Collection subclass that violates parent's method contracts

---

# Detection

- Runtime exceptions from unexpected type returns
- instanceof checks for specific subtype (client knows it's not substitutable)
- Method override with `@throws` not in parent
- `is_a()` checks before calling methods
- Conditional logic based on subtype
- Tests that override methods differently for subtypes

---

# Correction Strategies

- Favor composition over inheritance
- Use interface segregation before inheritance
- Define explicit contracts (return types, parameter types)
- LSP checklist: if subclass doesn't pass `instanceof` base class test, don't inherit
- Use Traits for shared implementation, not deep inheritance
- Contract testing: test base behavior against all subtypes
- Prefer final classes with strategy injection over subclassing

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Subtype reliably usable as base type | More design effort upfront | Must think about contracts before extending |
| Runtime behavior predictable | Composition can require more code | Strategy pattern over deep inheritance |
| Tests verify contract adherence | Contract testing for all subtypes | More test code |

---

# Performance Considerations

- LSP violations: zero performance cost (they're design errors, not runtime inefficiencies)
- Composition over inheritance: one extra method call for delegation â€” negligible
- Interface contracts: PHP 8+ intersection/union types add no overhead

---

# Production Considerations

- Enforce type strictness: `declare(strict_types=1)` in all files
- Use PHPStan/Psalm level max: catch return type mismatches
- Contract tests to verify subtypes behave as expected
- Document behavioral contracts beyond type signatures
- Review inheritance chains during code review with LSP checklist

---

# Common Mistakes

- Inheriting for code reuse without checking substitutability â†’ "I want those methods"
- Overriding method with covariant return type but weaker postcondition
- Adding validation in child that base didn't have â†’ strengthens precondition
- Silent no-op: child method does nothing while base documents specific behavior
- Collection inheritance: subclassing Eloquent Collection can violate LSP

---

# Related Knowledge Units

**Prerequisites**: Inheritance, Polymorphism, Design by Contract | **Related**: Composition over Inheritance, Interface Segregation (reduce LSP surface), PHP type system (covariance/contravariance) | **Advanced**: Behavioral subtyping theory, Contract testing for LSP, PHP variance rules

---

# Internal Mechanics

The internal mechanics of lsp-violations involve several operational concerns:

1. **Resolution Strategy**: The mechanism by which components discover and invoke each other — whether through direct instantiation, dependency injection, or service location.
2. **Lifetime Management**: How instances are created, cached, and destroyed. Different scopes (transient, scoped, singleton) serve different architectural needs.
3. **Boundary Enforcement**: How architectural rules are encoded and verified — through code structure, naming conventions, static analysis, or runtime checks.
4. **Communication Protocol**: The mechanism by which separated units communicate — synchronous (HTTP, RPC) or asynchronous (events, queues, message brokers).

In Laravel, the service container, event system, and queue infrastructure provide the runtime mechanics that implement these concerns.

---

# Patterns

Several established patterns relate to lsp-violations:

| Pattern | Purpose | Application in design-patterns-principles |
|---------|---------|--------------------------|
| Strategy | Encapsulate interchangeable algorithms | Selecting behavioral variants at runtime |
| Adapter | Convert one interface to another | Bridging between architectural layers |
| Facade | Provide simplified interface to complex subsystem | Hiding architectural complexity |
| Mediator | Centralize complex communication | Coordinating between modules |
| Observer | Establish one-to-many dependency | Event-driven decoupling |

These patterns are commonly used together to create robust lsp-violations solutions in Laravel applications.

---

# Architectural Decisions

Key architectural decisions when applying lsp-violations:

| Decision | Option A | Option B | Recommendation |
|----------|----------|----------|----------------|
| Boundary granularity | Fine-grained | Coarse-grained | Start coarse, refine with evidence |
| Communication style | Synchronous | Asynchronous | Prefer async for cross-boundary communication |
| State ownership | Shared state | Isolated state | Isolated state per boundary |
| Enforcement mechanism | Convention | Automation (CI, static analysis) | Automate what matters, document the rest |
| Abstraction depth | Shallow (direct) | Deep (multi-layer) | Shallow until complexity demands depth |

---

# Failure Modes

Common failure modes when applying lsp-violations:

- **Leaky Abstraction**: Architectural boundaries that don't fully hide their implementation details, causing callers to depend on internals.
- **Boundary Erosion**: Over time, architectural boundaries weaken as shortcuts are taken, leading to increased coupling.
- **Premature Granularity**: Splitting into too many fine-grained units before understanding the domain, resulting in excessive coordination overhead.
- **Synchronous Coupling**: Using synchronous communication across boundaries that should be asynchronous, leading to cascading failures.
- **Configuration Drift**: Different environments drift in configuration, causing boundary behavior differences between environments.
- **Testing Complexity**: Architectural boundaries make testing more complex, leading to inadequate test coverage over time.

---

# Ecosystem Usage

- **Laravel Framework**: Core service container, event system, queue infrastructure provide foundational support for lsp-violations concepts.
- **Laravel Octane**: Long-running application mode changes how architectural boundaries behave — state management becomes critical.
- **PHP Static Analysis Tools**: PHPStan and Psalm can enforce architectural rules through custom rules.
- **Deptrac**: PHP tool for enforcing layer dependencies and detecting architectural violations.
- **PHPArkitect**: Architecture testing framework for verifying code structure against architectural rules.
- **Spatie Packages**: Various Spatie packages (laravel-event-sourcing, laravel-queueable-actions) provide building blocks for lsp-violations implementation.

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping — influencing architectural decisions across the ecosystem.

