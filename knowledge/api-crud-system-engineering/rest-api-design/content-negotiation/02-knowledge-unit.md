# Content Negotiation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** REST API Design
- **Knowledge Unit:** Content Negotiation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Content negotiation is the mechanism by which an HTTP client and server agree on the format of a resource representation. The client indicates its preferences via request headers (`Accept`, `Content-Type`, `Accept-Language`, `Accept-Encoding`), and the server responds with the appropriate representation or a 406 Not Acceptable.

In REST APIs, content negotiation serves two purposes: response format selection (JSON, XML, custom media types) and API versioning (vendor media types). Laravel's request handling provides built-in support for JSON detection via the `Accept` header (`$request->expectsJson()`), and response content type can be set via headers. Custom media type versioning requires middleware or manual header parsing.

---

## Core Concepts

### Negotiation Headers

| Header | Purpose | Example |
|---|---|---|
| `Accept` | Response format preference | `Accept: application/json` |
| `Content-Type` | Request body format | `Content-Type: application/json` |
| `Accept-Language` | Language preference | `Accept-Language: en-US, fr-CA` |
| `Accept-Encoding` | Compression preference | `Accept-Encoding: gzip, deflate` |
| `Accept-Charset` | Character set preference | `Accept-Charset: utf-8` |

### Media Types (MIME Types)

| Type | Example | Purpose |
|---|---|---|
| JSON | `application/json` | Standard JSON API responses |
| XML | `application/xml` | Legacy system interop |
| Form URL-encoded | `application/x-www-form-urlencoded` | HTML form submissions |
| Multipart | `multipart/form-data` | File uploads |
| Vendor media type | `application/vnd.myapp.v2+json` | Versioned API responses |

### Response Format Selection Flow
1. Client sends `Accept: application/json`
2. Server inspects `Accept` header
3. Server selects the most preferred format it supports
4. Server sets `Content-Type: application/json` in response
5. If no mutually acceptable format: 406 Not Acceptable

### Vendor Media Type Structure
```
application/vnd.{company}.{version}+{format}

application/vnd.myapp.v1+json
application/vnd.stripe.v2+json
application/vnd.github.v3.raw+json
```

---

## Mental Models

### The Restaurant Menu Model
The client (customer) tells the server (chef) what format they want (menu item). The server prepares the response in that format. If the server can't produce the requested format, it says "not available" (406).

### The Translator Model
The same resource content is translated into different representation formats. The client requests a language (JSON, XML), and the server translates the resource into that format. The content is the same; the representation differs.

### The Format Negotiation in Browsers
Browsers set `Accept` headers automatically based on capabilities (HTML for pages, images for img tags, JSON for fetch API). API clients should similarly set `Accept` to indicate their format capabilities.

---

## Internal Mechanics

### Laravel's `expectsJson()` Method
```php
if ($request->expectsJson()) {
    // Client prefers JSON (Accept: application/json or similar)
    return response()->json($data);
}
```

`$request->expectsJson()` returns true when any of:
- `Accept: application/json`
- `Accept: application/*`
- `Accept: */*`
- `Accept: application/vnd.*+json`
- Any `Accept` containing `+json`
- `X-Requested-With: XMLHttpRequest` (legacy)

### Laravel Content Type Detection
```php
$request->isJson();                 // Content-Type: application/json
$request->wantsJson();              // Accept header prefers JSON
$request->accepts('application/json'); // Specific format check
$request->expectsJson();            // Prefers JSON (includes AJAX check)
$request->format();                 // Request format based on Content-Type
```

### Custom Media Type Parsing
```php
public function handle(Request $request, Closure $next)
{
    $accept = $request->header('Accept');
    
    if (preg_match('/application\/vnd\.myapp\.v(\d+)\+json/', $accept, $matches)) {
        $request->attributes->set('api_version', (int) $matches[1]);
    }
    
    return $next($request);
}
```

### Response Content-Type Setting
```php
// Explicit JSON response
return response()->json($data);
// Content-Type: application/json

// Custom Content-Type
return response($data)->header('Content-Type', 'application/vnd.myapp.v2+json');

// Response with format negotiation
$format = $request->prefers(['json', 'xml']);
if ($format === 'xml') {
    return response()->xml($data);  // Custom XML response
}
return response()->json($data);
```

---

## Patterns

### Format via Accept Header (Server-Driven Negotiation)
```php
Route::get('users/{user}', function (Request $request, User $user) {
    $format = $request->prefers(['json', 'xml']);
    
    return match ($format) {
        'xml' => response()->xml(new UserResource($user)),
        default => response()->json(new UserResource($user)),
    };
});
```

### Format via URL Extension (Agent-Driven Negotiation)
```php
Route::get('users/{user}.{format?}', function (User $user, string $format = 'json') {
    return match ($format) {
        'xml' => response()->xml(...),
        'json' => response()->json(...),
        default => abort(406),
    };
})->where('format', 'json|xml');
```

### Version via Vendor Media Type (Content Negotiation)
```php
// Middleware reads version from Accept header
class ApiVersionMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $accept = $request->header('Accept', '');
        $version = 'v1';
        
        if (preg_match('/application\/vnd\.myapp\.(v\d+)\+json/', $accept, $m)) {
            $version = $m[1];
        }
        
        app()->bind(VersionResolver::class, fn() => new $version);
        return $next($request);
    }
}
```

### Fallback Format Handling
```php
public function handle(Request $request, Closure $next)
{
    $accept = $request->header('Accept');
    
    if (!str_contains($accept, 'application/json') && !str_contains($accept, '*/*')) {
        return response()->json([
            'message' => 'This API only supports JSON responses.',
            'supported_types' => ['application/json'],
        ], 406);
    }
    
    return $next($request);
}
```

---

## Architectural Decisions

### Server-Driven vs Agent-Driven Negotiation
**Server-driven:** Server inspects `Accept` header, chooses format. More REST-correct, but complex with many formats. **Agent-driven:** Client specifies format in URL extension (`.json`, `.xml`). Simpler, more explicit, but pollutes URL space. Recommendation: Use server-driven for APIs consumed by automated clients; agent-driven for human-facing endpoints.

### Single Format vs Multiple Format Support
JSON-only is the pragmatic default. Adding XML, YAML, or CSV support increases serialization complexity, testing matrix, and documentation requirements. Add multiple formats only when clients demonstrably need them.

### Vendor Media Type Versioning vs Path Versioning
Vendor media type versioning (`Accept: application/vnd.myapp.v2+json`) keeps URLs clean but complicates client setup. Path versioning (`/v2/users`) is more explicit. Recommendation: Use path versioning for public APIs, vendor media types for versioning within a single client ecosystem.

### Content Negotiation for Error Responses
Error responses should use the same format as successful responses for the same request. If the client accepts JSON, errors should be JSON. Laravel renders exceptions as JSON when the request expects JSON.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Multiple format support: clients choose their preferred format | Multiple format support: doubles serialization code | Most clients only use JSON — XML support is unused |
| Vendor media types: clean URL versioning | Vendor media types: harder to test manually (must set headers) | API test tools (Postman, curl) need header configuration |
| Server-driven negotiation: REST-correct | Server-driven negotiation: client preferences may be ambiguous | `Accept: */*` matches everything but may not indicate capability |
| Accept-Language: internationalization support | Accept-Language: adds translation infrastructure | Only needed for multilingual content, not metadata CRUD |

---

## Performance Considerations

### Accept Header Parsing
Parsing `Accept` header with quality values (`q=0.9`) is non-trivial. Laravel's `$request->prefers()` handles this server-side. For high-throughput APIs, cache the parsed preference per unique Accept header value.

### Format Conversion Overhead
Serialization to JSON is ~2-3x faster than XML serialization in PHP. JSON encoding is optimized in PHP core (`json_encode`). XML serialization requires DOM construction or serialization libraries, adding ~10-50ms per response.

### Vendor Media Type Routing
Parsing vendor media types in middleware adds ~1-5µs per request. This is negligible but must be included in route middleware calculation for version resolution.

---

## Production Considerations

### Accept Header Validation
Reject requests with unsupported Accept values early (middleware). Return 406 with documentation links. Do not silently default to JSON when the client requested XML — the client may not understand the response format.

### Content-Type on Responses
Always set correct `Content-Type` on responses. `response()->json()` sets `Content-Type: application/json` automatically. Custom responses must set this manually. Missing Content-Type causes client parsing failures.

### CORS and Content-Type
CORS preflight for POST/PUT/PATCH requests requires `Content-Type` as an allowed header. If using custom vendor media types, add them to CORS allowed headers in `config/cors.php`.

---

## Common Mistakes

### Ignoring the Accept Header Entirely
Why it happens: All responses are JSON, so Accept header isn't checked. Why it's harmful: Clients that send `Accept: application/xml` receive JSON without warning, causing silent parsing failures. Better approach: Validate Accept header in middleware and return 406 for unsupported formats.

### Using URL Extension for Format When Content Negotiation Is Expected
Why it happens: Extension is simpler and more explicit. Why it's harmful: Splits the API surface — clients must know both `/users/42` and `/users/42.json`. Better approach: Choose one mechanism and document it clearly.

### Forgetting to Set Content-Type on Error Responses
Why it happens: `abort()` or exception handler returns HTML error pages by default. Why it's harmful: API clients receive HTML in a text body when they expect JSON, causing parse errors. Better approach: Customize the exception handler to return JSON for API requests.

### Implementing Content Negotiation Only for Success Responses
Why it happens: Error handlers are separate from successful responses. Why it's harmful: Successful request returns JSON, error returns HTML or plain text. Better approach: Use a unified response pipeline that respects Accept header at all exit points.

---

## Failure Modes

### Ambiguous Accept Header Matching
`Accept: text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8`. Parsing this correctly is complex. Naive implementations may match `*/*` to JSON when the client clearly prefers HTML. Use a quality-weighted negotiation algorithm.

### 406 Without Fallback
Returning 406 for all non-JSON Accept headers breaks browser-based testing (browsers send `text/html` as preferred). During development, allow `*/*` to default to JSON with a warning header.

### Content-Type Mismatch on POST/PUT
Client sends `Content-Type: application/xml` but the server only parses JSON. The request body is parsed as empty or malformed, leading to confusing validation errors. Validate `Content-Type` on write endpoints.

---

## Ecosystem Usage

### GitHub API
GitHub supports JSON response format via Accept header. GitHub uses custom vendor media types for versioning: `Accept: application/vnd.github.v3+json`. Different media types return different resource shapes (raw, full, diff).

### Stripe API
Stripe supports JSON only. Stripe uses URL path versioning (`/v1/`) rather than content negotiation for APIs. Stripe's webhooks use `Content-Type: application/json` exclusively.

### JSON:API Specification
JSON:API mandates `Content-Type: application/vnd.api+json` for requests and responses. Clients set `Accept: application/vnd.api+json`. This creates consistent tooling and client expectations.

---

## Related Knowledge Units

### Prerequisites
- REST Architectural Constraints — Self-descriptive messages constraint
- URL Structure Design — Format vs path versioning decision

### Related Topics
- API Versioning — Content negotiation for version selection
- Response Structures — Response envelope design per format
- CORS Design — Allowed headers for content negotiation

### Advanced Follow-up Topics
- Hypermedia Formats (HAL, JSON:API) — Format-specific content types
- API Documentation Generation — Documenting per-format response shapes

---

## Research Notes

### Source Analysis
- RFC 7231 — HTTP/1.1 Semantics and Content, Section 5.3 (Content Negotiation)
- RFC 2295 — Transparent Content Negotiation in HTTP
- JSON:API Specification (https://jsonapi.org) — Content-Type requirements

### Key Insight
For most Laravel APIs, content negotiation reduces to one question: "Does the client accept JSON?" Use `$request->expectsJson()` as the primary discriminator. Custom vendor media types add value only for versioning or format-specific behavior.

### Version-Specific Notes
- `$request->expectsJson()` behavior is consistent across Laravel 10-13
- Laravel 11's exception handler continues to distinguish JSON and HTML responses via `$request->expectsJson()`
- No framework-level changes to content negotiation handling in recent versions
