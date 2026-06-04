# Form Request Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 2 (Deep Implementation)
- **Tags:** testing, form-request, validation-tests, assertion-helpers, laravel

## Executive Summary
Phase 2 covers testing FormRequest validation rules — unit testing rules in isolation, integration testing validation via HTTP, testing authorization logic, and using Laravel's validation assertion helpers. Proper testing ensures validation contracts are enforced and regression-free.

## Mental Models

- **Three-Layer Testing Pyramid for Validation** — Unit tests (fast, narrow) sit at the base for rules in isolation, integration tests (slower, broad) cover the full lifecycle, and authorization tests form a parallel security column.
- **Validator::make() as an Isolated Test Harness** — Using `Validator::make()` directly creates an isolated test harness for rules without HTTP overhead or database dependencies.
- **Validation Contract as a Testable Specification** — Each validation rule is a testable specification; a comprehensive test suite encodes the contract explicitly and catches regressions early.
- **Custom Assertions as Testing DSL** — Custom assertion helpers create a domain-specific language for validation testing, reducing boilerplate and improving readability.

## Core Concepts

### Three Testing Levels for FormRequests

| Level | What It Tests | Speed | Coverage |
|---|---|---|---|
| Unit (Validator::make) | Rules logic in isolation | Fast | Narrow |
| Integration (HTTP) | Full request lifecycle | Slow | Broad |
| Authorization | authorize() logic | Fast | Security boundary |

### Validation Assertion Helpers
```php
// PHPUnit + Laravel assertions
$this->assertValidationPasses($data, $rules);
$this->assertValidationFails($data, $rules);
$this->assertValidationHasError($data, $rules, 'field_name');
```

## Internal Mechanics

### Unit Testing FormRequest Rules
```php
public function test_store_post_requires_title(): void
{
    $request = new StorePostRequest();
    $rules = $request->rules();

    $validator = Validator::make(
        ['body' => 'Content', 'status' => 'draft'],
        $rules,
    );

    $this->assertTrue($validator->fails());
    $this->assertArrayHasKey('title', $validator->errors()->messages());
}
```

### Testing with validationData()
```php
public function test_validation_data_returns_json_content(): void
{
    $request = new StorePostRequest(
        ['CONTENT_TYPE' => 'application/json'],
        [],
        [],
        [],
        [],
        ['HTTP_ACCEPT' => 'application/json']
    );

    $data = $request->validationData();
    $this->assertIsArray($data);
}
```

## Patterns

### Custom Assertion Helper Trait
```php
trait ValidatesFormRequest
{
    protected function assertValidationPasses(array $data, array $rules, array $messages = []): void
    {
        $validator = Validator::make($data, $rules, $messages);
        $this->assertTrue($validator->passes(), 'Validation should pass but failed with: ' . json_encode($validator->errors()->messages()));
    }

    protected function assertValidationFails(array $data, array $rules, array $messages = []): void
    {
        $validator = Validator::make($data, $rules, $messages);
        $this->assertTrue($validator->fails(), 'Validation should fail but passed.');
    }

    protected function assertValidationHasError(array $data, array $rules, string $field, array $messages = []): void
    {
        $validator = Validator::make($data, $rules, $messages);
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey($field, $validator->errors()->messages());
    }

    protected function assertValidationDoesNotHaveError(array $data, array $rules, string $field, array $messages = []): void
    {
        $validator = Validator::make($data, $rules, $messages);
        $validator->passes(); // Ensure validation ran
        $this->assertArrayNotHasKey($field, $validator->errors()->messages());
    }
}
```

### Testing All Rule Combinations
```php
class StorePostRequestValidationTest extends TestCase
{
    use ValidatesFormRequest;

    private array $validData;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validData = [
            'title' => 'My Post Title',
            'body' => 'Post body content here.',
            'status' => 'draft',
        ];
    }

    public function test_valid_data_passes(): void
    {
        $this->assertValidationPasses(
            $this->validData,
            (new StorePostRequest())->rules(),
        );
    }

    /** @testWith ["title", ""] */
    /** @testWith ["title", null] */
    /** @testWith ["title", str_repeat("a", 256)] */
    public function test_title_validation(string $field, mixed $value): void
    {
        $this->assertValidationFails(
            array_merge($this->validData, [$field => $value]),
            (new StorePostRequest())->rules(),
        );
    }

    public function test_status_must_be_valid_enum(): void
    {
        $this->assertValidationFails(
            array_merge($this->validData, ['status' => 'invalid_status']),
            (new StorePostRequest())->rules(),
        );
        $this->assertValidationHasError(
            array_merge($this->validData, ['status' => 'invalid_status']),
            (new StorePostRequest())->rules(),
            'status',
        );
    }

    public function test_body_is_optional_for_drafts(): void
    {
        // For draft status, body might be optional
        $this->markTestIncomplete('Draft status rule not yet implemented.');
    }
}
```

