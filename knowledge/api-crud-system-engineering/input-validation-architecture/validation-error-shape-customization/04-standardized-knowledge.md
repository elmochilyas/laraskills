# Validation Error Shape Customization

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-input-validation-architecture-validation-error-shape-customization |
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Skill Level | Intermediate |
| Classification | Configuration Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Customizing the validation error response format by overriding `failedValidation()` in a base `ApiRequest` class. The validation error format is part of the API contract — it must be consistent, documented, and versioned alongside the rest of the API. Centralizing the format ensures consistency, reduces duplication, and makes the error contract easy to document and test.

## Core Concepts

- **Default Laravel Shape**: `{ "message": "...", "errors": { "field": ["..."] } }` — web-oriented.
- **`failedValidation()` Hook**: Override in FormRequest to throw custom `HttpResponseException` with desired error shape.
- **JSON:API Error Format**: Industry-standard format with `status`, `code`, `title`, `detail`, `source.pointer`.
- **Flat Error Array**: Simple `[{ field, message }]` format for minimal APIs.
- **Centralized in Base Class**: Override in `ApiRequest` base class for consistent format across all endpoints.

## When To Use

- For any API that needs consistent validation error responses
- When migrating from Laravel's default web-oriented error shape
- When adopting JSON:API or other standard error formats
- For APIs consumed by multiple clients that need predictable error parsing
- When the default 422 error shape doesn't match the API's error envelope

## When NOT To Use

- For web applications where redirect back with errors is the expected behavior
- For internal APIs where all consumers accept Laravel's default format
- During early prototyping before error design is established
- When using Spatie Laravel Data which has its own error formatting

## Best Practices (WHY)

- **Override in base `ApiRequest`**: Single point of formatting ensures consistency across all endpoints.
- **Always throw `HttpResponseException`**: Returning a response from `failedValidation()` without throwing results in 200 with error body.
- **Use JSON:API error structure**: Industry standard with good tooling support.
- **Include field pointer information**: `source.pointer` helps clients locate the error in nested structures.
- **Use consistent HTTP status 422**: All validation errors use 422 Unprocessable Entity.
- **Log validation errors before throwing**: For observability and debugging.
- **Never include stack traces or internal identifiers** in validation errors.
- **Document the error format in the API contract**.

## Architecture Guidelines

- Override `failedValidation()` in `App\Http\Requests\Api\ApiRequest`.
- Choose a format (JSON:API, flat, envelope) and use it consistently.
- For JSON:API, convert field names to `/data/attributes/` pointer format.
- For nested fields, use dot-notation to pointer conversion.
- Pass custom `$response` to `ValidationException` constructor for full control.
- Register a renderable callback in the exception handler for `ValidationException` as backup.
- Ensure custom formatting handles both simple and nested/wildcard field errors.

## Performance Considerations

- Custom error formatting adds overhead proportional to error count.
- `collect()` + `map()` is O(n) — negligible for typical validation errors (< 100 fields).
- Avoid DB queries in `failedValidation()` — it runs on every failed validation.
- Pre-compile error format structure if using the same format across all requests.

## Security Considerations

- Never include the submitted value in validation error messages (leaks PII).
- Strip HTML tags from error messages to prevent XSS in error displays.
- Do not reveal business logic rules in error field names.
- Ensure error messages don't expose database column names or internal structure.
- Log validation errors for monitoring but exclude raw request body.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Override doesn't throw exception | Returns response instead of throwing | Forgetting `throw` | 200 response with error body | Always throw HttpResponseException |
| Inconsistent format per endpoint | Some JSON:API, some flat | Per-request overrides | Client parsing complexity | Centralize in base class |
| Sensitive data in errors | Submitted value in error message | Custom messages with :input | PII leak | Use generic messages without value interpolation |
| Returning 400 instead of 422 | Wrong status code | Status code confusion | Client expects different semantics | Always use 422 for validation errors |
| Not handling nested fields | Wildcard errors not formatted correctly | Missing pointer conversion | Client can't locate error source | Convert dot-notation to pointer format |

## Anti-Patterns

- **Overriding `failedValidation()` in every FormRequest**: Inconsistent — centralize in base class.
- **Using default Laravel web format for API**: The `errors` key structure is web-oriented.
- **Including raw validation rule metadata**: `min:max` constraints in error messages.
- **Translating field names inconsistently**: Some fields translated, others not.
- **Custom format per API version**: Version the format through the base class, not per request.

## Examples

```php
// Base ApiRequest with JSON:API error format
protected function failedValidation(Validator $validator): void
{
    $errors = collect($validator->errors()->messages())
        ->map(fn ($messages, $field) => [
            'status' => (string) Response::HTTP_UNPROCESSABLE_ENTITY,
            'code' => 'VALIDATION_ERROR',
            'title' => 'Validation Error',
            'detail' => $messages[0],
            'source' => [
                'pointer' => '/data/attributes/' . str_replace('.', '/', $field),
            ],
        ])
        ->values();

    throw new HttpResponseException(
        response()->json(['errors' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY)
    );
}
```

## Related Topics

- Form Request Design for APIs (the request class where failedValidation() lives)
- Standardized Error Envelope (broader error response structure)
- Manual Validator Creation (customizing errors from manual validation)
- Form Request Testing (testing custom error responses)
- Error Handling Design (comprehensive error handling strategy)

## AI Agent Notes

- Override `failedValidation()` in the base `ApiRequest` class, not per-request.
- Use JSON:API error format for structured, client-friendly error responses.
- Always throw `HttpResponseException` — never return a response.
- Convert dot-notation field names to `/data/attributes/` pointer format for nested fields.
- Never include sensitive data or stack traces in validation error responses.

## Verification

- [ ] `failedValidation()` is overridden in the base `ApiRequest` class
- [ ] All endpoints return the same validation error format
- [ ] The error format is documented in the API contract
- [ ] No sensitive data (submitted values) appears in error messages
- [ ] Nested/wildcard fields use correct pointer format
- [ ] HTTP status is always 422 for validation errors
- [ ] Integration tests verify validation error shape across all endpoints
