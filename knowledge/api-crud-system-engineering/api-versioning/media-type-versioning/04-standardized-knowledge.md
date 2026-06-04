# ECC Standardized Knowledge — Media Type Versioning

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Media Type Versioning |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Media type versioning encodes version information in the response media type (e.g., `application/vnd.myapp.v1+json`), leveraging HTTP content negotiation machinery. This KU covers content negotiation stack customization, response serialization, media type registry maintenance, and client library generation. A custom responder maps vendor MIME types to versioned transformers, and the response `Content-Type` echoes the negotiated media type. This is the only approach that cleanly separates version from both URL and format.

## Core Concepts

- **Vendor MIME Type**: `application/vnd.{vendor}.v{major}+{format}`
- **Accept Header Negotiation**: Client requests vendor MIME; server matches and responds
- **Content-Type Reflection**: Response echoes the negotiated media type
- **Format Independence**: Version is orthogonal to format (`+json`, `+xml`, `+msgpack`)
- **Media Type Registry**: Config mapping vendor MIME types to transformers
- **406 Not Acceptable**: Returned for unsupported/unknown media types

## When To Use

- APIs supporting multiple serialization formats per version
- REST-pure APIs following strict HTTP semantics
- Public APIs where clients explicitly negotiate the representation
- APIs with IANA-registered vendor media types

## When NOT To Use

- Simple APIs with a single format (JSON-only)
- Browser-consumed APIs (poor browser debugging support)
- APIs where client header complexity is a concern
- Internal microservices with simple versioning needs

## Best Practices

- **Use `+json` suffix** for the media type format — standard IANA pattern.
- **Register custom media types with IANA** if the API is public.
- **Cache the transformer registry** to avoid reflection on every request.
- **Handle `*/*` wildcard Accept header** gracefully — return default version or 406.
- **Include negotiated media type in response headers** for debugging.
- **Normalize media types for logging** (handle charset, quality values).

## Architecture Guidelines

- Content negotiation adds ~0.1ms for Accept header parsing and transformer resolution.
- Registry lookup should be cached to avoid file I/O or database queries.
- CDN cache fragmentation is the greatest operational challenge — each unique Accept value creates a separate cache partition.
- Log which media type was negotiated in every request for operations debugging.

## Performance Considerations

- Content negotiation adds ~0.1ms for header parsing and transformer resolution.
- Response serialization cost varies by transformer — versioned transformers may be slower.
- CDN cache fragmentation: `Vary: Accept` with multiple media types creates many cache partitions.
- Transformer factory caching: resolve once, cache for the worker's lifetime.

## Security Considerations

- Ensure media type parsing doesn't introduce Accept header injection vulnerabilities.
- Validate that deprecated media types don't expose unpatched security vulnerabilities.
- Log and monitor 406 rates as a signal of clients using outdated or typoed media types.
- Wildcard `*/*` Accept header should default safely, not expose internal version information.

## Common Mistakes

- Using `Content-Type` instead of `Accept` for version negotiation (Content-Type describes the request body, not the desired response).
- Inconsistent media type format strings across endpoints.
- Not handling the `*/*` wildcard Accept header gracefully.
- Forgetting charset handling in the Accept header.

## Anti-Patterns

- **No media type registry**: Scattered `if` statements checking Accept header throughout controllers.
- **Removing transformers without warning**: Client requests a media type, gets 500 because transformer is gone.
- **IANA staleness**: Media type registered with IANA but publicly documented differently.

## Examples

```php
// Media type registry
'media_types' => [
    'application/vnd.myapp.v1+json' => [
        'transformer' => V1\PostTransformer::class,
        'status' => 'ACTIVE',
    ],
    'application/vnd.myapp.v2+json' => [
        'transformer' => V2\PostTransformer::class,
        'status' => 'ACTIVE',
    ],
],

// Content negotiation middleware
class ContentNegotiationMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $accept = $request->header('Accept');
        $mediaType = $this->matchMediaType($accept);

        if (!$mediaType) {
            abort(406, 'Requested media type is not supported.');
        }

        $request->attributes->set('media_type', $mediaType);
        return $next($request);
    }
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: header-based-versioning, url-path-versioning
- **Advanced**: Custom response serializers, HATEOAS media types

## AI Agent Notes

- Media type versioning is the only approach that cleanly separates version from both URL and format.
- Google API Design Guide provides the canonical reference for vendor MIME type versioning.
- Laravel 11 uses Symfony's `AcceptHeader` utilities internally via `$request->getAcceptableContentTypes()`.

## Verification

- [ ] Media type registry defined with all supported vendor MIME types
- [ ] Content negotiation middleware implemented and tested
- [ ] Response `Content-Type` echoes the negotiated media type
- [ ] Unsupported media types return 406 Not Acceptable
- [ ] Transformer registry is cached for performance
- [ ] CDN `Vary: Accept` configured correctly
- [ ] IANA registration completed for public APIs
