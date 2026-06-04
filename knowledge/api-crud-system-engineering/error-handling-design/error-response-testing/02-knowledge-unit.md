# Error Response Testing

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
Error responses are tested as first-class citizens of the API contract — every endpoint has test cases that assert the error shape, code, status, and detail structure for all failure modes. Tests cover envelope shape, field-level validation errors, auth errors, status codes, and the absence of sensitive data in production mode.

## Core Concepts
- **Shape Assertions**: Every error test asserts the exact JSON structure of the error envelope.
- **Code Assertions**: Each error test asserts the specific error code string.
- **Field-Level Assertions**: Validation error tests assert per-field message arrays.
- **No-Sensitive-Data Assertions**: Tests run with `APP_DEBUG=false` and assert no stack traces or file paths in responses.
- **Boundary Tests**: Edge cases — empty request bodies, malformed JSON, exceeding rate limits, missing headers.

## Mental Models
Error response tests are like crash test dummies. You deliberately cause crashes (errors) in controlled conditions and verify that the safety systems (error envelope, status, headers) work correctly. You don't want to discover on the road (production) that the airbag (error response) is faulty.

## Internal Mechanics
1. Test creates a scenario that triggers an error (invalid input, missing auth, not found).
2. Test makes the request and captures the JSON response.
3. Test asserts response status, envelope structure, error code, and message.
4. Test asserts headers (WWW-Authenticate, Retry-After, Content-Type).
5. Test asserts absence of sensitive data (stack trace, file path, SQL).

```php
class ErrorResponseTest extends TestCase
{
    public function test_validation_error_shape(): void
    {
        $response = $this->postJson('/api/users', []);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'error' => [
                    'code',
                    'message',
                    'status',
                    'detail' => ['fields' => ['email', 'name']],
                ],
            ])
            ->assertJson([
                'error' => [
                    'code' => 'VALIDATION_ERROR',
                    'status' => 422,
                ],
            ]);
    }

    public function test_no_stack_trace_in_production(): void
    {
        app()->detectEnvironment(fn () => 'production');
        config(['app.debug' => false]);

        $response = $this->postJson('/api/users', []);

        $response->assertJsonMissingPath('error.trace');
        $response->assertJsonMissingPath('error.file');
        $response->assertJsonMissingPath('error.line');
        $response->assertJsonMissingPath('debug');
    }
}
```

## Patterns
- **Factory for Error Scenarios**: Use test factories or model factories to set up error scenarios (soft-deleted models for 404).
- **Shared Assertions**: A `AssertErrorResponse` trait provides `assertErrorShape()`, `assertErrorCode()`, `assertNoSensitiveData()`.
- **Snapshot Testing**: For stable error shapes, use snapshot testing (`spatie/phpunit-snapshot-assertions`) to compare full response.
- **Per-Endpoint Error Matrix**: A data provider iterates all endpoints and their known error modes.
- **Production Mode Tests**: Run a dedicated test suite with `APP_DEBUG=false` to validate production-safe responses.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Testing approach | Integration tests (HTTP) | Exercises full stack including middleware and handler |
| Shape assertion | `assertJsonStructure` + `assertJson` | Partial match (structure) + exact match (code, status) |
| Production mode test | Dedicated suite | Prevents accidental `APP_DEBUG=true` test skew |
| Snapshot vs inline | Snapshot for stable shapes; inline for dynamic | Best of both |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Test granularity | Unit test handler only | Integration test full stack | Integration — catches middleware and serialisation issues |
| Snapshot testing | Full JSON snapshot | Assert each field separately | Snapshot for shape; inline for dynamic values |
| Coverage target | All possible errors | All documented errors | All documented — undocumented errors don't need tests |

## Performance Considerations
- Error response tests are slower than success-case tests (exception handling overhead).
- Use `RefreshDatabase` only when needed — most error tests don't need DB.
- Group error tests into a separate suite for CI parallelism.
- Avoid `dd()` in error responses during tests (captures output, breaks assertions).

## Production Considerations
- Include error response tests in CI gating (mandatory pass before deploy).
- Add a test that validates all `ErrorCodes` constants have at least one test covering them.
- For each new endpoint, the PR must include error response tests for all defined error modes.
- Run production-mode error tests in staging deployment pipeline.
- Document the error test matrix as a living document.

## Common Mistakes
- Only testing the "happy path" and forgetting error cases entirely.
- Testing error shapes with `assertStatus(422)` but not asserting the envelope structure.
- Writing tests with `APP_DEBUG=true` (default for tests) and passing — production-mode tests fail.
- Asserting exact message strings (fragile — messages may change for i18n).
- Not testing headers (`WWW-Authenticate`, `Retry-After`).
- Testing the exception handler in isolation without the middleware stack.

## Failure Modes
- **Flaky Tests**: Timing-dependent tests (rate limiting) use hardcoded delays. Mitigation: mock rate limiter or use `Carbon::setTestNow()`.
- **Snapshot Drift**: Error shape changes intentionally — snapshot tests fail. Mitigation: update snapshots in the same PR that changes error shapes.
- **Test Duplication**: Same error scenario tested in every endpoint test. Mitigation: use a shared `AssertErrorResponse` trait.
- **Environment Leak**: A test runs with `APP_DEBUG=true` when it should test production mode. Mitigation: isolate production-mode tests in a separate file with `@group production-errors`.

## Ecosystem Usage
- **Laravel**: `assertJsonStructure()`, `assertJson()`, `assertJsonMissingPath()`, `assertStatus()`.
- **Spatie**: `phpunit-snapshot-assertions` for full JSON snapshot comparison.
- **Pest**: `expect($response)->toMatchJsonStructure()` for expressive assertions.
- **OpenAPI**: Contract testing with `phpunit-openapi` validates error responses against OpenAPI spec.
- **Postman/Newman**: Collection-level error response tests for integration testing.

## Related Knowledge Units
### Prerequisites
- KU-02 Standardized Error Envelope (the shape being tested)
- KU-06–KU-12 (all status-specific shapes being tested)

### Related Topics
- KU-03 Domain-Specific Error Codes (codes being asserted)
- PHPUnit / Pest testing frameworks

### Advanced Follow-up Topics
- Contract testing with OpenAPI for automatic error response validation (Phase 4).
- Fuzzing: sending random malformed data to verify graceful error handling (Phase 4).

## Research Notes
### Source Analysis
Testing methodology follows "Testing on the Toilet" Google patterns for contract testing. Laravel's `assertJsonStructure()` and `assertJson()` provide the building blocks. Snapshot testing approach from Spatie's package.

### Key Insight
**Error responses are part of the API contract.** If you don't test them, they will break — and when they break, clients break. A CI gate that requires error test coverage for each new error code is the most effective way to maintain error response quality.

### Version-Specific Notes
- Laravel 10+ `assertJsonMissingPath()` for negative assertions.
- Pest 2.x supports expressive `->assertJson()` chaining.
- PHPUnit 10+ `#[DataProvider]` attributes for error scenario data providers.
