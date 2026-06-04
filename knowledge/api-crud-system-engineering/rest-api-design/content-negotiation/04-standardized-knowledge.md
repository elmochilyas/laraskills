# Content Negotiation

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: rest-api-design
- Knowledge Unit: content-negotiation
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Content negotiation is the mechanism by which an HTTP client and server agree on the format of a resource representation. The client indicates preferences via request headers (`Accept`, `Content-Type`, `Accept-Language`, `Accept-Encoding`), and the server responds with the appropriate representation or a 406 Not Acceptable.

In REST APIs, content negotiation serves two purposes: response format selection (JSON, XML, custom media types) and API versioning (vendor media types). For most Laravel APIs, content negotiation reduces to one question: "Does the client accept JSON?" Use `$request->expectsJson()` as the primary discriminator.

## Core Concepts
- **Accept Header**: Client's response format preference. `Accept: application/json` requests JSON.
- **Content-Type Header**: Request body format. `Content-Type: application/json` indicates JSON request body.
- **Vendor Media Type**: Custom media types for versioning — `application/vnd.myapp.v2+json`.
- **Server-Driven Negotiation**: Server inspects `Accept` header and chooses format. More REST-correct but complex.
- **Agent-Driven Negotiation**: Client specifies format in URL extension (`.json`, `.xml`). Simpler but pollutes URL space.
- **expectsJson()**: Laravel method returning true for `Accept: application/json`, `application/*`, `*/*`, `+json`, or `X-Requested-With: XMLHttpRequest`.
- **406 Not Acceptable**: Response when server cannot produce any format the client accepts.

## When To Use
- **Multi-format APIs**: APIs serving both JSON and XML clients (legacy integrations, enterprise consumers)
- **Versioned APIs via media type**: Using `Accept: application/vnd.myapp.v2+json` for version selection
- **Content-Type validation**: Rejecting requests with unsupported `Content-Type` on write endpoints
- **Language negotiation**: Multilingual APIs where content varies by language
- **Compression negotiation**: gzip/brotli selection via `Accept-Encoding` (typically handled at server level)

## When NOT To Use
- JSON-only APIs where all clients accept JSON — Accept header validation adds complexity without value
- Internal microservices where both producer and consumer use the same format
- Small APIs with a single consumer — the cost of multi-format support exceeds the benefit
- APIs where URL extension is the established convention and clients expect it

## Best Practices (WHY)
- **Validate Accept header in middleware**: Return 406 for unsupported formats early rather than silently defaulting to JSON when client requested XML. Silent fallback causes client-side parse errors.
- **Set correct Content-Type on all responses**: `response()->json()` sets `Content-Type: application/json` automatically. Custom responses must set this manually — missing Content-Type causes client parsing failures.
- **Unify error and success content negotiation**: Error responses must use the same format as successful responses. Laravel's exception handler respects `$request->expectsJson()` for JSON errors.
- **Use path versioning for public APIs, vendor media types for single-client ecosystems**: Path versioning (`/v2/users`) is more explicit and testable. Vendor media types keep URLs clean but complicate client setup.
- **Keep JSON-only unless clients demonstrably need other formats**: Adding XML, YAML, or CSV support increases serialization complexity, testing matrix, and documentation requirements.

## Architecture Guidelines
- Use `$request->expectsJson()` as the primary discriminator for JSON-capable clients.
- Parse vendor media types in middleware and store the version in request attributes.
- Set `Vary: Accept` on responses to ensure caches store different versions per Accept header.
- For multi-format APIs, implement format-specific resource classes or transform responses after the controller returns.
- Accept header parsing with quality values (`q=0.9`) is non-trivial — use Laravel's `$request->prefers()`.
- Add custom vendor media types to CORS allowed headers in `config/cors.php`.

## Performance
- Parsing `Accept` header adds ~1-5µs per request. Cache parsed preferences per unique Accept header value for high-throughput APIs.
- JSON serialization is ~2-3x faster than XML in PHP — `json_encode` is optimized in PHP core.
- Adding vendor media type parsing in middleware adds negligible overhead (~1-5µs).
- `Vary: Accept` increases cache storage because each Accept value produces a separate cache entry.

