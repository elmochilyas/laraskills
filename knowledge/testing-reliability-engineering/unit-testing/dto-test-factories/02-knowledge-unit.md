# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: DTO Test Factories
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
DTO test factories create Data Transfer Object instances with valid default values and per-test overrides. They eliminate repetitive DTO construction in unit tests while making test intent explicit. While Eloquent model factories (`Factory::new()->create()`) are standard in Laravel, DTOs (plain PHP objects with typed properties) lack a built-in factory mechanism. Writing manual DTO factories or using libraries like `brick/data-factory` reduces test boilerplate by ~60% and makes test failures more readable.

# Core Concepts
- **DTO (Data Transfer Object)**: Immutable PHP object with typed properties, no business logic, used to transfer data between application layers. Often used as input to actions/services.
- **DTO factories**: A class or function that creates a valid DTO instance with sensible defaults and per-field overrides via named parameters or method chaining.
- **Default values vs fixture data**: DTO factories provide valid defaults (not random data). Override only the fields relevant to the test scenario.
- **Immutability and `with()`**: DTO factories typically use `with()` methods that clone the DTO with the overridden value, preserving immutability.
- **Named constructors**: Some DTOs use named constructors (e.g., `EmailDTO::forUser($user)`) that serve as built-in factories for common scenarios.

# Mental Models
- **DTO factory as test data builder**: A builder pattern that constructs DTOs piece by piece. Each method sets one property and returns the builder for chaining.
- **Sensible defaults strategy**: Default values should be obviously valid (e.g., `'test@example.com'` for email). Invalid defaults should only appear in deliberately "invalid state" factory methods.
- **Overrides as test intent**: The fields you override in a test are the fields relevant to that test. If a test overrides 5 fields, the test probably tests too much at once.
- **DTO vs Eloquent model**: DTOs don't persist. Factories don't need to handle relationships, sequences, or database state. Simpler by an order of magnitude.

# Internal Mechanics
- **`with()` pattern**: `$dto->withName('John')->withEmail('john@test.com')` returns a new DTO instance with the modified fields. Uses `clone` to avoid mutating the original.
- **Default definition**: A DTO factory stores default values for each property. Each `build()` call creates a new DTO using defaults merged with overrides.
- **Override storage**: Overrides are stored as an array of property-value pairs. `build()` applies overrides to defaults before instantiation via named arguments.
- **PHP 8+ named arguments**: `new UserDTO(name: 'John', email: 'john@test.com')` enables concise DTO construction. DTO factories build on this with named-argument-friendly defaults.
- **Array merge strategy**: `[...$defaults, ...$overrides]` merges overrides on top of defaults. Nested DTOs require recursive merge.

# Patterns
- **Pattern: Simple function factory**
  - Purpose: Stateless function returning a valid DTO
  - Benefits: Minimal boilerplate, no class needed
  - Tradeoffs: No method-chaining convenience; overrides via `array_merge`
  - Implementation: `function validUserDTO(array $overrides = []): UserDTO { return new UserDTO(...array_merge($defaults, $overrides)); }`

- **Pattern: Builder pattern factory**
  - Purpose: Fluent interface for readability in tests
  - Benefits: IDE autocompletion, self-documenting, chaining
  - Tradeoffs: More boilerplate (one method per property)
  - Implementation: `UserDTOFactory::new()->withName('John')->withRole('admin')->build()`

- **Pattern: Factory with preset scenarios**
  - Purpose: Common DTO variants as named factory presets
  - Benefits: Standardized test data, less duplication across tests
  - Tradeoffs: Presets may not match all edge cases
  - Implementation: `UserDTOFactory::new()->admin()->build()`, `UserDTOFactory::new()->guest()->build()`

- **Pattern: Nested DTO factory composition**
  - Purpose: DTOs containing other DTOs (e.g., `OrderDTO` containing `LineItemDTO[]`)
  - Benefits: Composable factories that mirror DTO structure
  - Tradeoffs: Deep nesting can become complex
  - Implementation: `OrderDTOFactory::new()->withItems([LineItemFactory::new()->build()])`

