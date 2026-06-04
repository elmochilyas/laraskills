# HTTP Status Code Selection

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: http-status-code-selection
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Return 201 With Location Header For Resource Creation
---
## Category
Design
---
## Rule
Always return 201 Created with a `Location` header pointing to the new resource URI for POST endpoints that create resources — never return 200.
---
## Reason
The 201 status code signals to clients that a new resource was created. The `Location` header provides the canonical URI of the new resource, enabling the client to fetch it without parsing the response body or constructing the URL from the response data. A 200 response conflates creation with other success cases and omits the Location header signal.
---
## Bad Example
```php
$user = User::create($request->validated());
return response()->json(new UserResource($user), 200);
// 200 — no creation signal, no Location header
```

## Good Example
```php
$user = User::create($request->validated());
return response()->json(new UserResource($user), 201)
    ->header('Location', route('users.show', $user));
```

## Exceptions
When the POST endpoint performs an action that does not create a new resource (e.g., `POST /orders/{order}/cancel`). In that case, 200 OK is correct — no resource was created.

## Consequences Of Violation
Clients cannot distinguish creation from other success responses; automated tooling cannot discover the new resource URI; reduced API usability for generic HTTP clients.
---

## Return 204 For Successful DELETE
---
## Category
Design
---
## Rule
Always return 204 No Content for successful DELETE operations — never return 200 with a body.
---
## Reason
After DELETE, the resource no longer exists — returning a body with its representation is semantically contradictory. 204 No Content unambiguously signals success with no body. Clients can treat any non-204 response as indicating an issue with the deletion.
---
## Bad Example
```php
$user->delete();
return response()->json(['message' => 'User deleted'], 200);
```

## Good Example
```php
$user->delete();
return response(null, 204);
```

## Exceptions
When the DELETE triggers side effects and the response includes metadata about those effects (e.g., cascaded deletions, cleanup results). In this case, 200 OK with a body is acceptable.

## Consequences Of Violation
Ambiguous success signaling; unnecessary bandwidth for response bodies; client logic must handle both body and no-body success cases.
---

## Distinguish 401 vs 403 Correctly
---
## Category
Security
---
## Rule
Always return 401 Unauthorized for missing or invalid authentication, and 403 Forbidden for authenticated but unauthorized requests — never conflate the two.
---
## Reason
401 tells the client "I don't know who you are — authenticate and retry." This triggers browser authentication dialogs and tells the client to present credentials. 403 tells the client "I know who you are, but you don't have permission." Conflating them confuses client error handling and security auditing.
---
## Bad Example
```php
// Missing token returns 403 instead of 401
if (!$request->bearerToken()) {
    return response()->json(['message' => 'Forbidden.'], 403);
}
```

## Good Example
```php
// Missing token → 401
if (!$request->bearerToken()) {
    return response()->json(['message' => 'Unauthenticated.'], 401);
}
// Valid token but insufficient permissions → 403
if (!$request->user()->can('view', $resource)) {
    return response()->json(['message' => 'Insufficient permissions.'], 403);
}
```

## Exceptions
When the API uses 404 for unauthorized access to existing resources as a security measure (hiding resource existence). This is a deliberate design choice — apply it consistently and document it.

## Consequences Of Violation
Clients cannot programmatically differentiate auth failures from permission failures; incorrect client retry behavior; security audits cannot distinguish attack patterns; browser clients show unexpected auth dialogs.
---

## Use 422 For Validation Errors, 400 For Syntax Errors
---
## Category
Design
---
## Rule
Always return 422 Unprocessable Entity for validation failures (field-level errors) and 400 Bad Request for syntactic errors (malformed JSON, wrong data types) — never use 400 for validation.
---
## Reason
422 carries specific semantics about the request body being syntactically correct but semantically invalid (field-level validation). 400 means the request could not be understood due to malformed syntax. Using 400 for validation conflates two distinct error categories, making it harder for clients to differentiate parse failures from business rule violations.
---
## Bad Example
```php
// Validation errors with 400
return response()->json([
    'message' => 'The email field is required.',
], 400);
```

## Good Example
```php
// Syntax error → 400
try {
    $data = json_decode($request->getContent(), true, 512, JSON_THROW_ON_ERROR);
} catch (\JsonException $e) {
    return response()->json(['message' => 'Malformed JSON.'], 400);
}

// Validation error → 422
return response()->json([
    'message' => 'Validation failed.',
    'errors' => ['email' => ['The email field is required.']],
], 422);
```

## Exceptions
When the client framework cannot handle 422 responses. In that case, document the deviation and consistently use 400 for both error types.

## Consequences Of Violation
Clients cannot differentiate parse failures from validation errors; form UIs cannot show field-level error messages; error handling code must inspect the response body instead of relying on status code.
---

## Set no-store On All 4xx and 5xx Responses
---
## Category
Performance
---
## Rule
Always set `Cache-Control: no-store` on all 4xx and 5xx responses — never allow CDNs or proxies to cache error responses.
---
## Reason
Cached error responses cause stale errors to be served after the issue is resolved. A 404 cached for 5 minutes means clients see "Not Found" for 5 minutes even after the resource is created. A cached 500 prevents clients from seeing a fixed endpoint. `no-store` prevents any caching of error responses.
---
## Bad Example
```php
return response()->json(['message' => 'Not found.'], 404);
// No Cache-Control — proxy may cache this 404
```

## Good Example
```php
return response()->json(['message' => 'Not found.'], 404)
    ->header('Cache-Control', 'no-store');
```

## Exceptions
When the API intentionally caches specific 4xx responses (e.g., rate-limit 429 with large Retry-After). Even then, the cached error should have a short TTL.

## Consequences Of Violation
Stale error responses served after resource creation; users seeing "not found" for existing resources; CDN serving 500 errors for fixed endpoints; difficult-to-debug intermittent errors.
---

## Never Expose Stack Traces In Production Error Responses
---
## Category
Security
---
## Rule
Always set `APP_DEBUG=false` in production and never include stack traces, SQL queries, or file paths in API error responses.
---
## Reason
Stack traces expose internal file paths, source code structure, database query patterns, and potentially sensitive configuration values. This information aids attackers in understanding the application architecture and identifying vulnerabilities. The only acceptable production error response is a generic 500 with a message like "Internal server error."
---
## Bad Example
```php
// APP_DEBUG=true in production — exposes full stack trace
{
    "message": "SQLSTATE[42S02]: Base table not found...",
    "file": "/var/www/app/Models/User.php",
    "line": 42,
    "trace": ["#0 /var/www/vendor/laravel/..."],
}
```

## Good Example
```php
// APP_DEBUG=false — generic error
{
    "message": "Internal server error.",
    "code": "INTERNAL_ERROR"
}
```

## Exceptions
When returning specific error details to first-party mobile apps for debugging. Even then, use a structured error code system (not stack traces) and limit to non-production builds.

## Consequences Of Violation
Exposed file paths and code structure; attackers can identify vulnerable packages from stack traces; compliance violations (PCI-DSS, HIPAA); increased attack surface.
---

## Return 409 For Resource Conflicts
---
## Category
Design
---
## Rule
Always return 409 Conflict when a request cannot be completed due to a conflict with the current resource state (duplicate creation, version mismatch, state transition violation) — never return 400 or 422.
---
## Reason
409 carries specific conflict semantics that tell the client the request is valid but conflicts with the current server state. This is distinct from validation errors (422) or syntax errors (400). Standard HTTP clients can distinguish conflict detection and may implement automatic retry with updated state.
---
## Bad Example
```php
// Duplicate email uses 400
return response()->json(['message' => 'Email already taken.'], 400);
```

## Good Example
```php
// Duplicate email uses 409
return response()->json(['message' => 'Email already taken.'], 409);
```

## Exceptions
When the API intentionally obscures conflict details for security reasons (e.g., not revealing that an email is already registered). In that case, return a generic 422 or 400 — document the security rationale.

## Consequences Of Violation
Clients conflate conflicts with validation errors; automated conflict retry logic cannot distinguish from other errors; monitoring cannot track conflict rates separately.
---

## Return 429 With Retry-After For Rate Limiting
---
## Category
Reliability
---
## Rule
Always return 429 Too Many Requests with a `Retry-After` header and rate-limit headers when rate limiting is exceeded — never return 403 or 503.
---
## Reason
429 is the HTTP-standard status code for rate limiting, and intermediaries (CDNs, WAFs) may handle it differently from 403 (permissions) or 503 (server capacity). The `Retry-After` header tells the client exactly when to retry, enabling intelligent backoff. Rate-limit headers (`X-RateLimit-Remaining`) inform proactive throttling.
---
## Bad Example
```php
return response()->json(['message' => 'Too many requests.'], 403);
// 403 — conflated with authorization failure
```

## Good Example
```php
return response()->json([
    'message' => 'Too many requests. Try again in 60 seconds.',
], 429)
    ->header('Retry-After', 60)
    ->header('X-RateLimit-Remaining', 0)
    ->header('X-RateLimit-Reset', now()->addSeconds(60)->timestamp);
```

## Exceptions
When the API's infrastructure layer (nginx, Cloudflare) handles rate limiting and returns a different status code. Match the infrastructure convention but add the `Retry-After` header.

## Consequences Of Violation
Clients cannot distinguish rate limiting from permission errors; automated retry without proper backoff; monitoring cannot track rate-limit events separately from other errors.
---

## Return 207 Multi-Status For Batch Operations
---
## Category
Architecture
---
## Rule
Always return 207 Multi-Status for batch operations where individual items may have different outcomes — never return a single status code for the entire batch.
---
## Reason
Batch operations inherently produce mixed results: some items succeed, others fail. A single 200 or 400 status code cannot represent this. 207 Multi-Status contains individual status codes per item, allowing the client to handle each item's outcome independently and retry only the failed items.
---
## Bad Example
```php
// Single status for batch — loses per-item results
return response()->json(['processed' => 8, 'failed' => 2], 200);
```

## Good Example
```php
$results = [];
foreach ($request->input('users') as $userData) {
    try {
        $user = User::create($userData);
        $results[] = ['status' => 201, 'data' => new UserResource($user)];
    } catch (\Exception $e) {
        $results[] = ['status' => 422, 'error' => $e->getMessage()];
    }
}
return response()->json($results, 207);
```

## Exceptions
When batch operations require atomicity (all-or-nothing). In that case, return a single status code reflecting the overall outcome, and document the atomicity requirement.

## Consequences Of Violation
Clients cannot determine individual item outcomes without parsing response bodies; retry logic must re-process the entire batch instead of failed items only; monitoring loses per-item success/failure granularity.
---

## Use 304 Not Modified For Conditional GET
---
## Category
Performance
---
## Rule
Always return 304 Not Modified with an empty body when a conditional GET (If-None-Match or If-Modified-Since) indicates the resource has not changed — never return 200 with the full response.
---
## Reason
304 saves bandwidth by omitting the response body while confirming the client's cached version is still valid. A 200 response would re-send the full body unnecessarily, negating the bandwidth-saving purpose of conditional requests. The 304 response must include the same caching headers (ETag, Last-Modified) as a 200 response.
---
## Bad Example
```php
// Returns 200 even when ETag matches — wastes bandwidth
$etag = $request->header('If-None-Match');
if ($etag === '"' . md5($user->updated_at->timestamp) . '"') {
    return response()->json(new UserResource($user), 200); // should be 304
}
```

## Good Example
```php
$etag = $request->header('If-None-Match');
$currentEtag = '"' . md5($user->updated_at->timestamp) . '"';
if ($etag === $currentEtag) {
    return response(null, 304)
        ->header('ETag', $currentEtag);
}
return response()->json(new UserResource($user), 200)
    ->setEtag($currentEtag);
```

## Exceptions
When the resource is so small that the overhead of conditional logic exceeds the cost of re-sending it. For sub-1KB responses, 304 provides negligible benefit.

## Consequences Of Violation
Wasted bandwidth for unchanged resources; increased response latency; higher server load; mobile clients consuming unnecessary data.
---
