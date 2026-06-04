# Validation Error Shape Design

## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Error Handling Design  
**Last Updated:** 2026-06-02

## Executive Summary
Validation errors have a unique sub-shape within the error envelope that communicates **which fields failed and why**, enabling clients to display inline field errors without parsing human-readable messages. The sub-shape is a flat object mapping field → array of message strings.

## Core Concepts
- **Field-Keyed Object**: `detail.fields` is `{ "field_name": ["message1", "message2"] }`.
- **Dot-Notation Keys**: Nested fields use dot notation (`addresses.0.city`) for array fields.
- **Messages Are Sentences**: Each message is a complete, human-readable sentence; not codes.
- **No Nesting**: One level only — avoid deeply nested field-error structures.
- **Always Present on 422**: Any 422 response must carry the `detail.fields` shape.

## Mental Models
Validation errors are like a teacher's corrections on a test. Each question (field) has one or more comments (messages). The student (client) can see exactly which questions they got wrong and why.

## Internal Mechanics
1. Laravel `Validator` fails and throws `ValidationException`.
2. Exception handler catches `ValidationException` and calls `$exception->errors()`.
3. Errors are passed through a `NormaliseValidationErrors` pipeline that:
   - Flattens nested arrays to dot notation.
   - Groups messages per field.
   - Strips HTML tags from messages.
4. The result is placed in `detail.fields`.

```php
// Input from Validator->errors()
[
    'email'    => ['The email field is required.'],
    'items.*.qty' => ['The qty must be a number.'],
]

// After normalisation
"detail": {
    "fields": {
        "email": ["The email field is required."],
        "items.0.qty": ["The qty must be a number."]
    }
}
```

## Patterns
- **Normalisation Middleware**: Registered on the 422 response pipeline.
- **Laravel Form Request Integration**: `failedValidation()` override on custom Form Requests shapes the response.
- **Strip HTML**: Validation error messages from custom rules may contain HTML; strip it.
- **Alphabetical Ordering**: Fields are sorted alphabetically in the response for deterministic output.

## Architectural Decisions
| Decision | Choice | Rationale |
|---|---|---|
| Shape | `detail.fields: { field: [string] }` | Industry standard; one-to-one with client form libraries |
| Flattening | Dot notation for arrays | Matches HTML form input names and Laravel conventions |
| Message count | Array, not single string | A field can fail multiple rules simultaneously |

## Tradeoffs
| Tradeoff | Option A | Option B | Chosen |
|---|---|---|---|
| Flat vs nested | Flat `{field: [msg]}` | Nested matching input structure | Flat — simplifies client iteration |
| Message + code | Human message only | Machine code per field | Message only — codes add complexity without client benefit |
| Single vs array | First message only | All messages | All messages — field can fail multiple rules |

## Performance Considerations
- Validation error collection happens already in the Laravel lifecycle.
- Normalisation overhead is O(n) on number of failed fields (rarely > 20).
- Pre-serialise common validation response shapes if they repeat (unlikely).

## Production Considerations
- Do not include the failed value in the response (security — may contain PII or secrets).
- Limit number of fields returned to 50 (prevent response bloat on malicious payloads).
- Localise messages if the app is multi-locale.
- Log the validation payload size — unusually large validation errors may indicate a probing attack.

## Common Mistakes
- Returning the raw `Validator->errors()` object (includes non-serialisable internals).
- Including the submitted value in the error response (`The email "hacker@x" is invalid` — may leak data).
- Nesting field errors in a different shape per Form Request (inconsistent).
- Not handling nested array validation errors (e.g., `items.*.name` becomes `items.0.name`, `items.1.name`).

## Failure Modes
- **Deep Nesting**: Validation on deeply nested structures produces long dot-notation keys. Mitigation: limit to 3 levels.
- **Empty Errors**: Validator throws with no messages. Mitigation: fallback to `"The given data was invalid."`.
- **HTML Injection**: Custom rule returns `<script>` in message. Mitigation: always strip / escape validation messages.

## Ecosystem Usage
- **Laravel**: Default `ValidationException` returns nested `{field: [msg]}` shape.
- **JSON:API**: Errors array with `source.pointer` for field.
- **Vee-Validate / React Hook Form**: Client libraries expect `{field: [msg]}` for inline rendering.
- **OpenAPI**: Schema defined in `ErrorResponse.detail.fields`.

## Related Knowledge Units
### Prerequisites
- KU-02 Standardized Error Envelope

### Related Topics
- Laravel Form Request validation
- Frontend form error handling integration

### Advanced Follow-up Topics
- Server-side validation i18n — localised error messages per request locale (Phase 4).

## Research Notes
### Source Analysis
The `{field: [messages]}` shape matches Laravel's `$errors` Bag, Vue/Vee-Validate defaults, and React Hook Form's `setError` format. This is the de facto standard for web API validation errors.

### Key Insight
Clients iterate validation errors by field name to render inline errors. If the shape changes (nested, different key name), every client must update. **Stabilise this shape first.**

### Version-Specific Notes
- Laravel 9+ `Stringable` can strip tags from messages concisely.
- Laravel 11+ `handle()` on Exception classes can override validation response directly.
