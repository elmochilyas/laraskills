# rfc-9457-problem-details
## Metadata
**Domain:** API & CRUD System Engineering  
**Subdomain:** Response Structures  
**Knowledge Unit:** rfc-9457-problem-details  
**Difficulty Level:** Intermediate  
**Last Updated:** 2026-06-02

## Executive Summary
RFC 9457 (Problem Details for HTTP APIs) defines a standard machine-readable JSON format for HTTP error responses. The format includes a `type` URI identifying the problem type, `title` (short summary), `status` (HTTP status code), `detail` (human explanation), and `instance` (URI identifying the specific occurrence). It replaces ad-hoc error structures with a standardized contract that HTTP libraries, API gateways, and monitoring tools can parse generically.

## Core Concepts
- **`type`**: A URI that identifies the problem type. SHOULD resolve to human-readable documentation. `about:blank` is used for generic problems without specific documentation.
- **`title`**: A short, human-readable summary of the problem type (e.g., "Validation Error"). SHOULD NOT change per occurrence.
- **`status`**: The HTTP status code (e.g., 422, 400, 404). Provides machine-readable severity classification.
- **`detail`**: A human-readable explanation specific to this occurrence (e.g., "The email field is required."). MAY change per occurrence.
- **`instance`**: A URI identifying the specific occurrence of the problem. Enables correlation with server logs.
- **Extension Members**: Additional members specific to the problem type (e.g., `validation_errors`, `invalid_params`). Must use a URI-namespaced key or be documented in the `type` URI.
- **Content Negotiation**: The media type `application/problem+json` identifies RFC 9457 responses. Clients can request problem details via Accept header.

## Mental Models
- **Error Receipt**: An RFC 9457 response is like an error receipt — it has a machine-readable code (type), a one-line summary (title), the severity (status), the specific issue (detail), and a transaction number (instance).
- **Error Category vs. Error Instance**: `type` is the error category (e.g., "Validation Error"). `detail` is the specific instance (e.g., "Email is invalid"). Think of type as the aisle in a store and detail as the shelf position.
- **Stack Trace for Ops Teams**: The `instance` URI is the operational teams' breadcrumb. It ties the error response to logs, metrics, and traces.

## Internal Mechanics
- **RFC 9457 Response Body**: The basic body structure:
  ```json
  {
    "type": "https://api.example.com/errors/validation-error",
    "title": "Validation Error",
    "status": 422,
    "detail": "The email field is required.",
    "instance": "/request/abc-123-def",
    "invalid_params": [
      { "field": "email", "reason": "required" }
    ]
  }
  ```
- **`about:blank` Type**: When no specific documentation URL is available, use `"type": "about:blank"`. The `title` SHOULD then be the standard HTTP status code reason phrase (e.g., "Not Found" for 404).
- **Problem Details Middleware**: A Laravel middleware can intercept exceptions and transform them into Problem Details responses. The exception handler checks if the request expects `application/problem+json`.
- **Extension Member Naming**: Custom fields that extend the problem details must either be namespaced (e.g., `https://api.example.com/errors#validation_errors`) or defined in the document at the `type` URI.
- **Status Code Consistency**: The `status` member must match the HTTP response status code. If they differ, clients SHOULD use the HTTP status code as the source of truth.

## Patterns
- **Problem Details for All 4xx/5xx**: Return RFC 9457 for ALL error responses, not just selected ones. This gives clients a single error-parsing code path regardless of the error type.
- **Validation Extension Pattern**: Add an `errors` extension member mapping field names to validation messages:
  ```json
  {
    "type": "https://api.example.com/errors/validation",
    "title": "Validation Error",
    "status": 422,
    "errors": { "email": ["The email field is required."] }
  }
  ```
- **Error Type Registry**: Maintain a registry of error types with documentation URLs. Each type has a unique URL that documents the error, its causes, and resolution steps.
- **Instance ID as Correlation ID**: Use the `instance` field to carry a request correlation ID that matches server-side logs. This enables debugging from the client error back to the server trace.
- **Framework Exception Mapping**: Map Laravel exceptions to RFC 9457 types. `ModelNotFoundException` → 404 Not Found, `ValidationException` → 422 Validation Error, `AuthenticationException` → 401 Unauthorized.
- **Problem Details with Envelope**: When using an envelope format, place the RFC 9457 body inside the `errors` key or return it directly with `application/problem+json` content type.

## Architectural Decisions
- **Error Content-Type Strategy**: Decide whether all errors use `application/problem+json` or only errors on endpoints that accept it. Using it globally simplifies client error handling.
- **Error Type URL Format**: Choose between using absolute URLs (`https://api.example.com/errors/validation`) or relative URIs (`/errors/validation`). Absolute URLs are more portable but couple the API to a domain.
- **Extension Members vs. Sparsely Populated Core**: Decide which common extension members to include (validation errors, rate limit info, stack trace). Keep the core `type`, `title`, `status`, `detail`, `instance` always present.
- **Sensitive Information in Detail**: The `detail` field may leak internal information (e.g., "User with ID 123 not found" includes a valid user ID). Sanitize `detail` for external consumers.
- **Rate Limiting Problem Details**: Standard rate limiting uses 429 status with a `Retry-After` header. RFC 9457 can extend with `remaining`, `reset`, `limit` fields.

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Standardized error structure for all clients | Requires maintaining error type registry | Each new error type needs documentation |
| Machine-readable error taxonomy (`type` URI) | `type` URI must resolve to documentation | Adds documentation operational burden |
| Client error handling is uniform across endpoints | More verbose than simple `{"error":"msg"}` | Adds 50-100 bytes per error response |
| API gateways can parse problem details | Must implement content-type negotiation | `application/problem+json` vs `application/json` |
| Correlation via `instance` | Requires request ID generation in middleware | Adds ~0.01ms per request for ID generation |

