# HTTP Status Code Selection

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** HTTP Status Code Selection
- **Last Updated:** 2026-06-02

---

## Executive Summary

HTTP status codes communicate the result of an HTTP request in a machine-readable format. REST APIs must select status codes that accurately reflect the outcome of each operation, enabling clients to handle responses programmatically without parsing response bodies. The 1xx/2xx/3xx/4xx/5xx class hierarchy is universally understood by HTTP clients, proxies, and CDNs.

The most frequently used codes in REST APIs are: 200 (OK), 201 (Created), 204 (No Content), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Unprocessable Entity), 429 (Too Many Requests), and 500 (Internal Server Error). Each code carries specific semantics about request success, client error, or server failure. Laravel provides helpers and conventions for returning each code via the `response()` helper and exception handling.

---

## Core Concepts

### Status Code Classes

| Class | Category | Meaning | Examples |
|---|---|---|---|
| 1xx | Informational | Request received, continuing | 100 Continue |
| 2xx | Success | Request understood and accepted | 200, 201, 202, 204 |
| 3xx | Redirection | Further action needed | 301, 302, 304 |
| 4xx | Client Error | Request cannot be fulfilled due to client issue | 400, 401, 403, 404, 409, 422, 429 |
| 5xx | Server Error | Server failed to fulfill a valid request | 500, 502, 503 |

### Common REST Status Codes

| Code | Name | When to Use | Response Body |
|---|---|---|---|
| 200 | OK | GET success, POST action success, PUT/PATCH success | Resource representation |
| 201 | Created | POST creating a new resource | New resource + Location header |
| 202 | Accepted | Request accepted but processing async (queues) | Status URL or tracking ID |
| 204 | No Content | DELETE success, PUT/PATCH with no body return, action with no result | Empty |
| 301 | Moved Permanently | Resource has new permanent URI | New URI |
| 304 | Not Modified | Conditional GET — resource hasn't changed | Empty |
| 400 | Bad Request | Malformed syntax, invalid field types | Error details |
| 401 | Unauthorized | Missing or invalid authentication | "Authentication required" |
| 403 | Forbidden | Authenticated but not authorized | "Insufficient permissions" |
| 404 | Not Found | Resource doesn't exist | "Resource not found" |
| 405 | Method Not Allowed | HTTP method not supported for this URI | Allowed methods |
| 409 | Conflict | Resource state conflict (duplicate, version mismatch) | Conflict details |
| 415 | Unsupported Media Type | Request body format not supported | Supported formats |
| 422 | Unprocessable Entity | Validation failures | Field-level error messages |
| 429 | Too Many Requests | Rate limit exceeded | Retry-After header |
| 500 | Internal Server Error | Unexpected server failure | Request ID (no details) |
| 503 | Service Unavailable | Server overloaded or maintenance | Retry-After header |

---

## Mental Models

### The Traffic Light Model
2xx = Green (go, everything worked), 3xx = Yellow (redirect — follow the sign), 4xx = Red (client problem — fix your request), 5xx = Black (server fire — nothing you can do, try again later).

### The Conversation Model
- 2xx = "Here you go" / "Done"
- 3xx = "I'm over here now"
- 4xx = "That doesn't make sense" / "I don't understand"
- 5xx = "I broke" / "I can't handle this right now"

### The Error Boundary Model
4xx errors are the client's responsibility to fix. 5xx errors are the server's responsibility to fix. Client error handling code should differentiate: retry 5xx, fix request for 4xx.

---

## Internal Mechanics

### Laravel Response Building

```php
// Implicit (Laravel converts to 200)
return new UserResource($user);

// Explicit status code
return response()->json($data, 200);
return response()->json($user, 201);
return response(null, 204);

// With Location header (201 Created)
return response()->json($user, 201)
    ->header('Location', route('users.show', $user));

// Error responses
return response()->json(['message' => 'Not found'], 404);
return response()->json(['message' => 'Validation failed', 'errors' => $errors], 422);
```

### Laravel's `abort()` Helpers
```php
abort(404);                    // 404 Not Found
abort(403, 'Unauthorized.');    // 403 Forbidden
abort(400, 'Bad request.');     // 400 Bad Request
abort_if(!$user, 404);          // Conditional
abort_unless(Auth::check(), 401); // Conditional
```

