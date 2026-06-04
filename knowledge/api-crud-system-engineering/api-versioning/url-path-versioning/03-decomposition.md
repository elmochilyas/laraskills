# URL Path Versioning — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers the operational lifecycle of URL-path versioned endpoints: monitoring version adoption, sunsetting old versions, coordinating removal across consumers, and automating version migration telemetry.

## Core Concepts
- **Version Adoption Tracking:** Measuring traffic per `/api/v{n}` to know active consumers.
- **Graceful Deprecation:** Adding deprecation warnings to response headers of old versions.
- **Sunset Scheduling:** Setting and communicating end-of-life dates per version.
- **405/410 on Removal:** Returning appropriate HTTP codes when a version is retired.

## Mental Models
- **Platform Version Lifecycle:** Like train platforms — platform v1 is open, then "last departure" announced, then closed permanently.
- **Traffic Lanes:** Each version is a lane on a highway. You don't close a lane without signs, detour routes, and a timeline posted in advance.

## Internal Mechanics
- Route middleware reads the version from the URI and injects deprecation headers.
- A `VersionStatus` enum tracks: `ACTIVE`, `DEPRECATED`, `SUNSET`, `RETIRED`.
- Scheduled commands check version status and trigger alerts or removals.
- Log aggregation queries filter by `request_uri` prefix for per-version metrics.

## Patterns
- Version metrics middleware that logs `version` tag to monitoring system.
- Deprecation middleware for older version groups injecting `Sunset` and `Deprecation` headers.
- Health check endpoint per version to validate it still resolves.
- Automated route removal via config-driven version registry.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Version removal method | Route removal vs 410 redirect | 410 preserves consumer debugging |
| Metrics aggregation | Per-version in log drain | Quick to implement, no extra infra |
| Deprecation trigger | Config array of deprecated versions | Single source of truth |
| Removal window | Automated after sunset date | Reduces manual ops burden |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Route removal | Clean codebase, no tech debt | Breaks consumers with stale URLs |
| 410 redirect | Safe failure, clear signal | Extra maintenance for redirect |
| Config-driven registry | Central control | Must be deployed to change |
| Automated sunset | Reliable, no human error | Unforgiving if date is wrong |

## Performance Considerations
- Deprecation/sunset header injection adds ~0.1ms per response.
- Version traffic monitoring via log aggregation adds zero request-time overhead.
- Route removal reduces cached route file size slightly.

## Production Considerations
- Always announce deprecation 6+ months before removal.
- Version removal is a **release note event** — announce in changelog.
- Monitor 404 spikes for 48 hours after version removal.
- Keep retired version route returning 410 for at least one full deprecation cycle.

## Common Mistakes
- Removing the route file without confirming zero traffic.
- Not coordinating version removal with mobile app release schedules.
- Forgetting to update API documentation when a version is deprecated.
- Silently removing a version still in use by internal services.

## Failure Modes
- **Silent consumer breakage:** Mobile apps with hardcoded `/api/v1/` crash after removal.
- **Incomplete deprecation:** Deprecation header added but sunset header omitted, confusing consumers.
- **Rogue traffic:** Bot or CI system still hitting old version despite deprecation, inflating metrics.

## Ecosystem Usage
- **Heroku API:** Announced v3 deprecation 18 months before removal, maintained v2 redirect for 6 more months.
- **Twitter API:** v1.0 → v1.1 required OAuth migration; kept v1 live for 6 months after v1.1 launch.
- **Shopify:** URL-path versioning with 12-month deprecation window documented in changelog.

## Related Knowledge Units
- **Prerequisites:** Deprecation header implementation, Sunset header implementation
- **Related Topics:** Phased deprecation timeline, Version retirement policy
- **Advanced Follow-up:** API gateway version routing, Consumer notification automation

## Research Notes
### Source Analysis
Heroku's 18-month v3 deprecation (2015) and Shopify's 12-month policy are the most cited industry reference points.

### Key Insight
The hardest part of URL-path versioning is not the implementation — it's the discipline to actually remove old versions on schedule.

### Version-Specific Notes
Laravel 11's maintenance mode (php artisan down) can be used per-version by routing deprecated versions to a maintenance page.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization