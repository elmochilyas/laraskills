# ECC Standardized Knowledge — Deprecation Link Headers

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Deprecation Link Headers |
| Difficulty | Intermediate |
| Category | Implementation |
| Last Updated | 2026-06-02 |

## Overview

Link headers attached to deprecated API responses point consumers to migration guides, changelogs, and alternative versions. This KU covers implementing the `Link` header with `rel="deprecation"`, `rel="sunset"`, and `rel="alternate"` relation types, and integration with deprecation middleware. Link headers turn deprecation from a warning into an actionable instruction — a consumer that sees a deprecation header can follow the link for next steps without searching documentation.

## Core Concepts

- **`Link` Header with Relations**: `Link: </docs/migration-v1-to-v2>; rel="deprecation"`
- **Relation Types**: `deprecation` (RFC 9745), `sunset` (RFC 8594), `alternate`, `latest-version`
- **Multiple Links**: One response can carry multiple `Link` headers for different purposes
- **Discovery**: Consumers can programmatically discover migration resources via links
- **Absolute URLs**: Recommended for unambiguous resolution
- **Link Freshness**: URLs referenced in `Link` headers must remain valid across the entire deprecation window

## When To Use

- On every deprecated API response alongside the `Deprecation` header
- When deprecation information should be actionable (not just a warning)
- In API responses as part of HATEOAS-style discoverability
- Alongside `Sunset` headers to point to migration guides

## When NOT To Use

- For non-deprecated endpoints (no need for deprecation links)
- When migration documentation doesn't exist yet
- When link targets are unstable or temporary

## Best Practices

- **Use absolute URLs** in link headers — unambiguous for consumers.
- **Use standard relation types**: `deprecation`, `sunset`, `alternate`, `latest-version`.
- **Combine with deprecation middleware** — link headers are injected alongside deprecation headers.
- **Send multiple links as separate headers** — easier for parsers than comma-separated.
- **Test link targets periodically** — a broken deprecation link is worse than no link.
- **Localize migration guides** if serving international consumers.
- **Automate link health checks** — scheduled task validates all deprecation link URLs return 200.

## Architecture Guidelines

- Link headers add ~50-200 bytes per deprecated response — negligible.
- Link target URLs should be stable and permanent (only add, never remove or change).
- A deprecation link header is a promise that the linked resource will exist for the entire deprecation period.
- Use analytics redirect (`302 → migration URL`) for click tracking if consumer engagement measurement is needed.

## Performance Considerations

- Link headers add ~50-200 bytes per deprecated response.
- Parse overhead is zero (header injection at framework level).
- Link health checks run offline — no production cost.
- Analytics redirect adds ~5ms per follow (one-time per consumer).

## Security Considerations

- Ensure link targets don't point to external/untrusted domains without validation.
- Analytics redirects should not leak API keys or consumer identifiers in the redirect URL.
- Migration guide URLs should be served over HTTPS.

## Common Mistakes

- Using `rel="deprecated"` instead of `rel="deprecation"` (non-standard).
- Pointing links to pages that don't exist yet.
- Not updating link URLs when documentation moves.
- Forgetting to include links in error responses (410, 406).

## Anti-Patterns

- **Broken link**: Migration guide page removed, link returns 404 — consumer can't find migration info.
- **No alternative URL**: Deprecation link points to a page that says "no alternative available."
- **Link rot**: No scheduled check for link validity — consumers find dead links.

## Examples

```php
class DeprecationLinkMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $version = $request->attributes->get('api_version');

        if ($this->isDeprecated($version)) {
            $migration = config("api.deprecation.versions.{$version}.migration_url");
            $sunset = config("api.deprecation.versions.{$version}.sunset_date");

            $response->header('Link', "<{$migration}>; rel=\"deprecation\"");
            $response->header('Link', "<{$this->alternateUrl($version)}>; rel=\"alternate\"");
            $response->header('Sunset', gmdate('D, d M Y H:i:s \G\M\T', strtotime($sunset)));
        }

        return $response;
    }
}
```

## Related Topics

- **Prerequisites**: rest-api-design, crud-architecture, resource-controllers
- **Siblings**: deprecation-header-implementation, sunset-header-implementation
- **Advanced**: RFC 9745, RFC 8594, REST HATEOAS principles

## AI Agent Notes

- Link headers turn deprecation from a warning into an actionable instruction — consumers can follow the link for next steps without searching documentation.
- RFC 5988 (Web Linking, 2010) defines the `Link` header mechanics. RFC 9745 (2022) adds the `deprecation` relation type.
- Laravel 11's `$response->withHeaders(['Link' => '<url>; rel="deprecation"'])` supports multiple headers as array.

## Verification

- [ ] `Link` header with `rel="deprecation"` present on all deprecated responses
- [ ] `Link` header with `rel="alternate"` pointing to the new version
- [ ] Link targets return 200 and contain migration guidance
- [ ] Link health check runs on a schedule
- [ ] Absolute URLs used in link headers
- [ ] Links included in error responses for deprecated endpoints (410, 406)