### Testing FormRequest via HTTP
```php
class StorePostEndpointValidationTest extends TestCase
{
    public function test_empty_payload_returns_422(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/posts', []);

        $response->assertStatus(422);
        $response->assertJsonStructure([
            'errors' => [['status', 'code', 'title', 'detail', 'source']],
        ]);
    }

    public function test_valid_payload_returns_201(): void
    {
        $response = $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/posts', [
                'title' => 'Test Post',
                'body' => 'Content',
                'status' => 'draft',
            ]);

        $response->assertStatus(201);
    }

    public function test_unauthorized_request_returns_403(): void
    {
        $response = $this->postJson('/api/v1/posts', [
            'title' => 'Test',
            'body' => 'Content',
            'status' => 'draft',
        ]);

        $response->assertStatus(403);
    }
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Unit test rules via Validator::make() | Fast, no HTTP, tests rules in isolation |
| Integration test via HTTP | Tests full lifecycle including authorization |
| Custom assertion helpers | Reduces boilerplate; consistent assertions |
| Parameterized tests (@testWith) | Covers edge cases without duplicating test methods |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Unit validation tests | Fast (< 1ms per test); precise failure location | Does not test middleware or authorization |
| HTTP integration tests | Full stack; realistic | Slow (~100ms per test); flaky if DB-dependent |
| Custom assertion trait | Consistent, DRY test code | Another trait to maintain |
| Data providers / @testWith | Exhaustive edge case coverage | Test output is verbose |

## Performance Considerations
- Unit validation tests run in milliseconds — prefer them for most coverage.
- HTTP tests should cover only key validations — not every edge case.
- Use `RefreshDatabase` sparingly — it adds seconds per test class.
- Mock external services in HTTP tests to avoid network calls.

## Production Considerations
- Run validation tests in CI before full test suite — they catch most regressions fast.
- Test both passes and fails for every rule.
- Test boundary values (min, max, empty, null) for every constrained field.
- Document test coverage requirements in CONTRIBUTING.md.

## Common Mistakes
- Testing only the passing case — missing validation logic errors.
- Testing only via HTTP — too slow for comprehensive coverage.
- Forgetting to test `authorize()` — the security boundary is untested.
- Using mock data that doesn't reflect production validation rules.
- Not resetting state between validation tests — shared state causes flaky tests.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Test passes but validation is wrong | Production bug | Test both pass and fail cases for each field |
| HTTP test flaky due to DB state | CI intermittent failures | Use RefreshDatabase or Transactions for HTTP tests |
| Rule change not reflected in test | False positive test | Map every rule to at least one test |
| authorize() untested | Security regression | Separate authorize() test class |

## Ecosystem Usage

### Laravel's Built-in Assertions
```php
// Test validation errors in HTTP responses
$response = $this->postJson('/api/posts', ['title' => '']);
$response->assertJsonValidationErrors(['title']);
$response->assertJsonMissingValidationErrors(['body']);
```

### Pest PHP Validation Testing
```php
it('validates title is required', function () {
    $validator = Validator::make(
        ['body' => 'Content'],
        (new StorePostRequest())->rules(),
    );

    expect($validator->fails())->toBeTrue();
    expect($validator->errors())->toHaveKey('title');
});

it('validates status enum', function (string $status) {
    $validator = Validator::make(
        ['title' => 'Test', 'body' => 'Content', 'status' => $status],
        (new StorePostRequest())->rules(),
    );

    expect($validator->passes())->toBeTrue();
})->with(['draft', 'published', 'archived']);
```

## Related Knowledge Units

### Prerequisites
- **form-request-design-for-apis** — the request class being tested.

### Related Topics
- **validation-error-shape-customization** — testing custom error responses.
- **authorization-in-form-requests** — testing authorize() method.

### Advanced Follow-up Topics
- **bulk-request-validation** — testing bulk validation behavior.
- **manual-validator-creation** — testing manual validation logic.

## Research Notes

### Source Analysis
Laravel's `assertJsonValidationErrors()` uses the `TestResponse` class to extract errors from the JSON response. It checks for field presence in the `errors` key regardless of the error shape — it works with both flat and nested error structures.

### Key Insight
Validation testing at the unit level (Validator::make() + rules()) is the **highest-value, lowest-cost testing** strategy in an API. Each test takes <1ms, requires no database, and directly validates the contract definition. A comprehensive validation test suite catches contract violations before they reach production.

### Version-Specific Notes
- Laravel 10: `$response->assertJsonValidationErrors()` supports dot notation.
- Laravel 11: No changes.
- Pest 2.x: `expect($validator)->pass()->toBeTrue()` syntax for validation tests.
