# Rules: HTTP Endpoint Assertions

## Rule: Assert Specific HTTP Status Codes
- **Condition:** When testing API endpoint responses
- **Action:** Assert exact HTTP status codes (201 for creation, 422 for validation, 401 for unauthenticated, 403 for forbidden, 404 for not found). Never use `assertSuccessful()` or generic 2xx/4xx assertions.
- **Consequence:** Specific status assertions catch incorrect status code logic that generic assertions miss.
- **Enforcement:** Code review enforces specific status codes in all new endpoint tests.

## Rule: Assert JSON Structure and Specific Data
- **Condition:** When testing API response bodies
- **Action:** Use `assertJsonStructure()` to validate response shape and `assertJsonFragment()` to validate specific data values. Reserve `assertExactJson()` for small, stable responses.
- **Consequence:** Structure assertions catch field removals; fragment assertions catch data errors; exact assertions create fragility.
- **Enforcement:** Architecture tests verify that feature tests contain at least one structure assertion.

## Rule: Test Happy Path First, Then Error Conditions
- **Condition:** When writing endpoint tests
- **Action:** Write happy path test (200/201) with status, structure, and data assertions. Then write error condition tests (401, 403, 404, 422, 500) with error envelope assertions.
- **Consequence:** Both success and error behaviors are validated; consumers experience both paths.
- **Enforcement:** Test coverage requirements mandate error path tests for every endpoint.

## Rule: Verify Error Envelope Structure
- **Condition:** When testing error responses
- **Action:** Assert that error responses follow the standardized error envelope format: status code, error code, human-readable message, and details array for validation errors.
- **Consequence:** Error shape consistency ensures clients can parse all errors uniformly.
- **Enforcement:** Shared assertion helper `assertErrorEnvelope()` enforces consistent error shape.

## Rule: Test Boundary Conditions
- **Condition:** When testing list endpoints or parameter-driven endpoints
- **Action:** Test empty collections, single-element collections, maximum pagination sizes, minimum/maximum field values, missing optional parameters, and invalid parameter values.
- **Consequence:** Boundary tests catch edge cases that happy-path tests miss.
- **Enforcement:** Review checklist includes boundary condition verification.

## Rule: Assert Response Headers Where Contractual
- **Condition:** When headers are part of the API contract
- **Action:** Assert `Content-Type`, `X-Api-Version`, caching headers (`Cache-Control`, `ETag`), deprecation headers (`Deprecation`, `Sunset`), rate limit headers, and security headers.
- **Consequence:** Header contract violations are caught in tests, not production.
- **Enforcement:** Contract tests validate all documented response headers.

## Rule: Avoid Asserting Sensitive Data
- **Condition:** When testing responses that may contain sensitive information
- **Action:** Use `assertJsonMissing()` or `assertDontSee()` to verify sensitive fields (tokens, secrets, PII) are absent from responses. Never assert exact values of sensitive data.
- **Consequence:** Prevents accidental exposure of sensitive data in test assertions.
- **Enforcement:** Security review checks for sensitive data assertions.
