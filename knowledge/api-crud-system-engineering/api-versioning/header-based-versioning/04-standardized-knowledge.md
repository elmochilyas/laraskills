# ECC Standardized Knowledge — Header-Based Versioning

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Header-Based Versioning |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

Header-based versioning uses HTTP request headers (e.g., `Accept: application/vnd.myapp.v1+json`) rather than the URL path to specify the API version. This KU covers middleware-based version resolution, controller dispatch, testing, and content negotiation. A middleware reads the header, resolves the version, and dispatches to the correct handler. Header-based versioning is more REST-pure than URL path versioning because the resource identifier (URI) does not change — only the representation.

## Core Concepts

- **Custom Accept Header**: `Accept: application/vnd.myapp.v{n}+json` — vendor MIME type
- **Custom Header**: `X-API-Version: v1` — simpler but non-standard
- **Middleware Resolution**: `VersionMiddleware` reads header, sets `api_version` attribute
- **Controller Factory**: Dynamically resolves correct versioned controller
- **`Vary: Accept`**: Required for CDN cache correctness with header-based versioning
- **Fallback Chain**: Accept header → Custom header → Default version → 400/406

## When To Use

- Internal APIs where URL stability is important
- Microservice-to-microservice communication
- APIs supporting multiple representations (JSON, XML) per version
- Teams comfortable with content negotiation

## When NOT To Use

- Public APIs consumed by browser-based clients (debugging difficulty)
- APIs where version visibility in logs is required
- Mobile apps with limited header control
- APIs behind proxies that strip custom headers

## Best Practices

- **Middleware-based version resolution** is cleaner and reusable versus controller-level parsing.
- **Set `Vary: Accept` on responses** to prevent CDN serving wrong version.
- **Include resolved version in response headers** for debuggability (`X-API-Version: v1`).
- **Validate version header early** — before authentication — to fail fast with 406.
- **Log the raw Accept header AND the resolved version** to debug parsing issues.
- **Use a `/version` endpoint** that echoes back the resolved version for client debugging.

## Architecture Guidelines

- Header parsing adds ~0.05ms per request — negligible.
- Controller factory resolution must be cached or use singleton pattern to avoid per-request overhead.
- The primary operational risk is invisibility — when something breaks, you can't see the version in the URL.
- Proxy/gateway compatibility must be verified — corporate proxies may strip custom headers.

## Performance Considerations

- Header parsing adds ~0.05ms per request — negligible.
- `Vary: Accept` splits the cache into N partitions (one per version), reducing effective cache size.
- Response header (`X-API-Version`) injection adds ~0.01ms.
- Gateway-level header parsing is faster than application-level.

## Security Considerations

- Test that security monitoring tools can still identify API version from headers.
- Ensure version header parsing doesn't introduce injection vulnerabilities in middleware.
- A missing Accept header should fail safely (default to latest or return 406), not crash.
- Corporate proxies that strip custom `X-API-Version` headers leave all clients at the default version.

## Common Mistakes

- Not setting `Vary: Accept`, causing CDN cache poisoning across versions.
- Using `X-API-Version` when the team already uses Accept for content type negotiation.
- Version regex too strict, rejecting valid vendor MIME extensions.
- Forgetting case-insensitivity on header values.

## Anti-Patterns

- **Silent defaulting**: Client sends malformed Accept header, server defaults to latest version — client gets wrong response without knowing.
- **No response version header**: Support can't determine which version was served from logs.
- **Proxy dependency**: Relying on a custom header that a reverse proxy strips.

## Examples

```php
class VersionMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $version = $this->resolveVersion($request);
        $request->attributes->set('api_version', $version);

        if (!$this->isVersionSupported($version)) {
            abort(406, "API version '{$version}' is not supported.");
        }

        return $next($request);
    }

    private function resolveVersion(Request $request): string
    {
        return $request->header('X-API-Version', 'v1');
    }
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: url-path-versioning, media-type-versioning
- **Advanced**: API gateway header routing, Multi-version middleware stacks

## AI Agent Notes

- Header-based versioning is more REST-pure than URL path versioning because the resource identifier (URI) does not change.
- Laravel 11 middleware groups accept headers identically to previous versions. Parse `$request->header('Accept')` manually.
- The primary operational risk is invisibility — compensate with aggressive logging and response version headers.

## Verification

- [ ] Version resolution middleware implemented and tested
- [ ] `Vary: Accept` header set on all versioned responses
- [ ] Resolved version included in response headers
- [ ] Invalid/unsupported versions return 406
- [ ] Proxy/gateway compatibility verified
- [ ] Dashboard tracking distribution of versions served
