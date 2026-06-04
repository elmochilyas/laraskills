# Header-Based Versioning — Phase 2: Implementation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Header-based versioning uses HTTP request headers (e.g., `Accept: application/vnd.myapp.v1+json`) rather than the URL path to specify the API version. Phase 2 covers middleware-based version resolution, controller dispatch, testing, and content negotiation.

## Core Concepts
- **Custom Accept Header:** Version encoded as a vendor MIME type: `application/vnd.myapp.v{n}+json`.
- **Custom Header:** `X-API-Version: v1` — simpler but non-standard.
- **Middleware Resolution:** A middleware reads the header, resolves the version, and dispatches to the correct handler.
- **Content Negotiation:** The `Accept` header already drives response format; versioning extends this pattern.

## Mental Models
- **Restaurant Order:** URL says "I want food from this restaurant"; the Accept header says "I want the v1 recipe for this dish." The kitchen (controller) picks the versioned recipe.
- **Negotiation Protocol:** Like HTTP content negotiation — the client says what it understands, the server responds appropriately.

## Internal Mechanics
- Laravel middleware intercepts the request, extracts the version from the `Accept` header using regex.
- The resolved version is stored in `$request->attributes->set('api_version', 'v1')`.
- Controllers are resolved dynamically via `App::make()` or a factory pattern.
- Response headers include version identification for debugging.

## Patterns
- Version-aware middleware that sets `api_version` attribute on request.
- Controller factory that instantiates the correct versioned controller.
- Fallback chain: Accept header → Custom header → Default version.
- Response transformer that appends version header to every response.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Header type | Accept vendor MIME vs `X-API-Version` | Accept is standards-based, `X-API-Version` is simpler |
| Version resolution | Middleware vs controller factory | Middleware is cleaner, reusable |
| Default version | Latest vs 400 error | Latest simplifies client onboarding |
| Invalid version handling | 400 vs 406 | 406 (Not Acceptable) is semantically correct |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| URL cleanliness | Paths are stable, no version clutter | Version is hidden from casual inspection |
| Caching | Single URL per resource | Cache varies by header — harder to configure |
| Debugging | Curl with `-H` | Not browser-testable without extensions |
| Documentation | One URL to document | More complex curl examples |

## Performance Considerations
- Header parsing adds ~0.05ms per request (negligible).
- Controller factory resolution must be cached or use singleton pattern to avoid per-request overhead.
- Vary header (`Vary: Accept`) must be set on HTTP responses for CDN correctness.

## Production Considerations
- Always set `Vary: Accept` on responses to prevent CDN serving wrong version.
- Monitor for `406` errors to detect clients sending unsupported version headers.
- Include resolved version in response headers for debuggability.
- Validate version header early — before authentication — to fail fast.

## Common Mistakes
- Not setting `Vary: Accept`, causing CDN cache poisoning across versions.
- Using `X-API-Version` when the team already uses Accept for content type negotiation.
- Version regex too strict, rejecting valid vendor MIME extensions.
- Forgetting case-insensitivity on header values.

## Failure Modes
- **Missing Accept header:** Rejects all requests without explicit accept header.
- **CDN cache collision:** Two versions served same cached response from different origins.
- **Proxy stripping:** Reverse proxy strips custom headers, version lost.
- **Client library override:** HTTP client library sets Accept automatically overriding vendor version.

## Ecosystem Usage
- **Google Cloud APIs:** Uses `Accept: application/vnd.google.gax.v2+json` pattern.
- **GitHub:** Previously used Accept header for preview APIs (`application/vnd.github.v3.raw+json`).
- **DigitalOcean:** Combined approach with URL path for major version and Accept for sub-version features.

## Related Knowledge Units

### Prerequisites
- rest-api-design
- crud-architecture
- resource-controllers

### Related Topics
- Media-type versioning
- URL path versioning

### Advanced Follow-up Topics
- API gateway header routing
- Multi-version middleware stacks

## Research Notes
### Source Analysis
Google's API design guide (2020) recommends the vendor MIME approach. GitHub used Accept header versioning for preview features from 2012-2018.

### Key Insight
Header-based versioning is more REST-pure than URL path versioning because the resource identifier (URI) does not change — only the representation.

### Version-Specific Notes
Laravel 11 middleware groups accept headers identically to previous versions. `$request->header('Accept')` returns the full string; must parse manually.