### ModelNotFoundException → 404
Laravel automatically converts `ModelNotFoundException` to a 404 response. Route model binding (`User $user`) triggers this when the model isn't found:
```php
Route::get('/users/{user}', [UserController::class, 'show']);
// GET /users/9999 → 404 Not Found automatically
```

### ValidationException → 422
Laravel's form request validation automatically returns 422 with field-level errors when validation fails:
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email must be a valid email address."]
    }
}
```

### ThrottleRequests → 429
Laravel's `throttle` middleware returns 429 Too Many Requests with `Retry-After` header when the rate limit is exceeded.

---

## Patterns

### Success Response Patterns

```php
// GET index — returns collection
return UserResource::collection($users); // 200

// GET show — returns single resource
return new UserResource($user);          // 200

// POST store — returns new resource
return new UserResource($user);          // 201 + Location header

// PUT/PATCH update — returns updated resource
return new UserResource($user);          // 200

// DELETE destroy — no content (most common)
return response(null, 204);              // 204

// DELETE destroy — with content (less common)
return response()->json(['deleted' => true]); // 200
```

### Validation Error Pattern
```php
return response()->json([
    'message' => 'Validation failed.',
    'errors' => [
        'email' => ['The email has already been taken.'],
        'name' => ['The name field is required.'],
    ]
], 422);
```

### Resource Not Found Pattern
```php
// Explicit check
public function show(string $id) {
    $user = User::find($id);
    if (!$user) {
        return response()->json(['message' => 'User not found.'], 404);
    }
    return new UserResource($user);
}

// Or use implicit route model binding
public function show(User $user) {
    return new UserResource($user); // Auto-404 if not found
}
```

### Conflict Pattern (409)
```php
return response()->json([
    'message' => 'A user with this email already exists.',
    'resource' => '/users/42',
], 409);
```

---

## Architectural Decisions

### 200 vs 201 for POST
Always use 201 when POST creates a new resource with a new identity. Use 200 when POST performs an action that doesn't create a resource. This distinction signals to clients whether to cache the Location header.

### 200 vs 204 for DELETE
Return 204 when the deletion is successful and there's no meaningful response body. Return 200 when the response includes confirmation data (deleted resource snapshot, status). 204 is the more common and REST-correct choice.

### 422 vs 400 for Validation Errors
Use 422 for domain validation errors (field validation, business rule violations). Use 400 for syntactic errors (malformed JSON, wrong data types, missing required fields). 422 carries more specific semantics about field-level validation.

### 401 vs 403
401 means "authenticate first" (no valid credentials). 403 means "you're authenticated but not allowed" (insufficient permissions). Return 401 for missing tokens, 403 for forbidden operations with valid tokens.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Precise codes enable automated handling | Too many codes overwhelm clients | Clients handle only 200/4xx/5xx generically |
| Standard codes are universally understood | Non-standard codes (422 vs 400) confuse some clients | Some APIs use only 200 and 400 for simplicity |
| 202 enables async processing patterns | 202 responses require polling or webhooks | Adds client complexity for status checking |
| 204 saves bandwidth for delete responses | 204 empty body doesn't confirm what was deleted | Clients must infer deletion from prior state |

---

## Performance Considerations

### 304 Not Modified Optimization
Returning 304 for conditional GET requests (with ETag or If-Modified-Since) saves bandwidth by omitting the response body. The server still processes the request but avoids serialization and transmission costs.

### 429 Rate Limiting Overhead
Returning 429 includes rate-limit headers (`X-RateLimit-Remaining`, `Retry-After`). The middleware calculates these on every request, adding negligible overhead. However, the client's retry behavior after 429 impacts server load.

### 500 Error Response Size
Return minimal information in 500 responses — never include stack traces, query details, or internal state. Laravel's `APP_DEBUG=true` exposes these in development but must be suppressed in production via `APP_DEBUG=false`.

---

## Production Considerations

### Error Response Consistency
All error responses (4xx, 5xx) should follow a uniform structure:
```json
{
    "message": "Human-readable message.",
    "errors": { ... },          // field-level errors (optional)
    "code": "ERROR_CODE",       // machine-readable error code (optional)
    "request_id": "req_abc123"  // correlation ID (optional)
}
```
Laravel's exception handler (`App\Exceptions\Handler`) should normalize all error responses.

### API Documentation of Status Codes
Document every possible status code for every endpoint. Clients need to know: what codes are possible, what each code means, and what the response body looks like for each code.

### Logging 5xx Errors with Context
Log 500 errors with full context (request ID, user ID, URL, method, input) but never in the response body. Use Laravel's logging channels to capture structured error data.

---

## Common Mistakes

### Returning 200 for All Success Cases
Why it happens: Simplicity — returning 200 for everything avoids thinking about status codes. Why it's harmful: Clients cannot differentiate between creation (201) and other successes (200), losing the ability to extract the resource URI from the Location header. Better approach: Use 201 for creation with Location header, 200 for other successes.

### Returning 404 for All Missing Resources Including Authorization Failures
Why it happens: Security — hiding whether a resource exists vs whether it's accessible. Why it's harmful: While security through obscurity has merit, conflating 403 and 404 prevents legitimate clients from understanding access issues. Better approach: Use 403 for unauthorized access to known resources, 404 only when the resource genuinely doesn't exist.

### Exposing Stack Traces in 500 Responses
Why it happens: `APP_DEBUG=true` in production (copy-pasted from .env.example). Why it's harmful: Exposes internal file paths, query structure, and potentially credentials. Better approach: Always set `APP_DEBUG=false` in production; log full details server-side.

### Using 400 for Validation Errors
Why it happens: 400 is the most general client error code. Why it's harmful: 400 conflates syntactic errors with business logic validation. 422 (Unprocessable Entity) has a specific meaning for validation failures. Better approach: Return 400 only for malformed requests; use 422 for validation failures.

---

## Failure Modes

### Ambiguous Status Code Handling in Clients
When the same endpoint returns 200 for both success and partial-failure (e.g., batch operation with some failures), clients cannot distinguish outcomes. Either split into separate endpoints or return 207 Multi-Status with individual status per item.

### CDN Caching of Error Responses
A CDN may cache a 404 or 500 response if cache headers are set. Subsequent clients receive the cached error, even after the resource is created or the error is fixed. Set `Cache-Control: no-store` on all 4xx and 5xx responses.

### 429 Thundering Herd
When rate-limited clients all retry simultaneously after `Retry-After` expires, they create a thundering herd. Use jitter and exponential backoff on the client side.

---

## Ecosystem Usage

### Stripe API
Stripe uses 200, 400, 401, 404, 409, 429, 500 consistently. Stripe returns 402 (Payment Required) for declined charges — a non-standard but meaningful use of an otherwise unused code.

### GitHub API
GitHub uses 200, 201, 204, 301, 304, 401, 403, 404, 409, 422, 429 precisely. GitHub notably uses 202 for accepted async operations (status checks, imports).

### Twilio API
Twilio returns 200 for all successful requests (even creation) and uses a unique error code system in the response body rather than differentiating by status code. Twilio uses 21201-style application error codes.

---

## Related Knowledge Units

### Prerequisites
- HTTP Method Semantics — Which status codes pair with which methods
- REST Architectural Constraints — Uniform interface constraint

### Related Topics
- Error Handling Design — Structured error response patterns
- Input Validation Architecture — 422 validation error structure
- Pagination Strategies — Pagination metadata with 200 responses

### Advanced Follow-up Topics
- API Lifecycle Governance — Deprecation headers (299, 301)
- Conditional Requests — 304 Not Modified mechanics

---

## Research Notes

### Source Analysis
- RFC 7231 — HTTP/1.1 Semantics and Content — Sections 6.2-6.6 define all standard status codes
- RFC 6585 — Additional HTTP Status Codes — 428 Precondition Required, 429 Too Many Requests, 431 Request Header Fields Too Large, 511 Network Authentication Required

### Key Insight
The most important status code distinction in practice is 401 vs 403. Misusing these causes security issues and client confusion. The rule: 401 = "I don't know who you are," 403 = "I know who you are but you can't do this."

### Version-Specific Notes
- Laravel 11 introduces `api` route file as opt-in
- Throttle middleware behavior unchanged across 10-13
- Validation exception format (422) consistent across all versions
