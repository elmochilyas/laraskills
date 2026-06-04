# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: Class & Method Testing (DTO Factories)
KU Code: ku-02-class-method-testing
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
DTO test factories create Data Transfer Object instances with valid default values and per-test overrides. They eliminate repetitive DTO construction in unit tests while making test intent explicit. While Eloquent model factories are standard in Laravel, DTOs (plain PHP objects with typed properties) lack a built-in factory mechanism. Writing manual DTO factories or using builder patterns reduces test boilerplate by approximately 60% and makes test failures more readable.

# Core Concepts
- **DTO (Data Transfer Object)**: Immutable PHP object with typed properties, no business logic, used to transfer data between layers.
- **DTO factory**: A class or function that creates a valid DTO instance with sensible defaults and per-field overrides.
- **Default values vs fixture data**: DTO factories provide valid defaults. Override only fields relevant to the test.
- **`with()` pattern**: Methods that clone the DTO with the overridden value, preserving immutability.
- **Named constructors**: Some DTOs use named constructors as built-in factories.
- **Builder pattern**: Fluent interface for assembling DTOs with IDE autocompletion.

# Mental Models
- **DTO factory as simplification layer**: The factory hides construction complexity. Tests express what data they need, not how to build it.
- **Builder as named parameter emulation**: PHP lacks named arguments in constructors for arrays. The builder pattern emulates named parameters with type safety.
- **Factory as domain vocabulary**: `UserDTOFactory::new()->admin()->build()` reads as domain language, not construction code.

# Internal Mechanics
- The factory stores default values as an array. The `build()` method merges defaults with overrides using the spread operator.
- Each `with*()` method adds to the overrides array and returns `$this` for chaining.
- Immutability is maintained by creating a new DTO instance in `build()`, not by modifying an existing one.
- Named presets are implemented as methods that call `with*()` methods internally.

# Patterns
- **Builder pattern**: Fluent factory with `new()`, `with*()`, and `build()` methods.
- **Named preset pattern**: Pre-configured factory methods like `admin()`, `guest()` for common DTO variants.
- **Nested factory composition pattern**: Factories for DTOs containing other DTOs compose child factories.
- **Deterministic default pattern**: Factory defaults use fixed values, not Faker or random data.

# Architectural Decisions
- **Decision: Builder over function factory**: Builder pattern is more discoverable via IDE autocompletion and supports more complex construction logic.
- **Decision: Clone-based immutability**: Each `build()` call creates a new instance. Preserves the original factory state for reuse.
- **Decision: Deterministic defaults over random**: Fixed values make tests reproducible and assertions predictable.

# Tradeoffs
- **Factory boilerplate vs test verbosity**: A factory with 10 `with*()` methods is verbose to write but simplifies 50 test call sites.
- **Presets vs parameters**: Presets (named methods) are more readable but less flexible than parameter arrays.
- **Nested factory composition**: Composing factories is more work but produces more readable test data setup.

# Performance Considerations
- Factory overhead: <10μs per DTO. Negligible. Thousands of DTOs per test in <10ms.
- Memory: Each factory stores defaults and overrides. 100 factories in memory use <1MB.
- Builder chain overhead: Each `with*()` creates a new factory instance. PHP GC handles this efficiently.
- Comparison to Eloquent factories: 100-1000x faster (no database, no hydration, no events).

# Production Considerations
- Default data exposure: Factory defaults may contain placeholder values. Review for sensitive data.
- DTO validation bypass: Factories should create valid DTOs. Don't skip DTO constructor validation in factories.
- Factory reuse: Shared factories may be used by tests that shouldn't have access to certain DTO presets.
- Immutability enforcement: Ensure `with()` methods use `clone` to prevent mutation of original DTO.

# Common Mistakes
- **Using random data in DTO factories**: Assertion failures show different values each run; hard to debug.
- **Over-factoring simple DTOs**: Full builder class for a 2-property DTO. Factory code is longer than test code.
- **Mutating DTOs after creation**: Bypasses immutability guarantees; test doesn't match production usage.
- **Factory defaults that don't match validation**: Factory creates DTOs that pass tests but fail in production.

# Failure Modes
- Factory defaults out of sync with DTO constructor: Renamed constructor parameters break factory.
- Immutability violation: Factory returning same instance causes test pollution.
- Circular nesting: DTO factory A calling factory B which calls factory A. Stack overflow.
- Preset explosion: Too many presets make the factory hard to maintain.

# Ecosystem Usage
- The builder pattern for DTO factories is a community convention, not a framework feature.
- Spatie's `laravel-data` package provides a `Data` class that supports array construction but not built-in factories.
- Teams using Domain-Driven Design commonly create DTO factory patterns.
- Factory placement in `tests/DTOFactories/` is a community convention.

# Related Knowledge Units
- Unit testing patterns
- Value object design
- Builder pattern
- Model factory patterns
- Spatie laravel-data library

# Research Notes
- PHP 8.1+ named arguments reduce the need for DTO factories for small DTOs. Factories are most valuable for DTOs with 5+ properties or complex validation.
- The `with()` pattern for immutability is borrowed from immutable value object patterns in functional programming.
- IDE autocompletion for builder methods is a key advantage over array-based factory methods.
