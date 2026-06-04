# Error Response Shape Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Error Response Shape Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Error response shape tests assert that every error response (4xx and 5xx) follows a consistent JSON structure across all endpoints. A uniform error shape — typically `{"message": "...", "errors": {...}}` for 422 or `{"message": "..."}` for others — is essential for client-side error handling. Tests verify that the error response has the correct top-level keys, error key naming conventions, message formats, and that debug information is stripped in production-like environments. Laravel's exception handler is the central control point for error shape consistency.

---

## Core Concepts
Laravel's default API error shapes: 401 returns `{"message": "Unauthenticated."}`, 403 returns `{"message": "This action is unauthorized."}`, 404 returns `{"message": "Not Found."}`, 422 returns `{"message": "The given data was invalid.", "errors": {"field": ["message"]}}`, 429 returns `{"message": "Too Many Attempts."}`, 500 returns `{"message": "Server Error"}` (in production). Tests assert these exact structures using `assertJsonStructure` and `assertExactJson` or `assertJsonFragment`. Custom error shapes defined in `App\Exceptions\Handler` must be tested to ensure they match the API contract. Error shapes should be versioned — v1 and v2 may differ, but all endpoints within a version must be consistent.

---

## Mental Models
Error response testing is **standardizing the crash report** — when something goes wrong, the error message must be in a format the client can parse. A car's dashboard warning lights all follow the same shape (icon + light color). API errors must follow the same principle: location of the error message, structure of validation errors, absence of stack traces.

---

## Internal Mechanics
`Illuminate\Foundation\Configuration\Exceptions` (Laravel 11) or `App\Exceptions\Handler` (Laravel 10) renders exceptions via `register()` callbacks. The `shouldReturnJson()` method determines if the request expects JSON. API requests always return JSON errors. The `render()` callback receives the request and exception and returns a response. Default error shapes are defined in the framework's `Handler` class. Custom error shapes override the `render()` method or use `$this->renderable()` closures. In production, `APP_DEBUG=false` strips stack traces from 500 responses. The `errors` key in 422 responses uses the `MessageBag::toArray()` format (`{"field": ["error1", "error2"]}`).

---

## Patterns
- **Test each error status code shape**: One test per error status (401, 403, 404, 422, 429, 500) asserting the exact JSON structure.
- **Use datasets for error shape coverage**: `it('returns :status shape', fn($status, $shape) => ...)->with('errorShapes')`.
- **Test both debug and production error shapes**: `APP_DEBUG=true` tests include stack traces; `APP_DEBUG=false` tests exclude them.
- **Assert error message absence of sensitive data**: `$response->assertJsonMissing(['email' => 'user@example.com'])` in error responses.
- **Custom error key convention testing**: If your API uses `{"error": {...}, "code": "VALIDATION_ERROR"}` instead of the default, assert that convention everywhere.

---

## Architectural Decisions
The default Laravel error shapes are intentionally minimal: `message` only for 401/403/404/429, and `message + errors` for 422. This avoids leaking implementation details. The decision to customize error shapes (adding `code`, `trace_id`, `status`) is application-specific but must be applied consistently in the handler, tested, and documented. Custom error shapes add client complexity — every new key requires client-side parsing logic.

---

## Tradeoffs
| Tradeoff | Default Error Shape | Custom Error Shape |
|---|---|---|
| Client complexity | Low (well-known format) | Higher (custom parsing) |
| Debug information | Minimal | Configurable (trace_id, context) |
| Framework dependency | Tight (upgrade-safe) | Loose (decoupled from Laravel defaults) |
| Consistency risk | Low (framework enforces) | Medium (custom handler must enforce) |

---

## Performance Considerations
Error response shape tests don't require complex setup — trigger errors with malformed requests. They're cheap and should cover every possible error status. Run them in a dedicated test suite that validates the exception handler globally, not per-endpoint.

---

## Production Considerations
Error shape consistency is a production contract — clients parse errors from arbitrary endpoints and expect the same structure. Publish the error shape as part of your API documentation. Never include stack traces, SQL queries, or internal IDs in production error messages. Use unique error codes (`POSTS_NOT_FOUND`, `VALIDATION_FAILED`) for client-side i18n. Log the full exception details server-side but return only the safe subset to the client.

---

## Common Mistakes
- Custom error shapes only applied to some exception types — others fall through to the default and create inconsistency.
- Including `exception` and `file` keys in production error responses (debug info leak).
- Making 422 error responses structurally different from 401/403 responses (inconsistent top-level keys).
- Forgetting to test the error shape for 500 errors (unguarded, may expose stack traces).

---

## Failure Modes
- **Inconsistent error keys**: Some endpoints return `{"error": "msg"}` while others return `{"message": "msg"}`.
- **Debug leak**: `APP_DEBUG=true` response includes stack trace in a production test.
- **Missing validation errors key**: 422 returns only `message` without `errors` — client can't display field-level errors.
- **Non-JSON error**: Exception handler returns HTML or plain text for an API request — `Content-Type` will be wrong.

---

## Ecosystem Usage
Laravel's first-party packages (Cashier, Horizon, Nova) all follow Laravel's default error shape. Spatie's `laravel-errors` package provides standardized error response formatting. The JSON:API specification defines a strict error shape (`errors[]` with `status`, `code`, `title`, `detail`).

---

## Related Knowledge Units
### Prerequisites
- Laravel Exception Handling (Handler, renderable callbacks)
- response-shape-testing (base structure assertion patterns)

### Related Topics
- response-status-code-testing (status code paired with error shape)
- validation-failure-testing (422-specific error shape)
- authentication-failure-testing (401-specific error shape)
- authorization-failure-testing (403-specific error shape)

### Advanced Follow-up Topics
- JSON:API error shape conformance
- Error code taxonomy and documentation
- Client-side error parsing and i18n

---

## Research Notes
### Source Analysis
`Illuminate\Foundation\Configuration\Exceptions::render()` in Laravel 11. `App\Exceptions\Handler::render()` in Laravel 10. `Symfony\Component\HttpKernel\Exception\HttpException` and its subclasses define the HTTP status code.
### Key Insight
Error response shape is the most frequently overlooked API contract — teams prioritize happy-path testing and forget that clients depend just as heavily on error parsing. A consistent error shape reduces client-side error handling code by 50%.
### Version-Specific Notes
Laravel 11 uses `Exceptions` class with `renderable()` and `shouldRenderJsonWhen()` methods. The default 422 shape changed in Laravel 11 to always include `errors`. `APP_DEBUG` controls stack trace visibility; test with both values.
