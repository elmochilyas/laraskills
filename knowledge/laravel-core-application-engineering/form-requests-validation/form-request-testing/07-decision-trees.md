# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Form Request Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* Integration Test vs Unit Test for FormRequest Validation
* Test Coverage Scope for Validation Rules
* Separate Validation Tests vs Combined Controller + Validation Tests

---

# Architecture-Level Decision Trees

---

## Decision 1: Integration Test vs Unit Test for FormRequest Validation

---

## Decision Context

Whether to test FormRequest validation rules via HTTP integration tests (full request cycle) or unit tests (directly calling `rules()`, `authorize()`, or the validator).

---

## Decision Criteria

* Whether the test needs to verify the full validation pipeline (rules + authorization + auto-validation)
* Whether the test needs access to the container, request, and route parameters
* Whether the test team prefers black-box or white-box testing
* Whether the validation rules involve database queries (unique, exists)

---

## Decision Tree

Does the test need to verify that validation actually stops invalid data?
↓
YES → Use HTTP integration test — send request, assert validation errors in response
NO → Does the test need to verify the rules array structure (keys, rule count)?
    YES → Unit test `rules()` — verify the rules array returns expected structure
    NO → Does the test need to verify authorization logic?
        YES → HTTP integration test — authenticated user, assert 403 on unauthorized
        NO → Do the rules involve database queries (unique, exists)?
            YES → HTTP integration test — database queries require the full Laravel app context
            NO → Unit test individual rules in isolation

---

## Rationale

HTTP integration tests exercise the full validation pipeline — route resolution, FormRequest instantiation, authorization check, rule validation, and error response. This is the most reliable way to verify that validation actually works. Unit-testing `rules()` or `authorize()` in isolation requires extensive mocking and doesn't verify the validation actually fires.

---

## Recommended Default

**Default:** HTTP integration tests for all FormRequest validation. Reserve unit tests for custom validation rule classes in isolation.
**Reason:** Integration tests verify the real behavior — invalid data produces errors, valid data passes. Unit tests of `rules()` only verify the array structure, not that validation works.

---

## Risks Of Wrong Choice

* Unit test of `rules()` only: Array has correct structure but validation doesn't actually fire — false confidence
* Integration test for every edge case: Slow — full HTTP request for 20 rule variants
* No test for authorization failure: Unauthorized requests succeed — security hole
* Mocking the FormRequest: Fragile — mock structure differs from real behavior

---

## Related Rules

* Test FormRequests via HTTP Integration Tests — Not Unit Tests

---

## Related Skills

* Test Validation Boundaries via HTTP Integration Tests

---

---

## Decision 2: Test Coverage Scope for Validation Rules

---

## Decision Context

How many test cases to write per FormRequest — whether to test every rule violation, valid data, and edge cases.

---

## Decision Criteria

* Number of validation rules in the FormRequest
* Whether rules have edge cases (boundary values, null, empty strings, special characters)
* Whether the FormRequest has conditional rules (required_if, sometimes)
* Whether the team follows strict testing standards

---

## Decision Tree

Does the FormRequest have 1-3 simple rules (required, email, max:255)?
↓
YES → Test: valid data (passes), one invalid case per rule (fails)
NO → Does the FormRequest have 4+ rules or complex rules (unique, custom rules)?
    YES → Test: valid data, one invalid case per rule, boundary values for size rules
    NO → Does the FormRequest have conditional rules (required_if, required_unless)?
        YES → Test: each conditional branch (condition met, condition not met, invalid condition value)
        NO → Does the FormRequest have custom invokable rule classes?
            ↓
            YES → Test: valid input, invalid input, edge cases per custom rule
            NO → Test: valid data, one invalid case per rule

---

## Rationale

Each rule is a validation boundary that must be tested independently. The goal is to verify that the rule rejects bad input and accepts good input. Conditional rules multiply the test matrix — each branch is a separate test case. Custom rules need their own test suite, but the integration test should verify they're wired correctly.

---

## Recommended Default

**Default:** One valid-data test + at least one invalid-data test per rule. Conditional rules: one test per branch. Custom rules: test the rule class in isolation + wire test in integration.
**Reason:** This coverage ensures every rule is actually enforced. Missing one rule's test means that rule could silently stop working.

---

## Risks Of Wrong Choice

* Only valid data test: Rules could be missing entirely — still passes
* No boundary tests: String max:255 with 256 chars passes — logic error
* No conditional branch test: `required_if` branch not tested — field not validated in that condition
* All tests passing when rules are removed: Validation coverage without assertions — false confidence

---

## Related Rules

* Test Every Rule Boundary

---

## Related Skills

* Test Validation Boundaries via HTTP Integration Tests

---

---

## Decision 3: Separate Validation Tests vs Combined Controller + Validation Tests

---

## Decision Context

Whether to write separate test methods for validation scenarios or combine them with the controller's business logic tests.

---

## Decision Criteria

* Whether validation tests and controller logic tests have different setup requirements
* Whether the test file would become too large (100+ lines) if combined
* Whether the team separates test concerns by test file or by test method
* Whether the validation and controller logic are independently testable

---

## Decision Tree

Does the controller action have significant business logic beyond validation?
↓
YES → Separate validation tests from controller logic tests — different concerns, different assertions
NO → Does the validation have 5+ test cases?
    YES → Extract to a separate test method or test file — one test file with 30 validation cases is too large
    NO → Combine with controller test — `assertSessionHasNoErrors()` then assert business result
NO → Is the validation logic complex (conditional, cross-field)?
    YES → Separate test methods per validation scenario — clear naming: `test_requires_email_when_is_admin_true`
    NO → Combine validation assertions with the controller action test

---

## Rationale

Validation tests and controller tests verify different concerns. Validation tests assert error responses. Controller tests assert business outcomes. Combining them is fine for simple actions (store with 3 fields). For complex actions, separate files prevent a single test file from growing unmanageable.

---

## Recommended Default

**Default:** Combine validation assertions with controller tests for simple actions. Use separate test methods for validation scenarios. Create a separate test file when validation tests exceed 5 test cases.
**Reason:** The 5-test-case threshold keeps test files focused. Combined tests are simpler but become hard to navigate when validation logic grows.

---

## Risks Of Wrong Choice

* All tests in one file: 200-line test file mixing validation + business logic + authorization — hard to navigate
* Separate file for 2 validation tests: File overhead — `StoreUserValidationTest` with 2 test methods
* No validation tests: Business logic tests pass with invalid data — false confidence
* Validation tests without controller tests: Input validated, but action doesn't produce the right outcome

---

## Related Rules

* Test FormRequests via HTTP Integration Tests — Not Unit Tests

---

## Related Skills

* Test Validation Boundaries via HTTP Integration Tests
