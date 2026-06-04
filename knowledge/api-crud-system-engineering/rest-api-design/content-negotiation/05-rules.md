# Content Negotiation

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: content-negotiation
- Phase: 5-rules
- Last Updated: 2026-06-02

---

## Validate Accept Header In Middleware
---
## Category
Design
---
## Rule
Always validate the `Accept` header in middleware and return 406 Not Acceptable for unsupported formats — never silently default to JSON when the client requested an unsupported format.
---
## Reason
Silent defaults hide integration errors. A client requesting XML silently receives JSON, which their XML parser cannot parse, producing a confusing error on the client side. Early validation with 406 makes the failure explicit and actionable.
---
## Bad Example
```php
// No Accept validation — always returns JSON regardless
return response()->json($data);
```

## Good Example
```php
// Accept validation middleware
$accept = $request->header('Accept');
if (!str_contains($accept, 'application/json') && !str_contains($accept, '*/*')) {
    return response()->json(['message' => 'Only application/json is supported.'], 406);
}
return $next($request);
```

## Exceptions
Internal microservices where both producer and consumer are owned by the same team and format is agreed upon outside HTTP negotiation. Document the agreement and remove the check.

## Consequences Of Violation
Client-side parse errors without clear cause; integration delays from debugging format mismatches; increased support burden from silent format fallbacks.
---

## Return JSON Error Responses For API Requests
---
## Category
Maintainability
---
## Rule
Always customize Laravel's exception handler to return JSON error responses for API requests instead of the default HTML error pages.
---
## Reason
Laravel's default exception handler returns HTML error pages for all requests. API clients receive HTML when expecting JSON, causing parse failures. Using `$request->expectsJson()` in the exception handler ensures consistent response format across success and error paths.
---
## Bad Example
```php
// Exception handler returns HTML for API routes — clients get HTML instead of JSON
```

## Good Example
```php
// In App\Exceptions\Handler
public function render($request, Throwable $e)
{
    if ($request->expectsJson()) {
        return response()->json([
            'message' => $e->getMessage(),
        ], $this->getStatusCode($e));
    }
    return parent::render($request, $e);
}
```

## Exceptions
When the API is consumed exclusively by first-party clients that can handle both JSON and HTML errors (rare). Even then, consistent JSON errors simplify client error handling.

## Consequences Of Violation
API clients that silently fail to parse HTML error responses; development confusion when APIs return HTML in error scenarios; inconsistent error handling between development and production.
---

## Validate Content-Type On Write Endpoints
---
## Category
Security
---
## Rule
Always validate `Content-Type` header on POST, PUT, and PATCH endpoints — return 415 Unsupported Media Type for unsupported request body formats.
---
## Reason
Accepting any `Content-Type` allows clients to send XML, form-data, or plain text payloads that bypass your JSON validation rules. Malformed or alternative-format payloads may be parsed differently, leading to unexpected behavior or injection vulnerabilities.
---
## Bad Example
```php
public function store(Request $request)
{
    $validated = $request->validate([...]); // accepts any Content-Type
}
```

## Good Example
```php
public function store(Request $request)
{
    if (!$request->isJson()) {
        return response()->json([
            'message' => 'Content-Type must be application/json.'
        ], 415);
    }
    $validated = $request->validate([...]);
}
```

## Exceptions
Multi-format APIs that accept both JSON and XML request bodies. Validate against the list of accepted formats, not against a single one.

## Consequences Of Violation
Validation bypass via alternative Content-Type; security vulnerabilities from unexpected payload parsing; inconsistent validation behavior across formats.
---

## Set Vary: Accept On Content-Negotiated Responses
---
## Category
Performance
---
## Rule
Always set `Vary: Accept` on responses that differ based on the `Accept` header — never omit the Vary header on content-negotiated responses.
---
## Reason
CDNs and reverse proxies use the `Vary` header to partition their cache by request header values. Without `Vary: Accept`, a cached JSON response may be served to a client requesting XML, or vice versa. This causes format mismatch errors that are intermittent and hard to debug.
---
## Bad Example
```php
return response()->json($data)
    ->header('Cache-Control', 'public, max-age=3600');
// Missing Vary: Accept — cache mixes formats
```

## Good Example
```php
return response()->json($data)
    ->header('Cache-Control', 'public, max-age=3600')
    ->header('Vary', 'Accept');
```

## Exceptions
JSON-only APIs that do not inspect the Accept header at all (no negotiation). In this case, the response doesn't vary by Accept, so Vary is technically unnecessary but still harmless.

## Consequences Of Violation
Wrong format served from cache; intermittent parse errors that disappear when cache is cleared; difficult debugging because the issue depends on cache state.
---

## Use expectsJson() As Primary Format Discriminator
---
## Category
Framework Usage
---
## Rule
Always use `$request->expectsJson()` as the primary discriminator for determining whether a client expects JSON, rather than manually parsing the Accept header.
---
## Reason
`$request->expectsJson()` correctly handles all valid Accept header patterns: `application/json`, `application/*`, `*/*`, `+json` suffixes, and the legacy `X-Requested-With: XMLHttpRequest` fallback. Manual parsing misses edge cases (quality values, wildcards, vendor media types) and duplicates logic that Laravel already handles.
---
## Bad Example
```php
$accept = $request->header('Accept');
$isJson = str_contains($accept, 'application/json'); // misses */*, +json, quality values
```

## Good Example
```php
if ($request->expectsJson()) {
    return response()->json($data);
}
```

## Exceptions
When you need to distinguish between specific media types beyond JSON vs non-JSON (e.g., `application/vnd.myapp.v2+json` vs `application/vnd.myapp.v1+json`). In those cases, parse the vendor media type manually.

## Consequences Of Violation
Incorrect format detection for clients with valid but non-standard Accept headers; broken integration with SDK-generated clients that use specific Accept patterns; unnecessary complexity in format detection logic.
---

## Use Prefers() For Quality-Weighted Format Selection
---
## Category
Design
---
## Rule
Always use `$request->prefers()` with an ordered list of supported formats for quality-weighted content negotiation — never implement custom Accept header parsing with quality values.
---
## Reason
HTTP quality values (`q=0.9`) follow complex weighting rules: clients specify multiple formats with weights, and the server must select the best match. `$request->prefers()` implements the RFC-compliant selection algorithm. Custom parsing almost always gets quality values wrong, leading to incorrect format selection.
---
## Bad Example
```php
$accept = $request->header('Accept');
if (str_contains($accept, 'application/xml')) {
    return response()->xml($data); // ignores quality weighting
}
```

## Good Example
```php
$format = $request->prefers(['json', 'xml']);
return match ($format) {
    'xml' => response()->xml($data),
    default => response()->json($data),
};
```

## Exceptions
When only one format is supported (JSON-only API). No negotiation needed — use `expectsJson()` only for validation.

## Consequences Of Violation
Incorrect format selection for clients with quality-weighted Accept headers; clients receiving their second-choice format when their first-choice is available; inconsistent behavior with standard HTTP tools.
---

## Use Consistent Error Response Format Across All Status Codes
---
## Category
Maintainability
---
## Rule
Always use the same error response structure (consistent `message`, `errors`, `code` fields) across all HTTP status codes — never vary the error format by status code.
---
## Reason
Clients write generic error handling code. If 400 responses have a different shape than 422 responses, client error handlers must branch by status code before parsing. Consistent structure allows a single error handler for all failures, reducing client complexity and bug rates.
---
## Bad Example
```php
// 400 returns { "error": "..." }
// 422 returns { "message": "...", "errors": { ... } }
// 403 returns "Forbidden" (plain string)
```

## Good Example
```php
// All errors follow the same structure
return response()->json([
    'message' => 'Validation failed.',
    'errors' => ['email' => ['Required.']],
    'code' => 'VALIDATION_ERROR',
], 422);

return response()->json([
    'message' => 'Unauthenticated.',
    'errors' => [],
    'code' => 'AUTHENTICATION_ERROR',
], 401);
```

## Exceptions
When integrating with legacy systems that use a different error format and cannot be changed. Wrap legacy errors in the consistent format before returning.

## Consequences Of Violation
More complex client error handling; increased bug rates in client error paths; higher integration effort for each new client.
---

## Do Not Use URL Extension For Format Selection
---
## Category
Architecture
---
## Rule
Never use file extensions in URLs (`.json`, `.xml`, `.csv`) for format selection — use the `Accept` header instead and avoid supporting both mechanisms.
---
## Reason
URL extensions create two competing mechanisms for format selection (`/users.json` vs `Accept: application/json`). This doubles the test surface, complicates route definitions, and creates ambiguity when both are provided. The `Accept` header is the HTTP-standard mechanism.
---
## Bad Example
```php
Route::get('users.{format}', [UserController::class, 'index']);
// format selection via URL extension
```

## Good Example
```php
Route::get('users', [UserController::class, 'index']);
// format selection via Accept header only
```

## Exceptions
When the API must support non-HTTP clients (CLI tools, curl scripts) that cannot set custom Accept headers. In that case, use the `format` query parameter (`?format=json`) as a fallback, not a URL extension.

## Consequences Of Violation
Inconsistent format selection behavior; doubled route definitions and test surface; confusing API surface with two competing mechanisms.
---