## Performance Considerations
- **Minimal Overhead**: Problem Details responses are typically small (< 1KB). The bottleneck is the error condition itself, not the format.
- **Content-Type Negotiation**: Checking `Accept` headers for `application/problem+json` adds negligible branching cost.
- **Error Type Registry Lookup**: If the error type URL is dynamically resolved, ensure the lookup is cached. Use a config array rather than a database query.
- **Serialization Speed**: Problem Details bodies are simple flat objects. Serialization is extremely fast (~0.001ms).

## Production Considerations
- **Exposing Error Documentation URLs**: Ensure the `type` URLs are publicly accessible and return human-readable documentation. Broken error type URLs undermine the trust in your API.
- **Sensitive Data in Detail**: Never include stack traces, debug backtraces, or SQL queries in `detail` for production responses. Use `instance` to correlate with internal logs.
- **Error Type Versioning**: Error type URLs should be versioned to allow documentation evolution: `/errors/v1/validation-error`.
- **Monitoring by Error Type**: Aggregate error metrics by `type` URI. This provides a clearer picture of API health than HTTP status codes alone.
- **Logging Problem Details**: Log the full RFC 9457 body with each error response. The `instance` field links the log to the actual response.

## Common Mistakes
- **Omitting `type`**: The `type` member is REQUIRED by the spec. Omitting it makes the response non-compliant.
- **Generic `type` for All Errors**: Using `https://api.example.com/errors/generic` for every error defeats the purpose. Each error category should have its own type.
- **Stack Traces in `detail`**: Including raw exception messages or stack traces in `detail` leaks internal implementation details.
- **Non-Matching Status**: Returning `"status": 422` in the body but HTTP 400 as the actual status code. The `status` must match the HTTP status.
- **Missing `status`**: The `status` member is REQUIRED. It enables clients to programmatically handle errors without parsing headers.

## Failure Modes
- **Broken Type URL**: The `type` URI returns 404. The client cannot look up error documentation. Monitor type URL reachability.
- **Inconsistent Error Shapes**: Some endpoints return Problem Details, others return simple `{"error":"msg"}`. Client error handling must branch.
- **Sensitive Info in Extension Members**: Adding `debug_info`, `sql_query`, or `stack_trace` as extension members exposes internals. Never include in production.
- **Type Collision**: Two different error scenarios share the same `type` URI. The client cannot distinguish them programmatically. Each error scenario needs a unique type.

## Ecosystem Usage
- **Laravel Framework**: Laravel does not natively produce RFC 9457 responses. Implement Problem Details via custom exception handling in `App\Exceptions\Handler`.
- **Spatie/laravel-ignition**: Uses a similar error detail format for debug pages but not for API responses.
- **IETF RFC 9457**: The specification itself (formerly RFC 7807). Widely adopted by Microsoft, Google, Stripe, and PayPal for their REST APIs.
- **Stripe API**: Stripe uses a JSON:API-like error format similar to RFC 9457 with `type`, `code`, `message`, `param` fields.
- **Microsoft REST API Guidelines**: Microsoft's API guidelines recommend RFC 9457 for all error responses.
- **API Platform (Symfony)**: Symfony's API Platform natively produces RFC 9457 error responses with validation extensions.
- **AWS APIs**: AWS services use a similar error format with `type`, `code`, `message` fields in their JSON error responses.

## Related Knowledge Units
### Prerequisites
- envelope-response-design

### Related Topics
- response-format-decision-framework

### Advanced Follow-up Topics
- response-versioning

---

## Research Notes

### Source Analysis
- IETF RFC 9457 (Problem Details for HTTP APIs, 2023) — supersedes RFC 7807
- `Illuminate\Validation\ValidationException` — maps to 422 Problem Details
- `Illuminate\Auth\AuthenticationException` — maps to 401 Problem Details
- `Symfony\Component\HttpKernel\Exception\HttpException` — base for 4xx/5xx
- `App\Exceptions\Handler` — custom exception-to-Problem-Details transformation

### Key Insight
The `type` URI is the most powerful yet most underused field in RFC 9457 — it creates a machine-readable error taxonomy that API gateways, monitoring tools, and client SDKs can parse programmatically, transforming error handling from string-matching on `message` to deterministic type-based routing.

### Version-Specific Notes
- RFC 7807 (2013) → RFC 9457 (2023): `type` is now REQUIRED (was optional); `status` is now REQUIRED (was optional)
- Laravel 10/11/12/13: No native Problem Details support — custom exception handler transformation required
- `content-type: application/problem+json` media type unchanged between RFC versions
- Laravel 11+ slimmer exception handler still requires manual Problem Details formatting
