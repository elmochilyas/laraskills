# HTTP Status Code Selection

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: http-status-code-selection
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
HTTP status codes communicate the result of an HTTP request in a machine-readable format. REST APIs must select status codes that accurately reflect the outcome of each operation, enabling clients to handle responses programmatically without parsing response bodies. The 1xx/2xx/3xx/4xx/5xx class hierarchy is universally understood by HTTP clients, proxies, and CDNs.

The most frequently used codes are: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Unprocessable Entity), 429 (Too Many Requests), and 500 (Internal Server Error). The most important distinction in practice is 401 vs 403 — 401 means "I don't know who you are," 403 means "I know who you are but you can't do this."

## Core Concepts
- **2xx Success**: Request understood and accepted. 200 (OK), 201 (Created), 202 (Accepted), 204 (No Content).
- **3xx Redirection**: Further action needed. 301 (Moved Permanently), 304 (Not Modified).
- **4xx Client Error**: Request cannot be fulfilled due to client issue. 400, 401, 403, 404, 409, 422, 429.
- **5xx Server Error**: Server failed to fulfill a valid request. 500, 502, 503.
- **201 Created**: POST creating a resource — include `Location` header with new resource URI.
- **204 No Content**: DELETE success, PUT/PATCH with no body return. Empty body.
- **304 Not Modified**: Conditional GET — resource hasn't changed. Empty body.
- **409 Conflict**: Resource state conflict (duplicate, version mismatch).
- **422 Unprocessable Entity**: Validation failures — field-level error messages.
- **429 Too Many Requests**: Rate limit exceeded — include `Retry-After` header.

## When To Use
- **200**: GET/PUT/PATCH success, POST action success with response body
- **201**: POST creating a new resource (with Location header)
- **202**: Accepted for async processing (queues, background jobs)
- **204**: DELETE success, PUT/PATCH with no body return
- **304**: Conditional GET when resource is unchanged
- **400**: Malformed syntax, invalid field types, bad request structure
- **401**: Missing or invalid authentication
- **403**: Authenticated but not authorized
- **404**: Resource doesn't exist
- **409**: Conflict (duplicate resource, version mismatch)
- **422**: Validation failure (field-level errors)
- **429**: Rate limit exceeded
- **500**: Unexpected server failure (no details in body)

## When NOT To Use
- **200 for creation**: Use 201 — it signals the client to cache the Location header
- **200 for delete success without body**: Use 204 — empty 200 is ambiguous
- **400 for validation errors**: Use 422 — validation is not a syntactic error
- **403 when resource doesn't exist**: Some APIs use 404 for security — be consistent either way
- **500 with stack traces**: Never expose debug info in production 500 responses
- **Non-standard codes without documentation**: Custom codes (e.g., 276) confuse tooling

## Best Practices (WHY)
- **Use 201 for POST with Location header**: Signals to clients that the resource was created and provides its URI. Enables automated resource fetching without parsing the response body.
- **Use 422 for validation errors, 400 for syntactic errors**: 422 carries specific semantics about field-level validation. 400 is for malformed JSON, wrong data types, missing required fields.
- **Return 204 for DELETE**: The resource no longer exists — there's nothing to return. A 200 with a deleted representation is misleading.
- **Distinguish 401 vs 403 clearly**: 401 = "authenticate first" (no valid credentials). 403 = "you're authenticated but not allowed" (insufficient permissions).
- **Set no-store on 4xx/5xx responses**: Prevent CDNs from caching error responses. A cached 404 or 500 serves stale errors even after the resource is created or the error is fixed.

## Architecture Guidelines
- Standardize error response structure across all 4xx and 5xx responses — consistent `message`, `errors`, `code`, `request_id` fields.
- Laravel's exception handler (`App\Exceptions\Handler`) should normalize all error responses to API format.
- Document every possible status code for every endpoint in OpenAPI — clients need to know all possible outcomes.
- Log 500 errors with full context (request ID, user ID, URL, method) but never include stack traces in the response body.
- For batch operations with mixed outcomes, return 207 Multi-Status with individual status per item.

