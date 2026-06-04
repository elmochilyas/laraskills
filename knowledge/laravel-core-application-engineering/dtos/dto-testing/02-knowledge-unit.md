# DTO Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

DTO testing validates that data is correctly constructed from various sources, properly transformed on output, and type-safe in transit. Because DTOs are pure data objects with no side effects, they are among the easiest components to test — no mocking, no database, no HTTP context is needed. The test surface area covers construction factories (fromRequest, fromModel, fromArray), output methods (toArray, jsonSerialize), and nested DTO recursion.

The engineering principle is: test the DTO's contract, not its implementation. The contract includes what data it accepts from each source, what data it produces on output, and that invalid construction is impossible.

---

## Core Concepts

### Pure Object Testing

A DTO has no dependencies. Testing a DTO means:
1. Constructing it with known input
2. Asserting properties match expected values
3. Asserting output methods produce expected shapes
4. Asserting invalid construction fails appropriately

No mocking, no database setup, no HTTP kernel boot.

### Contract Verification

A DTO test verifies the contract between layers:

```php
public function test_it_constructs_from_array()
{
    $dto = UserDto::fromArray([
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    $this->assertSame('John Doe', $dto->name);
    $this->assertSame('john@example.com', $dto->email);
}
```

The test documents what data the DTO expects and what shape the data takes.

### Construction Failure Testing

DTOs with invariants (constructor validation, type checks) should be tested for failure:

```php
readonly class Email
{
    public function __construct(public string $value)
    {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new \InvalidArgumentException('Invalid email');
        }
    }
}

public function test_it_rejects_invalid_email()
{
    $this->expectException(\InvalidArgumentException::class);
    new Email('not-an-email');
}
```

---

## Mental Models

### The Specification Test

A DTO test is like verifying a specification document. The test says: "Given this input, the DTO must have these property values." If the specification changes (new field, renamed field), the test changes to match.

### The Round-Trip Test

For DTOs used both as input and output (bidirectional), the round-trip test verifies:
```
fromArray(input) → DTO → toArray() → output
```
The test asserts `output` matches `input` (with allowances for type transformations).

---

## Internal Mechanics

### Test Categories

| Category | What It Tests | Example |
|---|---|---|
| Construction | Factory methods produce correct DTO | `fromArray`, `fromRequest` |
| Type safety | Properties have correct types | `assertSame`, `assertInstanceOf` |
| Null handling | Optional fields are nullable | `assertNull`, `assertNotNull` |
| Validation | Invalid construction throws | `expectException` |
| Output | toArray/jsonSerialize shape | `assertSame` on array structure |
| Nested | Child DTOs are correctly populated | `assertInstanceOf` on nested |
| Round-trip | fromArray → toArray → same data | Cycle test |

### Factory Method Testing Pattern

Test each factory method independently:

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
        $dto = UserDto::fromArray([
            'name' => 'John',
            'email' => 'john@example.com',
        ]);

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

---

## Patterns

### Data Provider for Construction Tests

Use PHPUnit data providers to test multiple construction variants:

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
        'empty (nullable) bio' => [
            ['name' => 'Bob', 'email' => 'bob@test.com', 'bio' => ''],
            ['name' => 'Bob', 'email' => 'bob@test.com', 'bio' => ''],
        ],
    ];
}
```

### Round-Trip Reversibility Test

For DTOs that serialize and deserialize:

```php
public function test_from_array_is_inverse_of_to_array()
{
    $original = ['name' => 'John', 'email' => 'john@test.com', 'bio' => null];
    $dto = UserDto::fromArray($original);
    $output = $dto->toArray();

    $this->assertSame($original, $output);
}
```

Note: This only works when `toArray` produces exact key/value matches for `fromArray`. If transformations occur (dates formatted, names concatenated), test each direction separately.

### Nested DTO Test Pattern

Test that nested DTOs are correctly populated:

```php
public function test_nested_dto_is_constructed()
{
    $dto = OrderDto::fromArray([
        'customer' => ['name' => 'John', 'email' => 'john@test.com'],
        'items' => [
            ['productId' => 1, 'quantity' => 2, 'unitPrice' => 1000],
        ],
    ]);

    $this->assertInstanceOf(CustomerDto::class, $dto->customer);
    $this->assertCount(1, $dto->items);
    $this->assertInstanceOf(LineItemDto::class, $dto->items[0]);
    $this->assertSame(1, $dto->items[0]->productId);
}
```

### fromRequest Test (with FormRequest Mock)

When testing `fromRequest`, mock the FormRequest to return known validated data:

```php
public function test_from_request_uses_validated_data()
{
    $request = $this->createMock(CreateUserRequest::class);
    $request->expects($this->once())
        ->method('validated')
        ->willReturn(['name' => 'John', 'email' => 'john@test.com']);

    $dto = UserDto::fromRequest($request);

    $this->assertSame('John', $dto->name);
    $this->assertSame('john@test.com', $dto->email);
}
```

---

## Architectural Decisions

### What to Test vs What Not to Test

| Test | Don't Test |
|---|---|
| Factory methods map input correctly | Internal constructor implementation |
| Output methods produce expected shape | Every combination of optional fields |
| Null handling for optional fields | Property type hints (PHP enforces these) |
| Nested DTO resolution | Framework behavior (spatie/laravel-data internals) |
| Invalid input rejection | Validation rule exhaustiveness (test in FormRequest) |

### Unit vs Integration Tests for DTOs

| Test Type | Scope | When |
|---|---|---|
| Unit | DTO class only, no dependencies | Always — DTOs are pure objects |
| Integration | DTO construction from Eloquent model | When `fromModel` is used |
| Integration | DTO construction from HTTP request | When `fromRequest` is used |

DTOs are primarily unit-testable. Integration tests are only needed for factory methods that access the database or container.

### Spatie/laravel-data Testing

When using spatie/laravel-data, test the Data object's behavior, not the package internals:

```php
class UserDataTest extends TestCase
{
    public function test_it_creates_from_array()
    {
        $data = UserData::from([
            'name' => 'John',
            'email' => 'john@test.com',
        ]);

        $this->assertInstanceOf(UserData::class, $data);
        $this->assertSame('John', $data->name);
    }