# Architectural Decisions
- **Function vs Builder factory**: Use functions for DTOs with <5 properties. Use builders for DTOs with >5 properties or complex inheritance.
- **Factory location**: Place factories in `tests/DTOFactories/` (Pest) or within the test file (small projects). Convention: mirror the DTO namespace structure.
- **Random vs deterministic defaults**: Always use deterministic defaults (fixed strings, predictable values). Random data creates flaky tests on assertion failure.
- **Factory reuse across tests**: Share factories via traits or a `FactoryRegistry` class. Avoid duplicating factory definitions across test files.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Eliminates DTO construction boilerplate | Additional factory code to maintain | Factory maintenance is trivial for simple DTOs |
| Explicit overrides show test intent | Tests with many overrides need refactoring | Override count is a code smell indicator |
| Builder pattern is IDE-friendly | More code per DTO property | Simple function factories as alternative |
| Presets standardize common scenarios | Presets may diverge from real DTO changes | Keep presets minimal; review on DTO changes |

# Performance Considerations
- **Factory overhead**: DTO factory construction adds <10μs per DTO. Negligible. Thousands of DTOs per test still complete in <10ms.
- **Memory**: Each DTO factory instance stores default values and overrides. 100 factories in memory use <1MB.
- **Builder chain overhead**: Each `with*()` call creates a new factory instance (immutability). 10-chain call creates 10 short-lived objects. PHP's GC handles this efficiently.
- **Comparison to Eloquent factories**: DTO factories are 100-1000x faster than Eloquent factories (no database, no hydration, no events).

# Production Considerations
- **CI speed**: DTO factories add zero measurable CI overhead. They're pure CPU operations.
- **Documentation value**: DTO factory methods serve as living documentation of valid DTO structures. New team members learn DTO shape from factories.
- **Refactoring impact**: When a DTO property changes type or name, factory methods must be updated. The compiler catches these quickly.
- **Test readability**: Factories make test Arrange sections shorter and more focused on test-specific data.

# Common Mistakes
- **Mistake: Using random data in DTO factories**
  - Why: Uniqueness between test runs
  - Why harmful: Assertion failures show different values each run; hard to debug
  - Better: Use fixed deterministic defaults. Only use random data for uniqueness in rare cases.

- **Mistake: Over-factoring simple DTOs**
  - Why: Writing a full builder class for a 2-property DTO
  - Why harmful: Factory code is longer than the test code it supports
  - Better: Use `new DTO(...)` directly or a simple function factory

- **Mistake: Mutating DTOs after creation**
  - Why: DTOs should be immutable
  - Why harmful: Bypasses immutability guarantees; test doesn't match production usage
  - Better: Use `with()` or create a new DTO for each variant

- **Mistake: Factory defaults that don't match validation rules**
  - Why: Default email is `test@example.com` but validation requires `*.gov` domain
  - Why harmful: Tests use factory but actual requests fail validation
  - Better: Align factory defaults with DTO's validation constraints

# Failure Modes
- **Stale factory after DTO property rename**: PHPStan or IDE can catch this. Run static analysis after DTO refactors.
- **Nullable property mismatch**: A factory provides `null` default but the DTO changed to non-nullable. Type errors at test runtime.
- **Over-validated DTO in constructors**: DTO constructor validates input; factory provides invalid defaults. Validation errors during `build()`. Relax validation in DTOs or keep factories in sync.
- **Recursive DTO infinite loop**: Factory for DTO A includes DTO B, which includes DTO A. Circular dependency. Break with `null` or lazy factory.

# Ecosystem Usage
- **Laravel core**: Laravel uses Eloquent models rather than DTOs internally. Community packages increasingly adopt DTO patterns.
- **Spatie Data (laravel-data)**: The Spatie `laravel-data` package provides DTOs with built-in factory support via `Data::from()` and `DataCollection`.
- **Laravel actions**: The `lorisleiva/laravel-actions` package uses DTOs as action inputs. Factories paired with action tests are a common pattern.
- **Domain-driven design packages**: DTO factories are standard in DDD-oriented Laravel projects.

# Related Knowledge Units
- **Prerequisites**: DTO design patterns, PHP 8+ named arguments, Unit testing patterns
- **Related Topics**: Model factory patterns, Value object testing, Builder pattern
- **Advanced Follow-up**: Spatie laravel-data library, CQRS with DTOs, Domain event testing

# Research Notes
- DTO factories are an under-documented but widely used pattern in production Laravel codebases
- The builder pattern with `with*()` methods is the most common implementation in open-source PHP projects
- Spatie's `laravel-data` package reduces the need for manual DTO factories by providing `Data::from()` and `DataCollection` factory methods
