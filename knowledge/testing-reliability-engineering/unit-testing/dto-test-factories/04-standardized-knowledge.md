# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Unit Testing |
| Knowledge Unit | DTO Test Factories |
| Difficulty | Intermediate |
| Maturity | Mature |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | DTO design patterns, PHP 8+ named arguments, Unit testing patterns |
| Related KUs | Model factory patterns, Value object testing, Builder pattern |
| Source | domain-analysis.md K047 |

# Overview

DTO test factories create Data Transfer Object instances with valid default values and per-test overrides. They eliminate repetitive DTO construction in unit tests while making test intent explicit. While Eloquent model factories (`Factory::new()->create()`) are standard in Laravel, DTOs (plain PHP objects with typed properties) lack a built-in factory mechanism. Writing manual DTO factories or using libraries like `brick/data-factory` reduces test boilerplate by ~60% and makes test failures more readable.

# Core Concepts

- **DTO (Data Transfer Object)**: Immutable PHP object with typed properties, no business logic, used to transfer data between application layers.
- **DTO factories**: A class or function that creates a valid DTO instance with sensible defaults and per-field overrides via named parameters or method chaining.
- **Default values vs fixture data**: DTO factories provide valid defaults (not random data). Override only the fields relevant to the test scenario.
- **Immutability and `with()`**: DTO factories typically use `with()` methods that clone the DTO with the overridden value, preserving immutability.
- **Named constructors**: Some DTOs use named constructors (e.g., `EmailDTO::forUser($user)`) that serve as built-in factories for common scenarios.

# When To Use

- DTO-heavy applications using action/service patterns
- Testing actions that receive DTO inputs
- Creating multiple DTO variants within a single test file
- Establishing common DTO configurations as presets
- When DTO construction has many optional parameters

# When NOT To Use

- DTOs with 1-2 simple properties (use `new DTO(...)` directly)
- Eloquent models (use Laravel model factories)
- Value objects that are primitives (use `new Email('test@example.com')`)
- When the DTO has no variation in test scenarios
- Over-factoring: when factory code exceeds the test code it supports

# Best Practices (WHY)

- **Use deterministic defaults, not random data**: Reason: random data creates flaky tests on assertion failure. Fixed values are debuggable and reproducible.
- **Align defaults with DTO validation constraints**: Reason: factory defaults that pass validation ensure tests don't fail on setup alone. Mismatch between defaults and validation rules causes confusing failures.
- **Override count as code smell**: Reason: a test that overrides 5+ fields may test too much at once. Split into focused test methods.
- **Prefer builder pattern for DTOs with >5 properties**: Reason: builder provides IDE autocompletion, self-documenting code, and chaining.
- **Place factories in `tests/DTOFactories/`**: Reason: mirrors DTO namespace structure. Easy to discover and maintain.

# Architecture Guidelines

- **Factory location**: `tests/DTOFactories/` directory mirroring DTO namespace. `tests/DTOFactories/UserDTOFactory.php` for `app/DTOs/UserDTO.php`.
- **Function vs Builder**: Use simple function factories for <5 properties. Use builder pattern for >5 properties or complex inheritance.
- **Preset scenarios**: Define named presets (admin, guest, expired) as static factory methods for common DTO variants.
- **Nested DTO composition**: For DTOs containing other DTOs, compose factories. `OrderDTOFactory` calls `LineItemFactory` for nested items.

# Performance Considerations

- **Factory overhead**: DTO factory construction adds <10μs per DTO. Thousands of DTOs per test still complete in <10ms.
- **Memory**: Each DTO factory instance stores default values and overrides. 100 factories in memory use <1MB.
- **Builder chain overhead**: Each `with*()` call creates a new factory instance (immutability). PHP's GC handles this efficiently.
- **Comparison to Eloquent factories**: DTO factories are 100-1000x faster than Eloquent factories (no database, no hydration, no events).

# Security Considerations

- **Sensitive data in factories**: DTO factories may contain default values that resemble real data. Avoid using real user data or secrets as defaults.
- **Factory exposure**: DTO factories are test code; they don't run in production. No production security concern.

# Common Mistakes

**Mistake: Using random data in DTO factories**
- Description: Using Faker or `uniqid()` for default values
- Cause: Uniqueness between test runs
- Consequence: Assertion failures show different values each run; hard to debug
- Better: Use fixed deterministic defaults.

**Mistake: Over-factoring simple DTOs**
- Description: Writing a full builder class for a 2-property DTO
- Cause: Consistency across all factories
- Consequence: Factory code is longer than the test code it supports
- Better: Use `new DTO(...)` directly or a simple function factory.

**Mistake: Mutating DTOs after creation**
- Description: Using setters or property assignment on supposedly immutable DTOs
- Cause: Not using the `with()` pattern
- Consequence: Bypasses immutability guarantees
- Better: Use `with()` or create a new DTO for each variant.

**Mistake: Factory defaults mismatched with validation**
- Description: Default email is `test@example.com` but validation requires `*.gov` domain
- Cause: Factory not kept in sync with DTO validation
- Consequence: Tests use factory but actual requests fail validation
- Better: Align factory defaults with DTO's validation constraints.

# Anti-Patterns

- **Stale factories after DTO property changes**: DTO property renamed but factory not updated. Run static analysis after DTO refactors.
- **Nullable property mismatch**: Factory provides `null` default but DTO changed to non-nullable.
- **Recursive DTO infinite loop**: Factory for DTO A includes DTO B, which includes DTO A. Break with `null` or lazy factory.
- **Over-validated DTO constructors**: DTO constructor validates input; factory provides invalid defaults.

# Examples

**Simple function factory**
```php
function validUserDTO(array $overrides = []): UserDTO
{
    $defaults = [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'role' => 'member',
    ];
    return new UserDTO(...array_merge($defaults, $overrides));
}
```

**Builder pattern factory**
```php
class UserDTOFactory
{
    private array $overrides = [];

    public static function new(): self
    {
        return new self();
    }

    public function withName(string $name): self
    {
        $this->overrides['name'] = $name;
        return $this;
    }

    public function withRole(string $role): self
    {
        $this->overrides['role'] = $role;
        return $this;
    }

    public function build(): UserDTO
    {
        $defaults = ['name' => 'Test', 'email' => 'test@example.com', 'role' => 'member'];
        return new UserDTO(...array_merge($defaults, $this->overrides));
    }
}

// Usage in test
test('admin user can access admin panel', function () {
    $dto = UserDTOFactory::new()->withRole('admin')->build();
    $result = (new AccessControlService())->checkAccess($dto);
    expect($result->canAccessAdmin)->toBeTrue();
});
```

**Preset scenarios**
```php
class UserDTOFactory
{
    public static function admin(): self
    {
        return self::new()->withRole('admin');
    }

    public static function guest(): self
    {
        return self::new()->withRole('guest')->withEmail('guest@example.com');
    }
}
```

# Related Topics

- Model factory patterns (Eloquent)
- Value object testing
- Builder pattern
- Spatie laravel-data library
- CQRS with DTOs
- Domain event testing

# AI Agent Notes

- When generating DTO factories, prefer deterministic defaults over Faker data.
- For DTOs with <5 properties, generate function factories. For >5 properties, generate builder pattern factories.
- Always include `build()` method that returns the DTO with merged defaults and overrides.
- Generate preset methods for commonly used DTO configurations (admin, expired, empty, etc.).
- Keep factory methods focused — each method sets exactly one property.

# Verification

- [ ] DTO factories use deterministic defaults (no random data)
- [ ] Factory defaults align with DTO validation constraints
- [ ] Factories are organized in `tests/DTOFactories/` mirroring DTO namespace
- [ ] Builder pattern used for DTOs with >5 properties
- [ ] Function factories used for simple DTOs (<5 properties)
- [ ] Preset methods exist for common DTO configurations
- [ ] DTO immutability is preserved (no setters, `with()` returns new instance)
- [ ] Factory code is reviewed when DTO properties change
