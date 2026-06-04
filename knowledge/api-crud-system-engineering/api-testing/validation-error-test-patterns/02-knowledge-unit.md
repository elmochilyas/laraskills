# Validation Error Test Patterns

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-testing
- **Knowledge Unit:** Validation Error Test Patterns
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Validation Error Test Patterns define how to verify that API endpoints return correct validation error responses for invalid input. Mastery ensures consistent error shapes, proper field-level error messages, and comprehensive coverage of validation rules.

---

## Core Concepts
- **Error Shape Assertions**: Verifying the structure of validation error responses (status code, message format, field errors)
- **Field-Level Error Assertions**: `assertJsonValidationErrors(['email'])` to confirm specific fields triggered rules
- **Multiple Error Scenarios**: Testing each validation rule independently (required, format, unique, min/max)
- **Boundary Value Testing**: Testing values at the edges of validation ranges (min-1, min, max, max+1)
- **Error Message Localization**: Verifying that error messages match the expected locale and content

---

## Mental Models
1. **Rule-Trigger Model**: Each validation rule is a trigger that produces a specific error. Test each rule independently to prove it fires correctly.
2. **Fuzz-to-Fail Model**: Send increasingly invalid data until every validation rule has been triggered, then verify the final error response.

---

## Internal Mechanics
When a form request or controller validation fails, Laravel throws a `ValidationException`. The exception handler converts it to a JSON response with `422 Unprocessable Entity` status and an `errors` object. `assertJsonValidationErrors()` decodes the response and checks the error keys match the expected fields.

---

## Patterns

### Pattern 1: Per-Rule Test Method
**Purpose**: One test per validation rule (e.g., `it('requires email')`, `it('validates email format')`)
**Benefits**: Clear failure messages pinpoint which rule is broken
**Tradeoffs**: Many test methods for complex validation

### Pattern 2: Dataset-Driven Validation Tests
**Purpose**: Use Pest datasets to test multiple invalid inputs for the same field
**Benefits**: Concise; easy to add new invalid cases
**Tradeoffs**: Error messages require more complex assertion logic

---

## Architectural Decisions
### When To Use
- Every API endpoint that accepts user input
- Form request classes with custom validation rules
- Endpoints where error consistency is critical

### When To Avoid
- Read-only endpoints (GET, HEAD)
- Endpoints with no validated input

### Alternatives
- Snapshot testing for complete validation error responses
- Contract tests that validate error shape against an OpenAPI spec

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Comprehensive rule coverage | Many tests for complex forms | Use datasets to reduce boilerplate |
| Consistent error responses | Tests must be updated when rules change | Refactor validation rules with test updates |
| Early detection of rule bugs | Over-testing of Laravel built-in rules | Test custom rules thoroughly; spot-check built-in |

---

## Performance Considerations
- Validation error tests are fast (<10ms each) since they fail on the first invalid field
- Use `ValidationException::withMessages()` for testing validation logic without HTTP calls
- Batch dataset-driven tests to minimize test method overhead

---

## Production Considerations
- Test that production error responses don't reveal internal validation logic
- Verify that validation error responses match the API documentation contract
- Test error response consistency across all API versions

---

## Common Mistakes
**Only testing the first error**: Laravel returns all validation errors. Test that expected fields are present, not just the first one.
**Ignoring nested validation errors**: Array and nested object validation (`items.*.name`) produces dot-notation keys. Test these specifically.
**Not testing valid input**: Validation tests should also verify that valid input passes without errors.

---

## Failure Modes
**Silent validation bypass**: A validation rule that never triggers allows invalid data. *Detection:* Add tests that would catch the invalid state.
**Inconsistent error shape**: Different endpoints return different error structures. *Detection:* Arch test enforcing error response contracts.

---

## Ecosystem Usage
Laravel's `assertJsonValidationErrors()` and `assertJsonMissingValidationErrors()` are the primary test helpers. Pest adds expectation macros for these. Form request tests can use `(new StoreUserRequest())->rules()` to access rules directly.

---

## Related Knowledge Units
### Prerequisites
- HTTP endpoint assertions
- Form request validation logic

### Related Topics
- Validation rule composition
- Validation error shape design

### Advanced Follow-up Topics
- Custom validation rule testing
- Async validation testing for real-time APIs

---

## Research Notes
- `assertJsonValidationErrors()` normalizes array keys from `items.0.name` to `items.*.name` for assertion matching
- For APIs using RFC 9457 problem details, validation errors follow a different structure; test accordingly