## Performance
- 304 Not Modified saves bandwidth by omitting the response body — the server still processes the request but avoids serialization and transmission costs.
- 429 rate limiting includes `X-RateLimit-Remaining` and `Retry-After` headers — negligible computation overhead.
- Error responses with minimal bodies (no stack traces) reduce bandwidth for failure paths.
- `APP_DEBUG=true` in production exposes stack traces in 500 responses — always set `APP_DEBUG=false` in production.

## Security
- 401 should not indicate whether the user exists — use the same message for "invalid token" and "user not found."
- 403 should not reveal why the user is unauthorized — "Insufficient permissions" is sufficient.
- Never include stack traces, SQL queries, file paths, or internal identifiers in 500 responses.
- 404 for non-existent resources vs 403 for unauthorized access to existing resources — choose a policy and apply consistently.
- CDN caching of error responses must be prevented — set `Cache-Control: no-store` on all 4xx and 5xx responses.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| 200 for all success | Returning 200 for creation, update, delete | Simplicity — one code for everything | Clients cannot differentiate creation (201) from other successes | Use 201 for creation with Location header |
| 400 for validation errors | Using 400 for field-level validation failures | 400 is the most general client error | Conflates syntactic errors with business logic validation | Return 422 for validation failures; 400 for malformed input |
| 404 for everything missing | Using 404 for both non-existent resources and unauthorized access | Security by obscurity | Legitimate clients can't distinguish "doesn't exist" from "can't access" | Use 403 for unauthorized access to known resources |
| Exposing stack traces in 500 | `APP_DEBUG=true` in production | Copy-pasted from .env.example | Exposes file paths, query structure, credentials | Always set `APP_DEBUG=false` in production |
| 200 with empty body | Returning 200 with null body instead of 204 | No established convention | Clients must check both status and body | Use 204 No Content when no body is needed |
| Caching error responses | `Cache-Control: public` on 4xx/5xx responses | Global cache middleware without filtering | Stale errors served after issue is resolved | Set `no-store` on all error responses |

## Anti-Patterns
- **200 OK for Everything**: No differentiation between creation, update, delete success. Use 201, 204.
- **500 for Client Errors**: Returning 500 when the client sends bad data. Use 400 or 422.
- **Custom Status Codes**: Using 461 or other non-standard codes. Most HTTP clients don't understand them.
- **Stack Traces in Production**: Including debug backtraces in API error responses.
- **Inconsistent Error Structure**: Different error shapes for different status codes. Unify.

## Examples
```php
// Success patterns
return new UserResource($user);              // 200
return response()->json($user, 201)          // 201 + Location header
    ->header('Location', route('users.show', $user));
return response(null, 204);                   // 204

// Client error patterns
return response()->json(['message' => 'Email already taken.'], 409);
return response()->json([
    'message' => 'Validation failed.',
    'errors' => ['email' => ['The email is required.']]
], 422);
return response()->json(['message' => 'Unauthenticated.'], 401);
return response()->json(['message' => 'Insufficient permissions.'], 403);

// Laravel helpers
abort(404, 'User not found.');
abort_if(!$user, 404);
abort_unless(Auth::check(), 401);

// ModelNotFoundException → 404 (automatic via route model binding)
Route::get('/users/{user}', [UserController::class, 'show']);
// GET /users/9999 → 404 automatically
```

## Related Topics
- **Prerequisites**: http-method-semantics, rest-architectural-constraints
- **Related**: error-handling-design, input-validation-architecture, pagination-strategies
- **Advanced**: conditional-requests, api-lifecycle-governance

## AI Agent Notes
- Use 201 for POST with Location header, 204 for DELETE, 422 for validation errors.
- Return 401 for missing/invalid auth, 403 for unauthorized but authenticated.
- Set `no-store` on all 4xx/5xx responses to prevent CDN caching.
- Keep error response structure consistent across all status codes.
- Never expose stack traces or debug info in production error responses.
- Document all possible status codes per endpoint in OpenAPI.

## Verification
- Every POST creating a resource returns 201 with Location header.
- Every DELETE returns 204 (no body).
- Validation errors return 422 with field-level error structure.
- Authentication failures return 401, authorization failures return 403.
- 4xx/5xx responses have `Cache-Control: no-store`.
- Error response structure is consistent across all endpoints and status codes.
- `APP_DEBUG=false` in production — no stack traces in 500 responses.
