# rfc-9457-problem-details

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: rfc-9457-problem-details
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
RFC 9457 (Problem Details for HTTP APIs) standardizes machine-readable JSON error responses. Every error includes `type` (URI identifying the problem type), `title` (short summary), `status` (HTTP status code), `detail` (human explanation), and `instance` (URI identifying the specific occurrence). Extension members provide additional context like validation errors.

This format replaces ad-hoc error structures with a standardized contract that HTTP libraries, API gateways, and monitoring tools can parse generically. The `type` URI creates a machine-readable error taxonomy, transforming error handling from string-matching on `message` to deterministic type-based routing.

## Core Concepts
- **`type`**: URI identifying the problem type. `about:blank` for generic problems. SHOULD resolve to documentation.
- **`title`**: Short, human-readable summary of the problem type. SHOULD NOT change per occurrence.
- **`status`**: HTTP status code. Must match the response status code.
- **`detail`**: Human-readable explanation specific to this occurrence. MAY change per occurrence.
- **`instance`**: URI identifying the specific occurrence. Enables log correlation.
- **Extension Members**: Additional fields namespaced by the `type` URI or documented in the type definition.
- **`application/problem+json`**: Media type for RFC 9457 responses.
- **`about:blank`**: Default `type` when no specific documentation URL exists. `title` should be the standard status phrase.

## When To Use
- All 4xx and 5xx responses in public APIs — gives clients a single error-parsing code path.
- APIs where error taxonomy matters for monitoring and alerting (aggregate by `type`).
- APIs consumed by API gateways that can parse `application/problem+json`.
- Services where error correlation between client and server logs is important (via `instance`).
- REST APIs that want to follow IETF best practices for error formatting.

## When NOT To Use
- Internal microservices where a simpler error format suffices.
- APIs where error responses must be extremely compact (IoT, bandwidth-constrained).
- Legacy systems with existing client error-parsing code that expects a different format.
- When the team cannot maintain error type documentation URLs.

## Best Practices (WHY)
- **Use RFC 9457 for ALL error responses**: Standardizing on a single format means clients write one error handler, not conditional code for different endpoint error shapes.
- **Register error types explicitly**: Each distinct error scenario gets its own `type` URI. Don't use one generic type for everything.
- **Make `type` URLs resolve to documentation**: Clients and developers should be able to visit the URL and understand the error.
- **Include `instance` as correlation ID**: Generate a request ID in middleware and use it as both the `instance` value and the log correlation ID.
- **Keep `detail` sanitized**: Never include stack traces, SQL queries, or internal state in `detail` for production responses.

## Architecture Guidelines
- Implement Problem Details via custom exception handling in `App\Exceptions\Handler` — map each exception type to a Problem Details response.
- Use `application/problem+json` content type for all error responses — set via middleware or exception handler.
- Maintain an error type registry mapping exception classes to `type` URIs, status codes, and titles.
- Extension members (like validation errors) should be consistent across all error types that include them.
- Version error type URLs to allow documentation evolution: `/errors/v1/validation-error`.

## Performance
- Problem Details responses are typically small (< 1KB) — error conditions themselves dominate response time.
- `Content-Type` negotiation for `application/problem+json` adds negligible branching cost.
- Error type registry lookups should be cached — use a config array, not database queries.
- Serialization of Problem Details bodies is extremely fast (~0.001ms) — simple flat objects.

## Security
- Never include stack traces, debug output, or SQL queries in `detail` for production responses.
- `instance` (correlation ID) should not encode sensitive information like user IDs.
- Extension members like `validation_errors` can leak schema information — review what field names reveal.
- `type` URLs should not expose internal infrastructure details in the URL path.
- Use `instance` for internal log correlation, not for exposing internal identifiers to clients.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Omitting `type` | Error response without `type` field | Not knowing it's REQUIRED per spec | Non-compliant — machine classification impossible | Always include `type`, even if `about:blank` |
| Generic type for all errors | `https://api.example.com/errors/generic` for every error | Convenience over correctness | Defeats purpose of error taxonomy | Each error category gets its own type |
| Stack traces in `detail` | Exception callstack in `detail` | Production debugging left enabled | Leaks internal implementation details | Log stack traces server-side; use `instance` for correlation |
| Non-matching status | Body says 422 but HTTP status is 400 | Not syncing body with response | Confuses client error handling | `status` must match HTTP response status code |
| Missing `status` | Required field omitted from body | Following pre-RFC 9457 patterns | Client cannot determine severity without parsing headers | Always include `status` |

## Anti-Patterns
- **Single Generic Type**: Using `about:blank` for every error — no taxonomy, no machine classification.
- **Custom Error Format**: Using `{"error": "message"}` instead of RFC 9457 — gateways can't parse it.
- **Inconsistent Error Shapes**: Some endpoints return Problem Details, others return simple JSON errors.
- **Sensitive Info in Extension Members**: `debug_info`, `sql_query`, `stack_trace` as extension fields.
- **Broken `type` URLs**: The `type` URI returns 404 — documentation becomes useless.

## Examples
```php
// RFC 9457 compliant error response
return response()->json([
    'type' => 'https://api.example.com/errors/validation-error',
    'title' => 'Validation Error',
    'status' => 422,
    'detail' => 'The email field is required.',
    'instance' => '/request/abc-123-def',
    'invalid_params' => [
        ['field' => 'email', 'reason' => 'required'],
    ],
], 422)->header('Content-Type', 'application/problem+json');

// Exception handler mapping
class Handler extends ExceptionHandler
{
    public function render($request, Throwable $e)
    {
        if ($request->expectsJson()) {
            $problem = [
                'type' => 'about:blank',
                'title' => class_basename($e),
                'status' => $this->getStatusCode($e),
                'detail' => $e->getMessage(),
                'instance' => $request->path(),
            ];
            return response()->json($problem, $problem['status'])
                ->header('Content-Type', 'application/problem+json');
        }
        return parent::render($request, $e);
    }
}
```

## Related Topics
- **Prerequisites**: envelope-response-design
- **Related**: response-format-decision-framework
- **Advanced**: response-versioning

## AI Agent Notes
- Always use `application/problem+json` content type for error responses.
- Map validation exceptions to `type: validation-error` with `invalid_params` extension.
- Use `about:blank` as `type` when no specific error documentation exists.
- Generate a request ID for `instance` in every response for log correlation.
- Never include `stack_trace` or `debug` fields in production Problem Details.

## Verification
- Every 4xx/5xx response has `type`, `title`, `status`, `detail`, and `instance` fields.
- `status` in the body matches the HTTP response status code.
- `Content-Type: application/problem+json` is set on all error responses.
- `type` URLs resolve to documentation pages.
- Validation errors include `invalid_params` extension with field-level details.
