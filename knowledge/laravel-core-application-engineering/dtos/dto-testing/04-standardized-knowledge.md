# DTO Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

DTO testing validates that data is correctly constructed from various sources, properly transformed on output, and type-safe in transit. Because DTOs are pure data objects with no side effects, they are among the easiest components to test — no mocking, no database, no HTTP context is needed. The test surface area covers construction factories (fromRequest, fromModel, fromArray), output methods (toArray, jsonSerialize), and nested DTO recursion.

The engineering principle is: test the DTO's contract, not its implementation. The contract includes what data it accepts from each source, what data it produces on output, and that invalid construction is impossible.

## Core Concepts

- **Pure Object Testing:** DTOs have no dependencies. Testing means: construct with known input → assert properties → assert output shape → assert invalid construction fails. No mocking, no database, no HTTP kernel boot.
- **Contract Verification:** A DTO test verifies the contract between layers. The test documents what data the DTO expects and what shape the data takes.
- **Round-Trip Test:** For bidirectional DTOs: `fromArray(input) → DTO → toArray() → output`. Asserts output matches input (with allowances for type transformations).
- **Test Categories:** Construction (factory methods), Type safety (properties have correct types), Null handling, Validation (invalid throws), Output (toArray shape), Nested (child DTOs correct), Round-trip (cycle test).

## When To Use

- Every factory method (`fromArray`, `fromModel`, `fromRequest`) should have at least one test
- Every output method (`toArray`, `jsonSerialize`) should have at least one test
- Null/optional field handling should have explicit test cases
- Invalid input rejection should have one test per distinct validation path

## When NOT To Test

- Simple DTOs with 2 properties and no factory methods — trivially correct constructor
- Properties that PHP already type-checks (`assertIsString` when `public string $name` is declared)
- Internal constructor implementation — test the observable behavior, not how it works internally
- Framework behavior (spatie/laravel-data internals) — test your Data classes' behavior, not the package

## Best Practices (WHY)

- **Why test the contract, not implementation:** Tests that verify the DTO's observable behavior (factory mapping, output shape) survive refactoring. Tests that verify implementation details (which constructor was called) break when the implementation changes.
- **Why DTO tests are cheap:** Pure assertions only — no database, no HTTP, no service container. A suite of 20 DTO tests completes in <20ms.
- **Why run DTO tests first in CI:** Fastest tests catch data contract breakage immediately. If DTO tests fail, later test stages are irrelevant.
- **Why data providers for construction variants:** Multiple input combinations (full data, minimal data, edge cases) are tested without duplicating test methods.

## Architecture Guidelines

- Test DTOs as unit tests (pure assertions) — no integration scaffolding needed
- For `fromModel` tests, use a factory-built model (light integration) or mock the model
- For `fromRequest` tests, mock `validated()` to return known data
- Name test methods to document the DTO contract: `test_from_array_sets_name_and_email()`, `test_from_array_sets_bio_to_null_when_omitted()`
- Use data providers for multiple construction variants to reduce duplication

## Performance

DTO unit tests execute in <1ms each. A suite of 20 DTO tests completes in <20ms. This is the fastest test category — no database, no HTTP, no service container.

## Security

- DTO tests verify that invalid data is rejected at construction — prevents bad data from reaching the service layer
- Test that sensitive data is not exposed in `toArray()` output
- Test that factory methods do not accept extra, unvalidated data from input sources

## Common Mistakes

1. **Testing Properties That PHP Already Checks:** `assertIsString($dto->name)` when `public string $name` is a PHP type hint adds no value. PHP already ensures the type.

2. **Testing Implementation (Not Contract):** Mocking the constructor to verify it was called with specific args tests implementation, not behavior. Test the observable result: property values match input.

3. **Over-Testing Simple DTOs:** A DTO with 2 properties and no factory methods gains nothing from a test. Focus effort on factory methods and transformations.

4. **False Positives from Stale Data Providers:** When a DTO adds a property, data providers may fail. Update data providers in the same commit as the DTO change.

## Anti-Patterns

- **The Implementation Spy:** Tests that mock the DTO to verify constructor arguments. Tests the mechanism, not the contract — breaks on any refactoring.
- **The Over-Tested Constructor:** Separate test cases for every property of a trivially simple DTO. A single data provider covering all properties is sufficient.
- **The Untested Factory:** A `fromModel` factory that silently maps fields incorrectly with no test coverage. If a field rename happens, no test catches it until a downstream service fails.

## Examples

### Factory Method Tests
```php
class UserDtoTest extends TestCase
{
    private array $validData = [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'bio' => 'Developer',
    ];

    public function test_from_array_constructs_correctly()
    {
        $dto = UserDto::fromArray($this->validData);
        $this->assertSame('John Doe', $dto->name);
        $this->assertSame('john@example.com', $dto->email);
        $this->assertSame('Developer', $dto->bio);
    }

    public function test_from_array_sets_bio_to_null_when_omitted()
    {
        $dto = UserDto::fromArray(['name' => 'John', 'email' => 'john@example.com']);
        $this->assertNull($dto->bio);
    }

    public function test_to_array_returns_expected_shape()
    {
        $dto = UserDto::fromArray($this->validData);
        $this->assertSame([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'bio' => 'Developer',
        ], $dto->toArray());
    }
}
```

### Data Provider for Multiple Construction Variants
```php
/** @dataProvider validConstructionData */
public function test_constructs_from_array(array $input, array $expected)
{
    $dto = UserDto::fromArray($input);
    foreach ($expected as $property => $value) {
        $this->assertSame($value, $dto->$property);
    }
}

public static function validConstructionData(): array
{
    return [
        'full data' => [
            ['name' => 'John', 'email' => 'john@test.com', 'bio' => 'Hi'],
            ['name' => 'John', 'email' => 'john@test.com', 'bio' => 'Hi'],
        ],
        'minimal data' => [
            ['name' => 'Jane', 'email' => 'jane@test.com'],
            ['name' => 'Jane', 'email' => 'jane@test.com', 'bio' => null],
        ],
    ];
}
```

### Spatie/laravel-data Testing
```php
class UserDataTest extends TestCase
{
    public function test_it_validates_rules()
    {
        $this->expectException(ValidationException::class);
        UserData::from(['name' => '', 'email' => 'invalid']);
    }
}
```

## Related Topics

- **DTO Construction Patterns** — factory methods to test
- **Data Object Transformation** — output methods to test
- **Form Request Testing** — testing FormRequest + DTO integration
- **Action Testing** — testing services/actions that receive DTOs

## AI Agent Notes

- Generate DTO tests with data providers for construction variants
- Focus tests on factory method mapping and output shape, not PHP type enforcement
- Test null handling explicitly for optional fields
- For spatie/laravel-data, test that `Data::from()` triggers validation
- Keep DTO tests purely deterministic — no mocks for factory methods
- Run DTO tests first in CI pipeline (fastest to fail)

## Verification

- [ ] Every factory method (`fromArray`, `fromModel`, `fromRequest`) has at least one test
- [ ] Every output method (`toArray`, `jsonSerialize`) has at least one test
- [ ] Null/optional field handling has explicit test cases
- [ ] Invalid input rejection has tests per distinct validation path
- [ ] Tests use data providers for construction variants where applicable
- [ ] Tests verify the contract, not the implementation
- [ ] Tests do not assert PHP-enforced type hints
- [ ] DTO tests run in CI as the first test stage
