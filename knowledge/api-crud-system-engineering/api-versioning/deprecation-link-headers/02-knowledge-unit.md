# Deprecation Link Headers — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Link headers attached to deprecated API responses point consumers to migration guides, changelogs, and alternative versions. Phase 2 covers implementing the `Link` header with `rel="deprecation"`, `rel="sunset"`, and `rel="alternate"` relation types, and integration with deprecation middleware.

## Core Concepts
- **`Link` Header with Relations:** `Link: </docs/migration-v1-to-v2>; rel="deprecation"`.
- **Relation Types:** `deprecation` (RFC 9745), `sunset` (RFC 8594), `alternate`, `latest-version`.
- **Multiple Links:** One response can carry multiple `Link` headers for different purposes.
- **Discovery:** Consumers can programmatically discover migration resources via links.

## Mental Models
- **Road Signs:** The Deprecation header is a "Road Closed" sign. The Link header is the detour arrow pointing to the alternate route.
- **QR Code on a Flyer:** The flyer (response) says "This version is deprecated." The QR code (Link header) takes you to the website (migration guide) with full details.

## Internal Mechanics
- Laravel's `$response->header('Link', '<url>; rel="deprecation"')` adds the link.
- Multiple links can be sent as separate headers or comma-separated in one header.
- URL resolution: link URLs are typically absolute paths to the API documentation.
- Link middleware inspects the resolved version and adds appropriate links.

## Patterns
- Link header registry: config mapping of relation types to URLs.
- Middleware that adds deprecation, sunset, and migration links to deprecated responses.
- Versioned documentation URLs: `/docs/v1-to-v2-migration`, `/docs/v1-changelog`.
- Multiple link headers in a single response: `Deprecation`, `Link`, `Sunset`.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Link format | Absolute URL vs relative path | Absolute is unambiguous |
| Relation types | `deprecation`, `sunset`, `alternate`, `latest-version` | Standard + custom |
| Multiple links | Separate headers vs comma-separated | Separate is easier to parse |
| Link target | Documentation page vs API endpoint | Documentation is informative |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Absolute URLs | No resolution needed | May change with domain updates |
| Relative paths | Domain-independent | Consumer must resolve |
| Separate headers | Easy to parse | More header bytes |
| Comma-separated | Compact | Harder for simple parsers |

## Performance Considerations
- Link headers add ~50-200 bytes per deprecated response.
- Parse overhead is zero (header injection at framework level).
- URL generation time is negligible.

## Production Considerations
- Ensure link target URLs are stable and permanent.
- Test link targets periodically to prevent 404s in deprecation links.
- Localize migration guides if your API serves international consumers.
- Include links in API root responses for discovery.

## Common Mistakes
- Using `rel="deprecated"` instead of `rel="deprecation"` (non-standard).
- Pointing links to pages that don't exist yet.
- Not updating link URLs when documentation moves.
- Forgetting to include links in error responses (410, 406).

## Failure Modes
- **Broken link:** Migration guide page removed, link returns 404.
- **Wrong relation type:** Consumers looking for `deprecation` relation can't find it.
- **No alternative URL:** Deprecation link points to a page that says "no alternative available."
- **Redirect loop:** Link URL redirects to itself or another deprecated page.

## Ecosystem Usage
- **Stripe:** `Link` headers with `rel="deprecation"` and `rel="sunset"` on deprecated API versions.
- **GitHub:** `Link` headers for pagination (standard) and deprecation migration guides.
- **DigitalOcean:** `Link` headers in API responses pointing to version documentation.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Deprecation header implementation
- Sunset header implementation

### Advanced Follow-up Topics
- RFC 9745
- RFC 8594
- REST HATEOAS principles

## Research Notes
### Source Analysis
RFC 5988 (Web Linking, 2010) defines the `Link` header mechanics. RFC 9745 (2022) adds the `deprecation` relation type. RFC 8594 (2019) adds the `sunset` relation type.

### Key Insight
Link headers turn deprecation from a warning into an actionable instruction. A consumer that sees a deprecation header can follow the link for next steps without searching documentation.

### Version-Specific Notes
Laravel 11's `$response->withHeaders(['Link' => '<url>; rel="deprecation"'])` supports multiple headers as array.
