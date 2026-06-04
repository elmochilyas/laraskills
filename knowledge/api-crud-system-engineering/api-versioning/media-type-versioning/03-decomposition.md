# Media Type Versioning — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers operational management of media type versioning: MIME type registration lifecycle, IANA considerations, content-type-aware CDN caching, transformer deprecation, and coordinating format changes alongside version changes.

## Core Concepts
- **Media Type Registry:** A maintained mapping of all vendor MIME types with their status (active/deprecated/retired).
- **IANA Registration:** Public APIs benefit from registering vendor media types with IANA for interoperability.
- **Transformer Retirement:** Removing versioned transformers while preserving support for active media types.
- **Format Version Orthogonality:** Managing version changes independently from format changes (json vs msgpack).

## Mental Models
- **Library Catalog:** Each media type is a book edition. The catalog (registry) lists all editions, their status, and their publication dates. The library keeps old editions in the archive even when not on the main shelf.
- **Currency Exchange:** Media type versioning is like foreign exchange — you specify what currency (format) and what year's exchange rate (version) you want.

## Internal Mechanics
- A `MediaTypeRegistry` config file maintains the list of known media types, their transformer class, status, and sunset date.
- A scheduled artisan command validates all registered media types have existing transformers.
- Deprecation middleware checks the negotiated media type against the registry status and adds warning headers.
- CDN configuration includes `Vary: Accept` with explicit media type normalization.

## Patterns
- Centralized MIME type registry with status enum (`ACTIVE`, `DEPRECATED`, `SUNSET`, `RETIRED`).
- Transformer factory using the registry for lookups.
- Automated health check that requests each registered media type and validates the response.
- Content-type normalization at the reverse proxy for cache key consistency.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Registry source | Config file vs database | Config file for speed, database for dynamic needs |
| MIME status lifecycle | Same as version lifecycle | Tied to version, not independent |
| IANA registration | Required for public APIs | Interoperability requires standards |
| Format deprecation | Independent from version | JSON may outlive a version |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| IANA registration | Standards compliance | Slow, bureaucratic process |
| Database registry | Dynamic updates | Adds latency, cache dependency |
| Separate format lifecycle | Maximum flexibility | More complex operations |
| CDN Vary normalization | Better cache hit rate | More proxy configuration |

## Performance Considerations
- Registry lookup should be cached to avoid file I/O or database queries.
- CDN cache fragmentation: Vary: Accept with multiple media types creates many cache partitions.
- Transformer factory caching: resolve once, cache for the worker's lifetime.

## Production Considerations
- Log which media type was negotiated in every request for operations debugging.
- Set a deprecation webhook for MIME types nearing sunset.
- Include supported media types in the API root response or `/` discovery endpoint.
- Monitor 406 rates as a signal that clients are using outdated or typoed media types.

## Common Mistakes
- Not normalizing media types for logging (e.g., `application/vnd.myapp.v1+json` vs `application/vnd.myapp.v1+JSON; charset=utf-8`).
- Removing a transformer while clients still request that media type.
- Forgetting to update the media type registry when adding a new version.
- Not testing that deprecated media types still return proper 406 or deprecation headers.

## Failure Modes
- **Stale client:** Old mobile app sends deprecated media type, gets broken response, no warning.
- **Transformer panic:** Transformer class removed but registry still references it → 500 error.
- **Cache collision:** Two different media types with the same body but different Accept headers served identical cached response.
- **IANA staleness:** Media type registered with IANA but publicly documented differently.

## Ecosystem Usage
- **GitHub:** Preview media types deprecated over time, replaced by stable v3 media types.
- **Google Cloud:** Long-lived media types for GCP APIs — some active for 5+ years.
- **Atlassian:** Uses media type versioning for Confluence and Jira APIs with registry documentation.

## Related Knowledge Units
- **Prerequisites:** IANA media type registration process, Content negotiation at the edge
- **Related Topics:** Header-based versioning, Content type negotiation patterns
- **Advanced Follow-up:** Custom media type design, Format evolution strategy

## Research Notes
### Source Analysis
IANA's media type registry (https://www.iana.org/assignments/media-types/) is the canonical reference. Google Cloud's API design guide (2023) is the best practical reference.

### Key Insight
Media type versioning's greatest operational challenge is cache fragmentation. Each unique Accept header value creates a separate cache partition, drastically reducing hit rates.

### Version-Specific Notes
Laravel 11's `Response` object extends Symfony's `Response`. Setting `Content-Type` via `$response->header('Content-Type', 'application/vnd.myapp.v1+json')`.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization