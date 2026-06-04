# Rules: Validation Error Test Patterns

## Rule: Test Each Validation Rule Independently
- **Condition:** When a field has multiple validation rules
- **Action:** Write a separate test for each rule. Submit data that fails one rule while satisfying others.
- **Consequence:** Each rule is independently verified; test failures identify exactly which rule is broken.
- **Enforcement:** Code review requires per-rule tests for fields with 3+ validation rules.

## Rule: Assert Specific Validation Error Details
- **Condition:** When testing validation failures
- **Action:** Use `assertJsonValidationErrors()` or `assertJsonValidationErrorFor()` to verify field-level error details and error structure, not just 422 status.
- **Consequence:** Validates that consumers receive actionable error information.
- **Enforcement:** Architecture tests verify validation tests assert more than status code.

## Rule: Test All Fields In a Request
- **Condition:** When a form request has multiple required fields
- **Action:** Test each missing field individually, plus one test where all fields are missing simultaneously (ensures multiple errors are collected).
- **Consequence:** No field's validation is forgotten; bulk error collection works.
- **Enforcement:** Validation test checklist covers all fields and the all-missing case.

## Rule: Test Valid Values Pass Validation
- **Condition:** When testing validation rules
- **Action:** Submit valid data for each field and assert the response proceeds past validation (status 200/201, not 422).
- **Consequence:** Confirms validation rules don't reject valid input.
- **Enforcement:** Review flags validation tests without corresponding positive test.

## Rule: Test Conditional Validation Both Ways
- **Condition:** When using conditional validation rules (`required_if`, `required_with`, `required_unless`)
- **Action:** Test when condition is true (field required → error on missing) and when condition is false (field not required → no error on missing).
- **Consequence:** Both branches of conditional logic are covered.
- **Enforcement:** Conditional validation tests are required in code review.

## Rule: Test Custom Validation Rules Independently
- **Condition:** When using custom validation rule classes
- **Action:** Unit test the rule class directly with `Validator::extend()` or instantiate the rule and call `passes()`. Feature-test the rule integrated in a form request.
- **Consequence:** Custom rule logic is validated in isolation and in context.
- **Enforcement:** Custom rule tests required at both unit and feature level.
