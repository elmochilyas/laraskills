# Phase 5: Rules — Validation Error Shape Design

## Rule: Use Flat Field-Keyed Object for Validation Errors
---
## Category
Architecture | Design
---
## Rule
Always return validation errors as a flat object mapping field names to arrays of message strings under `detail.fields` — `{"name": ["Required"]}` — never use arrays of error objects or nested structures.
---
## Reason
Field-keyed objects are the easiest structure for clients to iterate — `Object.keys(errors)` gives all failed fields, and `errors[field]` gives all messages for a specific field. Arrays of objects require searching by field name.
---
## Bad Example
```php
// Array of objects — client must search by field
'detail' => [
    'fields' => [
        ['field' => 'email', 'message' => 'Required'],
        ['field' => 'email', 'message' => 'Invalid format'],
    ],
]
```
---
## Good Example
```php
// Field-keyed object — O(1) lookup by field
'detail' => [
    'fields' => [
        'email' => ['The email field is required.', 'The email must be a valid email address.'],
    ],
]
```
---
## Exceptions
Adopting JSON:API format which uses `source.pointer` field paths in an array of error objects.
---
## Consequences Of Violation
Client-side form error rendering requires searching; O(n) field lookup instead of O(1); each client framework needs custom adapter code.

---

## Rule: Always Return an Array of Messages Per Field, Never a Single String
---
## Category
Design | Reliability
---
## Rule
Always return an array of message strings for each field, even if only one validation rule failed; never return a single string per field.
---
## Reason
A single string forces a breaking change when a second rule is added — clients must switch from string to array. Consistent arrays from the start mean clients always iterate `messages.forEach()`.
---
## Bad Example
```php
// Single string — breaks when second rule added
'detail' => ['fields' => ['email' => 'The email field is required.']]
```
---
## Good Example
```php
// Array — handles any number of rules consistently
'detail' => ['fields' => ['email' => ['The email field is required.']]]
// Adding a second rule: just append to the array
'detail' => ['fields' => ['email' => ['The email field is required.', 'The email must be valid.']]]
```
---
## Exceptions
No common exceptions — arrays are always the correct type for per-field messages.
---
## Consequences Of Violation
Client code changes when a field accumulates multiple validation rules; type instability in client SDK types (string | string[]).

---

## Rule: Use Dot Notation for Nested and Array Fields
---
## Category
Design | Maintainability
---
## Rule
Always flatten nested and array validation errors to dot notation (e.g., `addresses.0.city`, `items.*.name` → `items.0.name`); never use nested objects or wildcard patterns.
---
## Reason
Dot notation mirrors Laravel's validation internals and gives clients a predictable, single-level structure for all fields regardless of input nesting depth.
---
## Bad Example
```php
// Nested object — client must traverse
'detail' => ['fields' => ['addresses' => [['city' => ['City is required.']]]]]
```
---
## Good Example
```php
// Dot notation — flat, predictable
'detail' => ['fields' => ['addresses.0.city' => ['The city field is required.']]]
```
---
## Exceptions
No common exceptions — dot notation is always preferred for nested fields.
---
## Consequences Of Violation
Clients need recursive traversal logic; field lookup is unpredictable; different nesting depths cause parsing errors.

---

## Rule: Never Include the Submitted Value in Validation Messages
---
## Category
Security
---
## Rule
Always use validation error messages that do not echo the submitted value; never use default Laravel messages that interpolate `:input` or include the failed value.
---
## Reason
Including the submitted value in error messages (`The email "attacker@test.com" is invalid`) leaks PII in error responses and enables enumeration attacks on unique fields.
---
## Bad Example
```php
// Default Laravel message with :input — value included
'The email "attacker@test.com" is invalid.'
```
---
## Good Example
```php
// Generic message — no value interpolation
'The email must be a valid email address.'
```
---
## Exceptions
Internal admin endpoints where all users are trusted and value echo aids debugging; still consider PII implications.
---
## Consequences Of Violation
PII leak in API responses; email enumeration via "already exists" or "invalid" differences; compliance violation.

---

## Rule: Strip HTML Tags from All Validation Messages
---
## Category
Security
---
## Rule
Always apply `strip_tags()` or `Str::stripTags()` to all validation error messages before returning them in the response; never return raw HTML from custom validation rules.
---
## Reason
Custom validation rules may return HTML-formatted error messages. If rendered by a client-side framework without proper escaping, these can execute XSS attacks.
---
## Bad Example
```php
// Custom rule returns HTML — XSS vector
'This field is required. <script>alert(1)</script>'
```
---
## Good Example
```php
// All messages sanitised before response
function sanitiseMessages(array $fields): array
{
    foreach ($fields as $field => $messages) {
        $fields[$field] = array_map(fn ($msg) => strip_tags((string) $msg), $messages);
    }
    return $fields;
}
// Result: 'This field is required. alert(1)' — safe
```
---
## Exceptions
No common exceptions — HTML must always be stripped from validation messages.
---
## Consequences Of Violation
XSS vulnerability in applications that render validation errors directly from API responses; stored XSS in error logging systems.

---

