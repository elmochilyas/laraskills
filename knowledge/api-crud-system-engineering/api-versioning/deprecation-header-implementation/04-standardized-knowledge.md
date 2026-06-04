# ECC Standardized Knowledge — Deprecation Header Implementation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Deprecation Header Implementation |
| Difficulty | Intermediate |
| Category | Implementation |
| Last Updated | 2026-06-02 |

## Overview

The `Deprecation` header (RFC 9745) signals to consumers that an API version or endpoint is deprecated. This KU covers implementing the `Deprecation` header as HTTP middleware, adding deprecation metadata to responses, and configuring deprecation thresholds. The header value is `Deprecation: true` with optional `since` and `for` parameters. The Deprecation header alone is insufficient — it must be paired with a `Sunset` header and a `Link` header to the migration guide to be actionable for consumers.

## Core Concepts

- **RFC 9745**: Standardizes the `Deprecation` HTTP header
- **`Deprecation: true`**: Indicates the API version/endpoint is deprecated
- **`since` parameter**: `Deprecation: since="2026-01-01"` provides context
- **`for` parameter**: `Deprecation: for="6 months"` indicates deprecation duration
- **Deprecation vs Sunset**: Deprecation warns of future removal; Sunset announces the removal date
- **Middleware-based approach**: Consistent, automatic header injection

## When To Use

- When an API version is scheduled for removal
- When specific endpoints are superseded by newer versions
- As part of the phased deprecation timeline (Warn phase)
- Before any API version removal

## When NOT To Use

- For versions that are still actively developed with new features
- Without an accompanying `Sunset` header or migration timeline
- When the deprecation timeline is not yet determined

## Best Practices

- **Add deprecation headers at least 6 months before removal** for public APIs.
- **Always pair with a `Sunset` header** and `Link` header with migration guide.
- **Use middleware-based injection** for consistent, automatic header application.
- **Include `since` parameter** with ISO 8601 date for context.
- **Add deprecation warning in response body** for consumer visibility (e.g., `"deprecated": true`).
- **Test that deprecated endpoints still function correctly** — deprecation ≠ broken.
- **Monitor Deprecation header frequency** to estimate consumer migration progress.

## Architecture Guidelines

- Header injection adds ~0.01ms per deprecated response — negligible.
- Config array lookup is O(1) — no performance concern.
- Deprecation middleware is added to deprecated version route groups, not to individual routes.
- Per-endpoint deprecation uses route attributes or a separate config map.
- Response body deprecation field adds bytes to every deprecated response.

## Performance Considerations

- Header injection adds ~0.01ms per deprecated response.
- Config array lookup is O(1) — no performance concern.
- Response body deprecation field adds a small amount of bandwidth per deprecated response.

## Security Considerations

- Deprecated versions may have known vulnerabilities — ensure they still maintain auth/authorization.
- Never deprecate a version without an alternative that maintains security standards.
- Monitor that consumers don't "ignore" deprecation headers and continue using unpatched old versions.

## Common Mistakes

- Adding deprecation header but not having a sunset header or timeline.
- Using non-standard header names (`X-Deprecated` instead of `Deprecation`).
- Deprecating a version but still adding new features to it.
- Not communicating deprecation outside of the header (no docs, no email).

## Anti-Patterns

- **Header fatigue**: Many endpoints deprecated → consumers ignore the header entirely.
- **Silent deprecation**: Header added but consumers don't notice until the version is removed.
- **Deprecation without alternative**: Deprecation header sent but no upgrade path exists.

## Examples

```php
class DeprecationMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $version = $request->attributes->get('api_version', 'v1');
        $deprecations = config('api.deprecation.versions', []);

        if (isset($deprecations[$version])) {
            $deprecation = $deprecations[$version];
            $response = $next($request);

            $response->header('Deprecation', 'true');
            $response->header('Deprecation', 'since="' . $deprecation['since'] . '"');
            $response->header('Link', '<' . $deprecation['migration_url'] . '>; rel="deprecation"');

            return $response;
        }

        return $next($request);
    }
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: sunset-header-implementation, deprecation-link-headers
- **Advanced**: RFC 9745, Consumer deprecation notification systems

## AI Agent Notes

- The Deprecation header is the START of a conversation, not the end. It must be followed by Sunset headers, migration guides, consumer outreach, and eventual retirement.
- RFC 9745 (2022) standardized the Deprecation HTTP header. Prior to this, custom headers like `X-Deprecated` were common.
- Laravel 11's `$response->header('Deprecation', 'true')` sets the header.

## Verification

- [ ] Deprecation middleware implemented and applied to deprecated route groups
- [ ] `Deprecation: true` header present on all deprecated responses
- [ ] `since` parameter included with ISO 8601 date
- [ ] Paired with `Sunset` header with removal date
- [ ] Paired with `Link` header pointing to migration guide
- [ ] Deprecated endpoints still function correctly (deprecation ≠ broken)
- [ ] Deprecation frequency monitored for consumer migration tracking
