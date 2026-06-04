# Skill: Write Validation Error Tests

## Purpose
Test validation errors per Form Request rule set: missing required fields, type mismatches, boundary conditions, and business rule violations with correct error envelope structure.

## When To Use
- Every validation rule in Form Requests
- Custom validation rules and business logic
- Input boundary testing

## When NOT To Use
- Internal methods with validated parameters — use unit tests
- Database-level constraints — those are tested at model level

## Prerequisites
- Form Request classes with rule definitions
- Validation error envelope specification

## Inputs
- Form Request validation rules
- Error envelope shape specification

## Workflow
1. Test missing required fields — each required field omitted individually, assert 422
2. Test type mismatches — string for integer, array for string, null for required fields
3. Test boundary conditions — min/max lengths, min/max values, string character limits
4. Test business rule violations — unique validation, exists validation, custom rule failures
5. Test each validation returns 422 with correct error envelope structure: `errors.field`
6. Verify multiple validation errors returned in single request — send all invalid data
7. Verify single validation error for single invalid field — not cascading to unrelated fields
8. Test error message format matches API style (field-level, not global)
9. Test nested field errors use dot notation: `errors.address.city`
10. Test localization — error messages match request locale or default
11. Test that all fields pass with valid data — no false validation errors

## Validation Checklist
- [ ] Each required field tested individually with 422 assertion
- [ ] Type mismatch tested for each field
- [ ] Boundary conditions tested (min, max, edge values)
- [ ] Business rule violations tested
- [ ] Error envelope structure verified: `errors.field`
- [ ] Multiple errors returned in single request
- [ ] Single error per field — no cascade to unrelated fields
- [ ] Nested field errors use dot notation
- [ ] Valid request passes all fields — no false errors
- [ ] Error messages match API style

## Common Failures
- Testing only one validation error at a time — misses bug where one field error blocks others
- No boundary testing — overflow/underflow values pass through to database
- Testing only missing fields, not type mismatches
- No test for valid data — false positives from over-validation
- Testing error messages in one locale only — internationalized APIs break silently
- Testing error structure in validation only, not error response middleware

## Decision Points
- All errors vs first error — return all validation errors for better developer experience
- Field-level vs global error messages — field-level for form-like APIs, global for action endpoints
- Boundary values — test exact min, max, and one beyond for each bound

## Performance Considerations
- Test one invalid field per request to isolate exact errors
- Batch boundary tests using Pest datasets or PHPUnit data providers
- Avoid testing every possible invalid state — focus on rule boundaries

## Security Considerations
- Never reveal existence of resources in validation errors — `exists` rules reveal record presence
- Error messages should not expose database schema or column names
- Test that mass assignment protection is not bypassed by validation

## Related Rules
- Test Each Validation Rule Independently
- Verify Error Envelope Structure in Validation Errors
- Test Single and Multiple Validation Errors
- Test Business Rule Violations
- Test Valid Data Passes All Rules
- Test Localized Error Messages

## Related Skills
- Form Request Design for APIs — for validation rule design
- Validation Error Testing — for broader error testing
- Localized Validation Messages — for i18n error handling

## Success Criteria
- Every validation rule in every Form Request has a dedicated test
- Missing required, type mismatch, boundary, and business rule violations all covered
- Error envelope structure matches API contract
- Multiple errors return all failed rules
- Valid data passes without any validation errors
- Localized error messages tested for primary locale
