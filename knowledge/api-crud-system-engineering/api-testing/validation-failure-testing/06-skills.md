# Skill: Test Validation Failures

## Purpose
Write feature tests verifying that invalid input is rejected with 422 for every validation rule, using per-rule tests, boundary values, valid defaults for non-target fields, PestPHP datasets, and testing both store and update form requests with middleware transformations.

## When To Use
- Every endpoint with a Form Request or inline validation
- Endpoints with complex conditional validation rules
- Combined fields with interdependent validation

## When NOT To Use
- Isolated Form Request rule testing (use Form Request Unit Testing)
- Non-validation error scenarios (auth, authorization, not-found)
- Testing the validator library itself

## Prerequisites
- Laravel validation rules and Form Requests
- Feature test structure
- Understanding of middleware transformations (TrimStrings, ConvertEmptyStringsToNull)

## Inputs
- Form Request rule definitions per endpoint
- Invalid input examples per rule
- Valid default payload for non-target fields

## Workflow
1. Write one test per validation rule per field — each rule (required, email, unique, min, max) is a distinct constraint
2. Use boundary testing: for `min:3` test 2 chars; for `max:255` test 256 chars
3. Set valid defaults for all non-target fields when testing a specific field
4. Use PestPHP `with()` datasets to batch multiple validation rule tests reducing kernel boots
5. Test both store (POST) and update (PUT/PATCH) form requests — they may have different rules
6. Test middleware transformations: empty strings converted to null, whitespace trimmed before validation
7. Assert specific error messages with `assertJsonValidationErrors` and `assertJsonMissingValidationErrors`

## Validation Checklist
- [ ] One test per validation rule per field (not grouped into single "fails validation" test)
- [ ] Boundary values tested (min-1, max+1, etc.)
- [ ] Valid defaults provided for non-target fields
- [ ] Datasets used for efficiency
- [ ] Both store and update form requests tested
- [ ] Middleware transformation effects tested (empty string, whitespace-only)
- [ ] Specific error messages asserted (not just 422 status)

## Common Failures
- Testing validation on wrong HTTP method (POST vs PUT rules differ)
- Not testing nullable vs required fields
- Forgetting middleware transforms: ConvertEmptyStringsToNull turns "" into null
- Asserting validation errors for fields not in request body
- No validation failure tests at all

## Decision Points
- Test organization: per-rule tests vs per-field datasets vs per-endpoint groupings
- Error assertion: specific message vs field name only vs assertJsonValidationErrors
- Boundary strategy: exact boundaries vs broader range

## Performance Considerations
- Validation tests are input-heavy — use datasets to group many cases
- Batch independent field validations into single test with dataset rows
- Each test method with dataset reduces kernel boot overhead

## Security Considerations
- Validation error messages must not leak internal implementation details
- Debug `failed` key exposes rule internals — strip in production
- Ensure validation doesn't reveal whether a record exists (email uniqueness)

## Related Rules
- One Test Per Validation Rule Per Field
- Set Valid Defaults For Non-Target Fields
- Use PestPHP Datasets For Rule Variations
- Test Both Store And Update Form Requests
- Test Middleware Transformations

## Related Skills
- Test Authentication Failures
- Test Authorization Failures
- Test Form Request Unit

## Success Criteria
- Every validation rule has a dedicated failing test
- Boundary conditions are covered (min/max edges)
- Non-target fields are valid to isolate test focus
- Store and update validation are independently tested
- Middleware transformations are accounted for in test data
- Validation error shape is consistent across all endpoints
