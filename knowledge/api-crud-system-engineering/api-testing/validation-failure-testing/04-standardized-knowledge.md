# ECC Standardized Knowledge — Validation Failure Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Validation Failure Testing |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Validation failure tests verify that malformed or missing input is rejected with 422 Unprocessable Entity and structured error messages. Each validation rule applied to each field must have at least one test that triggers it. Feature-level validation tests catch middleware-validation interactions (TrimStrings, ConvertEmptyStringsToNull) that unit tests miss. A thorough validation suite prevents data corruption and provides consistent developer experience.

## Core Concepts

- **422 response**: `{"message": "The given data was invalid.", "errors": {"field": ["message1", "message2"]}}`.
- **assertJsonValidationErrors**: Asserts the response has validation errors for given fields.
- **assertJsonMissingValidationErrors**: Asserts specific fields passed validation.
- **Middleware interaction**: TrimStrings strips whitespace; ConvertEmptyStringsToNull turns "" into null before validation.
- **Rule coverage**: Each rule (required, email, unique, exists, min, max, etc.) needs a triggering test.
- **Conditional rules**: Test required_if, required_with, required_without combinations.

## When To Use

- Every endpoint with a Form Request or inline validation
- Endpoints with complex conditional validation rules
- Combined fields with interdependent validation

## When NOT To Use

- Isolated Form Request rule testing (use Form Request Unit Testing)
- Non-validation error scenarios (auth, authorization, not-found)
- Testing the validator library itself (already tested by Laravel)

## Best Practices

- **One test per validation rule**: `test_title_is_required`, `test_title_must_be_unique`.
- **Boundary testing**: For `min:3`, test with 2 characters; for `max:255`, test with 256.
- **Set valid defaults for non-target fields**: Vary only the field under test.
- **Use PestPHP datasets for rule variations**: `it('rejects invalid :field', fn($field, $value) => ...)->with('invalidInputs')`.
- **Test both store and update form requests**: They may differ.
- **Assert specific error messages**: `assertJsonValidationErrors(['title' => 'The title field is required.'])`.

## Architecture Guidelines

- Feature-level validation tests verify the middleware stack (TrimStrings, ConvertEmptyStringsToNull) is active.
- Every declared rule in every form request must have a failing test.
- Never expose debug-level `failed` key in production 422 responses.
- 422 error shape must be consistent across all endpoints.

## Performance Considerations

- Validation tests are input-heavy — use PestPHP datasets to group many cases into one test method.
- Batch independent field validations into a single `it()` block with dataset rows.
- Each test method with dataset reduces kernel boot overhead.

## Security Considerations

- Validation error messages must not leak internal implementation details.
- Debug `failed` key exposes rule internals — strip in production.
- Ensure validation doesn't reveal whether a record exists (for security-sensitive fields like email).

## Common Mistakes

- Testing validation on wrong HTTP method (POST vs PUT form requests differ).
- Not testing nullable vs required fields (nullable accepts null, required rejects it).
- Forgetting middleware transforms: ConvertEmptyStringsToNull turns "" into null.
- Asserting validation errors for fields not in request body — error appears because field is entirely absent.
- Silent validation bypass: field not in `$rules` but test assumes it is.

## Anti-Patterns

- **No validation failure tests**: Invalid data passes through, causing data corruption.
- **Testing only happy path**: No coverage for the 422 case consumers actually hit most.
- **Inconsistent error message format**: Custom rules returning non-standard error arrays.

## Examples

- Required test: `$this->postJson('/api/posts', [])->assertStatus(422)->assertJsonValidationErrors(['title'])`.
- Unique test: Create post with title, then create another with same title -> assert 422 on title.
- Boundary test: `$this->postJson('/api/posts', ['title' => str_repeat('a', 256)])->assertJsonValidationErrors(['title'])`.

## Related Topics

- **Prerequisites**: Laravel Validation (rules, form requests), Feature Test Structure
- **Closely Related**: Error Response Shape Testing, Form Request Unit Testing, Happy Path Testing
- **Advanced**: Custom rule object testing, Conditional validation testing, Async validation testing

## AI Agent Notes

When testing validation failures: one test per rule per field, use boundary testing for min/max, set valid defaults for non-target fields, use datasets for efficiency, test both store and update form requests, assert specific error messages, remember middleware transformations.

## Verification

Sources: `Illuminate\Validation\ValidationException`, `Illuminate\Foundation\Http\FormRequest`, `Illuminate\Testing\TestResponse::assertJsonValidationErrors`, domain-analysis.md.
