# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Repository (Fowler) in PHP/Laravel context
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Repository mediates between domain and data mapping layers, acting like an in-memory domain object collection. It provides collection-style access to domain objects while hiding storage details. In Laravel, the Repository pattern is controversial: Eloquent already provides similar abstraction (ActiveRecord with query builder), leading to debate about whether Repository adds value or unnecessary indirection. The correct answer depends on complexity: use Repository when you need to abstract storage (multiple backends, complex queries, domain persistence ignorance) or when Eloquent's ActiveRecord coupling is problematic.

---

# Core Concepts

- Collection-like interface: `find()`, `findAll()`, `add()`, `remove()`
- Hides storage: callers don't know about DB, cache, API
- Domain focus: returns domain objects, not DB rows
- Query specification: encapsulates complex queries
- Persistence ignorance: domain layer depends on repository interface

---

# Mental Models

- **Library Catalog**: You search the catalog (Repository) without knowing where books are stored
- **Collection Proxy**: Repository behaves like an in-memory Collection backed by persistent storage
- **Abstraction Boundary**: Changes to storage don't affect domain code

---

# Internal Mechanics

Repository interface lives in domain layer. Concrete implementation (e.g., EloquentRepository) lives in infrastructure layer and maps between Eloquent models and domain objects. Methods typically: accept specification/ID, query underlying store, construct domain objects, return them. Laravel container binds interface to concrete implementation for dependency injection.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Collection-style | Standard CRUD interface | Familiar API, testable | May not fit all query needs |
| Criterion/Specification | Encapsulated query criteria | Composable queries | More classes, query flexibility |
| Caching Repository | Decorator over repository | Transparent caching | Cache invalidation complexity |
| Eloquent Repository | Wraps Eloquent model | Leverages Eloquent power | Couples to Eloquent anyway |

---

# Architectural Decisions

- Use Repository when: you need storage abstraction (swap DB, add caching, test in isolation)
- Use Repository when: your domain model is separate from Eloquent (Hexagonal/Clean)
- Use Repository when: you need complex query encapsulation
- Skip Repository for: simple CRUD apps where Eloquent suffices
- Skip Repository for: teams not ready for abstraction overhead
- Consider: repository interface per aggregate root, not per table

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Storage abstraction | Additional code and interfaces | More maintenance |
| Testable without DB | Mock setup complexity | Tests may pass but integration fails |
| Domain persistence ignorance | Mapping overhead between domain and ORM | Performance: domain objects != DB rows |
| Complex query encapsulation | Specification explosion for unique queries | Many small classes |
| Swappable implementations (cache, mock) | Rarely actually swapped | YAGNI violation |

---

# Performance Considerations

- Repository adds mapping overhead between DB rows and domain objects
- Eloquent Repository: unnecessary if domain model IS Eloquent (double abstraction)
- Query optimization: repository can hide query complexity but also hide query performance
- Eager loading: repository must expose loading strategy or default to lazy
- For read-heavy operations, consider separate read repository (CQRS)

---

# Production Considerations

- Repository should return types, not arrays
- Consider read vs write repository separation for complex domains
- Monitor repository method performance — they often become hot paths
- Test repository integration with actual DB, not just mocked
- Document query expectations (which relations are eager-loaded, what indexes are needed)

---

# Common Mistakes

- Repository that mirrors Eloquent methods exactly → no abstraction benefit, just wrapping
- Repository returning Eloquent models → domain layer still coupled to Eloquent
- Generic repository interface (IRepository<T>) → PHP generics limitations, overly generic
- Repository for every model → unnecessary abstraction for every table
- Repository methods that return different types conditionally → unpredictable

---

# Failure Modes

- **N+1 through repository**: repository lazy-loads relations → unexpected queries
- **Repository interface too generic**: every query goes through `findBy(criteria)` → no type safety
- **ORM leak**: repository exposes query builder → callers couple to ORM anyway
- **Mock mismatch**: mocked repository returns different data than real implementation → tests pass, prod fails
- **Transaction confusion**: repository methods auto-commit → cannot participate in larger transactions

---

# Ecosystem Usage

- **Laravel Eloquent**: ActiveRecord pattern, not Repository — but often wrapped in Repository pattern by developers
- **Doctrine ORM**: has built-in Repository pattern support
- **Spatie/laravel-repository-pattern**: package for repository pattern in Laravel
- **Laravel community**: divided between "always use Repository" and "never use Repository"

---

# Related Knowledge Units

**Prerequisites**: Dependency Inversion Principle, Interface segregation | **Related**: Data Mapper (full ORM mapping vs collection abstraction), Unit of Work (transaction tracking), Domain Model (what repository returns) | **Advanced**: CQRS read vs write repositories, Specification pattern for queries, Hybrid approaches (Eloquent + Repository at boundaries)

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

