# Validation Error Shape Design

## Metadata

| Field | Value |
|-------|-------|
| ECC Version | 1.0 |
| Knowledge Unit ID | api-crud-system-engineering-error-handling-design-validation-error-shape-design |
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Skill Level | Intermediate |
| Classification | Design Pattern |
| Status | Standardized |
| Last Updated | 2026-06-02 |

## Overview

Validation errors have a unique sub-shape within the error envelope that communicates **which fields failed and why**, enabling clients to display inline field errors without parsing human-readable messages. The sub-shape is a flat object mapping field → array of message strings.

## Core Concepts

- **Field-Keyed Object**: `detail.fields` is `{ "field_name": ["message1", "message2"] }`.
- **Dot-Notation Keys**: Nested fields use dot notation (`addresses.0.city`) for array fields.
- **Messages Are Sentences**: Each message is a complete, human-readable sentence; not codes.
- **No Nesting**: One level only — avoid deeply nested field-error structures.
- **Always Present on 422**: Any 422 response must carry the `detail.fields` shape.
- **Alphabetical Ordering**: Fields are sorted alphabetically in the response for deterministic output.

## When To Use

- For any API that accepts user input and returns validation errors
- When clients render inline field errors (forms, registration flows)
- For APIs consumed by frontend frameworks (React, Vue, mobile apps)
- When implementing Laravel Form Requests with custom error responses
- For public APIs where validation error usability is a priority

## When NOT To Use

- For internal APIs where only the first error message matters
- When using JSON:API format (which uses `source.pointer` instead)
- For machine-to-machine APIs where error codes alone suffice
- When the API never returns 422 responses

## Best Practices (WHY)

- **Use flat `{field: [msg]}` structure**: Simplifies client iteration — matches HTML form input names and Laravel conventions.
- **Use dot notation for nested/array fields**: Matches Laravel validation's internal structure (`items.*.name` → `items.0.name`).
- **Always return an array of messages, not a single string**: A field can fail multiple rules simultaneously.
- **Strip HTML from validation messages**: Custom rules may return HTML; sanitize before response.
- **Sort fields alphabetically**: Deterministic output for testability and client caching.
- **Never include the submitted value**: Security — may contain PII or secrets.
- **Limit fields returned to 50**: Prevent response bloat on malicious payloads with many fields.

## Architecture Guidelines

- Normalise validation errors in a dedicated pipeline or middleware on the 422 response path.
- Flatten nested arrays to dot notation before response.
- Group messages per field (Laravel's `$errors` already groups by field).
- Strip HTML tags from messages using `strip_tags()` or `Str::stripTags()`.
- Override `failedValidation()` on Form Requests for custom 422 response shape.
- Register the normalisation pipeline in the exception handler for `ValidationException`.

## Performance Considerations

- Validation error collection happens already in the Laravel lifecycle.
- Normalisation overhead is O(n) on number of failed fields (rarely > 20).
- Pre-serialising common validation shapes is unnecessary — errors vary per request.
- HTML stripping adds minimal overhead per message string.

## Security Considerations

- Never include the submitted value in validation error messages (e.g., `The email "attacker@test.com" is invalid`).
- Strip HTML/JS from validation messages to prevent XSS in error displays.
- Limit the number of returned validation fields to prevent response-based attacks.
- Do not reveal validation rules structure in field names that expose business logic.
- Log validation payload size — unusually large validation errors may indicate probing.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Returning raw Validator errors object | Non-serialisable internals included | Direct `$validator->errors()` passthrough | Serialisation errors or unexpected output | Always normalise through a pipeline |
| Including submitted values | `The email "hacker@x" is invalid` | Custom validation messages with :input | PII/data leak | Use generic messages without value interpolation |
| Inconsistent per-endpoint shapes | Some return `fields`, others return `errors` | No shared normalisation | Client must handle multiple shapes | Apply normalisation globally for all 422s |
| Deep nesting in field errors | `data.attributes.email` nested path | Input structure mirroring | Clients must traverse to find errors | Flatten to one level with dot notation |
| Single message per field | Only first validation error returned | Calling `->first()` | Client misses additional errors | Return array of all messages per field |

## Anti-Patterns

- **Returning only a top-level message**: "Validation failed" with no per-field details.
- **Using array of error objects**: `[{ field: "email", message: "required" }]` — harder for clients to index by field.
- **Including machine codes in per-field messages**: `email: ["REQUIRED|The email is required"]`.
- **HTML in validation messages**: Links, bold, or other formatting in error text.
- **Different shape per locale**: Some locales change the error structure.

## Examples

```php
// Input from Validator->errors()
[
    'email'       => ['The email field is required.'],
    'items.*.qty' => ['The qty must be a number.'],
]

// After normalisation in response:
"detail": {
    "fields": {
        "email": ["The email field is required."],
        "items.0.qty": ["The qty must be a number."]
    }
}
```

## Related Topics

- Standardized Error Envelope (validation detail lives inside the envelope)
- Form Request Design for APIs (source of validation rules)
- Validation Error Shape Customization (overriding default Laravel validation shapes)
- JSON:API Error Objects (alternative validation error format)
- Frontend form error handling integration

## AI Agent Notes

- Always normalise validation errors into the `detail.fields` structure before response.
- Use dot notation for array fields (`items.0.name` not `items.*.name`).
- Strip HTML tags from all validation messages before returning.
- Never include the failed input value in any validation error message.
- When generating Form Requests, ensure `failedValidation()` is overridden if custom shape is needed.

## Verification

- [ ] All 422 responses contain `detail.fields` with `{ field: [string] }` structure
- [ ] Nested array fields use dot notation (e.g., `items.0.qty`)
- [ ] No submitted values appear in any validation error message
- [ ] HTML tags are stripped from all validation messages
- [ ] Fields are sorted alphabetically in the response
- [ ] Maximum 50 fields returned per 422 response
- [ ] Integration tests verify validation error shape for every endpoint with input
