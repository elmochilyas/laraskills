# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Validation Error Test Patterns
**Difficulty:** Intermediate
**Category:** Testing & Quality Assurance
**Last Updated:** 2026-06-03

---

# Overview

Validation Error Test Patterns are systematic approaches to testing API validation behavior — verifying that invalid inputs produce correct error responses with appropriate status codes, error codes, field-level messages, and structured detail arrays. They exist because validation is the primary mechanism for maintaining data integrity at the API boundary, and validation errors are the most common API response consumers encounter.

Engineers must care because poorly tested validation leads to data corruption, confusing consumer experiences, and security vulnerabilities. Each untested validation rule is a potential data integrity gap. Comprehensive validation tests ensure that the API rejects bad data before it reaches the application layer.

---

# Core Concepts

**Field-Level Error Assertions:** Testing that each invalid field produces a specific error message identifying the field, the failed rule, and the rejected value.

**Error Envelope Structure:** Validation errors follow a standardized format — typically HTTP 422 with an error envelope containing a code, message, and details array with per-field errors.

**Rule-Specific Testing:** Each validation rule (required, email, unique, min, max, exists, etc.) must be tested independently to confirm it triggers correctly.

**Boundary Value Testing:** Testing edge cases of validation rules — empty strings, zero values, maximum lengths, minimum values, null values for nullable fields.

**Conditional Validation Testing:** Testing validation rules that depend on other field values or application state — `required_if`, `required_with`, `required_unless`, custom conditional rules.

**Bulk Validation Testing:** Testing validation behavior when multiple fields fail simultaneously — the error response should include all errors, not just the first one.

---

# When To Use

- Every Form Request or validation rule defined in the API
- Custom validation rules and conditional validation logic
- Input fields with complex validation (relationships, unique constraints, composite keys)
- API endpoints that accept user-generated content
- Before releasing validation changes that affect existing consumers

---

# When NOT To Use

- Validation that duplicates database constraints (database-level unique/foreign key enforcement)
- Authentication/authorization validation — those are auth tests, not validation tests
- Server-internal validation not exposed to API consumers

---

# Best Practices

**Test each validation rule independently.** For a field with required, email, and unique rules, write three tests — one for each rule. Combining them makes failures harder to diagnose.

**Test all fields in a request, not just one.** A form request with 5 required fields needs 6 tests: one for each missing field + one where all are missing (multiple errors).

**Assert the error structure, not just the status.** 422 status confirms validation failed, but doesn't verify the error format. Assert error code, message, and field-level details.

**Test valid values pass validation.** Validation tests aren't just negative tests. Confirm that valid inputs produce no validation errors.

**Test the error message for custom rules.** Built-in rules have known messages. Custom rules must be tested to confirm they produce the expected, consumer-friendly message.

**Test conditional validation both ways.** For `required_if:field,value`, test when condition is true (field required → missing produces error) and when condition is false (field not required → missing is OK).

---

# Architecture Guidelines

**Validation tests are feature tests that hit the controller layer.** Testing validation through HTTP requests validates the full stack: controller → form request → validator → error response.

**Form Request unit tests supplement feature tests.** Use `Validator::make()` with the Form Request's rules in unit tests for faster feedback on rule logic.

**Error shape tests are shared across all validation tests.** Extract `assertValidationError()` helper that verifies the 422 status, error code prefix, and detail array structure.

**Custom rule tests should be unit tests** with `Validator::extend()` or direct rule class instantiation. Feature tests confirm the rule integrates correctly in the request lifecycle.

---

# Performance Considerations

**Validation tests are fast (~10-20ms each) because they fail early.** Requests with invalid data are rejected before controller logic executes, making validation tests some of the fastest feature tests.

**Batch validation tests (testing all fields at once) are more efficient** than individual field tests but provide less diagnostic precision. Balance based on risk:

**Conditional validation tests add complexity** but not significant performance overhead.

---

# Security Considerations

**Test that validation rejects injection attempts.** SQL injection, XSS payloads, and NoSQL injection in input fields should trigger validation errors.

**Test that error messages don't reveal internal details.** Validation error messages must not expose table names, column names, or database structure.

**Test unique constraint messages don't reveal existence.** For registration forms, the "email already taken" message reveals registered emails. Consider generic messages if this is a privacy concern.

**Test file upload validation.** Reject oversized files, wrong MIME types, and malicious file content.

---

# Common Mistakes

**Testing only one validation rule per field.** If a field has 5 rules, testing only the required case misses failures in format, uniqueness, or length validation.

**Asserting only 422 status without error structure.** The status confirms validation failed but doesn't verify the consumer receives actionable error information.

**Not testing valid cases.** Negative tests verify rejection; positive tests verify that valid data proceeds past validation.

**Hardcoding error messages in tests.** Error messages may change for localization or clarity. Assert error codes or rule identifiers instead of exact message strings.

**Testing only single-field validation.** Multi-field validation (start_date before end_date) requires tests where the combination is evaluated, not just individual fields.

---

# Anti-Patterns

**Validation Test Monoculture:** Testing every field with every rule but never testing multi-field or conditional validation. The most complex validation logic is often untested.
**Better approach:** Prioritize tests by validation complexity. Required/format rules are simple; conditional and cross-field rules need dedicated tests.

**Status-Only Validation Testing:** Asserting only the 422 status without verifying error details. The test passes even if the error response format changes completely.
**Better approach:** Always assert at least one error detail field (field name, rule) plus the 422 status.

**Message Matching Fragility:** Asserting exact English error messages. Localization or copy changes break tests.
**Better approach:** Assert error codes or rule strings instead of messages.

---

# Examples

**Single field validation test:**
```
it('requires name field', function () {
    $response = $this->postJson('/api/v1/users', []);
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['name']);
});

it('validates email format', function () {
    $response = $this->postJson('/api/v1/users', [
        'email' => 'not-an-email'
    ]);
    $response->assertStatus(422)
        ->assertJsonValidationErrorFor('email');
});
```

**Multi-field validation test:**
```
it('requires start_date before end_date', function () {
    $response = $this->postJson('/api/v1/events', [
        'start_date' => '2026-06-10',
        'end_date' => '2026-06-05'
    ]);
    $response->assertStatus(422)
        ->assertJsonValidationErrorFor('end_date');
});
```

---

# Related Topics

**Prerequisites:**
- Laravel Validation Fundamentals
- Form Request Design for APIs

**Closely Related Topics:**
- HTTP Endpoint Assertions — general assertion patterns
- Validation Error Shape Design — error response format
- Conditional Validation Patterns — complex validation logic

**Advanced Follow-Up Topics:**
- Custom Validation Rules — testing custom rule classes
- Bulk Request Validation — testing validation on bulk endpoints

**Cross-Domain Connections:**
- Error Code Taxonomy — validation error codes
- Standardized Error Envelope — error response structure
