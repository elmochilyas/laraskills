# Validation Error Shape Customization — Rules

## Override failedValidation() in the Base ApiRequest
---
## Category
Architecture | Maintainability
---
## Rule
Override `failedValidation()` once in the base `ApiRequest` class that all API FormRequests extend — never override per-FormRequest.
---
## Reason
The validation error format is part of the API contract and must be consistent across every endpoint. Per-request overrides inevitably diverge, producing inconsistent error shapes.
---
## Bad Example
```php
// In StorePostRequest — custom format
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(response()->json([...], 422));
}
// In UpdatePostRequest — forgot override, uses web format — inconsistency!
```
---
## Good Example
```php
// In ApiRequest — once for all endpoints
abstract class ApiRequest extends FormRequest
{
    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            response()->json($this->formatErrors($validator), 422)
        );
    }
}
```
---
## Exceptions
No common exceptions — always centralize in the base class.
---
## Consequences Of Violation
Inconsistent error responses across endpoints; clients must handle multiple formats; some endpoints return web-oriented redirect responses.

---

## Always Throw HttpResponseException
---
## Category
Reliability | Framework Usage
---
## Rule
Inside `failedValidation()`, always throw an `HttpResponseException` wrapping the JSON response — never return a response directly.
---
## Reason
FormRequest expects `failedValidation()` to throw. Returning a response without throwing allows the request to continue processing normally, sending a 200 with error body instead of 422.
---
## Bad Example
```php
protected function failedValidation(Validator $validator): void
{
    response()->json(['errors' => [...]], 422);
    // Returned, not thrown — returns 200
}
```
---
## Good Example
```php
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(
        response()->json(['errors' => [...]], 422)
    );
}
```
---
## Exceptions
No common exceptions — this is a mandatory requirement of the FormRequest lifecycle.
---
## Consequences Of Violation
API returns HTTP 200 with error body; clients interpret as success; debugging nightmare for "successful" failed requests.

---

## Use JSON:API Error Structure
---
## Category
Architecture | Scalability
---
## Rule
Format validation errors using the JSON:API error structure with `status`, `code`, `title`, `detail`, and `source.pointer` fields.
---
## Reason
JSON:API is an industry standard with broad tooling support. The structured format includes field pointers for nested errors, enabling clients to render errors precisely.
---
## Bad Example
```php
// Laravel default field-fragment format
{
    "message": "Validation failed.",
    "errors": { "title": ["The title is required."] }
}
```
---
## Good Example
```php
// JSON:API format
{
    "errors": [{
        "status": "422",
        "code": "VALIDATION_ERROR",
        "title": "Validation Error",
        "detail": "The title field is required.",
        "source": { "pointer": "/data/attributes/title" }
    }]
}
```
---
## Exceptions
Internal APIs where all consumers are first-party and accept any consistent format — but JSON:API remains the recommended default.
---
## Consequences Of Violation
Poor client-side error rendering; no field pointer support for nested data; non-standard format requires custom client code.

---

## Convert Dot-Notation to Pointer Format
---
## Category
Scalability | Maintainability
---
## Rule
Convert Laravel's dot-notation field names (`tags.3.name`) to JSON pointer format (`/data/attributes/tags/3/name`) in your error formatter.
---
## Reason
Clients consuming nested validation errors need precise pointers to locate the error source. Laravel's default dot-notation is internal; JSON pointer is the standard.
---
## Bad Example
```php
// Dot-notation — client must parse manually
"errors": { "tags.3.name": ["Name is required."] }
```
---
## Good Example
```php
// JSON pointer — standard, parseable
"source": { "pointer": "/data/attributes/tags/3/name" }
```
---
## Exceptions
Flat payloads with no dots — dot-notation is already a valid pointer path.
---
## Consequences Of Violation
Clients must implement custom dot-notation parsing; nested error locations are ambiguous; third-party tools cannot render errors correctly.

---

## Never Include Submitted Values in Error Messages
---
## Category
Security
---
## Rule
Strip submitted values from validation error messages — never use `:input` placeholders or interpolate user input into error text.
---
## Reason
Submitted values may contain PII, passwords, credit card numbers, or other sensitive data. Including them leaks sensitive data in logs, monitoring, and API responses.
---
## Bad Example
```php
$fail("The email '{$value}' is blocked."); // Leaks submitted value
```
---
## Good Example
```php
$fail("This email address is not allowed."); // No value interpolation
```
---
## Exceptions
Development environments with debug mode enabled may include values, but production must never expose submitted data.
---
## Consequences Of Violation
PII leaked in error responses; regulatory compliance violations (GDPR, HIPAA); security audit finding.

---

## Always Use HTTP 422 for Validation Errors
---
## Category
Architecture | Framework Usage
---
## Rule
Return HTTP status 422 (Unprocessable Entity) for all validation errors — never 400, 409, or other statuses.
---
## Reason
422 is the standard status for semantically invalid payloads. Using 400 suggests malformed syntax; using 409 suggests conflict. Consistency is critical for client-side error handling.
---
## Bad Example
```php
throw new HttpResponseException(response()->json([...], 400));
// Wrong — 400 means bad syntax
```
---
## Good Example
```php
throw new HttpResponseException(
    response()->json([...], Response::HTTP_UNPROCESSABLE_ENTITY) // 422
);
```
---
## Exceptions
No common exceptions — always use 422 for validation errors.
---
## Consequences Of Violation
Client error handling must check multiple status codes; monitoring alerts misfire; API documentation diverges.

---

## Log Validation Errors Before Throwing
---
## Category
Observability | Security
---
## Rule
Log validation errors at `warning` level with relevant context (field names, error count) before throwing `HttpResponseException`.
---
## Reason
Validation errors are a key observability signal — they indicate client errors, potential abuse attempts, or API contract violations. Without logging, abuse patterns go undetected.
---
## Bad Example
```php
protected function failedValidation(Validator $validator): void
{
    throw new HttpResponseException(response()->json([...], 422));
    // No log — failures invisible in monitoring
}
```
---
## Good Example
```php
protected function failedValidation(Validator $validator): void
{
    Log::warning('Validation failed', [
        'path' => $this->path(),
        'error_count' => $validator->errors()->count(),
        'fields' => array_keys($validator->errors()->toArray()),
    ]);
    throw new HttpResponseException(response()->json([...], 422));
}
```
---
## Exceptions
No common exceptions — always log validation failures at least at warning level.
---
## Consequences Of Violation
Blindness to widespread client errors; undetected abuse patterns; inability to identify API contract violations during migrations.
