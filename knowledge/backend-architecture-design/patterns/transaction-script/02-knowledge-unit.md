# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Transaction Script (Fowler) in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Transaction Script organizes business logic as a set of procedural scripts, one per use case or user action, where each script handles a single transaction from input to output. It is the simplest domain logic pattern, ideal for CRUD applications with straightforward business rules. Laravel controllers and action classes are natural Transaction Script hosts. The pattern's key tradeoff: simple to implement but does not scale to complex business logic — duplication emerges as rules grow.

---

# Core Concepts

- Single transaction = single procedure
- Each use case has its own script/function
- Business logic lives in procedures, not objects
- Minimal object orientation in domain logic
- Pattern relies on other patterns for data access (Table Data Gateway, Row Data Gateway)

---

# Mental Models

- **Recipe Card**: Each operation is a step-by-step procedure
- **Controller Action**: Controller method is a transaction script
- **One File Per Operation**: Each action class represents one transaction script
- **Procedural over OO**: Business logic as sequential steps, not object collaborations

---

# Internal Mechanics

Transaction Script receives input (request data, parameters), performs validation, executes business logic (often in-line), calls data source, and returns result. In Laravel, this maps to controller methods, action classes (single-invoke classes), or queued job `handle()` methods. The script is typically transactional (begin/commit/rollback) and self-contained.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Controller Method | Single HTTP use case | Simple, follows Laravel convention | Controller becomes fat if many scripts |
| Action Class | Single-use invokable class | Testable, focused, SRP | Many small classes |
| Queued Job | Background transaction script | Async execution, retry | More infrastructure |
| Service Method | Service class method | Reusable, injectable | Accumulates multiple scripts |

---

# Architectural Decisions

- Use Transaction Script for: simple CRUD applications with limited business logic
- Use for: prototypes and MVPs where speed matters
- Use for: applications where business logic is primarily data transformations
- Avoid for: complex business domains with intricate, interconnected rules
- Avoid for: domains where rules change frequently or need to be composed
- Transition path: start with Transaction Script, refactor to Domain Model as complexity grows

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simple to understand and implement | Duplication as business rules grow | Same validation logic in multiple scripts |
| Easy to test (one script = one test) | No reuse of business logic | Copy-paste maintenance burden |
| Well-supported by Laravel conventions | Domain logic mixed with infrastructure | Hard to extract into separate domain layer |
| Low ceremony, high developer velocity | No domain vocabulary in code | Ubiquitous language not enforced |

---

# Performance Considerations

- Transaction Script: minimal overhead — direct procedural execution
- Each script typically does one DB transaction
- Code duplication in scripts can lead to N+1 queries if not careful
- Easy to optimize per use case (one script, one query plan)

---

# Production Considerations

- Transaction Script + Service Layer = thin service that delegates to script
- Monitor script execution time per use case
- Ensure each script is properly transactional
- Test scripts end-to-end; refactor to Domain Model when duplication becomes painful
- Watch for thousand-line controller methods — split into action classes

---

# Common Mistakes

- Transaction Script that grows beyond 100 lines → breaking SRP
- Duplicating validation logic across multiple scripts → inconsistent rules
- Mixing UI concerns in transaction script → controller doing business logic
- Transaction script that assumes specific UI → cannot reuse for API + web
- No separation of concerns → script does validation, formatting, AND DB access

---

# Failure Modes

- **Rule inconsistency**: same rule implemented differently in two scripts → data integrity failures
- **Missing edge case**: script handles happy path but misses error scenario → silent data corruption
- **Transaction boundary too wide**: one script spans multiple operations → partial failure
- **Transaction boundary too narrow**: each DB call its own transaction → data inconsistency

---

# Ecosystem Usage

- **Laravel Controllers**: default pattern for most Laravel apps
- **Laravel Actions (lorisleiva/laravel-actions)**: single-action classes as transaction scripts
- **Repository pattern with Transaction Script**: common Laravel combination
- **Laravel Livewire**: component actions as transaction scripts

---

# Related Knowledge Units

**Prerequisites**: MVC controller pattern | **Related**: Domain Model (opposite end of complexity spectrum), Service Layer (organizes transaction scripts), Table Module (tabular logic organization) | **Advanced**: Refactoring Transaction Script to Domain Model, When to abandon Transaction Script

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

