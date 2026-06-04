# Form Request Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** testing, form-request, coverage, ci, mutation-testing, property-based

## Executive Summary
Phase 3 covers advanced testing strategies: property-based testing for validation rules, mutation testing for test quality, CI test architecture, coverage enforcement, snapshot testing for error responses, and testing FormRequest hooks in conjunction with validation.

## Core Concepts

### Exhaustive Validation Coverage
Every constraint in a validation rule must have at least two tests: one that passes and one that fails. For `string|max:255`, test: valid string, empty string, null, 256-character string, integer instead of string.

### Mutation Testing for Validation Rules
Mutation testing (e.g., with Infection) verifies that your tests catch rule changes. If changing `max:255` to `max:500` doesn't fail a test, the constraint is not tested.

## Internal Mechanics

### Property-Based Validation Testing
Using PHPUnit's data providers with generated data:
```php
class StorePostRequestValidationTest extends TestCase
{
    use ValidatesFormRequest;

    /** @dataProvider validTitleProvider */
    public function test_title_accepts_valid_values(string $title): void
    {
        $this->assertValidationPasses(
            ['title' => $title, 'body' => 'Content', 'status' => 'draft'],
            (new StorePostRequest())->rules(),
        );
    }

    public static function validTitleProvider(): array
    {
        return [
            'single word' => ['Title'],
            'with numbers' => ['Post 2024'],
            'with special chars' => ['My Post #1'],
            'max length' => [str_repeat('a', 255)],
            'unicode' => ['中文标题'],
            'with newlines' => ["Line 1\nLine 2"],
        ];
    }

    /** @dataProvider invalidTitleProvider */
    public function test_title_rejects_invalid_values(string $title): void
    {
        $this->assertValidationFails(
            ['title' => $title, 'body' => 'Content', 'status' => 'draft'],
            (new StorePostRequest())->rules(),
        );
    }

    public static function invalidTitleProvider(): array
    {
        return [
            'empty string' => [''],
            'too long' => [str_repeat('a', 256)],
            'only spaces' => ['   '],
        ];
    }
}
```

### Snapshot Testing for Error Responses
```php
public function test_validation_error_response_is_stable(): void
{
    $response = $this->postJson('/api/v1/posts', [
        'title' => '',
        'body' => '',
    ]);

    $response->assertStatus(422);

    // Store snapshot: php artisan make:snapshot
    $this->assertMatchesJsonSnapshot($response->json());
}
```

## Patterns

### Comprehensive Test Class Structure
```php
class StorePostRequestValidationTest extends TestCase
{
    use ValidatesFormRequest;

    private StorePostRequest $request;
    private array $baseData;

    protected function setUp(): void
    {
        parent::setUp();
        $this->request = new StorePostRequest();
        $this->baseData = [
            'title' => 'Valid Title',
            'body' => 'Valid body content',
            'status' => 'draft',
        ];
    }

    // --- Happy path ---
    public function test_valid_data_passes(): void
    {
        $this->assertValidationPasses($this->baseData, $this->request->rules());
    }

    // --- Field-level required rules ---
    /** @dataProvider requiredFieldsProvider */
    public function test_required_fields(string $field): void
    {
        $data = $this->baseData;
        unset($data[$field]);

        $this->assertValidationFails($data, $this->request->rules());
        $this->assertValidationHasError($data, $this->request->rules(), $field);
    }

    public static function requiredFieldsProvider(): array
    {
        return [['title'], ['body'], ['status']];
    }

    // --- Field-level type rules ---
    public function test_title_must_be_string(): void
    {
        $this->assertValidationFails(
            array_merge($this->baseData, ['title' => 123]),
            $this->request->rules(),
        );
    }

    // --- Enum constraint ---
    /** @dataProvider validStatusProvider */
    public function test_status_accepts_valid_values(string $status): void
    {
        $this->assertValidationPasses(
            array_merge($this->baseData, ['status' => $status]),
            $this->request->rules(),
        );
    }

    public static function validStatusProvider(): array
    {
        return [['draft'], ['published'], ['archived']];
    }

    // --- Size constraints ---
    public function test_title_max_length(): void
    {
        $this->assertValidationPasses(
            array_merge($this->baseData, ['title' => str_repeat('a', 255)]),
            $this->request->rules(),
        );
    }

    public function test_title_exceeds_max_length(): void
    {
        $this->assertValidationFails(
            array_merge($this->baseData, ['title' => str_repeat('a', 256)]),
            $this->request->rules(),
        );
    }

    // --- Custom rules ---
    public function test_custom_slug_rule(): void
    {
        // This test would validate a custom Rule class
    }
}
```

