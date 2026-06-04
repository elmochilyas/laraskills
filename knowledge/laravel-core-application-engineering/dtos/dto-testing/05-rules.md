## Rule 1: Test the DTO's Contract, Not Its Implementation

---

## Category

Testing

---

## Rule

Write tests that verify observable behavior — factory methods produce correct property values, output methods produce expected shapes, invalid input is rejected. Do not test implementation details such as which constructor was called, how many times a method was invoked, or internal property assignment order.

---

## Reason

Contract tests survive refactoring. An implementation test (e.g., mocking the constructor to verify it was called) breaks when the constructor signature changes, even if the DTO's observable behavior is identical. Contract tests verify what the DTO does, not how it does it.

---

## Bad Example

```php
public function test_from_array_uses_constructor(): void
{
    $dto = $this->createMock(UserDto::class);
    // Tests implementation — breaks on any refactoring
}
```

---

## Good Example

```php
public function test_from_array_constructs_correctly(): void
{
    $dto = UserDto::fromArray(['name' => 'John', 'email' => 'john@test.com']);
    $this->assertSame('John', $dto->name);
    $this->assertSame('john@test.com', $dto->email);
}
// Tests the contract — observable behavior survives refactoring.
```

---

## Exceptions

No common exceptions. DTO tests should always verify observable behavior, never internal implementation.

---

## Consequences Of Violation

Maintenance: refactoring the DTO breaks tests even when behavior is unchanged. Reliability: implementation tests provide false confidence — they pass when behavior is broken and fail when behavior is correct.

---

## Rule 2: Use Data Providers for Construction Variants

---

## Category

Testing

---

## Rule

Use PHPUnit data providers to test multiple construction variants (full data, minimal data, edge cases) with a single test method. Cover all optional fields and null variants.

---

## Reason

Data providers eliminate test method duplication. A single test + data provider covers 5-10 construction variants that would otherwise require 5-10 separate test methods. When the DTO adds a field, update the data provider in one place rather than modifying every test method.

---

## Bad Example

```php
public function test_constructs_with_all_fields(): void { /* ... */ }
public function test_constructs_without_bio(): void { /* ... */ }
public function test_constructs_without_phone(): void { /* ... */ }
public function test_constructs_without_bio_and_phone(): void { /* ... */ }
// Four test methods for four variants. Adding a new optional field adds 8 more methods.
```

---

## Good Example

```php
/** @dataProvider validConstructionData */
public function test_constructs_from_array(array $input, array $expected): void
{
    $dto = UserDto::fromArray($input);
    foreach ($expected as $property => $value) {
        $this->assertSame($value, $dto->$property);
    }
}

public static function validConstructionData(): array
{
    return [
        'full data' => [['name' => 'John', 'email' => 'j@t.com', 'bio' => 'Hi'], ['name' => 'John', 'email' => 'j@t.com', 'bio' => 'Hi']],
        'minimal data' => [['name' => 'Jane', 'email' => 'j@t.com'], ['name' => 'Jane', 'email' => 'j@t.com', 'bio' => null]],
    ];
}
// One test method covers all variants. Adding a new optional field: add one entry to the data provider.
```

---

## Exceptions

For DTOs with exactly one valid construction path and no optional fields, a single test without a data provider is sufficient.

---

## Consequences Of Violation

Maintenance: DTO field additions require creating or updating many test methods. Test coverage: edge cases are often forgotten because adding a new test method requires more effort.

---

## Rule 3: Run DTO Tests First in the CI Pipeline

---

## Category

Testing

---

## Rule

Configure the CI pipeline to execute DTO tests as the first test stage. Fail the pipeline immediately if any DTO test fails.

---

## Reason

DTO tests are the fastest tests in the application (<1ms each, no database, no HTTP, no mocking). They validate the data contract that all downstream layers depend on. If a DTO test fails, every subsequent test stage (service, action, HTTP, integration) is potentially invalid. Running them first provides the fastest possible feedback cycle.

---

## Bad Example

```
CI Pipeline Order:
1. Integration tests (5 minutes) — database, HTTP, full boot
2. Feature tests (3 minutes)
3. Unit tests (30 seconds)
4. DTO tests (20ms)
// If a DTO test fails at step 4, the first 8+ minutes of CI were wasted.
```

---

## Good Example

```
CI Pipeline Order:
1. DTO tests (20ms) — fastest feedback
2. Static analysis (10 seconds)
3. Unit tests (30 seconds)
4. Feature tests (3 minutes)
5. Integration tests (5 minutes)
// Data contract failure detected in 20ms. No wasted CI time.
```

---

## Exceptions

When using a CI provider that does not support custom stage ordering, run DTO tests in the first parallel test batch.

---

## Consequences Of Violation

Team efficiency: developers wait minutes for CI feedback when a DTO test fails. Cost: CI compute minutes are wasted on tests that depend on a broken data contract.

---

## Rule 4: Test Every Factory Method with at Least One Valid-Input Test

---

## Category

Testing

---

## Rule

Every factory method (`fromArray()`, `fromModel()`, `fromRequest()`) must have at least one test that verifies correct construction with valid input. Tests must assert that each property value matches the expected mapped value.

---

## Reason

Factory methods contain mapping logic that is the most common source of DTO bugs. A `fromModel()` factory that maps `$user->full_name` instead of `$user->name` silently produces incorrect DTOs. A test per factory catches these mapping errors at the source rather than downstream in service tests.

---

## Bad Example

```php
// Only fromArray is tested
public function test_from_array(): void { /* ... */ }
// fromModel and fromRequest are untested — mapping errors in them go undetected.
```

---

## Good Example

```php
public function test_from_array_constructs_correctly(): void { /* test mapping */ }
public function test_from_model_constructs_correctly(): void { /* test mapping */ }
public function test_from_request_constructs_correctly(): void { /* test mapping */ }
// Every factory method has explicit test coverage. Mapping errors are caught immediately.
```

---

## Exceptions

When a factory method is a trivial delegate (e.g., `fromRequest()` calls `fromArray($request->validated())` without additional mapping), a single test covering the delegate is sufficient.

---

## Consequences Of Violation

Reliability: mapping errors in untested factory methods propagate to downstream services, causing bugs that are harder to diagnose than a direct DTO test failure would be.

---

## Rule 5: Test Invalid Input Rejection with Explicit Validation Test Cases

---

## Category

Testing

---

## Rule

For DTOs with validation rules, write one test per distinct validation path that asserts construction with invalid data throws a `ValidationException` (or equivalent).

---

## Reason

Validation rules are the DTO's guarantee that invalid data cannot enter the system. Without tests that explicitly assert rejection, a validation rule may be silently removed or weakened during refactoring. Each distinct rule (required, format, length, domain constraint) needs verification that it rejects invalid input.

---

## Bad Example

```php
public function test_constructs_with_valid_data(): void
{
    $dto = UserDto::fromArray(['name' => 'John', 'email' => 'john@test.com']);
    // Only tests success path. No test that invalid email is rejected.
}
```

---

## Good Example

```php
public function test_rejects_invalid_email(): void
{
    $this->expectException(ValidationException::class);
    UserDto::fromArray(['name' => 'John', 'email' => 'not-an-email']);
}

public function test_rejects_missing_name(): void
{
    $this->expectException(ValidationException::class);
    UserDto::fromArray(['email' => 'john@test.com']);
}
// Each validation rule has a dedicated rejection test.
```

---

## Exceptions

When using PHP type hints that inherently reject invalid types (e.g., `string` type hint rejects non-string input), PHP itself handles the rejection — no test needed.

---

## Consequences Of Violation

Reliability: a validation rule is accidentally removed or loosened during refactoring with no test failure. Security: invalid data enters the service layer because a validation rule was not tested.

---

## Rule 6: Test Output Methods for Expected Shape, Keys, Types, and Null Handling

---

## Category

Testing

---

## Rule

For every output method (`toArray()`, `jsonSerialize()`), write a test that asserts the exact output shape including keys, value types, date formatting, and null handling for optional fields.

---

## Reason

Output methods define the contract with consumers (frontend, API clients, exports). A change that adds, renames, removes, or reformats a key silently breaks consumers. Explicit output shape tests catch these changes at the source and document the expected contract.

---

## Bad Example

```php
public function test_to_array(): void
{
    $dto = UserDto::fromArray(['name' => 'John', 'email' => 'john@test.com', 'bio' => 'Dev']);
    $result = $dto->toArray();
    $this->assertCount(3, $result); // Doesn't verify keys, values, or types
}
```

---

## Good Example

```php
public function test_to_array_returns_expected_shape(): void
{
    $dto = UserDto::fromArray(['name' => 'John', 'email' => 'john@test.com', 'bio' => 'Dev']);
    $this->assertSame([
        'name' => 'John',
        'email' => 'john@test.com',
        'bio' => 'Dev',
    ], $dto->toArray());
}

public function test_to_array_sets_bio_to_null_when_omitted(): void
{
    $dto = UserDto::fromArray(['name' => 'John', 'email' => 'john@test.com']);
    $this->assertSame(['name' => 'John', 'email' => 'john@test.com', 'bio' => null], $dto->toArray());
}
// Exact shape verified. Key name changes, type changes, null handling — all caught.
```

---

## Exceptions

When `toArray()` output is intentionally dynamic and verifiable only by key subset, assert only the known keys rather than the exact shape.

---

## Consequences Of Violation

Maintenance: renaming a key in `toArray()` does not break any test, but silently breaks frontend consumers. Reliability: date format changes, null handling changes, and field additions go undetected in tests.
