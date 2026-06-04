# Phase 5: Rules — Error Response Documentation

## Define Reusable Error Response Components
---
## Category
Code Organization
---
## Rule
Define error response schemas in `components/responses/` and reference them via `$ref` in every operation rather than inlining error definitions per endpoint.
---
## Reason
Inline error definitions per endpoint guarantee inconsistency — one endpoint documents `message` as a string, another documents `error` as an object. Component-based definitions enforce a single, consistent error envelope across the entire API, enabling consumers to write generic error handlers.
---
## Bad Example
```yaml
paths:
  /users:
    responses:
      '422':
        description: Validation error
        content:
          application/json:
            schema:
              type: object
              properties:
                error: { type: string }
```
---
## Good Example
```yaml
components:
  responses:
    ValidationError:
      description: Validation failed
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
paths:
  /users:
    post:
      responses:
        '422':
          $ref: '#/components/responses/ValidationError'
```
---
## Exceptions
Endpoints with truly unique error shapes (e.g., file upload size errors with different fields).
---
## Consequences Of Violation
Inconsistent error shapes across endpoints prevent generic client-side error handling; consumer code must special-case each endpoint.
---

## Document All Error Status Codes On Every Endpoint
---
## Category
Reliability
---
## Rule
Document at minimum 400, 401, 403, 404, 422, 429, and 500 responses for every endpoint that can return them.
---
## Reason
Happy-path-only documentation is not usable documentation. Consumers building robust clients need to know the shape of every error response before they encounter it in production. Undocumented error codes are the leading cause of production incidents in API integrations.
---
## Bad Example
```yaml
responses:
  '200':
    description: Success
```
---
## Good Example
```yaml
responses:
  '200': { $ref: '#/components/responses/Success' }
  '401': { $ref: '#/components/responses/Unauthorized' }
  '403': { $ref: '#/components/responses/Forbidden' }
  '404': { $ref: '#/components/responses/NotFound' }
  '422': { $ref: '#/components/responses/ValidationError' }
  '429': { $ref: '#/components/responses/TooManyRequests' }
  '500': { $ref: '#/components/responses/InternalServerError' }
```
---
## Exceptions
Public health-check endpoints that genuinely cannot return auth errors.
---
## Consequences Of Violation
Consumer error handlers break on first error response; production incidents from unhandled error shapes.
---

## Include Machine-Readable Error Codes
---
## Category
Design
---
## Rule
Add a `code` property with an enum of machine-readable strings (`VALIDATION_ERROR`, `NOT_FOUND`, `RATE_LIMITED`) in every error response schema.
---
## Reason
Consumers need to handle errors programmatically — retry on rate limits, show field validation messages, redirect on auth failures. A machine-readable code enables `switch`/`match` logic. Parsing human-readable `message` strings for control flow is fragile and breaks when wording changes.
---
## Bad Example
```json
{ "message": "User not found" }
```
---
## Good Example
```json
{ "message": "User not found", "code": "NOT_FOUND" }
```
---
## Exceptions
No common exceptions. Every error response must include a machine-readable code.
---
## Consequences Of Violation
Consumers write fragile string-matching logic against human-readable messages; localization changes break consumer error handling.
---

## Provide Scenario-Based Error Examples
---
## Category
Documentation
---
## Rule
Include multiple response examples per error status code showing different failure scenarios (missing field, invalid format, duplicate value, rate limit exceeded).
---
## Reason
A single error example teaches consumers only one failure mode. Multiple scenario examples show the range of possible error payloads, enabling consumers to handle all failure cases correctly from the start.
---
## Bad Example
```yaml
responses:
  '422':
    description: Validation error
    # No examples at all
```
---
## Good Example
```yaml
responses:
  '422':
    description: Validation error
    content:
      application/json:
        examples:
          missing_field:
            summary: Name is required
            value: { "message": "Validation failed.", "code": "VALIDATION_ERROR", "errors": { "name": ["The name field is required."] } }
          invalid_email:
            summary: Invalid email format
            value: { "message": "Validation failed.", "code": "VALIDATION_ERROR", "errors": { "email": ["The email must be a valid email address."] } }
          duplicate:
            summary: Email already exists
            value: { "message": "Validation failed.", "code": "VALIDATION_ERROR", "errors": { "email": ["The email has already been taken."] } }
```
---
## Exceptions
No common exceptions. Every error status should have at least one example showing the real error shape.
---
## Consequences Of Violation
Consumers miss edge-case error shapes; error handling code fails for less common but still possible failures.
---

## Document Retry-After Header In Rate Limit Errors
---
## Category
Documentation
---
## Rule
Document the `Retry-After` header format (seconds or HTTP-date) in the 429 response schema and description.
---
## Reason
Rate-limited consumers need to know when to retry. Without documented `Retry-After` format, consumers either retry immediately (defeating rate limiting) or wait arbitrary durations (wasting time). This is the most commonly undocumented error detail.
---
## Bad Example
```yaml
'429':
  description: Too many requests
```
---
## Good Example
```yaml
'429':
  description: Too many requests — retry after the specified duration
  headers:
    Retry-After:
      description: "Seconds to wait before retrying. Example: 120"
      schema:
        type: integer
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/ErrorResponse'
```
---
## Exceptions
APIs that do not implement rate limiting.
---
## Consequences Of Violation
Consumers either spam retries or wait unnecessarily long; rate limiting becomes ineffective or frustrating.
---

## Validate Error Response Schemas With Contract Tests
---
## Category
Testing
---
## Rule
Write contract tests that verify actual error response payloads match the documented error schemas for every documented status code.
---
## Reason
Error schemas drift from implementation more frequently than success schemas because error paths are rarely tested manually. Contract tests catch mismatched property names, missing fields, or changed types before consumers encounter them.
---
## Bad Example
No error-path contract tests exist. Documentation says `errors` is an object, but the actual response sends `error` as an array. Every consumer's error handler breaks.
---
## Good Example
```php
public function test_error_response_matches_documentation(): void
{
    $response = $this->postJson('/api/users', []);
    $response->assertStatus(422);
    $response->assertJsonStructure([
        'message',
        'code',
        'errors' => ['name']
    ]);
}
```
---
## Exceptions
No common exceptions. Every documented error status code must be verified by a contract test.
---
## Consequences Of Violation
Error documentation and actual responses diverge; consumers write error handlers against documentation that doesn't match reality; production errors are unhandled.
---
