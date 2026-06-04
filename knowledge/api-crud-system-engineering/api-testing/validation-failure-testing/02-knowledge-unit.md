# Validation Failure Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Validation Failure Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Validation failure tests verify that malformed or missing input is rejected with a 422 Unprocessable Entity response and structured error messages. Each validation rule (required, email, unique, exists, min, max, etc.) applied to each field must have at least one test that triggers it. Laravel's `assertStatus(422)`, `assertJsonValidationErrors`, and `assertJsonMissingValidationErrors` are the primary assertions. A thorough validation suite prevents data corruption and provides a consistent developer experience.

---

## Core Concepts
Laravel returns 422 with a JSON body containing `message`, `errors` (field => array), and optionally `failed` (in debug mode). `assertJsonValidationErrors(array $fields)` asserts the response has validation errors for the given fields. `assertJsonMissingValidationErrors(array $fields)` asserts specific fields passed validation. `assertStatus(422)` confirms the HTTP code. Each field-rule pair needs a test: `required` is triggered by omitting the field, `email` by providing a non-email string, `unique` by providing a duplicate, `exists` by providing a non-existent foreign key, `min`/`max` by providing boundary values. Also test nested validation (`array.*.field`), conditional validation (`required_if`, `required_with`), and custom rule objects.

---

## Mental Models
Validation tests are **bulletproof glass tests** — every rule is a bullet you fire at the endpoint, and the response must stop it and tell you exactly which rule triggered. If any bullet passes through (endpoint accepts invalid data), the glass is broken. The error message is the shatter pattern.

---

## Internal Mechanics
When validation fails, `Illuminate\Validation\ValidationException` is thrown. Laravel's exception handler converts it to a JSON response with 422 status. The exception contains `$validator->errors()` — a `MessageBag` — serialized as `{"message": "The given data was invalid.", "errors": {"field": ["message1", "message2"]}}`. Custom form requests (`App\Http\Requests\StorePostRequest`) extend `FormRequest`, which calls `$this->validator()` and automatically throws on failure. `assertJsonValidationErrors` checks the `errors` key of the decoded JSON response and verifies the specified fields have at least one error message.

---

## Patterns
- **One test per validation rule**: `test_title_is_required`, `test_title_must_be_unique`, etc.
- **Boundary testing**: For `min:3`, test with 2 characters; for `max:255`, test with 256.
- **Combine multiple valid fields in a single test**: Set valid defaults for all non-target fields and vary only the field under test.
- **Use PestPHP datasets for rule variations**: `it('rejects invalid :field', fn($field, $value) => ...)->with('invalidInputs')`.
- **Test both direct and nested validation**: `store` and `update` form requests may differ — test both.
- **Assert specific error messages**: `assertJsonValidationErrors(['title' => 'The title field is required.'])` for message-level precision.

---

## Architectural Decisions
Testing validation at the HTTP feature-test level (rather than unit-testing form requests) ensures the middleware stack (TrimStrings, ConvertEmptyStringsToNull) is active. `TrimStrings` strips whitespace before validation runs — unit tests would miss this interaction. The tradeoff is slightly slower tests, but the increased fidelity justifies the cost.

---

## Tradeoffs
| Tradeoff | Feature Validation Test | FormRequest Unit Test |
|---|---|---|
| Middleware interaction | Verified | Missed |
| Rule-to-controller mapping | Verified | Missed (mock-dependent) |
| Speed | Slower | Fast |
| Diagnostic value | High (real error shape) | Medium (mock injection) |

---

## Performance Considerations
Validation tests are input-heavy — each test case sends different request bodies. Use PestPHP datasets to group many validation cases into one test method, reducing kernel boot overhead. Batch independent field validations (e.g., all string-length rules together) into a single `it()` block with dataset rows.

---

## Production Considerations
Validation coverage should be comprehensive — every declared rule in every form request must have a failing test. Use architecture tests to scan form request `rules()` methods and cross-reference with test coverage. The 422 response shape must be consistent across all endpoints — API consumers depend on it. Never expose debug-level `failed` key in production 422 responses.

---

## Common Mistakes
- Testing validation on the wrong HTTP method (e.g., testing `POST` validation on `PUT` endpoint — the form request class may differ).
- Not testing nullable vs required fields (nullable fields should accept `null`, required fields should reject it).
- Forgetting middleware transforms: `ConvertEmptyStringsToNull` turns `""` into `null`, which may pass `nullable` validation unexpectedly.
- Asserting validation errors for fields not in the request body — error appears because field is entirely absent, not because its value is wrong.

---

## Failure Modes
- **Silent validation bypass**: Field is not in `$rules` but the test assumes it is — the test never triggers a failure, and invalid data passes through undetected.
- **Inconsistent error message format**: Custom rules return non-standard error arrays that `assertJsonValidationErrors` can't match.
- **Unique validation in tests**: Unique rule depends on database state — previous test's data may not be rolled back, causing false failures or false passes with `RefreshDatabase`.

---

## Ecosystem Usage
Laravel's own test suite uses extensive validation failure testing. Spatie's `laravel-medialibrary` tests every validation rule on upload endpoints. The `laravel-validated-dto` package generates form requests from DTOs and includes built-in validation tests.

---

## Related Knowledge Units
### Prerequisites
- Laravel Validation (rules, form requests, custom rules)
- feature-test-structure (sending request bodies)

### Related Topics
- error-response-shape-testing (422 error structure)
- form-request-unit-testing (testing validation in isolation)
- happy-path-testing (paired positive assertions)

### Advanced Follow-up Topics
- Custom rule object testing
- Conditional validation testing (`required_if`, `required_with`)
- Async validation (debounced, batched)

---

## Research Notes
### Source Analysis
`Illuminate\Validation\ValidationException` thrown by `Illuminate\Foundation\Http\FormRequest::failedValidation()`. The `assertJsonValidationErrors` and `assertJsonMissingValidationErrors` are on `Illuminate\Testing\TestResponse`.
### Key Insight
Feature-level validation tests catch middleware-validation interactions that unit tests miss — specifically `TrimStrings` and `ConvertEmptyStringsToNull` which alter input before validation.
### Version-Specific Notes
Laravel 11's `FormRequest` uses `failedValidation()` overridable method for custom error formatting. `assertJsonValidationErrors` was enhanced in Laravel 10 to support dot-notation for nested validation. PestPHP's `with()` datasets integrate naturally with validation testing.