## Security
- Validate `Accept` header against allowed formats — reject unsupported formats with 406, not 200 with wrong Content-Type.
- `Content-Type` validation on write endpoints prevents injection of non-JSON payloads that may bypass validation parsing.
- CORS `Access-Control-Allow-Headers` must include `Content-Type` and any vendor media types for preflight to succeed.
- Never trust `Accept` header for authorization decisions — it is a format preference, not an identity claim.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Ignoring Accept header | Returning JSON regardless of Accept value | Convenience — all responses are JSON | Clients requesting XML silently receive JSON and fail parsing | Validate Accept header; return 406 for unsupported formats |
| Forgetting Content-Type on errors | Exception handler returns HTML for API routes | Default Laravel error pages | API clients receive HTML when expecting JSON | Customize exception handler to return JSON for API requests |
| Content-Type mismatch on POST | Accepting any Content-Type without validation | Not checking request content type | XML body parsed as JSON (empty/null) | Validate Content-Type on write endpoints |
| Naive Accept header parsing | Matching `*/*` to JSON without quality weighting | Simple string matching | Client preferring HTML receives JSON | Use quality-weighted algorithm or `$request->prefers()` |
| CORS without Content-Type | Not including Content-Type in allowed headers | Minimal CORS config | Preflight fails for JSON POST requests | Add `Content-Type` to `Access-Control-Allow-Headers` |
| Inconsistent format negotiation | Success uses negotiation but errors default to HTML | Separate error handling path | Clients parse errors in different format than success | Unified response pipeline respecting Accept header |

## Anti-Patterns
- **Format via User-Agent sniffing**: Detecting browser vs. app to choose format. Use explicit `Accept` headers.
- **JSON-only but ignoring Accept**: Not validating Accept header at all — clients receive JSON even when they request XML and cannot parse it.
- **URL extension for every format decision**: Having both `/users.json` and `/users?format=json` — choose one mechanism.
- **Negotiation on every endpoint but no Vary header**: Responses vary by Accept but caches are not told to differentiate.
- **Silent defaulting to JSON**: Accept header with `text/html` defaults to JSON without warning.

## Examples
```php
// Format negotiation middleware
public function handle(Request $request, Closure $next)
{
    $accept = $request->header('Accept');
    if (!str_contains($accept, 'application/json') && !str_contains($accept, '*/*')) {
        return response()->json([
            'message' => 'This API supports application/json only.',
        ], 406);
    }
    return $next($request);
}

// Vendor media type versioning
public function handle(Request $request, Closure $next)
{
    $accept = $request->header('Accept', '');
    if (preg_match('/application\/vnd\.myapp\.(v\d+)\+json/', $accept, $m)) {
        $request->attributes->set('api_version', $m[1]);
    }
    return $next($request);
}

// Laravel expectsJson() usage
if ($request->expectsJson()) {
    return response()->json($data);
}

// Content-Type validation on store
public function store(Request $request)
{
    if (!$request->isJson()) {
        return response()->json(['message' => 'Content-Type must be application/json'], 415);
    }
    // ...
}
```

## Related Topics
- **Prerequisites**: rest-architectural-constraints, url-structure-design
- **Related**: cors-design, hateoas-hypermedia-controls
- **Advanced**: hypermedia-formats, api-documentation-generation

## AI Agent Notes
- Use `$request->expectsJson()` as the primary discriminator for JSON responses.
- Validate Accept header in middleware for format enforcement.
- Set `Vary: Accept` on responses that vary by Accept header.
- Customize exception handler to return JSON for API routes.
- For multi-format support, use `$request->prefers()` for quality-weighted selection.

## Verification
- Every response includes correct `Content-Type` header matching the response format.
- Requests with unsupported Accept headers receive 406 Not Acceptable.
- Error responses use the same format as successful responses for the same request.
- `Vary: Accept` header is present on responses that vary by content negotiation.
- Write endpoints validate `Content-Type` and reject unsupported request formats.
- Laravel's exception handler returns JSON for API requests (not HTML).