### Testing Hooks: prepareForValidation() and passedValidation()
```php
class StorePostRequestTest extends TestCase
{
    public function test_prepare_for_validation_normalizes_email(): void
    {
        $request = new StorePostRequest([], [
            'email' => '  USER@EXAMPLE.COM  ',
        ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

        $request->prepareForValidation();

        $this->assertEquals('user@example.com', $request->input('email'));
    }

    public function test_passed_validation_injects_uuid(): void
    {
        $request = new StorePostRequest([], [
            'title' => 'Test',
            'body' => 'Content',
            'status' => 'draft',
        ], [], [], [], ['HTTP_ACCEPT' => 'application/json']);

        $request->setContainer(app());
        $request->setUserResolver(fn () => User::factory()->make(['id' => 1]));

        $validator = Validator::make($request->validationData(), $request->rules());
        if ($validator->passes()) {
            $request->passedValidation();
        }

        $validated = $request->validated();
        $this->assertArrayHasKey('uuid', $validated);
        $this->assertTrue(Str::isUuid($validated['uuid']));
    }
}
```

### CI Pipeline for Validation Tests
```yaml
# .github/workflows/validation-tests.yml
name: Validation Tests
on:
  pull_request:
    paths:
      - 'app/Http/Requests/**'
      - 'app/Rules/**'
jobs:
  validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.2'
      - run: composer install
      - run: php artisan request:check-conventions
      - name: Run validation tests
        run: php artisan test --filter=Validation
      - name: Mutation testing for rules
        run: vendor/bin/infection --min-covered-msi=80 --filter=Rules
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Property-based testing with data providers | Exhaustive edge case coverage without duplication |
| Snapshot testing for error responses | Detects accidental format changes |
| Mutation testing for rules | Ensures tests actually test constraints |
| Separate validation test CI job | Fast feedback for contract changes |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Data provider tests | Exhaustive coverage | Large test class; verbose parameter lists |
| Snapshot testing | Catches unexpected format changes | Fragile; requires snapshot review |
| Mutation testing | High-quality tests | Slow (5-10x normal test time) |
| CI validation job | Fast feedback | Duplicate CI infrastructure |

## Performance Considerations
- Unit validation tests should run in < 1 second for an entire request class.
- Mutation testing is slow — run overnight or on schedule, not per-push.
- Snapshot tests with large error payloads can be slow — keep focused.
- Separate validation CI runs in parallel with full test suite — doesn't slow overall pipeline.

## Production Considerations
- Enforce minimum validation test coverage in CI (e.g., 90%+).
- Use infection testing with MSI (Mutation Score Indicator) thresholds.
- Run validation tests on every push; full mutation suite nightly.
- Archive test snapshots with each API version release.

## Common Mistakes
- Testing only passes, not fails — rule may be accidentally permissive.
- Testing only required fields — optional fields (sometimes, nullable) left untested.
- Using real database in validation tests — validation doesn't need DB.
- Not testing boundary values — min/max/empty/null/exactly-limit.
- Assuming validation order — tests should not depend on rule evaluation order.

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| False positive test | Validation rule broken but test passes | Mutation testing catches |
| Boundary missed | Off-by-one error in max/min | Test exact limit and limit+1 |
| Hook not tested | Hook modifies data unexpectedly | Test prepareForValidation() and passedValidation() |
| Snapshot drift across PHP versions | Snapshot test fails | Use platform-agnostic serialization |

## Ecosystem Usage

### Pest PHP for Validation Testing
```php
covers(StorePostRequest::class);

dataset('valid_titles', [
    'Title',
    str_repeat('a', 255),
    '中文标题',
]);

it('accepts valid titles', function (string $title) {
    $result = Validator::make(
        ['title' => $title, 'body' => 'Content', 'status' => 'draft'],
        (new StorePostRequest())->rules(),
    );
    expect($result->passes())->toBeTrue();
})->with('valid_titles');
```

### Infection Mutation Testing
```bash
# Run mutation testing specifically for validation rules
vendor/bin/infection \
  --filter=app/Rules \
  --min-covered-msi=90 \
  --threads=4 \
  --logger-html=reports/infection.html
```

## Related Knowledge Units

### Prerequisites
- **form-request-testing** — Phase 2 testing foundations.
- **form-request-design-for-apis** — the request class being tested.

### Related Topics
- **validation-error-shape-customization** — testing error response formats.
- **authorization-in-form-requests** — testing authorize() logic.

### Advanced Follow-up Topics
- **bulk-request-validation** — testing bulk validation patterns.
- **api-testing** — broader API testing strategies.

## Research Notes

### Source Analysis
Laravel's `assertJsonValidationErrors()` works by decoding the JSON response and checking for field keys in the `errors` object. It does not depend on the error structure — it works with both Laravel's default format and custom formats, as long as errors are keyed by field name.

### Key Insight
Validation tests are the **cheapest, highest-value tests** in an API codebase. Each validation test runs in <1ms, requires no external services, and directly validates the API contract. A comprehensive validation test suite (covering every rule + boundary for every field) should be the first testing priority for any API project.

### Version-Specific Notes
- Laravel 10: `$response->assertJsonValidationErrors()` accepts array of fields.
- PHPUnit 10: `#[DataProvider]` attribute replaces annotation; static data providers.
- Pest 2.x: `arch` testing for enforcing FormRequest naming conventions.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization