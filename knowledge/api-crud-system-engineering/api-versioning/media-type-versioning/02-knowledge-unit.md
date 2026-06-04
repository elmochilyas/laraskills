# Media Type Versioning — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Media type versioning encodes version information in the response media type (e.g., `application/vnd.myapp.v1+json`). It leverages HTTP content negotiation machinery. Phase 2 covers content negotiation stack customization, response serialization, and client library generation.

## Core Concepts
- **Vendor MIME Type:** `application/vnd.{vendor}.v{major}+{format}` — a standard extension of HTTP media types.
- **Accept Header Negotiation:** Client requests `application/vnd.myapp.v1+json`; server matches and responds.
- **Content-Type Reflection:** Response `Content-Type` echoes the negotiated media type.
- **Format Independence:** Version is orthogonal to format (`+json`, `+xml`, `+msgpack`).

## Mental Models
- **Restaurant Menu Translation:** The media type is the language the menu is printed in. Version is the edition year of the menu. Same dish (endpoint), different menu edition (version).
- **Telescope Focus:** The Accept header is the eyepiece you choose. Media type versioning lets you keep the telescope (URL) fixed while swapping the eyepiece (version).

## Internal Mechanics
- Laravel's content negotiation in `Middleware\ContentNegotiation` parses the Accept header.
- A custom responder maps vendor MIME types to versioned transformers.
- The `Response` object's `Content-Type` header is set to the vendor MIME type.
- Eloquent serialization respects the versioned transformer selected during negotiation.

## Patterns
- Media type registry: a config file mapping `app/vnd.myapp.v1+json` → `V1Transformer`.
- Content negotiation middleware that selects the transformer chain.
- Version+Format extraction via regex on the Accept header.
- Fallback to default media type with a `406 Not Acceptable` for unknown types.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Media type format | `+json` suffix | Standard IANA pattern, widely supported |
| Vendor prefix | `vnd.myapp.` | IANA-registered vendor tree prefix |
| Version in suffix | `v1+json` vs `json;version=1` | Suffix is more common, cleaner |
| Unknown type handling | 406 vs fallback to latest | 406 is semantically correct |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| REST purity | Most RESTful approach | Complex to implement |
| Client clarity | Explicit version contract | More complex curl commands |
| Format flexibility | Orthogonal version + format | Requires format-aware serializers |
| Standards alignment | Full HTTP spec compliance | Poor browser support |

## Performance Considerations
- Content negotiation adds ~0.1ms for Accept header parsing and transformer resolution.
- Response serialization cost varies by transformer; versioned transformers may be slower.
- Consider a transformer registry cache to avoid reflection on every request.

## Production Considerations
- Test all supported media types in integration tests.
- Ensure your API documentation vendor MIME types are correct.
- Register custom media types with IANA if the API is public.
- Include the negotiated media type in response headers for debugging.

## Common Mistakes
- Using `Content-Type` instead of `Accept` for version negotiation (Content-Type describes the request body, not the desired response).
- Inconsistent media type format strings across endpoints.
- Not handling the `*/*` wildcard Accept header gracefully.
- Forgetting `charset` handling in the Accept header.

## Failure Modes
- **Accept wildcard mismatch:** Client sends `Accept: */*` and gets the wrong version.
- **Parser regex too narrow:** Rejects valid Accept headers with quality values (`q=0.9`).
- **Format confusion:** `+json` vs `json` — missing `+` prefix breaks matching.
- **Transformer instantiation overhead:** Reflection on every request if transformers aren't cached.

## Ecosystem Usage
- **GitHub:** Used media type versioning for preview APIs (`application/vnd.github.v3.raw+json`).
- **Google Cloud APIs:** Vendor MIME types for all GCP services.
- **DigitalOcean:** `application/vnd.digitalocean.v2+json` for the Droplet API.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Header-based versioning
- Content negotiation patterns

### Advanced Follow-up Topics
- Custom response serializers
- HATEOAS media types

## Research Notes
### Source Analysis
Google API Design Guide (2020) provides the canonical reference for vendor MIME type versioning. GitHub's v3 API (2012) was an early adopter.

### Key Insight
Media type versioning is the only approach that cleanly separates version from both URL and format, making it the choice for APIs that support multiple serialization formats per version.

### Version-Specific Notes
Laravel 11 uses Symfony's `AcceptHeader` utilities internally. Access via `$request->getAcceptableContentTypes()`.
