# Skill: Implement Validation Error Shape Customization

## Purpose
Customize validation error response shape in `failedValidation()` override: consistent envelope with `source.pointer` JSON pointer format, field-level messages, and application-specific error codes.

## When To Use
- API Form Request validation customization
- Consistent validation error envelope
- JSON:API complaint validation errors

## When NOT To Use
- Default Laravel validation error format
- Non-API validation

## Prerequisites
- Form Request design
- JSON:API error specification

## Inputs
- Validation error shape specification

## Workflow
1. Override `failedValidation()` in base Form Request class
2. Build error envelope with `errors` top-level key
3. Include `status: '422'` as string
4. Include `code: 'VALIDATION_ERROR'` application code
5. Include `detail` with human-readable message per field
6. Include `source.pointer` with JSON pointer: `/data/attributes/email`
7. Use ValidationException's `errors()` for field messages
8. Maintain consistent shape across all Form Requests
9. Return `JsonResponse` with 422 status
10. Test validation error shape for all request types

## Validation Checklist
- [ ] `failedValidation()` overridden
- [ ] `errors` top-level key in response
- [ ] `status: '422'` as string
- [ ] `code` field present
- [ ] `detail` with human-readable messages
- [ ] `source.pointer` in JSON pointer format
- [ ] Consistent shape across requests
- [ ] Tested for all request types

## Related Skills
- Standardized Error Envelope
- Form Request Validation Logic
- Exception Rendering
