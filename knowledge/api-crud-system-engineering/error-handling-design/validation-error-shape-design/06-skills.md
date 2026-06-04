# Skill: Design Validation Error Shape

## Purpose
Return consistent 422 error responses with structured validation error details — field-level messages, error codes per field, and source pointers — enabling programmatic field-level error handling by API consumers.

## When To Use
- Any API with form request validation
- When clients need field-level error identification
- When validation errors need to be displayed in UI forms

## When NOT To Use
- APIs with no validation (no input endpoints)
- Internal services where validation errors are not consumer-facing
- When field-level detail is not needed (simple pass/fail validation)

## Prerequisites
- FormRequest validation setup
- Error envelope specification

## Inputs
- Validation rule definitions per form request
- Validation error response format specification

## Workflow
1. Override `failedValidation()` in base FormRequest to return consistent JSON error shape
2. Return 422 status with standard error envelope containing `errors` object
3. Include one entry per failed field — field name as key, array of messages as value
4. Include error code per field — use validation rule-specific codes (`VALIDATION.REQUIRED`, `VALIDATION.EMAIL`, `VALIDATION.MAX_STRING`)
5. Include source pointer — JSON pointer to the field that failed validation
6. Use consistent field naming between request input and error response (same case, same format)
7. Include error code for the entire validation failure — `VALIDATION.FAILED`
8. Test validation error shape for every form request — including nested/array field validation

## Validation Checklist
- [ ] 422 returned for validation failures
- [ ] Field-level error messages included per failing field
- [ ] Error code per field (validation rule-specific)
- [ ] Source pointer included for each error
- [ ] Field naming consistent between request and response
- [ ] Overall validation error code included
- [ ] Validation error shape tested per form request

## Common Failures
- Returning 422 with only top-level message — no field-level detail
- Inconsistent field naming — camelCase in request, snake_case in errors
- No per-field error codes — client can't distinguish required vs format error
- Missing source pointers for nested/array fields — client can't map to UI

## Decision Points
- Flat vs nested error shape — flat for simple, nested for complex forms
- Single message vs message array per field — array for multiple rules per field
- First failure vs all failures — all failures for UX, first for simplicity

## Performance Considerations
- Validation error response generation negligible (<0.05ms)
- Nested field error mapping adds proportional to error count
- Message localization may add overhead per field

## Security Considerations
- Validation error messages must not reveal business rules or internal logic
- Don't expose accepted values in error messages — "must be one of: admin, user" reveals enum
- Ensure error responses don't expose field existence for security-sensitive fields

## Related Rules
- Override failedValidation() in FormRequest
- Return 422 with Error Envelope
- Include One Entry Per Failed Field
- Include Error Code Per Field
- Include Source Pointer Per Error
- Test Validation Error Shape Per Form Request

## Related Skills
- Standardized Error Envelope — envelope for validation errors
- Form Request Organization — versioned form requests
- Error Response Testing — testing validation scenarios

## Success Criteria
- All validation errors return 422 with field-level messages
- Per-field error codes identify which rule failed
- Source pointers enable UI field mapping
- Nested/array fields produce accurate error paths
- Validation error shape is consistent across all endpoints