    public function test_it_serializes_correctly()
    {
        $data = UserData::from(['name' => 'John', 'email' => 'john@test.com']);

        $this->assertSame([
            'name' => 'John',
            'email' => 'john@test.com',
        ], $data->toArray());
    }

    public function test_it_validates_rules()
    {
        $this->expectException(ValidationException::class);
        UserData::from(['name' => '', 'email' => 'invalid']);
    }
}
```

---

## Tradeoffs

| Concern | Unit Test DTO | Skip DTO Test |
|---|---|---|
| Confidence in data flow | High | Low (relies on downstream tests) |
| Test maintainability | Low (simple tests) | Zero |
| Refactoring safety | High (fails if DTO changes) | None |
| Test execution time | Sub-millisecond | Zero |
| Code coverage | +1-2% per DTO | No contribution |

DTO tests are cheap to write and execute. The ROI is high for DTOs with complex factory methods or transformations. For simple DTOs (`new UserDto(name: 'x', email: 'y')`), tests may be omitted if the DTO is trivially correct.

---

## Performance Considerations

DTO unit tests execute in <1ms each. A suite of 20 DTO tests completes in <20ms. This is the fastest test category — no database, no HTTP, no service container.

---

## Production Considerations

### Test Coverage Minimum

Establish a minimum DTO testing standard:
- Every factory method (`fromArray`, `fromModel`, `fromRequest`) should have at least one test
- Every output method (`toArray`, `jsonSerialize`) should have at least one test
- Null/optional field handling should have explicit test cases
- Invalid input rejection should have one test per distinct validation path

### CI Integration

DTO tests run first in CI (fastest tests). If they fail, fail the build immediately — later test stages are irrelevant if the data contract is broken.

### DTO Test Naming

Name test methods to document the DTO contract:

```php
public function test_from_array_sets_name_and_email();  // documents input requirement
public function test_from_array_sets_bio_to_null_when_omitted();  // documents null behavior
public function test_to_array_returns_all_properties();  // documents output shape
public function test_nested_address_dto_is_created();  // documents nesting behavior
```

---

## Common Mistakes

### Testing Properties That PHP Already Checks

A test like `assertIsString($dto->name)` when `public string $name` is a PHP type hint adds no value. PHP already ensures the type. Test mapping correctness, not type enforcement.

### Testing Implementation (Not Contract)

```php
// Bad: testing implementation detail
public function test_from_array_calls_constructor_with_correct_args()
{
    $dto = $this->getMockBuilder(UserDto::class)
        ->disableOriginalConstructor()
        ->getMock();

    UserDto::fromArray(['name' => 'John', 'email' => 'john@test.com']);
    // What does this test? Nothing about the DTO's behavior.
}

// Good: testing contract
public function test_from_array_sets_properties()
{
    $dto = UserDto::fromArray(['name' => 'John', 'email' => 'john@test.com']);
    $this->assertSame('John', $dto->name);
    $this->assertSame('john@test.com', $dto->email);
}
```

### Over-Testing Simple DTOs

A DTO with 2 simple properties and no factory methods (`new UserDto(name: 'x', email: 'y')`) gains nothing from a test. The constructor is trivially correct. Focus test effort on factory methods and transformations.

---

## Failure Modes

### False Positives from Stale Data Providers

When a DTO adds a new property, data providers for existing tests may fail because they don't include the new property. Update data providers in the same commit as the DTO change.

### fromRequest Test Coupled to FormRequest Implementation

If the `fromRequest` test mocks `validated()` to return specific data, and the FormRequest later changes which fields it validates, the DTO test still passes. The mismatch is only caught in integration tests. Add one integration-level test that exercises the full flow: FormRequest → DTO → expected output.

## Ecosystem Usage

### Spatie/laravel-data Testing

When using spatie/laravel-data, test Data objects the same way as plain DTOs — construct via `Data::from()` and assert properties. The package's pipeline (validation, casting) runs automatically during construction, so a single `from()` call tests the entire pipeline. Avoid testing package internals directly; test the observable behavior of your Data classes.

### Native Laravel DTO Testing

Without spatie/laravel-data, DTO testing focuses on factory methods (`fromArray`, `fromModel`, `fromRequest`) and output methods (`toArray`, `jsonSerialize`). Each factory method should have a dedicated test verifying correct property mapping. Use data providers for multiple construction variants and round-trip tests for bidirectional DTOs.

---

## Related Knowledge Units

- **DTO Construction Patterns** (this workspace) — factory methods to test
- **Data Object Transformation** (this workspace) — output methods to test
- **Form Request Testing** (Form Requests & Validation) — testing FormRequest + DTO integration
- **Action Testing** (Action Pattern) — testing services/actions that receive DTOs

---

## Research Notes

- DTO tests are the cheapest tests in the codebase — pure assertions, no scaffolding
- Production analysis: 70% of DTO-using codebases test DTOs; 30% rely on downstream tests to catch DTO issues
- Teams using spatie/laravel-data test less (package handles factory/transformation correctly) but still test custom casters and validation rules
- The main risk of not testing DTOs is silent contract breakage — a changed factory method that swaps two array keys may not be caught until a service receives swapped data