## Rule: Sort Fields Alphabetically in the Response
---
## Category
Testing | Maintainability
---
## Rule
Always sort validation error fields alphabetically by key name in the response; never rely on the order returned by Laravel's validator.
---
## Reason
Alphabetical sorting produces deterministic output regardless of PHP version, validator internals, or rule registration order. This makes test assertions stable and client-side iteration predictable.
---
## Bad Example
```php
// Order depends on validator internals — non-deterministic
'detail' => ['fields' => ['name' => [...], 'email' => [...], 'age' => [...]]]
```
---
## Good Example
```php
// Sorted alphabetically — deterministic
'detail' => ['fields' => [
    'age' => [...],
    'email' => [...],
    'name' => [...],
]]
// Applied via ksort($fields) before response
```
---
## Exceptions
No common exceptions — deterministic ordering is always better for API contracts.
---
## Consequences Of Violation
Snapshot tests fail on PHP version upgrades; clients cannot rely on field order; debugging harder due to non-deterministic output.

---

## Rule: Limit Fields Returned to 50 Maximum
---
## Category
Performance | Security
---
## Rule
Always limit the number of validation error fields returned in a single 422 response to 50; truncate additional fields and log a warning.
---
## Reason
A malformed request can submit hundreds of invalid fields, generating a response that is multiple megabytes in size. Limiting to 50 prevents response bloat, DoS amplification, and excessive bandwidth use.
---
## Bad Example
```php
// All fields returned regardless of count — response may be MBs
'detail' => ['fields' => $allErrors] // 200+ fields
```
---
## Good Example
```php
$maxFields = 50;
if (count($fields) > $maxFields) {
    Log::warning('Validation error truncation', [
        'total_fields' => count($fields),
        'truncated_to' => $maxFields,
    ]);
    $fields = array_slice($fields, 0, $maxFields, preserve_keys: true);
}
'detail' => ['fields' => $fields]
```
---
## Exceptions
No common exceptions — a 50-field limit protects against DoS and response bloat.
---
## Consequences Of Violation
DoS amplification — attacker sends 500-field request, response is 500KB; bandwidth exhaustion; response serialisation memory limits hit.

---

## Rule: Override failedValidation() on Form Requests for Custom 422 Shape
---
## Category
Framework Usage | Code Organization
---
## Rule
Always override `failedValidation()` on API Form Requests to throw a custom exception that renders the standard envelope with `detail.fields`; never let the default `ValidationException` render without normalisation.
---
## Reason
Laravel's default `ValidationException` returns a raw message/errors structure without the standard envelope. Overriding `failedValidation()` ensures the validation error goes through the normalisation pipeline.
---
## Bad Example
```php
// Default behavior — returns raw array without envelope
class StoreUserRequest extends FormRequest
{
    // No failedValidation override — default Laravel response
}
// Response: {"message": "...", "errors": {"email": ["Required"]}}
```
---
## Good Example
```php
class StoreUserRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new ValidationException(
            validator: $validator,
            response: $this->buildEnvelopeResponse($validator),
        );
    }

    protected function buildEnvelopeResponse(Validator $validator): JsonResponse
    {
        $fields = $this->normaliseValidationErrors($validator->errors());
        return response()->json(
            new ErrorEnvelope(
                code: ErrorCodes::VALIDATION_ERROR,
                message: 'The given data was invalid.',
                status: 422,
                detail: ['fields' => $fields],
            ),
            422,
        );
    }
}
```
---
## Exceptions
Global middleware normalises all validation error responses to the standard envelope; override not needed per-request.
---
## Consequences Of Violation
Inconsistent error shapes — some endpoints return the standard envelope, others return Laravel's default array; clients must handle both formats.

---

## Rule: Normalise Validation Errors in a Global Pipeline
---
## Category
Code Organization | Maintainability
---
## Rule
Always apply a global normalisation pipeline for `ValidationException` in the exception handler that flattens, sorts, limits, and sanitises validation errors; never duplicate this logic per endpoint.
---
## Reason
Centralised normalisation ensures every 422 response has the exact same `detail.fields` shape regardless of which endpoint or Form Request generated it.
---
## Bad Example
```php
// Each endpoint formats errors differently
// UsersController: {"errors": {"email": ["Required"]}}
// OrdersController: {"error": {"code": "VALIDATION", "fields": {"email": ["Required"]}}}
```
---
## Good Example
```php
// Global normalisation in handler:
$this->renderable(function (ValidationException $e, Request $request) {
    if (! $request->expectsJson()) return null;

    $fields = $e->validator->errors()->toArray();
    $fields = $this->flattenToDotNotation($fields);
    $fields = $this->sanitiseMessages($fields);
    ksort($fields);
    $fields = array_slice($fields, 0, 50);

    return response()->json(
        new ErrorEnvelope(
            code: ErrorCodes::VALIDATION_ERROR,
            message: 'The given data was invalid.',
            status: 422,
            detail: ['fields' => $fields],
        ),
        422,
    );
});
```
---
## Exceptions
No common exceptions — global normalisation is the correct pattern for consistent validation error shapes.
---
## Consequences Of Violation
Inconsistent 422 shapes across endpoints; some endpoints return the envelope, others return Laravel's default array; client integration requires per-endpoint handling.
