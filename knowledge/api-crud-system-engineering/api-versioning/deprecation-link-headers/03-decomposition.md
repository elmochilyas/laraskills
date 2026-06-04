# Deprecation Link Headers — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers maintaining deprecation link targets over time, monitoring link header usage by consumers, ensuring link freshness, managing multi-language migration guides, and auditing link relation coverage across all deprecated responses.

## Core Concepts
- **Link Freshness:** Ensuring the URLs referenced in `Link` headers remain valid across the entire deprecation window.
- **Link Usage Analytics:** Tracking how many consumers follow deprecation links (via redirects or click tracking).
- **Multi-Language Links:** Serving locale-specific migration guides via content negotiation on link targets.
- **Link Relation Coverage:** All deprecated endpoints should have `deprecation`, `sunset`, and `alternate` links.

## Mental Models
- **Guide Signs on a Highway:** Link headers are highway exit signs. They must be maintained, repainted, and kept visible. A faded or fallen sign is worse than no sign (false confidence).
- **Book References:** Like "see chapter 5" references in a textbook that must stay valid across editions.

## Internal Mechanics
- A scheduled health check hits all deprecation link URLs and alerts on non-200 responses.
- Link click tracking via a redirect URL (e.g., `/api/redirect/deprecation?target=docs&version=v1`) for analytics.
- Content negotiation on documentation URLs: `Accept-Language` header selects the migration guide language.
- A `LinkRelationAudit` CI step checks that all deprecated versions have all required link relations.

## Patterns
- Link health check as a scheduled artisan command.
- Analytics redirect for deprecation links with `302 → migration URL`.
- Link relation matrix: required relations per endpoint status (DEPRECATED, SUNSET, RETIRED).
- Auto-generated migration guide URLs from version numbers.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Link freshness monitoring | Automated weekly check | Catches broken links early |
| Click tracking | Redirect URL with analytics | Measures consumer engagement |
| Multi-language | Content negotiation on doc URLs | Consumer language preference |
| Link coverage audit | CI step on release | Prevents missing links |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Automated link checks | Early detection | Requires link target availability |
| Manual link verification | Context-aware | Labor-intensive |
| Analytics redirect | Usage data | Adds redirect latency |
| Direct links | Simpler, faster | No usage data |

## Performance Considerations
- Link health checks run offline, no runtime cost.
- Analytics redirect adds ~5ms per follow (one-time per consumer).
- Content negotiation on doc pages is on the documentation server, not the API server.

## Production Considerations
- Never delete a migration guide page without a redirect to a newer guide.
- Monitor link click-through rates to estimate consumer migration awareness.
- If consumers don't follow deprecation links, consider more aggressive communication.
- Archive old migration guides but keep them accessible with a deprecation notice.

## Common Mistakes
- Having deprecation links that point to a 404 page (broken migration guide).
- Not updating link URLs when documentation is restructured.
- Forgetting to add links to error responses (400, 422) for deprecated endpoints.
- Not testing links in all supported locales.

## Failure Modes
- **Link rot:** Migration guide deleted or moved, consumers get 404.
- **Missing `alternate` relation:** Consumer can find deprecation info but not the alternative API version.
- **Stale link content:** Migration guide not updated for latest version transitions.
- **Language mismatch:** Migration guide in English only, consumer expects localized version.

## Ecosystem Usage
- **Stripe:** Deprecation links monitored as part of API reliability SLA. Link targets are versioned documentation pages.
- **GitHub:** Link headers in API responses are tested in CI for every release.
- **Twilio:** Migration guide links sent via webhook in addition to response headers.

## Related Knowledge Units
- **Prerequisites:** URL management, Documentation versioning
- **Related Topics:** Deprecation header implementation, Sunset header implementation
- **Advanced Follow-up:** HATEOAS API discovery, Documentation automation

## Research Notes
### Source Analysis
RFC 8288 (Web Linking, 2017) updates RFC 5988. The principle of "link maintenance" is discussed in the REST community as part of the "hypermedia as the engine of application state" (HATEOAS) concept.

### Key Insight
A deprecation link header is a promise that the linked resource will exist for the duration of the deprecation period. Maintaining that promise requires active link monitoring.

### Version-Specific Notes
Laravel 11's `URL::to()` generates absolute URLs for link headers. Ensure the APP_URL config is correct in all environments.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization