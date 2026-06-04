# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Unit Testing
Knowledge Unit: Class & Method Testing (DTO Factories)
 KU Code: ku-02-class-method-testing
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
DTO test factories create Data Transfer Object instances with valid default values and per-test overrides. They eliminate repetitive DTO construction in unit tests while making test intent explicit. While Eloquent model factories are standard in Laravel, DTOs (plain PHP objects with typed properties) lack a built-in factory mechanism. Writing manual DTO factories or using builder patterns reduces test boilerplate by ~60% and makes test failures more readable. DTO factories complement class and method testing by providing clean, intent-revealing test data for service and action tests.

# Core Concepts
- **DTO (Data Transfer Object)**: Immutable PHP object with typed properties, no business logic, used to transfer data between layers.
- **DTO factory**: A class or function that creates a valid DTO instance with sensible defaults and per-field overrides.
- **Default values vs fixture data**: DTO factories provide valid defaults (not random data). Override only fields relevant to the test.
- **`with()` pattern**: Methods that clone the DTO with the overridden value, preserving immutability.
- **Named constructors**: Some DTOs use named constructors (`EmailDTO::forUser($user)`) as built-in factories.
- **Builder pattern**: Fluent interface for assembling DTOs with IDE autocompletion.

# When To Use
- DTOs used as input to services, actions, or commands
- Value objects with multiple constructor parameters
- Classes that require valid DTO instances for testing
- Tests where DTO construction boilerplate outweighs test logic
- Teams practicing Domain-Driven Design with rich domain objects

# When NOT To Use
- Very simple DTOs with 1-2 properties (use `new DTO(...)` directly)
- Eloquent models (use Laravel's model factories instead)
- DTOs that change frequently (factory maintenance cost outweighs benefit)
- When the factory method is longer than the inline construction it replaces
- In test files where DTO construction happens once (extract only when duplicated)

# Best Practices (WHY)
- **Use the `with()` pattern for immutability**: Reason: `$dto->withName('John')` returns a new instance, preserving the original. DTOs should be immutable; `with()` enforces this.
- **Favor builder pattern for DTOs with >5 properties**: Reason: named `with*()` methods are self-documenting and IDE-friendly. Array overrides for small DTOs are acceptable.
- **Align factory defaults with validation rules**: Reason: if the DTO validates email format, the factory default should be valid. Tests using the factory should not fail validation.
- **Use deterministic defaults, not random data**: Reason: `'test@example.com'` is predictable. Faker-generated data causes flaky tests when assertions compare values.
- **Place factories in `tests/DTOFactories/` following namespace structure**: Reason: convention makes factories discoverable. Mirror the DTO's namespace for easy navigation.
- **Keep factory scope narrow**: Reason: one factory per DTO class. Don't create mega-factories that construct multiple unrelated DTOs.
- **Use named presets for common DTO variants**: Reason: `UserDTOFactory::new()->admin()->build()` is more readable than setting multiple `->with*()` calls.

# Architecture Guidelines
- **Factory location**: `tests/DTOFactories/{Domain}/` following DTO namespace structure.
- **Factory naming**: `{DTO}Factory` (e.g., `UserDTOFactory`). Consistent with Eloquent factory conventions.
- **Method naming**: `with{Property}()` for individual property setters. `{preset}()` for named presets (e.g., `admin()`, `guest()`).
- **Return type**: Factory methods should return the DTO instance. `build(): UserDTO`.
- **Default values**: Sensible, valid defaults that satisfy DTO validation. Document default values in the factory class docblock.
- **Composition**: DTOs containing other DTOs should compose factories: `OrderDTOFactory::new()->withItems([LineItemFactory::new()->build()])`.

# Performance
- **Factory overhead**: <10μs per DTO. Negligible. Thousands of DTOs per test in <10ms.
- **Memory**: Each factory stores defaults and overrides. 100 factories in memory use <1MB.
- **Builder chain overhead**: Each `with*()` creates a new factory instance (immutability). PHP GC handles this efficiently.
- **Comparison to Eloquent factories**: 100-1000x faster (no database, no hydration, no events).

# Security
- **Default data exposure**: Factory defaults may contain placeholder values. Review for sensitive data.
- **DTO validation bypass**: Factories should create valid DTOs. Don't skip DTO constructor validation in factories.
- **Factory reuse**: Shared factories may be used by tests that shouldn't have access to certain DTO presets.
- **Immutability enforcement**: Ensure `with()` methods use `clone` to prevent mutation of original DTO.

# Common Mistakes

**Mistake: Using random data in DTO factories**
- Description: `'email' => fake()->email()` in factory defaults
- Cause: "Random data is more realistic"
- Consequence: Assertion failures show different values each run; hard to debug
- Better: Use fixed deterministic defaults. Only use random data for uniqueness in rare cases.

**Mistake: Over-factoring simple DTOs**
- Description: Full builder class for a 2-property DTO
- Cause: "Always use a factory"
- Consequence: Factory code is longer than the test code it supports
- Better: Use `new DTO(...)` directly or a simple function factory for small DTOs.

**Mistake: Mutating DTOs after creation**
- Description: `$dto->name = 'new name';` instead of using `with()`
- Cause: "PHP allows public property assignment"
- Consequence: Bypasses immutability guarantees; test doesn't match production usage
- Better: Use `with()` or create a new DTO for each variant.

**Mistake: Factory defaults that don't match validation**
- Description: Default email is `test@example.com` but validation requires `*.gov` domain
- Cause: Factory and validation are developed independently
- Consequence: Tests using factory pass but actual requests fail validation
- Better: Align factory defaults with DTO's validation constraints. Test factory defaults against validation.

# Anti-Patterns
- **Factory-as-fixture**: Creating a factory that builds complete object graphs irrelevant to most tests.
- **Mutable factories**: Factories that modify DTOs instead of cloning them. Breaks immutability.
- **Hidden validation bypass**: Factories using reflection to set private properties, bypassing constructor validation.
- **Duplicate factory definitions**: Multiple test files defining the same DTO construction logic.
- **Testing the factory**: Writing unit tests for DTO factories. They're test helpers, not production code.

# Examples

**Builder pattern DTO factory**
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

    public function withEmail(string $email): self
    {
        $this->overrides['email'] = $email;
        return $this;
    }

    public function admin(): self
    {
        return $this->withRole('admin');
    }

    public function build(): UserDTO
    {
        $defaults = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'member',
        ];

        return new UserDTO(...[...$defaults, ...$this->overrides]);
    }
}
```

**DTO factory usage in tests**
```php
test('admin can access admin dashboard', function () {
    $dto = UserDTOFactory::new()->admin()->build();

    $result = $this->userService->canAccessAdmin($dto);

    expect($result)->toBeTrue();
});
```

**Nested DTO factory composition**
```php
$orderDTO = OrderDTOFactory::new()
    ->withCustomer(UserDTOFactory::new()->admin()->build())
    ->withItems([
        LineItemDTOFactory::new()->withProduct('SKU-001')->withQuantity(2)->build(),
        LineItemDTOFactory::new()->withProduct('SKU-002')->withQuantity(1)->build(),
    ])
    ->build();
```

# Related Topics
- Unit testing patterns
- Value object design
- Builder pattern
- Model factory patterns
- Spatie laravel-data library

# AI Agent Notes
- Use the builder pattern for DTOs with >5 properties. Use simple function factories for smaller DTOs.
- Always use deterministic defaults (fixed strings, predictable values). Never use `fake()` in factory defaults.
- Implement `with*()` methods that return `$this` for chaining. Build method merges defaults with overrides.
- For nested DTOs, compose factories rather than building deep object graphs in a single factory.
- When generating DTO factories, align defaults with the DTO's validation rules to ensure validity.
- Generate factories in `tests/DTOFactories/` directory, mirroring the DTO's namespace.

# Verification
- [ ] DTO factory uses builder pattern with `with*()` methods for properties >5
- [ ] Factory defaults are deterministic (fixed strings, not Faker)
- [ ] `build()` method merges defaults with overrides using spread operator
- [ ] Factory produces valid DTOs that pass DTO constructor validation
- [ ] `with*()` methods return `$this` for method chaining
- [ ] Named presets exist for common DTO variants (admin, guest, etc.)
- [ ] Factory is located in `tests/DTOFactories/` mirroring DTO namespace
- [ ] DTO immutability is preserved (no direct property mutation after creation)
