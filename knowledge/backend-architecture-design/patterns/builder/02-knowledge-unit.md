# Metadata

Domain: Backend Architecture & Design
Subdomain: Design Patterns & Principles
Knowledge Unit: Builder pattern in PHP/Laravel context
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Builder separates the construction of a complex object from its representation, allowing the same construction process to create different representations. In Laravel, Builders appear extensively: Eloquent Query Builder for SQL construction, DTO/Data builders for test factories, and request builders for complex API calls. The pattern shines when an object has many optional parameters, when construction involves multiple steps, or when you need to create different object variants from the same construction process.

---

# Core Concepts

- Step-by-step construction: each builder method configures one aspect
- Fluent interface: methods return `$this` for chaining
- Immutable vs mutable builders: immutable returns new instance on each call, mutable mutates internal state
- Product retrieval: `build()`, `get()`, or `toX()` method produces final object
- Director: optional orchestrator that defines standard construction sequences

---

# Mental Models

- **Configuration Accumulation**: Builder collects configuration, produces object in one shot
- **Named Parameters Before PHP 8**: Builder simulates what PHP 8 named parameters now provide natively
- **Construction DSL**: Builder methods create a domain-specific language for object setup

---

# Internal Mechanics

Mutable builder stores all parameters as internal state. Each method validates and stores its parameter. `build()` performs final validation and constructs the product (often calling `new Product(...)` with accumulated state). PHP 8 promoted constructors reduce boilerplate but builder remains valuable for conditional construction logic.

---

# Patterns

| Pattern | Purpose | Benefits | Tradeoffs |
|---------|---------|----------|-----------|
| Fluent Builder | Readable object construction | Self-documenting method chains | More code than constructor |
| Immutable Builder | Safe from accidental mutation | Thread-safe, predictable | More allocations |
| Director + Builder | Standardized variants | Reusable construction sequences | Extra abstraction layer |

---

# Architectural Decisions

- Prefer PHP 8 named arguments + promoted constructor for simple objects (up to 3-4 params)
- Use Builder when: object has 5+ optional parameters with interdependencies
- Use Builder when: construction requires validation across parameters
- Use Builder when: multiple object variants share construction logic
- Builder pattern for DTOs: especially when creating from multiple data sources (array, request, API)

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Readable object construction | More code than direct construction | Higher maintenance for simple objects |
| Partial construction possible | Invalid object states during construction | build() must validate completeness |
| Construction reuse across variants | Director adds indirection | Overengineering for single use |
| Self-documenting method names | Method count grows with parameters | Interface pollution risk |

---

# Performance Considerations

- Builder allocation vs direct construction: negligible for most use cases
- Immutable builder allocates intermediate objects on each method call — measurable at 100k+ constructions/second
- Query Builder (Eloquent): builds SQL string incrementally with internal state mutations
- Test data builders: acceptable cost since they run in test environments

---

# Production Considerations

- Validate required fields in `build()` method, throw meaningful exception
- Document default values in builder docblocks
- Consider readonly properties on built objects for immutability
- Serialization: builder state is unnecessary in serialized form; product is what matters

---

# Common Mistakes

- Builder that allows invalid object states → `build()` must guard at construction time
- Builder with too many responsibilities → separate builders per product type
- Not providing defaults → caller must set every parameter even when reasonable defaults exist
- Mutable builder reused after `build()` — mutations affect already-built object
- Builder creating objects with inconsistent state (e.g., service URL without API key)

---

# Failure Modes

- **Incomplete build**: `build()` called without required parameters → runtime exception
- **Mutable state leak**: building two objects from same builder shares internal state → second object has first's settings
- **Builder explosion**: every product variant requires new builder method → unmaintainable interface

---

# Ecosystem Usage

- **Laravel Eloquent**: `Illuminate\Database\Eloquent\Builder` — query construction builder
- **Illuminate\Database\Query\Builder**: SQL query builder with fluent methods
- **Spatie/LaravelData**: `LaravelData` supports builders for test data construction
- **Test data builders**: Common pattern in test suites for creating models with specific states
- **Laravel HTTP Client**: `Illuminate\Http\Client\PendingRequest` — fluent builder for HTTP requests

---

# Related Knowledge Units

**Prerequisites**: PHP 8 named arguments, Constructor promotion | **Related**: Factory (simple creation vs complex), Prototype (cloning vs building), DTO construction patterns | **Advanced**: Immutable builders for value objects, Test data builder patterns

---

# Research Notes

2025-2026 ecosystem observations:

- **Modular Monolith Trend**: The industry is increasingly adopting modular monoliths as a starting point, deferring microservices until proven necessary. This avoids premature distribution complexity.
- **Framework-Agnostic Domain**: The push toward framework-agnostic domain layers continues. PHP 8.3+ features (readonly classes, enums, typed properties) make pure domain models more practical.
- **Static Analysis Enforcement**: PHPStan level max + custom rules is becoming the standard for architectural enforcement, replacing manual code review for structural concerns.
- **Event-Driven by Default**: Asynchronous, event-driven communication is becoming the default recommendation for cross-boundary communication, with synchronous calls treated as exceptions.
- **AI-Assisted Architecture**: LLM-based tools are increasingly used for architecture documentation, ADR generation, and boundary identification, though human judgment remains critical for nuanced decisions.
- **Octane-Aware Design**: Laravel Octane's adoption has made developers more conscious of state management, stateless services, and proper scoping � influencing architectural decisions across the ecosystem.

