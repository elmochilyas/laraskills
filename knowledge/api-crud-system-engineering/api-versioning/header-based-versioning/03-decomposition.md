# Header-Based Versioning — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers operational concerns specific to header-based versioning: monitoring hidden version usage, managing CDN Vary header behavior, ensuring proxy compatibility, and handling the unique debugging challenges of invisible version selection.

## Core Concepts
- **Covert Version Usage:** Since version is in the header, operations can't see the version in URLs. Request logging must explicitly capture the header.
- **Vary Header Hygiene:** Correct `Vary` configuration is critical to prevent cache poisoning.
- **Proxy & Gateway Awareness:** Load balancers and API gateways must be configured to forward or inspect version headers.
- **Debugging Transparency:** Every response should reflect which version was used.

## Mental Models
- **Invisible Plumbing:** The version is like water pipes behind a wall — you know it's there only when something breaks. Phase 3 installs inspection panels and flow meters.
- **DNS for APIs:** The header is the "DNS" that directs to the right version resolver; operations must ensure the DNS (header routing) works end-to-end.

## Internal Mechanics
- Request logging pipeline captures the `api_version` attribute from middleware and indexes it.
- CDN/Varnish config includes `Vary: Accept` (or `Vary: X-API-Version`) to create separate cache partitions.
- API gateway rules inspect the version header and apply per-version rate limits or routing.
- Alerting rules compare error rates by resolved version attribute.

## Patterns
- Response header `X-API-Version: v1` enables operations to confirm version routing.
- Structured logging with version as a tagged field.
- Gateway-level validation of version header before it reaches the application.
- A `/version` endpoint that echoes back the resolved version for client debugging.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Cache key strategy | Full Accept string vs parsed version | Full string avoids cache collisions on format variants |
| Header passthrough | Allow vs strip at gateway | Strip unknown headers, allow known version headers |
| Version logging | Middleware attribute vs log inspection | Attribute is structured, easier to query |
| Client debugging | `/version` echo vs response header | Response header is zero-effort for clients |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| `Vary: Accept` | Correct cache behavior | Reduces cache hit rate |
| Gateway validation | Catches errors early | Duplicates app logic |
| Response header version | Easy debugging | Adds ~50 bytes per response |
| Centralized version map | Single reference | Deploy coordination needed |

## Performance Considerations
- `Vary: Accept` splits the cache into N partitions (one per version), reducing effective cache size.
- Response header injection adds negligible overhead (<0.01ms).
- Gateway-level header parsing is faster than application-level.

## Production Considerations
- Test CDN behavior with a staging API before deploying header versioning to production.
- Log the raw Accept header AND the resolved version to debug parsing issues.
- Set up a dashboard widget showing distribution of versions served.
- Train support team that "which version?" is no longer visible in the URL.

## Common Mistakes
- Setting `Vary: Accept` without considering that Accept already varies by content type — creates overlapping cache partitions.
- Not including version in error responses, making support tickets impossible to triage.
- Relying on a custom header that a corporate proxy strips.
- Version header case-sensitivity mismatches between client and server.

## Failure Modes
- **Silent defaulting:** Client sends malformed Accept header, server defaults to latest version, client gets wrong response.
- **Cache poisoning:** `Vary: Accept` misconfigured on one server node leaks v2 response to v1 request.
- **Proxy stripping:** Corporate proxy strips `X-API-Version`, all clients get default version, no one notices.
- **Debugging black hole:** Error occurs but the version cannot be determined from logs.

## Ecosystem Usage
- **Stripe:** Migrated from URL-path to header-based versioning in later iterations; maintains both detection methods.
- **Fastly:** Strongly recommends `Vary` header hygiene for API versioning at the edge.
- **Google Cloud Endpoints:** Uses Accept header for version dispatch with detailed logging.

## Related Knowledge Units
- **Prerequisites:** CDN caching strategy, API gateway configuration
- **Related Topics:** Media-type versioning, Content negotiation
- **Advanced Follow-up:** Edge-side version routing, Multi-layer cache invalidation

## Research Notes
### Source Analysis
Fastly's 2019 post on "API Versioning at the Edge" details real-world Vary header challenges. Google Cloud Endpoints documentation (2022) describes header-based version dispatch.

### Key Insight
The primary operational risk of header-based versioning is invisibility — when something breaks, you can't see the version in the URL bar. Compensate with aggressive logging and response headers.

### Version-Specific Notes
Laravel 11's HTTP kernel middleware runs after the `TrustProxies` middleware; ensure `Vary` headers are added after `TrustProxies` processes the request.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization